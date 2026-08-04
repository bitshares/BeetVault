import path from 'path';
import os from 'os';
import { BrowserWindow, Tray, Menu, Notification, ipcMain, app, dialog, shell, safeStorage } from 'electron';
import { pathToFileURL } from 'url';
import { applyWindowSecurityGuards, validateSender } from './securityGuards.js';
import { INJECTED_CALL } from '../lib/Actions.js';
import { SAFE_DOMAINS } from './constants.js';
import { initApplicationMenu } from '../lib/applicationMenu.js';

/**
 * The main application window. Null until {@link createMainWindow} is called.
 * @type {Electron.BrowserWindow|null}
 * @private
 */
let mainWindow = null;

/**
 * Map of modal (prompt/approve/deny) windows keyed by request ID.
 * @type {Object<string, Electron.BrowserWindow>}
 * @private
 */
let modalWindows = {};

/**
 * Map of pending modal request metadata keyed by request ID.
 * Stores the original IPC event so responses can be sent back.
 * @type {Object<string, {request: object, event: Electron.IpcMainEvent}>}
 * @private
 */
let modalRequests = {};

/**
 * Map of receipt windows keyed by request ID.
 * @type {Object<string, Electron.BrowserWindow>}
 * @private
 */
let receiptWindows = {};

/**
 * The error window singleton. Only one error window can be open at a time.
 * @type {Electron.BrowserWindow|null}
 * @private
 */
let errorWindow = null;

/**
 * System tray icon instance.
 * @type {Electron.Tray|null}
 * @private
 */
let tray = null;

/**
 * The application's HTML directory path, used to resolve file:// URLs
 * for preload scripts, icons, and HTML pages.
 * @type {string|null}
 * @private
 */
let _allowedDir = null;

/**
 * Sets the application directory path for window module resolution.
 *
 * @param {string} dir - Absolute path to the application's root directory.
 * @returns {void}
 */
export function setAppDirForWindows(dir) {
    _allowedDir = dir;
}

/**
 * Returns the main application window.
 *
 * @returns {Electron.BrowserWindow|null} The main window, or null if not
 *   yet created or has been destroyed.
 */
export function getMainWindow() {
    return mainWindow;
}

/**
 * Returns the map of currently open modal (prompt) windows.
 *
 * @returns {Object<string, Electron.BrowserWindow>} Modal windows keyed
 *   by request ID.
 */
export function getModalWindows() {
    return modalWindows;
}

/**
 * Returns the map of pending modal request metadata.
 *
 * @returns {Object<string, {request: object, event: Electron.IpcMainEvent}>}
 *   Pending requests keyed by request ID.
 */
export function getModalRequests() {
    return modalRequests;
}

/**
 * Returns the map of currently open receipt windows.
 *
 * @returns {Object<string, Electron.BrowserWindow>} Receipt windows
 *   keyed by request ID.
 */
export function getReceiptWindows() {
    return receiptWindows;
}

/**
 * Returns the current error window, if any.
 *
 * @returns {Electron.BrowserWindow|null} The error window, or null.
 */
export function getErrorWindow() {
    return errorWindow;
}

/**
 * Closes all open modal (prompt) windows and clears the tracking maps.
 *
 * This is called during logout to ensure no stale modal windows remain
 * open after the session is cleared. Only affects `modalWindows` —
 * receipt and error windows are not touched.
 *
 * @returns {void}
 */
export function closeAllModals() {
    Object.keys(modalWindows).forEach((id) => {
        if (modalWindows[id] && !modalWindows[id].isDestroyed()) {
            modalWindows[id].close();
        }
    });
    modalWindows = {};
}

/**
 * Closes the error window and clears the reference.
 *
 * @returns {void}
 */
export function destroyErrorWindow() {
    if (errorWindow && !errorWindow.isDestroyed()) {
        errorWindow.close();
    }
    errorWindow = null;
}

/**
 * Checks whether an error window is currently open.
 *
 * @returns {boolean} True if an error window exists and is not destroyed.
 */
