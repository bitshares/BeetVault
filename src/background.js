/**
 * @module background
 *
 * BeetVault Electron main process entry point.
 *
 * This module is the thin orchestrator that wires together the
 * modularized main-process code:
 *
 *   - **sessionManager** — Seed storage, wallet decrypt/sign, logout
 *   - **windows** — Window lifecycle, tray, IPC dispatch
 *   - **ipcHandlers** — IPC handler registration
 *   - **appSetup** — Power monitor initialization
 *   - **deeplink** — Protocol link handling
 *   - **blockchainHandler** — Blockchain API dispatch
 *   - **securityGuards** — Sender validation, navigation guards
 *   - **constants** — Shared constants (safe domains)
 *
 * The file is kept minimal (160 lines) to serve only as the entry point.
 * All business logic lives in the modules above.
 */

import path from 'path';
import { app, ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';

import {
    initializeEncryption,
    registerAppDir,
    forceLogout,
    decryptSeed,
} from './main/sessionManager.js';
import {
    createMainWindow,
    getMainWindow,
    createError,
} from './main/windows.js';
import { registerIPCHandlers } from './main/ipcHandlers.js';
import { initPowerMonitor, cleanupPowerMonitor } from './main/appSetup.js';
import { handleSecondInstance, handleOpenUrl } from './main/deeplink.js';
import { getSignature } from './lib/SecureRemote.js';
import { Apis } from './lib/blockchains/bitshares/library/index.js';
import { disconnect } from './lib/blockchains/blockchainFactory.js';
import { getChainNodes as getBlockchainChainNodes } from './main/blockchainHandler.js';

/**
 * Whether safeStorage encryption is available on this system.
 * Cached at startup and passed to window creation.
 * @type {boolean}
 * @private
 */
let ENCRYPTION_AVAILABLE = false;

/**
 * Whether the fallback encryption warning has already been shown.
 * Reset on each createWindow call.
 * @type {boolean}
 * @private
 */
let FALLBACK_WARNED = false;

/**
 * Returns a reference to the shared chain nodes map.
 *
 * This function exists to break the circular dependency between
 * background.js and blockchainHandler.js. The chain nodes map is
 * defined in blockchainHandler.js but needs to be shared with the
 * session manager functions that sign transactions.
 *
 * @returns {Object<string, string>} Map of chain identifiers to RPC node URLs.
 * @private
 */
function getChainNodesState() {
    return getBlockchainChainNodes();
}

/**
 * Registers global process-level error handlers.
 *
 * - `unhandledRejection`: Logs the error and shows an error window
 *   to the user via `createError`.
 * - `uncaughtException`: Logs only — process state may be corrupted,
 *   so no UI operations are attempted.
 *
 * Registered at module scope so crashes are captured during startup
 * in every environment.
 *
 * @returns {void}
 * @private
 */
function setupProcessHandlers() {
    process.on('unhandledRejection', (error, handle) => {
        const msg = error?.stack || error?.message || String(error);
        console.error(`[Main] Unhandled rejection: ${msg}`);

        const win = getMainWindow();
        if (win && !win.isDestroyed()) {
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
    });
}

/**
 * Creates the main application window and initializes the session.
 *
 * This function:
 *   1. Initializes safeStorage encryption availability
 *   2. Creates the main BrowserWindow via windows.js
 *   3. Registers all IPC handlers via ipcHandlers.js
 *   4. Sets up power-monitor listeners for auto-logout
 *
 * Called once from `app.whenReady().then()`.
 *
 * @returns {void}
 * @private
 */
function createWindow() {
    ENCRYPTION_AVAILABLE = initializeEncryption();
    FALLBACK_WARNED = false;

    const winOptions = {
        ENCRYPTION_AVAILABLE,
        FALLBACK_WARNED,
        appDir: __dirname,
    };

    createMainWindow(winOptions);

    registerIPCHandlers({
        getMainWindow,
        getChainNodes: getChainNodesState,
        decryptSeed,
        getSignatureFn: getSignature,
    });

    initPowerMonitor(() => forceLogout(getMainWindow));
}

/**
 * Registers application lifecycle event handlers (macOS only).
 *
 * On macOS, these handlers are registered outside the single-instance
 * lock block because macOS doesn't use `requestSingleInstanceLock`.
 *
 * - `before-quit`: Closes blockchain connections and cleans up power listeners
 * - `window-all-closed`: Removes IPC listeners, quits on non-macOS
 * - `activate`: Re-creates the window when the dock icon is clicked
 *
 * @returns {void}
 * @private
 */
function setupShutdownHandlers() {
    app.on('before-quit', () => {
        console.log('[APP] before-quit: closing blockchain connections');
        cleanupPowerMonitor();
        try { disconnect(); } catch (e) {}
        try { Apis.close(); } catch (e) {}
    });

    app.on('window-all-closed', () => {
        ipcMain.removeAllListeners('getSafeAccountResponse');
        ipcMain.removeAllListeners('injectedCallResponse');
        ipcMain.removeAllListeners('injectedCallError');

        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (!getMainWindow()) {
            createWindow();
        }
    });
}

/**
 * Supported protocol scheme names for deep link handling.
 * @type {string[]}
 * @private
 */
const schemes = ['beeteos', 'rawbeeteos', 'beetvault', 'rawbeetvault'];

/**
 * Registers the application as the default protocol client for all
 * supported schemes (beeteos://, rawbeeteos://, beetvault://, rawbeetvault://).
 *
 * On Windows/Linux, the protocol is registered with the current
 * executable path and the default open path. On macOS, the protocol
 * is registered without arguments.
 *
 * @returns {void}
 * @private
 */
function registerProtocolClients() {
    if (process.platform === 'win32' || process.platform === 'linux') {
        let defaultPath;
        try {
            if (process.argv[1]) {
                defaultPath = path.resolve(process.argv[1]);
            }
        } catch (error) {
            console.log(error);
        }

        schemes.forEach((scheme) => {
            app.setAsDefaultProtocolClient(scheme, process.execPath, [defaultPath]);
        });
    } else {
        schemes.forEach((scheme) => {
            app.setAsDefaultProtocolClient(scheme);
        });
    }
}

// ============================================================================
// Application startup
// ============================================================================

/** Register the app directory for sender validation */
registerAppDir(__dirname);

/** Set up global error handlers */
setupProcessHandlers();

/** Disable hardware acceleration for compatibility */
app.disableHardwareAcceleration();

if (process.platform === 'win32' || process.platform === 'linux') {
    // Windows/Linux: use single instance lock to prevent multiple instances
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
        app.quit();
    } else {
        registerProtocolClients();

        app.on('second-instance', (event, argv) => {
            handleSecondInstance(getMainWindow(), argv);
        });

        app.whenReady().then(() => {
            createWindow();
        });
    }
} else {
    // macOS: no single instance lock needed (handled by OS)
    registerProtocolClients();

    app.on('open-url', (event, urlString) => {
        handleOpenUrl(getMainWindow(), urlString);
    });

    app.whenReady().then(() => {
        createWindow();
    });

    setupShutdownHandlers();
}
