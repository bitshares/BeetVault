import path from "path";
import { pathToFileURL } from "url";
import fsPromises from "fs/promises";

import os from "os";

import queryString from "query-string";
import { PrivateKey, Apis } from "./lib/blockchains/bitshares/library";

import { v4 as uuidv4 } from "uuid";
import { encrypt, decrypt } from "./lib/crypto.js";
import * as secp from "@noble/secp256k1";
import { hexToBytes, bytesToHex } from "@noble/hashes/utils.js";
import { sha256, sha512 } from "@noble/hashes/sha2.js";
import { hmac } from "@noble/hashes/hmac.js";

secp.hashes.sha256 = sha256;
secp.hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg);

import {
    app,
    BrowserWindow,
    Menu,
    Tray,
    dialog,
    ipcMain,
    Notification,
    shell,
    safeStorage,
    powerMonitor,
    systemPreferences,
} from "electron";

import { initApplicationMenu } from "./lib/applicationMenu.js";
import { getSignature } from "./lib/SecureRemote.js";
import * as Actions from "./lib/Actions.js";
import getBlockchainAPI from "./lib/blockchains/blockchainFactory.js";
import BTSWalletHandler from "./lib/blockchains/bitshares/BTSWalletHandler.js";
import { BTS_FAMILY, EOS_FAMILY, HIVE_FAMILY } from "./lib/blockchains/chainFamilies.js";

import { inject } from "./lib/inject.js";
import { validateSender, validateMainSender, setAppDir } from "./lib/senderValidation.js";

// Register the app's HTML directory for sender validation
setAppDir(__dirname);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let modalWindows = {};
let modalRequests = {};
let receiptWindows = {};
let errorWindow = null;

const isDevMode = process.execPath.match(/[\\/]electron/);
let tray = null;
let regexBTS = /1\.2\.\d+/g;

/*
 * Harden a BrowserWindow against navigation / window-open attacks.
 * All pages are local (file:) and load fixed HTML; there is no legitimate
 * reason to navigate away or open new windows from the renderer. Any such
 * attempt is almost certainly an XSS vector, so deny it defensively.
 */
const applyWindowSecurityGuards = (win) => {
    win.webContents.on('will-navigate', (event, url) => {
        event.preventDefault();
        console.debug(`[SECURITY] Prevented navigation to: ${url}`);
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
        console.debug(`[SECURITY] Prevented window.open: ${url}`);
        return { action: 'deny' };
    });
};

/*
 * Main-process crash / unhandled-rejection handling.
 *
 * Registered at module scope (rather than only in the production branch) so
 * that crashes are captured during startup in every environment. The
 * unhandledRejection handler surfaces a user-facing error window via the
 * existing createError() flow; the uncaughtException handler is log-only
 * because the process state may be corrupted and we must not attempt UI from
 * within it.
 */
process.on('unhandledRejection', (error, handle) => {
    const msg = error?.stack || error?.message || String(error);
    console.error(`[Main] Unhandled rejection: ${msg}`);

    if (mainWindow && !mainWindow.isDestroyed()) {
        const id = uuidv4();
        setImmediate(() => {
            createError({
                id,
                title: 'Unhandled Error',
                errorMessage: msg.substring(0, 500),
                terminalError: msg,
                consoleLogs: [{ msg, timestamp: new Date().toISOString() }],
                context: 'process.unhandledRejection',
            }, null).catch(err => console.error(`[Main] Error popup creation failed: ${err}`));
        });
    }
});

process.on('uncaughtException', (error) => {
    console.error(`[Main] Uncaught exception: ${error?.stack || error?.message}`);
    // Log only — the process state may be corrupted, so do not attempt UI here.
});

async function _readFile(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        throw "Invalid file path";
    }

    const resolved = path.resolve(filePath);
    const ext = path.extname(resolved);

    if (ext !== '.bin') {
        throw "Invalid file type";
    }

    if (resolved.includes('..') || resolved.includes('\0')) {
        throw "Invalid file path";
    }

    return await fsPromises.readFile(resolved);
}

/*
 * On modal popup this runs to create child browser window
 */
const createModal = async (arg, modalEvent) => {
    let modalHeight = 600;
    let modalWidth = 800;
    if (!mainWindow) {
        throw "No main window";
    }

    let request = arg.request;
    let id = request.id;
    if (!request || !request.id) {
        throw "No request";
    }

    if (modalWindows[id] || modalRequests[id]) {
        throw "Modal exists already!";
    }

    let type = request.type;
    if (!type) {
        throw "No modal type";
    }

    modalRequests[id] = { request: request, event: modalEvent };
    let targetURL = `file://${__dirname}/modal.html?id=${encodeURIComponent(
        id
    )}`;
    let modalData = { id, type, request };

    if ([Actions.INJECTED_CALL].includes(type)) {
        let visualizedAccount = arg.visualizedAccount;
        let visualizedParams = arg.visualizedParams;
        if (!visualizedAccount || !visualizedParams) {
            throw "Missing required visualized fields";
        }
        modalRequests[id]["visualizedAccount"] = visualizedAccount;
        modalRequests[id]["visualizedParams"] = visualizedParams;
        modalData["visualizedAccount"] = visualizedAccount;
        modalData["visualizedParams"] = visualizedParams;
    }

    if ([Actions.INJECTED_CALL].includes(type)) {
        if (arg.isBlockedAccount) {
            modalRequests[id]["warning"] = true;
            modalData["warning"] = "blockedAccount";
        } else if (arg.serverError) {
            modalRequests[id]["warning"] = true;
            modalData["warning"] = "serverError";
        }
    }

    ipcMain.once(`get:prompt:${id}`, (event) => {
        if (!validateSender(event.senderFrame)) return;
        // The modal window is ready to receive data
        event.reply(`respond:prompt:${id}`, modalData);
    });

    modalWindows[id] = new BrowserWindow({
        parent: mainWindow,
        title: "BeetVault prompt",
        width: modalWidth,
        height: modalHeight,
        minWidth: modalWidth,
        minHeight: modalHeight,
        maxWidth: modalWidth,
        maximizable: true,
        maxHeight: modalHeight,
        useContentSize: true,
        webPreferences: {
            nodeIntegration: false, // Keep false for security
            contextIsolation: true, // Keep true for security
            sandbox: true, // Keep true for security
            preload: path.join(__dirname, "preloadModal.js"),
        },
        icon: __dirname + "/img/beet-taskbar.png",
    });

    applyWindowSecurityGuards(modalWindows[id]);
    modalWindows[id].loadURL(targetURL);

    modalWindows[id].once("ready-to-show", () => {
        console.log("ready to show modal");
        modalWindows[id].show();
    });

    modalWindows[id].on("closed", () => {
        ipcMain.removeAllListeners(`get:prompt:${id}`);

        if (modalWindows[id]) {
            delete modalWindows[id];
        }

        if (modalRequests[id]) {
            modalRequests[id].event.sender.send(`popupRejected_${id}`, {
                id: id,
                result: {
                    isError: true,
                    method: type,
                    error: "User closed modal without answering prompt.",
                },
            });
            delete modalRequests[id];
            modalData = {};
        }
    });
};

    /*
     * Creating an optional receipt browser window popup
     */
    const createReceipt = async (arg, modalEvent) => {
        let modalHeight = 600;
        let modalWidth = 800;
        if (!mainWindow) {
            throw "No main window";
        }

        let request = arg.request;
        let id = request.id;
        let result = arg.result;
        let receipt = arg.receipt;
        let notifyTXT = arg.notifyTXT;
        if (!request || !request.id || !result || !notifyTXT || !receipt) {
            throw "No request";
        }

        if (receiptWindows[id]) {
            throw "Receipt window exists already!";
        }

        let targetURL = `file://${__dirname}/receipt.html?id=${encodeURIComponent(
            id
        )}`;
        
        ipcMain.once(`get:receipt:${id}`, (event) => {
            if (!validateSender(event.senderFrame)) return;
            // The modal window is ready to receive data
            event.reply(`respond:receipt:${id}`, {
                id,
                request,
                result,
                receipt,
                notifyTXT,
            });
        });

        receiptWindows[id] = new BrowserWindow({
            parent: mainWindow,
            title: "BeetVault receipt",
            width: modalWidth,
            height: modalHeight,
            minWidth: modalWidth,
            minHeight: modalHeight,
            maximizable: true,
            useContentSize: true,
            webPreferences: {
                nodeIntegration: false, // Keep false for security
                contextIsolation: true, // Keep true for security
                sandbox: true, // Keep true for security
                preload: path.join(__dirname, "preloadModal.js"),
            },
            icon: __dirname + "/img/beet-taskbar.png",
        });

        applyWindowSecurityGuards(receiptWindows[id]);
        receiptWindows[id].loadURL(targetURL);

        receiptWindows[id].once("ready-to-show", () => {
            receiptWindows[id].show();
        });

        receiptWindows[id].on("closed", () => {
            ipcMain.removeAllListeners(`get:receipt:${id}`);

            if (receiptWindows[id]) {
                delete receiptWindows[id];
            }
        });
    };

