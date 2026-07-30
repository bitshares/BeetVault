import path from "path";
import url from "url";
import fs from "fs";
import fsPromises from "fs/promises";

import os from "os";

import queryString from "query-string";
import { PrivateKey } from "bitsharesjs";

import { v4 as uuidv4 } from "uuid";
import { encrypt as opensslEncrypt, decrypt as opensslDecrypt } from "./lib/openssl.js";
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
} from "electron";

import Logger from "./lib/Logger.js";
import { initApplicationMenu } from "./lib/applicationMenu.js";
import { getSignature } from "./lib/SecureRemote.js";
import * as Actions from "./lib/Actions.js";
import getBlockchainAPI from "./lib/blockchains/blockchainFactory.js";
import BTSWalletHandler from "./lib/blockchains/bitshares/BTSWalletHandler.js";
import { BTS_FAMILY, EOS_FAMILY, HIVE_FAMILY } from "./lib/blockchains/chainFamilies.js";

import { inject } from "./lib/inject.js";

const VALID_SENDER_PAGES = ['index.html', 'modal.html', 'receipt.html', 'error.html'];

/**
 * Validates that an IPC sender is from an allowed HTML page.
 *
 * Checks that the sender's URL uses the file: protocol and that the
 * page filename is in the list of allowed sender pages.
 *
 * @param {Electron.WebFrame} senderFrame - The sender frame from the IPC event.
 * @returns {boolean} True if the sender is from an allowed page.
 */
function validateSender(senderFrame) {
    try {
        const senderUrl = new URL(senderFrame.url);
        if (senderUrl.protocol !== 'file:') return false;
        const filename = senderUrl.pathname.split('/').pop();
        return VALID_SENDER_PAGES.includes(filename);
    } catch {
        return false;
    }
}

/**
 * Validates that an IPC sender is from the main app page (index.html).
 *
 * This is a stricter check used for sensitive operations like wallet
 * unlocking and encryption. Only the main app window is allowed.
 *
 * @param {Electron.WebFrame} senderFrame - The sender frame from the IPC event.
 * @returns {boolean} True if the sender is from index.html.
 */