export function isErrorWindowOpen() {
    return !!errorWindow;
}

/**
 * Creates the main application window, system tray, and loads the
 * primary HTML page.
 *
 * This function:
 *   1. Creates a BrowserWindow with the configured dimensions and security settings
 *   2. Applies navigation/window-open security guards
 *   3. Initializes the application menu
 *   4. Sets up the system tray icon with context menu
 *   5. Loads `index.html` via a file:// URL
 *   6. Shows a notification if OS-level keyring is unavailable
 *
 * @param {object} options - Window configuration options.
 * @param {boolean} options.ENCRYPTION_AVAILABLE - Whether safeStorage
 *   encryption is available on this system.
 * @param {boolean} options.FALLBACK_WARNED - Whether the fallback
 *   encryption warning has already been shown.
 * @param {string} options.appDir - Absolute path to the application's
 *   root directory (typically `__dirname`).
 * @returns {Electron.BrowserWindow} The created main window.
 */
export function createMainWindow(options) {
    const { ENCRYPTION_AVAILABLE, FALLBACK_WARNED, appDir } = options;
    _allowedDir = appDir;

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
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(_allowedDir, 'preload.js'),
        },
        icon: _allowedDir + '/img/beet-taskbar.png',
    });

    applyWindowSecurityGuards(mainWindow);

    let trayIcon = _allowedDir + '/img/beet-tray.png';
    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: function () {
                mainWindow.show();
            },
        },
        {
            label: 'Quit',
            click: function () {
                app.isQuiting = true;
                tray = null;
                app.quit();
            },
        },
    ]);

    tray.setToolTip('BeetVault');

    tray.on('right-click', (event, bounds) => {
        tray.popUpContextMenu(contextMenu);
    });

    tray.on('click', () => {
        mainWindow.setAlwaysOnTop(true);
        mainWindow.show();
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(false);
    });

    tray.on('balloon-click', () => {
        mainWindow.setAlwaysOnTop(true);
        mainWindow.show();
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(false);
    });

    initApplicationMenu(mainWindow);

    mainWindow.loadURL(
        `${pathToFileURL(path.join(_allowedDir, 'index.html')).href}`
    );

    if (!ENCRYPTION_AVAILABLE && !FALLBACK_WARNED) {
        let reason = process.platform;
        if (process.platform === 'linux') {
            try {
                reason = safeStorage.getSelectedStorageBackend();
            } catch (error) {
                reason = 'secret store unavailable';
            }
        }
        new Notification({
            title: 'BeetVault — No OS Keyring',
            body: 'Your system has no OS-level keychain (' + reason +
                  '). Your wallet is still encrypted with your password, but the unlock material is held in app memory only. Lock the wallet when you step away.',
            icon: _allowedDir + '/img/beet-tray.png',
        }).show();
    }

    return mainWindow;
}

/**
 * Creates a modal BrowserWindow for user approval/denial prompts.
 *
 * Modal windows are child windows of the main window that present
 * blockchain operation details and ask the user to approve or deny.
 *
 * The function:
 *   1. Validates the request and prevents duplicate modals
 *   2. Stores the request metadata for later response delivery
 *   3. Registers an IPC one-time listener for the renderer to fetch data
 *   4. Creates a BrowserWindow and loads `modal.html`
 *   5. On close, sends a rejection response if the user didn't answer
 *
 * @param {object} arg - The modal creation arguments.
 * @param {object} arg.request - The blockchain request object.
 * @param {string} arg.request.id - Unique request identifier.
 * @param {string} arg.request.type - Request type (e.g., INJECTED_CALL).
 * @param {object} [arg.visualizedAccount] - Visualized account data for display.
 * @param {object} [arg.visualizedParams] - Visualized parameters for display.
 * @param {boolean} [arg.isBlockedAccount] - Whether the account is blocked.
 * @param {boolean} [arg.serverError] - Whether a server error occurred.
 * @param {Electron.IpcMainEvent} modalEvent - The IPC event from the
 *   renderer that triggered the modal.
 * @returns {Promise<void>}
 * @throws {string} If the main window is missing, request is invalid,
 *   or a modal for this ID already exists.
 */