/*
 * Creating an error browser window popup for failed operations
 */
const createError = async (arg, errorEvent) => {
    let modalHeight = 600;
    let modalWidth = 800;
    if (!mainWindow) {
        throw "No main window";
    }

    if (errorWindow) {
        throw "Error window already open";
    }

    let id = arg.id;
    if (!id) {
        throw "No error id";
    }

    let title = arg.title || "Unknown error";
    let titleKey = arg.titleKey || "";
    let titleParams = arg.titleParams || {};
    let errorMessage = arg.errorMessage || "An unexpected error occurred.";
    let errorMessageKey = arg.errorMessageKey || "";
    let errorMessageParams = arg.errorMessageParams || {};
    let terminalError = arg.terminalError || "";
    let terminalErrorKey = arg.terminalErrorKey || "";
    let consoleLogs = arg.consoleLogs || [];
    let timestamp = arg.timestamp || new Date().toISOString();
    let context = arg.context || "";
    let contextKey = arg.contextKey || "";
    let contextParams = arg.contextParams || {};

    let targetURL = `file://${__dirname}/error.html?id=${encodeURIComponent(id)}`;

    ipcMain.once(`get:error:${id}`, (event) => {
        if (!validateSender(event.senderFrame)) return;
        event.reply(`respond:error:${id}`, {
            id,
            title,
            titleKey,
            titleParams,
            errorMessage,
            errorMessageKey,
            errorMessageParams,
            terminalError,
            terminalErrorKey,
            consoleLogs,
            timestamp,
            context,
            contextKey,
            contextParams,
        });
    });

    errorWindow = new BrowserWindow({
        parent: mainWindow,
        title: "BeetVault error",
        width: modalWidth,
        height: modalHeight,
        minWidth: modalWidth,
        minHeight: modalHeight,
        maxWidth: modalWidth,
        maximizable: true,
        maxHeight: modalHeight,
        useContentSize: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, "preloadModal.js"),
        },
        icon: __dirname + "/img/beet-taskbar.png",
    });

    applyWindowSecurityGuards(errorWindow);
    errorWindow.loadURL(targetURL);

    errorWindow.once("ready-to-show", () => {
        console.log("ready to show error window");
        errorWindow.show();
    });

    errorWindow.on("closed", () => {
        ipcMain.removeAllListeners(`get:error:${id}`);
        errorWindow = null;
    });
};

/*
 * User approved modal contents. Close window, resolve promise, delete references.
 */
    ipcMain.on("clickedAllow", (event, arg) => {
        if (!validateSender(event.senderFrame)) return;
        console.log("ipcmain clickedAllow");
    let id = arg.request.id;

    if (modalWindows[id]) {
        modalWindows[id].close();
        delete modalWindows[id];
    }

    if (modalRequests[id]) {
        modalRequests[id].event.sender.send(`popupApproved_${id}`, arg);
        delete modalRequests[id];
    }
});

/*
 * User rejected modal contents. Close window, reject promise, delete references.
 */
    ipcMain.on("clickedDeny", (event, arg) => {
        if (!validateSender(event.senderFrame)) return;
        console.log("ipcmain clickedDeny");
    let id = arg.request.id;

    if (modalWindows[id]) {
        modalWindows[id].close();
        delete modalWindows[id];
    }

    if (modalRequests[id]) {
        modalRequests[id].event.sender.send(`popupRejected_${id}`, arg);
        delete modalRequests[id];
    }
});