function validateMainSender(senderFrame) {
    try {
        const senderUrl = new URL(senderFrame.url);
        if (senderUrl.protocol !== 'file:') return false;
        const filename = senderUrl.pathname.split('/').pop();
        return filename === 'index.html';
    } catch {
        return false;
    }
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let modalWindows = {};
let modalRequests = {};
let receiptWindows = {};
let errorWindow = null;

var isDevMode = process.execPath.match(/[\\/]electron/);
const logger = new Logger(isDevMode ? 3 : 0);
let tray = null;
let regexBTS = /1\.2\.\d+/g;

async function _readFile(filePath) {
    return new Promise((resolve, reject) => {
        if (!filePath || typeof filePath !== 'string') {
            return reject("Invalid file path");
        }

        const resolved = path.resolve(filePath);
        const ext = path.extname(resolved);

        if (ext !== '.bin') {
            return reject("Invalid file type");
        }

        if (resolved.includes('..') || resolved.includes('\0')) {
            return reject("Invalid file path");
        }

        fs.readFile(resolved, async (err, data) => {
            if (err) {
                console.log({ err });
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
}

/*
 * On modal popup this runs to create child browser window
 */
const createModal = async (arg, modalEvent) => {
    let modalHeight = 600;
    let modalWidth = 800;
    if (!mainWindow) {
        logger.debug(`No window`);
        throw "No main window";
    }

    let request = arg.request;
    let id = request.id;
    if (!request || !request.id) {
        logger.debug(`No request`);
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
        // The modal window is ready to receive data
        event.reply(`respond:prompt:${id}`, modalData);
    });

    modalWindows[id] = new BrowserWindow({
        parent: mainWindow,
        title: "BeetEOS prompt",
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
            enableRemoteModule: false, // Keep false for security
            sandbox: true, // Keep true for security
            preload: path.join(__dirname, "preloadModal.js"),
        },
        icon: __dirname + "/img/beet-taskbar.png",
    });

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
            logger.debug(`No request`);
            throw "No request";
        }

        if (receiptWindows[id]) {
            throw "Receipt window exists already!";
        }

        let targetURL = `file://${__dirname}/receipt.html?id=${encodeURIComponent(
            id
        )}`;
        
        ipcMain.once(`get:receipt:${id}`, (event) => {
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
            title: "BeetEOS receipt",
            width: modalWidth,
            height: modalHeight,
            minWidth: modalWidth,
            minHeight: modalHeight,
            maximizable: true,
            useContentSize: true,
            webPreferences: {
                nodeIntegration: false, // Keep false for security
                contextIsolation: true, // Keep true for security
                enableRemoteModule: false, // Keep false for security
                sandbox: true, // Keep true for security
                preload: path.join(__dirname, "preloadModal.js"),
            },
            icon: __dirname + "/img/beet-taskbar.png",
        });

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
        logger.debug(`No window`);
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
    let errorMessage = arg.errorMessage || "An unexpected error occurred.";
    let terminalError = arg.terminalError || "";
    let consoleLogs = arg.consoleLogs || [];
    let timestamp = arg.timestamp || new Date().toISOString();
    let context = arg.context || "";

    let targetURL = `file://${__dirname}/error.html?id=${encodeURIComponent(id)}`;

    ipcMain.once(`get:error:${id}`, (event) => {
        event.reply(`respond:error:${id}`, {
            id,
            title,
            errorMessage,
            terminalError,
            consoleLogs,
            timestamp,
            context,
        });
    });

    errorWindow = new BrowserWindow({
        parent: mainWindow,
        title: "BeetEOS error",
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
            enableRemoteModule: false,
            sandbox: true,
            preload: path.join(__dirname, "preloadModal.js"),
        },
        icon: __dirname + "/img/beet-taskbar.png",
    });

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

/*
 * A modal error occurred. Close window, resolve promise, delete references.
 */
ipcMain.on("modalError", (event, arg) => {
    if (modalWindows[arg.id]) {
        modalWindows[arg.id].close();
        delete modalWindows[arg.id];
    }
    if (modalRequests[arg.id]) {
        modalRequests[arg.id].reject(arg);
        delete modalRequests[arg.id];
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
            decryptedData = opensslDecrypt(parsedRequest, currentCode);
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

    if (!settingsRows.includes(request.payload.method)) {
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
const createWindow = async () => {
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
            enableRemoteModule: false, // Keep false for security
            sandbox: true, // Keep true for security
            preload: path.join(__dirname, "preload.js"),
        },
        icon: __dirname + "/img/beet-taskbar.png",
    });

    initApplicationMenu(mainWindow);
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "index.html"),
            protocol: "file:",
            slashes: true,
        })
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
    tray.setToolTip("BeetEOS");

    tray.on("right-click", (event, bounds) => {
        tray.popUpContextMenu(contextMenu);
    });

    ipcMain.handle("memoFromBuffer", async (event, arg) => {
        const { msg } = arg;
        return Buffer.from(msg).toString('hex');
    });

    /*
     * Handling front end blockchain requests
     */
    ipcMain.handle("blockchainRequest", async (event, arg) => {
        const { methods, account, chain } = arg;

        console.log({ methods, account, chain });

        let blockchain;
        try {
            blockchain = await getBlockchainAPI(chain);
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
            try {
                account = await blockchain.verifyAccount(
                    accountname,
                    authorities,
                    chain
                );
            } catch (error) {
                console.log(error);
                return;
            }

            if (account) {
                const token = storePendingKey(accountname, chain, authorities);
                responses["verifyAccount"] = { account, token };
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
                try {
                    account = await blockchain.verifyAccount(
                        accountname,
                        authorities
                    );
                } catch (error) {
                    console.log(error);
                    return;
                }

                if (account) {
                    const token = storePendingKey(accountname, chain, authorities);
                    responses["verifyCloudAccount"] = { account, token };
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
        const { file, seed } = arg;

        if (!file || !file.endsWith('.beet')) {
            console.log("Invalid restore file path");
            throw new Error('Invalid file path');
        }

        let data;
        try {
            data = await fsPromises.readFile(file, "utf-8");
        } catch (error) {
            console.log("Error reading file");
            throw new Error('Failed to read file');
        }

        let decryptedData;
        try {
            decryptedData = opensslDecrypt(data, seed);
        } catch (error) {
            console.log(error);
            throw new Error('Decryption failed');
        }

        if (!decryptedData) {
            console.log("Wallet restore failed");
            throw new Error('Wallet restore failed');
        }

        return decryptedData;
    });

    const safeDomains = [
        "bloks.io",
        "explore.beos.world",
        "blocksights.info",
        "telos.eosx.io",
    ];
    ipcMain.on("openURL", (event, arg) => {
        try {
            const parsedUrl = new url.URL(arg);
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
        try {
            await createError(arg, event);
        } catch (error) {
            console.log(error);
        }
    });

    ipcMain.on("notify", (event, arg) => {
        logger.debug("notify");
        const NOTIFICATION_TITLE = "Beet wallet notification";
        const NOTIFICATION_BODY =
            arg == "request" ? "Beet has received a new request." : arg;

        if (os.platform === "win32") {
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
        const id = uuidv4();
        return id;
    });

    let _encryptedSeed = null;

    ipcMain.on("seed", (event, arg) => {
        if (!validateMainSender(event.senderFrame)) return;
        console.log("SEEDED");
        if (!safeStorage.isEncryptionAvailable()) {
            console.warn("[SECURITY] safeStorage encryption not available. Seed stored in memory without OS-level protection. Consider configuring a system keychain (GNOME Keyring, KWallet, or Windows Credential Locker).");
            _encryptedSeed = { fallback: true, seed: arg };
        } else {
            const buffer = safeStorage.encryptString(arg);
            _encryptedSeed = { fallback: false, buffer: buffer };
        }
    });

    ipcMain.on("clearSeed", (event) => {
        if (!validateMainSender(event.senderFrame)) return;
        console.log("SEED CLEARED");
        _encryptedSeed = null;
        _pendingKeys.clear();
        _keyCounter = 0;
    });

    function _decryptSeed() {
        if (!_encryptedSeed) {
            return null;
        }
        if (_encryptedSeed.fallback) {
            return _encryptedSeed.seed;
        }
        return safeStorage.decryptString(_encryptedSeed.buffer);
    }

    // Key vault: stores plaintext keys temporarily during import flow
    const _pendingKeys = new Map();
    let _keyCounter = 0;

    function storePendingKey(accountname, chain, keys) {
        const token = `pending_${++_keyCounter}`;
        _pendingKeys.set(token, {
            accountname,
            chain,
            keys,
            created: Date.now()
        });
        return token;
    }

    ipcMain.handle("encryptPendingKeys", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { token, password } = arg;
        const pending = _pendingKeys.get(token);
        if (!pending) {
            throw new Error('Invalid or expired token');
        }
        _pendingKeys.delete(token);

        const encrypted = {};
        for (const [keytype, value] of Object.entries(pending.keys)) {
            try {
                encrypted[keytype] = opensslEncrypt(value, password);
            } catch (error) {
                console.log({error});
                throw new Error('Encryption failure');
            }
        }
        return encrypted;
    });

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
            signingKey = opensslDecrypt(encryptedKey, seed);
        } catch (error) {
            console.log({error, location: "decryptAndSign.decrypt"});
            throw new Error('Key decryption failed');
        }

        if (!signingKey) {
            throw new Error('Key decryption returned empty');
        }

        let blockchain;
        try {
            blockchain = await getBlockchainAPI(chain);
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

    ipcMain.handle("decryptAndCreateMemo", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { encryptedKey, chain, from, to, nonce, message } = arg;

        const seed = _decryptSeed();
        if (!seed) {
            throw new Error('Wallet not unlocked');
        }

        let memoKey;
        try {
            memoKey = opensslDecrypt(encryptedKey, seed);
        } catch (error) {
            console.log({error, location: "decryptAndCreateMemo.decrypt"});
            throw new Error('Key decryption failed');
        }

        let blockchain;
        try {
            blockchain = await getBlockchainAPI(chain);
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

    ipcMain.handle("decryptAndSignMessage", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { encryptedKey, chain, accountName, messageText } = arg;

        const seed = _decryptSeed();
        if (!seed) {
            throw new Error('Wallet not unlocked');
        }

        let signingKey;
        try {
            signingKey = opensslDecrypt(encryptedKey, seed);
        } catch (error) {
            console.log({error, location: "decryptAndSignMessage.decrypt"});
            throw new Error('Key decryption failed');
        }

        let blockchain;
        try {
            blockchain = await getBlockchainAPI(chain);
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
        if (!safeStorage.isEncryptionAvailable()) {
            console.warn("[SECURITY] safeStorage encryption not available. Seed stored in memory without OS-level protection. Consider configuring a system keychain (GNOME Keyring, KWallet, or Windows Credential Locker).");
            _encryptedSeed = { fallback: true, seed: password };
        } else {
            const buffer = safeStorage.encryptString(password);
            _encryptedSeed = { fallback: false, buffer: buffer };
        }

        let decryptedWallet;
        try {
            decryptedWallet = opensslDecrypt(encryptedData, password);
        } catch (error) {
            console.log({error, location: "unlockWallet.decrypt"});
            throw new Error('Wallet decryption failed');
        }

        return decryptedWallet;
    });

    ipcMain.handle("encryptAndStore", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { data, password } = arg;

        let encrypted;
        try {
            encrypted = opensslEncrypt(data, password);
        } catch (error) {
            console.log({error, location: "encryptAndStore.encrypt"});
            throw new Error('Encryption failed');
        }

        return encrypted;
    });

    ipcMain.handle("decryptWallet", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { data } = arg;

        const seed = _decryptSeed();
        if (!seed) {
            throw new Error('Wallet not unlocked');
        }

        let decrypted;
        try {
            decrypted = opensslDecrypt(data, seed);
        } catch (error) {
            console.log({error, location: "decryptWallet.decrypt"});
            throw new Error('Decryption failed');
        }

        return decrypted;
    });

    ipcMain.handle("setSeedFromPassword", async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { password } = arg;

        if (!safeStorage.isEncryptionAvailable()) {
            console.warn("[SECURITY] safeStorage encryption not available. Seed stored in memory without OS-level protection. Consider configuring a system keychain (GNOME Keyring, KWallet, or Windows Credential Locker).");
            _encryptedSeed = { fallback: true, seed: password };
        } else {
            const buffer = safeStorage.encryptString(password);
            _encryptedSeed = { fallback: false, buffer: buffer };
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
        return {
            available: safeStorage.isEncryptionAvailable(),
            backend: process.platform === 'linux' ? safeStorage.getSelectedStorageBackend() : process.platform
        };
    });

    ipcMain.handle("getSignature", async (event, arg) => {
        let response;
        try {
            response = await getSignature(arg);
        } catch (error) {
            console.log(error);
        }

        return response;
    });

    ipcMain.handle("verifyCrypto", async (event, arg) => {
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
        const { walletName, accounts } = arg;
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
                    encrypted = await aes
                        .encrypt(
                            JSON.stringify({
                                wallet: walletName,
                                accounts: JSON.parse(accounts),
                            }),
                            seed
                        )
                        .toString();
                } catch (error) {
                    console.log(`encrypt: ${error}`);
                    return;
                }

                if (!encrypted) {
                    console.log("Failed to backup wallet (encryption)");
                    return;
                }

                if (encrypted) {
                    fs.writeFileSync(result.filePath, encrypted);
                }
            })
            .catch((error) => {
                console.log(error);
            });
    });

    ipcMain.on("log", (event, arg) => {
        logger[arg.level](arg.data);
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
};

app.disableHardwareAcceleration();

let currentOS = os.platform();
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
                    (arg.startsWith('beeteos://') || arg.startsWith('rawbeeteos://'))
                );
            } catch (error) {
                console.log(error);
                return;
            }

            if (!deeplink) {
                console.log("No deep link found in argv");
                return;
            }

            const isRaw = deeplink.startsWith('rawbeeteos://');
            const apiPrefix = isRaw ? 'rawbeeteos://api/' : 'beeteos://api/';
            if (!deeplink.includes(apiPrefix)) {
                console.log("Invalid deep link format");
                return;
            }

            let deeplinkingUrl = deeplink.split(apiPrefix)[1];
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
            defaultPath = path.resolve(process.argv[1]);
        } catch (error) {
            console.log(error);
        }

        app.setAsDefaultProtocolClient("beeteos", process.execPath, [
            defaultPath,
        ]);

        app.setAsDefaultProtocolClient("rawbeeteos", process.execPath, [
            defaultPath,
        ]);

        app.whenReady().then(() => {
            createWindow();
        });
    }
} else {
    app.setAsDefaultProtocolClient("beeteos");
    app.setAsDefaultProtocolClient("rawbeeteos");

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

        let deeplinkingUrl = urlString.replace(
            urlType === "deeplink" ? "beeteos://api/" : "rawbeeteos://api/",
            ""
        );

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
        if (process.platform !== "darwin") {
            app.quit();
        }
    });

    app.on("activate", () => {
        if (mainWindow === null) {
            createWindow();
        }
    });
}