export function createModal(arg, modalEvent) {
    let modalHeight = 600;
    let modalWidth = 800;
    if (!mainWindow) {
        throw 'No main window';
    }

    let request = arg.request;
    let id = request.id;
    if (!request || !request.id) {
        throw 'No request';
    }

    if (modalWindows[id] || modalRequests[id]) {
        throw 'Modal exists already!';
    }

    let type = request.type;
    if (!type) {
        throw 'No modal type';
    }

    modalRequests[id] = { request: request, event: modalEvent };
    let targetURL = `file://${_allowedDir}/modal.html?id=${encodeURIComponent(id)}`;
    let modalData = { id, type, request };

    if ([INJECTED_CALL].includes(type)) {
        let visualizedAccount = arg.visualizedAccount;
        let visualizedParams = arg.visualizedParams;
        if (!visualizedAccount || !visualizedParams) {
            throw 'Missing required visualized fields';
        }
        modalRequests[id]['visualizedAccount'] = visualizedAccount;
        modalRequests[id]['visualizedParams'] = visualizedParams;
        modalData['visualizedAccount'] = visualizedAccount;
        modalData['visualizedParams'] = visualizedParams;
    }

    if ([INJECTED_CALL].includes(type)) {
        if (arg.isBlockedAccount) {
            modalRequests[id]['warning'] = true;
            modalData['warning'] = 'blockedAccount';
        } else if (arg.serverError) {
            modalRequests[id]['warning'] = true;
            modalData['warning'] = 'serverError';
        }
    }

    ipcMain.once(`get:prompt:${id}`, (event) => {
        if (!validateSender(event.senderFrame)) return;
        event.reply(`respond:prompt:${id}`, modalData);
    });

    modalWindows[id] = new BrowserWindow({
        parent: mainWindow,
        title: 'BeetVault prompt',
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
            preload: path.join(_allowedDir, 'preloadModal.js'),
        },
        icon: _allowedDir + '/img/beet-taskbar.png',
    });

    applyWindowSecurityGuards(modalWindows[id]);
    modalWindows[id].loadURL(targetURL);

    modalWindows[id].once('ready-to-show', () => {
        console.log('ready to show modal');
        modalWindows[id].show();
    });

    modalWindows[id].on('closed', () => {
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
                    error: 'User closed modal without answering prompt.',
                },
            });
            delete modalRequests[id];
            modalData = {};
        }
    });
}

/**
 * Creates a receipt BrowserWindow to display transaction results.
 *
 * Receipt windows show the user the outcome of a blockchain operation
 * (e.g., a successful transfer). They are read-only and do not require
 * user interaction.
 *
 * @param {object} arg - The receipt creation arguments.
 * @param {object} arg.request - The original blockchain request.
 * @param {string} arg.request.id - Unique request identifier.
 * @param {object} arg.result - The transaction result from the blockchain.
 * @param {object} arg.receipt - The formatted receipt data for display.
 * @param {string} arg.notifyTXT - The notification text to display.
 * @param {Electron.IpcMainEvent} modalEvent - The IPC event from the
 *   renderer that triggered the receipt.
 * @returns {Promise<void>}
 * @throws {string} If the main window is missing, required fields are
 *   absent, or a receipt for this ID already exists.
 */