async function _parseDeeplink(
    requestContent,
    type,
    chain,
    blockchain,
    blockchainActions,
    settingsRows,
    currentCode
) {
    let processedRequest;
    let parsedRequest;
    let request;

    if (type === "totp") {
        try {
            processedRequest = decodeURIComponent(requestContent);
        } catch (error) {
            console.log("Processing request failed");
            return;
        }

        try {
            parsedRequest = Buffer.from(processedRequest, 'base64').toString('utf-8');
        } catch (error) {
            console.log({
                msg: "Parsing request failed",
                error,
                processedRequest,
                requestContent,
            });
            return;
        }

        let decryptedData;
        try {
            decryptedData = await decrypt(parsedRequest, currentCode);
        } catch (error) {
            console.log(error);
            return;
        }

        try {
            request = JSON.parse(decryptedData);
        } catch (error) {
            console.log(error);
            return;
        }
    } else if (type === "raw") {
        try {
            processedRequest = decodeURIComponent(requestContent);
        } catch (error) {
            console.log("Processing request failed");
            return;
        }

        try {
            request = JSON.parse(processedRequest);
        } catch (error) {
            console.log(error);
            return;
        }
    } else {
        try {
            request = JSON.parse(requestContent);
        } catch (error) {
            console.log(error);
            return;
        }
    }

    if (
        !request ||
        !request.id ||
        !request.payload ||
        !request.payload.chain ||
        !request.payload.method ||
        (request.payload.method === Actions.INJECTED_CALL &&
            !request.payload.params)
    ) {
        console.log("invalid request format");
        return;
    }

    if (chain !== request.payload.chain) {
        console.log("Incoming deeplink request for wrong chain");
        return;
    }

    if (
        !Object.keys(Actions)
            .map((key) => Actions[key])
            .includes(request.payload.method)
    ) {
        console.log("Unsupported request type rejected");
        return;
    }

    if (!blockchainActions.includes(request.payload.method)) {
        console.log({
            msg: "Unsupported request type rejected",
            request,
        });
        return;
    }

    if (settingsRows && !settingsRows.includes(request.payload.method)) {
        console.log("Unauthorized beet operation");
        return;
    }

    if (request.payload.method === Actions.INJECTED_CALL) {
        let authorizedUse = false;
        if (BTS_FAMILY.includes(chain)) {
            let tr;
            try {
                tr = await blockchain._parseTransactionBuilder(
                    request.payload.params
                );
            } catch (error) {
                console.log(error);
            }
            if (tr) {
                for (let i = 0; i < tr.operations.length; i++) {
                    let operation = tr.operations[i];
                    if (settingsRows && settingsRows.includes(operation[0])) {
                        authorizedUse = true;
                        break;
                    }
                }
            }
        } else if (EOS_FAMILY.includes(chain)) {
            if (request.payload.params && request.payload.params.length > 1) {
                let actions;
                try {
                    actions = JSON.parse(request.payload.params[1]).actions;
                } catch (error) {
                    console.log({ error, location: "_parseDeeplink.EOS.parse" });
                    return;
                }

                if (actions) {
                    for (let i = 0; i < actions.length; i++) {
                        let operation = actions[i];
                        if (
                            settingsRows &&
                            settingsRows.includes(operation.name)
                        ) {
                            authorizedUse = true;
                            break;
                        }
                    }
                }
            }
        } else if (HIVE_FAMILY.includes(chain)) {
            if (request.payload.params && request.payload.params.length > 1) {
                let actions;
                try {
                    actions = JSON.parse(request.payload.params[1]).actions;
                } catch (error) {
                    console.log({ error, location: "_parseDeeplink.HIVE.parse" });
                    return;
                }

                if (actions) {
                    for (let i = 0; i < actions.length; i++) {
                        let operation = actions[i];
                        if (
                            settingsRows &&
                            settingsRows.includes(operation.name)
                        ) {
                            authorizedUse = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!authorizedUse) {
            console.log(
                `Unauthorized use of deeplinked ${chain} blockchain operation`
            );
            return;
        }
        console.log("Authorized use of deeplinks");
    }

    return {
        id: request.id,
        type: request.payload.method,
        payload: request.payload,
    };
}

/*
 * Creating the primary window, only runs once.
 */
let ENCRYPTION_AVAILABLE = false;
let FALLBACK_WARNED = false;

const createWindow = async () => {
    // Layer 1: Cache safeStorage availability once, after app.whenReady().
    // createWindow() is only invoked from app.whenReady().then(), so this runs
    // at the correct time — after Electron has initialized its OS backends.
    ENCRYPTION_AVAILABLE = safeStorage.isEncryptionAvailable();
    if (!ENCRYPTION_AVAILABLE && !FALLBACK_WARNED) {
        FALLBACK_WARNED = true;
        let reason;
        if (process.platform === "linux") {
            try {
                reason = safeStorage.getSelectedStorageBackend();
            } catch (error) {
                reason = `getSelectedStorageBackend failed: ${error.message}`;
            }
        } else {
            reason = process.platform;
        }
        console.warn(
            "[SECURITY] safeStorage unavailable. Reason: " + reason +
            ". Seed will be held in memory without OS-level protection."
        );
    }

    let width = 525;
    let height = 695;
    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        minWidth: width,
        minHeight: height,
        maxWidth: width,
        maximizable: false,
        maxHeight: height,
        useContentSize: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false, // Keep false for security
            contextIsolation: true, // Keep true for security
            sandbox: true, // Keep true for security
            preload: path.join(__dirname, "preload.js"),
        },
        icon: __dirname + "/img/beet-taskbar.png",
    });

    applyWindowSecurityGuards(mainWindow);
    initApplicationMenu(mainWindow);
    mainWindow.loadURL(
        `${pathToFileURL(path.join(__dirname, "index.html")).href}`
    );

    tray = new Tray(__dirname + "/img/beet-tray.png");
    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Show App",
            click: function () {
                mainWindow.show();
            },
        },
        {
            label: "Quit",
            click: function () {
                app.isQuiting = true;
                tray = null;
                app.quit();
            },
        },
    ]);
    tray.setToolTip("BeetVault");

    tray.on("right-click", (event, bounds) => {
        tray.popUpContextMenu(contextMenu);
    });

    ipcMain.handle("memoFromBuffer", async (event, arg) => {
        if (!validateSender(event.senderFrame)) throw new Error('Unauthorized');
        const { msg } = arg;
        return Buffer.from(msg).toString('hex');
    });

    /*
     * Handling front end blockchain requests
     */
    ipcMain.handle("blockchainRequest", async (event, arg) => {
        if (!validateSender(event.senderFrame)) throw new Error('Unauthorized');
        const { methods, account, accountname, chain, node } = arg;

        console.log({ methods, accountname, chain });

        // Store the renderer's current node for this chain
        if (node) {
            _chainNodes[chain] = node;
        }

        let blockchain;
        try {
            blockchain = await getBlockchainAPI(chain, _chainNodes[chain] || null);
        } catch (error) {
            console.log(error);
        }

        if (!blockchain || !methods || !methods.length) {
            console.log("Unable to perform blockchain request");
            return;
        }

        let blockchainActions = [Actions.INJECTED_CALL];

        let responses = {
            chain,
        };

        if (methods.includes("calculateFee")) {
            const { operation } = arg;
            let fee;
            try {
                fee = await blockchain.calculateFee(operation);
            } catch (error) {
                console.log({ error, location: "calculateFee" });
            }

            if (fee) {
                responses["calculateFee"] = fee;
            }
        }

        if (methods.includes("supportsLocal")) {
            responses["supportsLocal"] = blockchain.supportsLocal();
        }

        if (methods.includes("supportsTOTP")) {
            responses["supportsTOTP"] = blockchain.supportsTOTP();
        }

        if (methods.includes("supportsQR")) {
            responses["supportsQR"] = blockchain.supportsQR();
        }

        if (methods.includes("supportsWeb")) {
            responses["supportsWeb"] = blockchain.supportsWeb();
        }

        if (methods.includes("getBalances")) {
            const _usr = account.name ? account.name : account.accountName;
            let _balances;
            try {
                _balances = await blockchain.getBalances(_usr);
            } catch (error) {
                console.log({ error, location: "getBalances", user: _usr });
            }

            if (_balances) {
                responses["getBalances"] = JSON.stringify(_balances);
            }
        }

        if (methods.includes("verifyMessage")) {
            const { request } = arg;
            let _verifyMessage;
            try {
                _verifyMessage = await blockchain.verifyMessage(request);
            } catch (error) {
                console.log({ error, location: "verifyMessage" });
            }
            if (_verifyMessage) {
                responses["verifyMessage"] = _verifyMessage;
            }
        }

        if (methods.includes("getExplorer")) {
            let _explorer;
            try {
                _explorer = await blockchain.getExplorer({
                    accountName: account.name
                        ? account.name
                        : account.accountName,
                    chain,
                });
            } catch (error) {
                console.log({ error, location: "getExplorer" });
            }

            if (_explorer) {
                responses["getExplorer"] = _explorer;
            }
        }

        if (methods.includes("getAccessType")) {
            responses["getAccessType"] = blockchain.getAccessType();
        }

        if (methods.includes("getSignUpInput")) {
            responses["getSignUpInput"] = blockchain.getSignUpInput();
        }

        if (methods.includes("getImportOptions")) {
            responses["getImportOptions"] = blockchain.getImportOptions();
        }

        if (methods.includes("getOperationTypes")) {
            let _opTypes;
            try {
                _opTypes = await blockchain.getOperationTypes();
            } catch (error) {
                console.log({ error, location: "getOperationTypes" });
            }
            if (_opTypes) {
                responses["getOperationTypes"] = _opTypes;
            }
        }

        if (methods.includes("broadcastTransaction")) {
            const { operation } = arg;
            let broadcastResponse;
            try {
                broadcastResponse = await blockchain.broadcast(operation);
            } catch (error) {
                const errData = {
                    code: error.code,
                    message: error.message || "Transaction broadcast failed",
                    data: error.data,
                    digest: error.digest,
                    transaction: error.transaction,
                    location: "broadcast",
                };
                const err = new Error(errData.message);
                err.message = JSON.stringify(errData);
                throw err;
            }
            if (broadcastResponse) {
                responses["broadcastTransaction"] = broadcastResponse;
            }
        }

        if (methods.includes("totpCode")) {
            const { timestamp } = arg;
            const msg = uuidv4();
            let shaMSG = bytesToHex(sha512(new TextEncoder().encode(msg + timestamp)))
                .substring(0, 15);
            responses["code"] = shaMSG;
        }

        if (methods.includes("totpDeeplink")) {
            const { requestContent, currentCode, allowedOperations } = arg;

            let apiobj;
            try {
                apiobj = await _parseDeeplink(
                    requestContent,
                    "totp",
                    chain,
                    blockchain,
                    blockchainActions,
                    allowedOperations,
                    currentCode
                );
            } catch (error) {
                console.log(error);
            }

            if (apiobj && apiobj.type === Actions.INJECTED_CALL) {
                let status;
                try {
                    status = await inject(
                        blockchain,
                        apiobj,
                        mainWindow.webContents
                    );
                } catch (error) {
                    console.log({ error: error || "No status" });
                }

                if (
                    status &&
                    status.result &&
                    !status.result.isError &&
                    !status.result.canceled
                ) {
                    responses["getRawLink"] = status.result;
                }
            }
        }

        if (methods.includes("getRawLink")) {
            const { requestBody, allowedOperations } = arg;

            let apiobj;
            try {
                apiobj = await _parseDeeplink(
                    requestBody,
                    "raw",
                    chain,
                    blockchain,
                    blockchainActions,
                    allowedOperations
                );
            } catch (error) {
                console.log({ error, location: "_parseDeeplink" });
            }

            if (apiobj && apiobj.type === Actions.INJECTED_CALL) {
                let status;
                try {
                    status = await inject(
                        blockchain,
                        apiobj,
                        mainWindow.webContents
                    );
                } catch (error) {
                    console.log({ error: error || "No status" });
                }

                if (
                    status &&
                    status.result &&
                    !status.result.isError &&
                    !status.result.canceled
                ) {
                    responses["getRawLink"] = status.result;
                }
            }
        }

        if (methods.includes("localFileUpload")) {
            const { allowedOperations, fileData } = arg;
            try {
                const data = fileData;

                let apiobj;
                try {
                    apiobj = await _parseDeeplink(
                        data,
                        "local",
                        chain,
                        blockchain,
                        blockchainActions,
                        allowedOperations,
                        null, // avoid TOTP
                        true // changes request parsing
                    );
                } catch (error) {
                    console.log(error);
                }

                if (apiobj && apiobj.type === Actions.INJECTED_CALL) {
                    let status;
                    try {
                        status = await inject(
                            blockchain,
                            apiobj,
                            mainWindow.webContents
                        );
                    } catch (error) {
                        console.log({ error: error || "No status" });
                    }

                    if (
                        status &&
                        status.result &&
                        !status.result.isError &&
                        !status.result.canceled
                    ) {
                        responses["localFileUpload"] = status.result;
                    }
                }
            } catch (error) {
                console.log({ error });
            }
        }

        if (methods.includes("processQR")) {
            const { qrChoice, qrData, allowedOperations } = arg;

            let parsedData;
            try {
                parsedData = JSON.parse(qrData);
            } catch (error) {
                console.log({ error, location: "processQR.parse" });
                return responses;
            }
            let authorizedUse = false;
            if (BTS_FAMILY.includes(chain)) {
                const ops = parsedData.operations[0].operations;
                for (let i = 0; i < ops.length; i++) {
                    let operation = ops[i];
                    if (
                        allowedOperations &&
                        allowedOperations.includes(operation[0])
                    ) {
                        authorizedUse = true;
                        break;
                    }
                }
            } else if (EOS_FAMILY.includes(chain)) {
                const ops = parsedData.actions;
                for (let i = 0; i < ops.length; i++) {
                    let operation = ops[i];
                    if (
                        allowedOperations &&
                        allowedOperations.includes(operation.name)
                    ) {
                        authorizedUse = true;
                        break;
                    }
                }
            } else if (HIVE_FAMILY.includes(chain)) {
                const ops = parsedData.actions;
                for (let i = 0; i < ops.length; i++) {
                    let operation = ops[i];
                    if (
                        allowedOperations &&
                        allowedOperations.includes(operation.name)
                    ) {
                        authorizedUse = true;
                        break;
                    }
                }
            }

            if (authorizedUse) {
                let qrTX;
                try {
                    qrTX = BTS_FAMILY.includes(chain)
                        ? await blockchain.handleQR(
                              JSON.stringify(parsedData.operations[0])
                          )
                        : parsedData;
                } catch (error) {
                    console.log({ error, location: "background" });
                }

                console.log("Authorized use of QR codes");

                let apiobj = {
                    type: Actions.INJECTED_CALL,
                    id: await uuidv4(),
                    payload: {
                        origin: "localhost",
                        appName: "qr",
                        browser: qrChoice,
                        params: BTS_FAMILY.includes(chain)
                            ? qrTX.toObject()
                            : ["signAndBroadcast", qrTX, []],
                        chain: chain,
                    },
                };

                let status;
                try {
                    status = await inject(
                        blockchain,
                        apiobj,
                        mainWindow.webContents
                    );
                } catch (error) {
                    console.log({ error, location: "processQR" });
                }

                if (
                    status &&
                    status.result &&
                    !status.result.isError &&
                    !status.result.canceled
                ) {
                    responses["qrData"] = status.result;
                }
            }
        }

        if (methods.includes("verifyAccount")) {
            const { accountname, authorities } = arg;
            let account;
            let error;
            try {
                account = await blockchain.verifyAccount(
                    accountname,
                    authorities,
                    chain
                );
            } catch (e) {
                console.log(e);
                error = e;
            }

            if (account) {
                const token = storePendingKey(accountname, chain, authorities);
                responses["verifyAccount"] = { account, token };
            } else if (error) {
                responses["verifyAccountError"] = error;
            }
        }

        if (methods.includes("verifyCloudAccount")) {
            const { accountname, pass, legacy } = arg;

            const active_seed = accountname + "active" + pass;
            const owner_seed = accountname + "owner" + pass;
            const memo_seed = accountname + "memo" + pass;

            let authorities;
            try {
                authorities = legacy
                    ? {
                          active: PrivateKey.fromSeed(active_seed).toWif(),
                          memo: PrivateKey.fromSeed(active_seed).toWif(), // legacy wallets improperly used active key for memo
                          owner: PrivateKey.fromSeed(owner_seed).toWif(),
                      }
                    : {
                          active: PrivateKey.fromSeed(active_seed).toWif(),
                          memo: PrivateKey.fromSeed(memo_seed).toWif(),
                          owner: PrivateKey.fromSeed(owner_seed).toWif(),
                      };
            } catch (error) {
                console.log(error);
            }

            if (authorities) {
                let account;
                let error;
                try {
                    account = await blockchain.verifyAccount(
                        accountname,
                        authorities
                    );
                } catch (e) {
                    console.log(e);
                    error = e;
                }

                if (account) {
                    const token = storePendingKey(accountname, chain, authorities);
                    responses["verifyCloudAccount"] = { account, token };
                } else if (error) {
                    responses["verifyCloudAccountError"] = error;
                }
            }
        }

        if (methods.includes("decryptBackup")) {
            const { filePath, pass } = arg;

            let _data;
            try {
                _data = await _readFile(filePath);
            } catch (error) {
                console.log({ error });
            }

            if (_data) {
                let wh = new BTSWalletHandler(_data);

                let unlocked;
                try {
                    unlocked = await wh.unlock(pass);
                } catch (error) {
                    console.log({ error });
                }

                if (unlocked) {
                    let retrievedAccounts;
                    try {
                        retrievedAccounts = await blockchain.lookupAccounts(
                            wh.public,
                            wh.keypairs
                        );
                    } catch (error) {
                        console.log({ error });
                    }

                    if (retrievedAccounts) {
                        // Store keys in vault and replace with tokens
                        for (let account of retrievedAccounts) {
                            const accountKeys = {};
                            if (account.active && account.active.key) {
                                accountKeys.active = account.active.key;
                                delete account.active.key;
                            }
                            if (account.owner && account.owner.key) {
                                accountKeys.owner = account.owner.key;
                                delete account.owner.key;
                            }
                            if (account.memo && account.memo.key) {
                                accountKeys.memo = account.memo.key;
                                delete account.memo.key;
                            }
                            if (Object.keys(accountKeys).length > 0) {
                                account._vaultToken = storePendingKey(account.name, chain, accountKeys);
                            }
                        }
                        responses["decryptBackup"] = retrievedAccounts;
                    }
                }

                wh = null;
            }
        }

        return responses;
    });

    ipcMain.handle("restore", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { fileData, seed } = arg;

        if (!fileData) {
            console.log("Invalid restore file data");
            throw new Error('Invalid file data');
        }

        let decryptedData;
        try {
            decryptedData = await decrypt(fileData, seed);
        } catch (error) {
            console.log(error);
            throw new Error('Decryption failed');
        }

        if (!decryptedData) {
            console.log("Wallet restore failed");
            throw new Error('Wallet restore failed');
        }

        let parsed;
        try {
            parsed = JSON.parse(decryptedData);
        } catch (error) {
            console.log("Failed to parse restored data:", error);
            throw new Error('Invalid backup format');
        }

        return parsed;
    });

    const safeDomains = [
        // BitShares
        "blocksights.info",
        // BEOS
        "explore.beos.world",
        "beos.world",
        // Telos
        "telos.eosx.io",
        // EOS / WAX (shared explorer)
        "eosauthority.com",
        // EOS testnet
        "jungle4.cryptolions.io",
        // FIO
        "bloks.io",
        "fio.bloks.io",
        "fio-test.bloks.io",
        // Libre
        "libreblocks.io",
        "www.libreblocks.io",
        "tools.libre.org",
        "libre-explorer.edenia.cloud",
        // XPR Network
        "explorer.xprnetwork.org",
        "testnet.explorer.xprnetwork.org",
        // Hive
        "hiveblocks.com",
        // Project
        "github.com",
    ];

    ipcMain.on("openURL", (event, arg) => {
        if (!validateSender(event.senderFrame)) return;
        try {
            const parsedUrl = new URL(arg);
            const domain = parsedUrl.hostname;
            if (safeDomains.includes(domain)) {
                shell.openExternal(arg);
            } else {
                console.error(
                    `Rejected opening URL with unsafe domain: ${domain}`
                );
            }
        } catch (err) {
            console.error(`Failed to open URL: ${err.message}`);
        }
    });

    /*
     * Create modal popup & wait for user response
     */
    ipcMain.on("createPopup", async (event, arg) => {
        if (!validateSender(event.senderFrame)) return;
        try {
            await createModal(arg, event);
        } catch (error) {
            console.log(error);
        }
    });

    /*
     * Create receipt popup & wait for user response
     */
    ipcMain.on("createReceipt", async (event, arg) => {
        if (!validateSender(event.senderFrame)) return;
        try {
            await createReceipt(arg, event);
        } catch (error) {
            console.log(error);
        }
    });

    /*
     * Create error popup for failed operations
     */
    ipcMain.on("createError", async (event, arg) => {
        if (!validateSender(event.senderFrame)) return;
        try {
            await createError(arg, event);
        } catch (error) {
            console.log(error);
        }
    });

    /*
     * Log a renderer-forwarded uncaught error / unhandled rejection.
     * Renderers forward via window.electron.sendError (see src/app.js etc.);
     * this captures them in the main process log for crash reporting.
     */
    ipcMain.on("sendError", async (event, arg) => {
        if (!validateSender(event.senderFrame)) return;
        console.error(`[RENDERER] ${event.senderFrame?.url || ""}: ${arg}`);
    });

    ipcMain.on("notify", (event, arg) => {
        if (!validateSender(event.senderFrame)) return;
        const NOTIFICATION_TITLE = "BeetVault wallet notification";
        const NOTIFICATION_BODY =
            arg == "request" ? "BeetVault has received a new request." : arg;

        if (os.platform() === "win32") {
            app.setAppUserModelId(app.name);
        }

        function showNotification() {
            new Notification({
                title: NOTIFICATION_TITLE,
                subtitle: "subtitle",
                body: NOTIFICATION_BODY,
                icon: __dirname + "/img/beet-tray.png",
            }).show();
        }

        showNotification();
    });

    ipcMain.handle("id", (event, arg) => {
        if (!validateSender(event.senderFrame)) throw new Error('Unauthorized');
        const id = uuidv4();
        return id;
    });

    let _encryptedSeed = null;

    // Stores the current node URL per chain, set by the renderer via blockchainRequest
    const _chainNodes = {};

    ipcMain.on("seed", (event, arg) => {
        if (!validateMainSender(event.senderFrame)) return;
        console.log("SEEDED");
        if (!ENCRYPTION_AVAILABLE) {
            _encryptedSeed = { fallback: true, seed: Buffer.from(arg, "utf8") };
        } else {
            try {
                const buffer = safeStorage.encryptString(arg);
                _encryptedSeed = { fallback: false, buffer: buffer };
            } catch (error) {
                console.warn("[SECURITY] safeStorage.encryptString failed, falling back:", error.message);
                ENCRYPTION_AVAILABLE = false;
                _encryptedSeed = { fallback: true, seed: Buffer.from(arg, "utf8") };
            }
        }
    });

    function _logout() {
        console.log("[SECURITY] logout: clearing session");
                if (!_encryptedSeed) {
            return;
        }
        console.log("[SECURITY] forceLogout: clearing session");

        if (_encryptedSeed && _encryptedSeed.seed) {
            _encryptedSeed.seed.fill(0);
        }

        _encryptedSeed = null;
        _pendingKeys.clear();

        // Safety net: remove any orphaned inject listeners
        ipcMain.removeAllListeners("getSafeAccountResponse");
        ipcMain.removeAllListeners("injectedCallResponse");
        ipcMain.removeAllListeners("injectedCallError");

        // Close any open modal/request popups on logout
        Object.keys(modalWindows).forEach((id) => {
            if (modalWindows[id] && !modalWindows[id].isDestroyed()) {
                modalWindows[id].close();
            }
        });
        modalWindows = {};
    }

    function forceLogout() {
        _logout();

        // Notify the renderer (if alive) to reset its in-memory session state
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("forceLogout");
        }
    }

    ipcMain.on("clearSeed", (event) => {
        if (!validateMainSender(event.senderFrame)) return;
        console.log("SEED CLEARED");
        _logout();
    });

    // Register power-monitor listeners (suspend / shutdown / lock-screen)
    // now that the session-wipe helper is in scope. createWindow only runs
    // inside app.whenReady().then(), so powerMonitor is safe to use here.
    initPowerMonitor(forceLogout);

    function _decryptSeed() {
        if (!_encryptedSeed) {
            return null;
        }
        if (_encryptedSeed.fallback) {
            return _encryptedSeed.seed.toString("utf8");
        }
        try {
            return safeStorage.decryptString(_encryptedSeed.buffer);
        } catch (error) {
            console.warn("[SECURITY] safeStorage.decryptString failed:", error.message);
            ENCRYPTION_AVAILABLE = false;
            return null;
        }
    }

    // Key vault: stores plaintext keys temporarily during import flow
    const _pendingKeys = new Map();
    const PENDING_KEY_TTL_MS = 5 * 60 * 1000; // 5 minutes

    function cleanupPendingKeys() {
        const now = Date.now();
        for (const [token, entry] of _pendingKeys) {
            if (now - entry.created > PENDING_KEY_TTL_MS) {
                _pendingKeys.delete(token);
            }
        }
    }

    function storePendingKey(accountname, chain, keys) {
        cleanupPendingKeys();
        const token = uuidv4();
        _pendingKeys.set(token, {
            accountname,
            chain,
            keys,
            created: Date.now()
        });
        return token;
    }

    /**
     * Encrypts pending vault-stored keys and returns the encrypted map.
     *
     * During wallet creation, private keys are temporarily stored in a
     * `_pendingKeys` Map keyed by a UUID token. This handler encrypts each
     * key with Argon2id + AES-256-GCM, deletes the pending entry, and
     * returns the encrypted map.
     *
     * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
     * @param {{ token: string, password: string, tier?: string }} arg
     *   - `token` — UUID identifying the pending keys entry.
     *   - `password` — Pre-hashed password (SHA-512 hex) for encryption.
     *   - `tier` — Optional security tier ("low", "medium", "high"). Defaults to "medium".
     * @returns {Promise<Object<string, string>>} Map of key types to Base64-encoded
     *   encrypted keys in v3 wire format.
     * @throws {Error} If the sender is unauthorized, token is invalid/expired,
     *   or encryption fails.
     */
    ipcMain.handle("encryptPendingKeys", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { token, password, tier } = arg;
        const pending = _pendingKeys.get(token);
        if (!pending) {
            throw new Error('Invalid or expired token');
        }
        _pendingKeys.delete(token);

        const encrypted = {};
        for (const [keytype, value] of Object.entries(pending.keys)) {
            try {
                encrypted[keytype] = await encrypt(value, password, tier || "medium");
            } catch (error) {
                console.log({error});
                throw new Error('Encryption failure');
            }
        }
        return encrypted;
    });

    /**
     * Decrypts a private key and uses it to sign a blockchain transaction.
     *
     * Decrypts the encrypted key using the stored seed, signs the operation
     * with the blockchain API, broadcasts the signed transaction, and returns
     * the broadcast response.
     *
     * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
     * @param {{ encryptedKey: string, chain: string, operation: object }} arg
     *   - `encryptedKey` — Base64-encoded v3 encrypted private key.
     *   - `chain` — Blockchain identifier (e.g., "eos", "bitshares").
     *   - `operation` — The blockchain operation object to sign.
     * @returns {Promise<object>} The broadcast response from the blockchain.
     * @throws {Error} If the sender is unauthorized, wallet is locked,
     *   key decryption fails, or signing/broadcasting fails.
     */
    ipcMain.handle("decryptAndSign", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { encryptedKey, chain, operation } = arg;

        // Decrypt the key using stored seed
        const seed = _decryptSeed();
        if (!seed) {
            throw new Error('Wallet not unlocked');
        }

        let signingKey;
        try {
            signingKey = await decrypt(encryptedKey, seed);
        } catch (error) {
            console.log({error, location: "decryptAndSign.decrypt"});
            throw new Error('Key decryption failed');
        }

        if (!signingKey) {
            throw new Error('Key decryption returned empty');
        }

        let blockchain;
        try {
            blockchain = await getBlockchainAPI(chain, _chainNodes[chain] || null);
        } catch (error) {
            console.log({error, location: "decryptAndSign.getBlockchain"});
            throw new Error('Failed to get blockchain API');
        }

        // Sign the transaction
        let transaction;
        try {
            transaction = await blockchain.sign(operation, signingKey);
        } catch (error) {
            const errData = {
                code: error.code,
                message: error.message || "Transaction signing failed",
                data: error.data,
                location: "decryptAndSign.blockchain.sign",
            };
            const err = new Error(errData.message);
            err.message = JSON.stringify(errData);
            throw err;
        }

        // Broadcast the transaction
        if (transaction) {
            let broadcastResponse;
            try {
                broadcastResponse = await blockchain.broadcast(transaction);
            } catch (error) {
                const errData = {
                    code: error.code,
                    message: error.message || "Transaction broadcast failed",
                    data: error.data,
                    digest: error.digest,
                    transaction: error.transaction,
                    location: "decryptAndSign.blockchain.broadcast",
                };
                const err = new Error(errData.message);
                err.message = JSON.stringify(errData);
                throw err;
            }
            return broadcastResponse;
        }

        throw new Error('No transaction returned from sign');
    });

    /**
     * Decrypts a memo key and creates an encrypted memo object.
     *
     * Decrypts the memo key using the stored seed, then uses the blockchain
     * API to create an encrypted memo object for transferring messages
     * between accounts.
     *
     * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
     * @param {{ encryptedKey: string, chain: string, from: string, to: string, nonce: string, message: string }} arg
     *   - `encryptedKey` — Base64-encoded v3 encrypted memo key.
     *   - `chain` — Blockchain identifier.
     *   - `from` — Sender account name.
     *   - `to` — Recipient account name.
     *   - `nonce` — Memo nonce for encryption.
     *   - `message` — Plaintext message to encrypt in the memo.
     * @returns {Promise<object>} The encrypted memo object.
     * @throws {Error} If the sender is unauthorized, wallet is locked,
     *   key decryption fails, or memo creation fails.
     */
    ipcMain.handle("decryptAndCreateMemo", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { encryptedKey, chain, from, to, nonce, message } = arg;

        const seed = _decryptSeed();
        if (!seed) {
            throw new Error('Wallet not unlocked');
        }

        let memoKey;
        try {
            memoKey = await decrypt(encryptedKey, seed);
        } catch (error) {
            console.log({error, location: "decryptAndCreateMemo.decrypt"});
            throw new Error('Key decryption failed');
        }

        let blockchain;
        try {
            blockchain = await getBlockchainAPI(chain, _chainNodes[chain] || null);
        } catch (error) {
            console.log({error, location: "decryptAndCreateMemo.getBlockchain"});
            throw new Error('Failed to get blockchain API');
        }

        let memoObject;
        try {
            memoObject = blockchain._createMemoObject(
                from, to, nonce, message, memoKey
            );
        } catch (error) {
            console.log({error, location: "decryptAndCreateMemo.createMemo"});
            throw new Error('Memo creation failed');
        }

        return memoObject;
    });

    /**
     * Decrypts a private key and uses it to sign a text message.
     *
     * Decrypts the key using the stored seed, then signs the message using
     * the blockchain API's signMessage method.
     *
     * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
     * @param {{ encryptedKey: string, chain: string, accountName: string, messageText: string }} arg
     *   - `encryptedKey` — Base64-encoded v3 encrypted private key.
     *   - `chain` — Blockchain identifier.
     *   - `accountName` — Account name that owns the signing key.
     *   - `messageText` — The text message to sign.
     * @returns {Promise<object>} The signed message object.
     * @throws {Error} If the sender is unauthorized, wallet is locked,
     *   key decryption fails, or message signing fails.
     */
    ipcMain.handle("decryptAndSignMessage", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { encryptedKey, chain, accountName, messageText } = arg;

        const seed = _decryptSeed();
        if (!seed) {
            throw new Error('Wallet not unlocked');
        }

        let signingKey;
        try {
            signingKey = await decrypt(encryptedKey, seed);
        } catch (error) {
            console.log({error, location: "decryptAndSignMessage.decrypt"});
            throw new Error('Key decryption failed');
        }

        let blockchain;
        try {
            blockchain = await getBlockchainAPI(chain, _chainNodes[chain] || null);
        } catch (error) {
            console.log({error, location: "decryptAndSignMessage.getBlockchain"});
            throw new Error('Failed to get blockchain API');
        }

        let signedMessage;
        try {
            signedMessage = await blockchain.signMessage(
                signingKey,
                accountName,
                messageText,
                chain
            );
        } catch (error) {
            console.log({error, location: "decryptAndSignMessage.signMessage"});
            throw new Error('Message signing failed');
        }

        return signedMessage;
    });

    /**
     * Unlocks a wallet by decrypting its encrypted data.
     *
     * The password is expected to be pre-hashed (SHA-512 hex) by the renderer
     * before being sent to the main process. The password is stored via
     * Electron's safeStorage for later use in signing operations.
     *
     * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
     * @param {{ encryptedData: string, password: string }} arg - The encrypted wallet data and pre-hashed password.
     * @returns {Promise<string>} The decrypted wallet data as a JSON string.
     * @throws {Error} If the sender is unauthorized or decryption fails.
     */
    ipcMain.handle("unlockWallet", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { encryptedData, password } = arg;

        // Store the pre-hashed password as seed via safeStorage
        if (!ENCRYPTION_AVAILABLE) {
            _encryptedSeed = { fallback: true, seed: Buffer.from(password, "utf8") };
        } else {
            try {
                const buffer = safeStorage.encryptString(password);
                _encryptedSeed = { fallback: false, buffer: buffer };
            } catch (error) {
                console.warn("[SECURITY] safeStorage.encryptString failed, falling back:", error.message);
                ENCRYPTION_AVAILABLE = false;
                _encryptedSeed = { fallback: true, seed: Buffer.from(password, "utf8") };
            }
        }

        let decryptedWallet;
        try {
            decryptedWallet = await decrypt(encryptedData, password);
        } catch (error) {
            console.log({error, location: "unlockWallet.decrypt"});
            throw new Error('Wallet decryption failed');
        }

        return decryptedWallet;
    });

    /**
     * Encrypts arbitrary data with Argon2id + AES-256-GCM and returns
     * the Base64-encoded v3 wire format string.
     *
     * Used by the renderer to encrypt wallet blobs, individual keys, and
     * other sensitive data before storing in IndexedDB.
     *
     * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
     * @param {{ data: string, password: string, tier?: string }} arg
     *   - `data` — Plaintext string to encrypt.
     *   - `password` — Pre-hashed password (SHA-512 hex) for key derivation.
     *   - `tier` — Optional security tier ("low", "medium", "high") or raw
     *     `{ t, m, p }` parameters. Defaults to "medium".
     * @returns {Promise<string>} Base64-encoded ciphertext in v3 wire format.
     * @throws {Error} If the sender is unauthorized or encryption fails.
     */
    ipcMain.handle("encryptAndStore", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { data, password, tier } = arg;

        let encrypted;
        try {
            encrypted = await encrypt(data, password, tier || "medium");
        } catch (error) {
            console.log({error, location: "encryptAndStore.encrypt"});
            throw new Error('Encryption failed');
        }

        return encrypted;
    });

    /**
     * Decrypts wallet data using the stored in-memory seed.
     *
     * Used for authorization checks (verifying the user knows the password)
     * and for re-encrypting wallet data after adding/removing accounts.
     * The seed is the pre-hashed password that was stored during unlockWallet.
     *
     * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
     * @param {{ data: string }} arg
     *   - `data` — Base64-encoded v3 encrypted wallet data.
     * @returns {Promise<string>} Decrypted plaintext (usually JSON).
     * @throws {Error} If the sender is unauthorized, wallet is not unlocked,
     *   or decryption fails.
     */
    ipcMain.handle("decryptWallet", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { data } = arg;

        const seed = _decryptSeed();
        if (!seed) {
            throw new Error('Wallet not unlocked');
        }

        let decrypted;
        try {
            decrypted = await decrypt(data, seed);
        } catch (error) {
            console.log({error, location: "decryptWallet.decrypt"});
            throw new Error('Decryption failed');
        }

        return decrypted;
    });

    /**
     * Stores a pre-hashed password as the in-memory encryption seed.
     *
     * Used during wallet restore to set the seed without going through the
     * unlock flow. The seed is used for subsequent decrypt operations and
     * for signing transactions.
     *
     * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
     * @param {{ password: string }} arg
     *   - `password` — Pre-hashed password (SHA-512 hex) to store as seed.
     * @returns {Promise<boolean>} Always returns true on success.
     * @throws {Error} If the sender is unauthorized.
     */
    ipcMain.handle("setSeedFromPassword", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { password } = arg;

        if (!ENCRYPTION_AVAILABLE) {
            _encryptedSeed = { fallback: true, seed: Buffer.from(password, "utf8") };
        } else {
            try {
                const buffer = safeStorage.encryptString(password);
                _encryptedSeed = { fallback: false, buffer: buffer };
            } catch (error) {
                console.warn("[SECURITY] safeStorage.encryptString failed, falling back:", error.message);
                ENCRYPTION_AVAILABLE = false;
                _encryptedSeed = { fallback: true, seed: Buffer.from(password, "utf8") };
            }
        }

        return true;
    });

    /**
     * Returns information about the safeStorage encryption backend.
     *
     * On Linux, returns the selected password manager backend name (e.g.,
     * "gnome_libsecret", "kwallet5", "basic_text"). On other platforms,
     * returns the platform name since `getSelectedStorageBackend()` is
     * Linux-only.
     *
     * @returns {{ available: boolean, backend: string }} Encryption availability and backend name.
     */
    ipcMain.handle("getSafeStorageBackend", async (event) => {
        if (!validateSender(event.senderFrame)) throw new Error('Unauthorized');
        let backend;
        if (process.platform === 'linux') {
            try {
                backend = safeStorage.getSelectedStorageBackend();
            } catch (error) {
                backend = `error: ${error.message}`;
            }
        } else {
            backend = process.platform;
        }
        return {
            available: ENCRYPTION_AVAILABLE,
            backend: backend
        };
    });

    ipcMain.handle("getSignature", async (event, arg) => {
        if (!validateSender(event.senderFrame)) throw new Error('Unauthorized');
        let response;
        try {
            response = await getSignature(arg);
        } catch (error) {
            console.log(error);
        }

        return response;
    });

    ipcMain.handle("verifyCrypto", async (event, arg) => {
        if (!validateSender(event.senderFrame)) throw new Error('Unauthorized');
        const { signedMessage, msgHash, pubk } = arg;
        let isValid;
        try {
            isValid = secp.verify(hexToBytes(signedMessage), hexToBytes(msgHash), pubk, {prehash: false});
        } catch (error) {
            console.log(error);
        }

        return isValid;
    });

    ipcMain.on("downloadBackup", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) return;
        const { walletName, walletTier, accounts } = arg;
        const seed = _decryptSeed();
        if (!seed) {
            console.error("Cannot backup: wallet not unlocked");
            return;
        }
        let toLocalPath = path.resolve(
            app.getPath("desktop"),
            `BeetBackup-${walletName}-${new Date()
                .toISOString()
                .slice(0, 10)}.beet`
        );
        dialog
            .showSaveDialog({ defaultPath: toLocalPath })
            .then(async (result) => {
                if (result.canceled) {
                    console.log("Cancelled saving backup.");
                    return;
                }

                let response = await getSignature("backup");
                if (!response) {
                    console.log("Error: No signature");
                    return;
                }

                let isValid;
                try {
                    isValid = secp.verify(hexToBytes(response.signedMessage), hexToBytes(response.msgHash), response.pubk, {prehash: false});
                } catch (error) {
                    console.log(error);
                    return;
                }

                if (!isValid) {
                    console.log("Failed to backup wallet (validation)");
                    return;
                }

                let encrypted;
                try {
                    encrypted = await encrypt(
                        JSON.stringify({
                            wallet: walletName,
                            tier: walletTier || "medium",
                            accounts: JSON.parse(accounts),
                        }),
                        seed
                    );
                } catch (error) {
                    console.log(`encrypt: ${error}`);
                    return;
                }

                if (!encrypted) {
                    console.log("Failed to backup wallet (encryption)");
                    return;
                }

                if (encrypted) {
                    await fsPromises.writeFile(result.filePath, encrypted);
                }
            })
            .catch((error) => {
                console.log(error);
            });
    });

    tray.on("click", () => {
        mainWindow.setAlwaysOnTop(true);
        mainWindow.show();
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(false);
    });

    tray.on("balloon-click", () => {
        mainWindow.setAlwaysOnTop(true);
        mainWindow.show();
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(false);
    });

    // Layer 4: One-time-per-session security warning when safeStorage is
    // unavailable. Shows a non-blocking system notification so the user is
    // aware their seed is held in memory without OS-level protection.
    if (!ENCRYPTION_AVAILABLE) {
        let reason = process.platform;
        if (process.platform === "linux") {
            try {
                reason = safeStorage.getSelectedStorageBackend();
            } catch (error) {
                reason = "secret store unavailable";
            }
        }
        new Notification({
            title: "BeetVault — No OS Keyring",
            body: "Your system has no OS-level keychain (" + reason +
                  "). Your wallet is still encrypted with your password, but the unlock material is held in app memory only. Lock the wallet when you step away.",
            icon: __dirname + "/img/beet-tray.png",
        }).show();
    }
};

app.disableHardwareAcceleration();

let currentOS = os.platform();

// Tears down all power-monitor listeners (used on before-quit / shutdown).
let _powerMonitorCleanup = () => {};

// Wires up Electron powerMonitor to force a logout on system
// suspend (sleep), shutdown, and lock-screen. Must be called after
// app.whenReady() resolves (it is invoked from createWindow, which
// only runs inside app.whenReady().then()). powerMonitor never
// throws if the platform backend is unavailable (best-effort on
// Linux). `forceLogoutFn` is injected to avoid pulling the seed
// closure into module scope.
function initPowerMonitor(forceLogoutFn) {
    const cleanupFns = [];

    const onSystemEvent = () => forceLogoutFn();

    // suspend / shutdown / lock-screen -> forceLogout
    const events = ["suspend", "shutdown", "lock-screen"];
    events.forEach((evt) => {
        powerMonitor.on(evt, onSystemEvent);
        cleanupFns.push(() => powerMonitor.removeListener(evt, onSystemEvent));
    });

    // macOS does not emit "lock-screen" via powerMonitor. Fall back to the
    // workspace session-resigned-active notification so lock-screen is
    // detected here too. systemPreferences may be undefined on some
    // builds, hence the guard.
    if (process.platform === "darwin" && systemPreferences) {
        const subscription = systemPreferences.subscribeNotification(
            "NSWorkspaceSessionDidResignActiveNotification",
            onSystemEvent
        );
        if (subscription) {
            cleanupFns.push(() => subscription.unsubscribe());
        }
    }

    _powerMonitorCleanup = () => cleanupFns.forEach((fn) => fn());
}