export function createReceipt(arg, modalEvent) {
    let modalHeight = 600;
    let modalWidth = 800;
    if (!mainWindow) {
        throw 'No main window';
    }

    let request = arg.request;
    let id = request.id;
    let result = arg.result;
    let receipt = arg.receipt;
    let notifyTXT = arg.notifyTXT;
    if (!request || !request.id || !result || !notifyTXT || !receipt) {
        throw 'No request';
    }

    if (receiptWindows[id]) {
        throw 'Receipt window exists already!';
    }

    let targetURL = `file://${_allowedDir}/receipt.html?id=${encodeURIComponent(id)}`;

    ipcMain.once(`get:receipt:${id}`, (event) => {
        if (!validateSender(event.senderFrame)) return;
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
        title: 'BeetVault receipt',
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
            preload: path.join(_allowedDir, 'preloadModal.js'),
        },
        icon: _allowedDir + '/img/beet-taskbar.png',
    });

    applyWindowSecurityGuards(receiptWindows[id]);
    receiptWindows[id].loadURL(targetURL);

    receiptWindows[id].once('ready-to-show', () => {
        receiptWindows[id].show();
    });

    receiptWindows[id].on('closed', () => {
        ipcMain.removeAllListeners(`get:receipt:${id}`);

        if (receiptWindows[id]) {
            delete receiptWindows[id];
        }
    });
}

/**
 * Creates an error BrowserWindow to display operation failures.
 *
 * Error windows show detailed error information including the error
 * message, terminal output, and context. Only one error window can
 * be open at a time.
 *
 * @param {object} arg - The error display arguments.
 * @param {string} arg.id - Unique error identifier.
 * @param {string} [arg.title] - Error title (defaults to 'Unknown error').
 * @param {string} [arg.titleKey] - i18n key for the title.
 * @param {object} [arg.titleParams] - i18n parameters for the title.
 * @param {string} [arg.errorMessage] - User-facing error message.
 * @param {string} [arg.errorMessageKey] - i18n key for the message.
 * @param {object} [arg.errorMessageParams] - i18n parameters for the message.
 * @param {string} [arg.terminalError] - Raw terminal/stack trace output.
 * @param {string} [arg.terminalErrorKey] - i18n key for terminal error.
 * @param {Array<{msg: string, timestamp: string}>} [arg.consoleLogs] -
 *   Console log entries captured before the error.
 * @param {string} [arg.timestamp] - ISO timestamp of the error.
 * @param {string} [arg.context] - Context describing where the error occurred.
 * @param {string} [arg.contextKey] - i18n key for the context.
 * @param {object} [arg.contextParams] - i18n parameters for the context.
 * @param {Electron.IpcMainEvent} errorEvent - The IPC event from the
 *   renderer that triggered the error window.
 * @returns {Promise<void>}
 * @throws {string} If the main window is missing, no error ID is provided,
 *   or an error window is already open.
 */
export function createError(arg, errorEvent) {
    let modalHeight = 600;
    let modalWidth = 800;
    if (!mainWindow) {
        throw 'No main window';
    }

    if (errorWindow) {
        throw 'Error window already open';
    }

    let id = arg.id;
    if (!id) {
        throw 'No error id';
    }

    let title = arg.title || 'Unknown error';
    let titleKey = arg.titleKey || '';
    let titleParams = arg.titleParams || {};
    let errorMessage = arg.errorMessage || 'An unexpected error occurred.';
    let errorMessageKey = arg.errorMessageKey || '';
    let errorMessageParams = arg.errorMessageParams || {};
    let terminalError = arg.terminalError || '';
    let terminalErrorKey = arg.terminalErrorKey || '';
    let consoleLogs = arg.consoleLogs || [];
    let timestamp = arg.timestamp || new Date().toISOString();
    let context = arg.context || '';
    let contextKey = arg.contextKey || '';
    let contextParams = arg.contextParams || {};

    let targetURL = `file://${_allowedDir}/error.html?id=${encodeURIComponent(id)}`;

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
        title: 'BeetVault error',
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
            preload: path.join(_allowedDir, 'preloadModal.js'),
        },
        icon: _allowedDir + '/img/beet-taskbar.png',
    });

    applyWindowSecurityGuards(errorWindow);
    errorWindow.loadURL(targetURL);

    errorWindow.once('ready-to-show', () => {
        console.log('ready to show error window');
        errorWindow.show();
    });

    errorWindow.on('closed', () => {
        ipcMain.removeAllListeners(`get:error:${id}`);
        errorWindow = null;
    });
}

/**
 * Displays a native OS notification from the main process.
 *
 * Used by the renderer to trigger desktop notifications for incoming
 * blockchain requests or other events.
 *
 * @param {Electron.IpcMainEvent} event - The IPC event from the renderer.
 * @param {string} arg - The notification body text. If the string is
 *   literally `'request'`, a generic "new request" message is shown instead.
 * @returns {void}
 */
export function onNotify(event, arg) {
    if (!validateSender(event.senderFrame)) return;
    const NOTIFICATION_TITLE = 'BeetVault wallet notification';
    const NOTIFICATION_BODY =
        arg == 'request' ? 'BeetVault has received a new request.' : arg;

    if (os.platform() === 'win32') {
        app.setAppUserModelId(app.name);
    }

    function showNotification() {
        new Notification({
            title: NOTIFICATION_TITLE,
            subtitle: 'subtitle',
            body: NOTIFICATION_BODY,
            icon: _allowedDir + '/img/beet-tray.png',
        }).show();
    }

    showNotification();
}

/**
 * Opens an external URL in the user's default browser, but only if
 * the URL's hostname is in the {@link SAFE_DOMAINS} allowlist.
 *
 * This prevents the renderer from opening arbitrary external URLs
 * which could be a phishing or malware vector.
 *
 * @param {Electron.IpcMainEvent} event - The IPC event from the renderer.
 * @param {string} arg - The URL to open.
 * @returns {void}
 */
export function handleOpenURL(event, arg) {
    if (!validateSender(event.senderFrame)) return;
    try {
        const parsedUrl = new URL(arg);
        const domain = parsedUrl.hostname;
        if (SAFE_DOMAINS.includes(domain)) {
            shell.openExternal(arg);
        } else {
            console.error(`Rejected opening URL with unsafe domain: ${domain}`);
        }
    } catch (err) {
        console.error(`Failed to open URL: ${err.message}`);
    }
}

/**
 * Handles the user clicking "Allow" on a modal prompt.
 *
 * Closes the modal window and sends an approval response back to the
 * renderer that initiated the blockchain request.
 *
 * @param {Electron.IpcMainEvent} event - The IPC event from the renderer.
 * @param {object} arg - The approval arguments.
 * @param {object} arg.request - The original request object.
 * @param {string} arg.request.id - The request ID to approve.
 * @returns {void}
 */
export function handleClickAllow(event, arg) {
    if (!validateSender(event.senderFrame)) return;
    console.log('ipcmain clickedAllow');
    let id = arg.request.id;

    const windows = getModalWindows();
    const requests = getModalRequests();

    if (windows[id]) {
        windows[id].close();
        delete windows[id];
    }

    if (requests[id]) {
        requests[id].event.sender.send(`popupApproved_${id}`, arg);
        delete requests[id];
    }
}

/**
 * Handles the user clicking "Deny" on a modal prompt.
 *
 * Closes the modal window and sends a rejection response back to the
 * renderer that initiated the blockchain request.
 *
 * @param {Electron.IpcMainEvent} event - The IPC event from the renderer.
 * @param {object} arg - The rejection arguments.
 * @param {object} arg.request - The original request object.
 * @param {string} arg.request.id - The request ID to deny.
 * @returns {void}
 */
export function handleClickDeny(event, arg) {
    if (!validateSender(event.senderFrame)) return;
    console.log('ipcmain clickedDeny');
    let id = arg.request.id;

    const windows = getModalWindows();
    const requests = getModalRequests();

    if (windows[id]) {
        windows[id].close();
        delete windows[id];
    }

    if (requests[id]) {
        requests[id].event.sender.send(`popupRejected_${id}`, arg);
        delete requests[id];
    }
}

/**
 * Nullifies the tray reference during application shutdown.
 *
 * Prevents stale tray operations after the app begins quitting.
 *
 * @returns {void}
 */
export function setTrayForShutdown() {
    tray = null;
}