if (currentOS === "win32" || currentOS === "linux") {
    // windows + linux setup phase
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
        app.quit();
    } else {
        // Handle the protocol. In this case, we choose to show an Error Box.
        app.on("second-instance", (event, argv) => {
            // Someone tried to run a second instance, we should focus our window.
            if (!mainWindow) {
                console.error("Main window is not defined.");
                return;
            }

            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }

            mainWindow.focus();

            let deeplink;
            try {
                deeplink = argv.find(arg =>
                    typeof arg === 'string' &&
                    (arg.startsWith('beeteos://') || arg.startsWith('rawbeeteos://') ||
                     arg.startsWith('beetvault://') || arg.startsWith('rawbeetvault://'))
                );
            } catch (error) {
                console.log(error);
                return;
            }

            if (!deeplink) {
                console.log("No deep link found in argv");
                return;
            }

            const isRaw = deeplink.startsWith('rawbeeteos://') || deeplink.startsWith('rawbeetvault://');
            const apiPrefix = isRaw ? 'raw' : '';
            const schemePrefix = deeplink.startsWith('rawbeeteos://') ? 'rawbeeteos://api/'
                : deeplink.startsWith('rawbeetvault://') ? 'rawbeetvault://api/'
                : deeplink.startsWith('beetvault://') ? 'beetvault://api/'
                : 'beeteos://api/';
            if (!deeplink.includes(schemePrefix)) {
                console.log("Invalid deep link format");
                return;
            }

            let deeplinkingUrl = deeplink.split(schemePrefix)[1];
            if (!deeplinkingUrl || deeplinkingUrl.length > 4096) {
                console.log("Deep link URL missing or too long");
                return;
            }

            let qs;
            try {
                qs = queryString.parse(deeplinkingUrl);
            } catch (error) {
                console.log(error);
                return;
            }

            if (qs) {
                mainWindow.webContents.send(
                    deeplink.includes("raw") ? "rawdeeplink" : "deeplink",
                    qs
                );
            }
        });

        let defaultPath;
        try {
            if (process.argv[1]) {
                defaultPath = path.resolve(process.argv[1]);
            }
        } catch (error) {
            console.log(error);
        }

        app.setAsDefaultProtocolClient("beeteos", process.execPath, [
            defaultPath,
        ]);

        app.setAsDefaultProtocolClient("rawbeeteos", process.execPath, [
            defaultPath,
        ]);

        app.setAsDefaultProtocolClient("beetvault", process.execPath, [
            defaultPath,
        ]);

        app.setAsDefaultProtocolClient("rawbeetvault", process.execPath, [
            defaultPath,
        ]);

        app.whenReady().then(() => {
            createWindow();
        });
    }
} else {
    app.setAsDefaultProtocolClient("beeteos");
    app.setAsDefaultProtocolClient("rawbeeteos");
    app.setAsDefaultProtocolClient("beetvault");
    app.setAsDefaultProtocolClient("rawbeetvault");

    app.whenReady().then(() => {
        createWindow();
    });

    app.on("open-url", (event, urlString) => {
        if (!mainWindow) {
            console.error("Main window is not defined.");
            return;
        }

        let urlType = urlString.includes("raw") ? "rawdeeplink" : "deeplink";

        dialog.showErrorBox("Error", urlType);

        let deeplinkingUrl = urlString
            .replace(/rawbeeteos:\/\/api\//, "")
            .replace(/rawbeetvault:\/\/api\//, "")
            .replace(/beetvault:\/\/api\//, "")
            .replace(/beeteos:\/\/api\//, "");

        let qs;
        try {
            qs = queryString.parse(deeplinkingUrl);
        } catch (error) {
            console.log(error);
            return;
        }

        if (qs) {
            dialog.showErrorBox("Error", JSON.stringify({ qs: qs }));
            mainWindow.webContents.send(urlType, qs);
        }
    });

    app.on("window-all-closed", () => {
        // Safety net: remove any orphaned inject listeners
        ipcMain.removeAllListeners("getSafeAccountResponse");
        ipcMain.removeAllListeners("injectedCallResponse");
        ipcMain.removeAllListeners("injectedCallError");

        if (process.platform !== "darwin") {
            app.quit();
        }
    });

    app.on("before-quit", () => {
        console.log("[APP] before-quit: closing blockchain connections");
        // Tear down power-monitor listeners before they can re-fire during
        // shutdown (avoids a double forceLogout race with the "shutdown"
        // power event).
        _powerMonitorCleanup();
        try {
            // BitShares: refcounted close of state.ws_rpc (ChainWebSocket).
            Apis.close();
        } catch (e) {
            // Ignore — app is shutting down regardless.
        }
        // TODO(EOS/Hive family): expose a disconnect() on BlockchainAPI/EOSmainnet
        // and call it here to tear down the WebSocket connection.
    });

    app.on("activate", () => {
        if (mainWindow === null) {
            createWindow();
        }
    });
}
