import { validateSender, validateMainSender } from '../lib/senderValidation.js';

export { validateSender, validateMainSender };

/**
 * Hardens a BrowserWindow against navigation and window-open attacks.
 *
 * All pages in this application are local (file:) and load fixed HTML.
 * There is no legitimate reason to navigate away or open new windows from
 * the renderer. Any such attempt is almost certainly an XSS vector, so
 * this function denies it defensively by:
 *   - Preventing `will-navigate` events
 *   - Denying all `window.open` requests
 *
 * @param {Electron.BrowserWindow} win - The BrowserWindow to harden.
 * @returns {void}
 */
export function applyWindowSecurityGuards(win) {
    win.webContents.on('will-navigate', (event, url) => {
        event.preventDefault();
        console.debug(`[SECURITY] Prevented navigation to: ${url}`);
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
        console.debug(`[SECURITY] Prevented window.open: ${url}`);
        return { action: 'deny' };
    });
}

/**
 * Validates that an IPC event originated from a known renderer frame.
 *
 * Throws immediately if the sender is not recognized, preventing
 * unauthorized code from invoking main-process IPC handlers.
 *
 * @param {Electron.IpcMainEvent} event - The IPC event to validate.
 * @returns {Electron.Frame} The validated sender frame.
 * @throws {Error} If the sender frame is missing or fails validation.
 */
export function requireValidSender(event) {
    const senderFrame = event.senderFrame;
    if (!senderFrame || !validateSender(senderFrame)) {
        throw new Error('Unauthorized sender');
    }
    return senderFrame;
}

/**
 * Validates that an IPC event originated from a known renderer frame,
 * using the stricter main-window sender validation.
 *
 * This should be used for handlers that require the sender to be
 * the main application window (e.g., seed operations, wallet decryption).
 *
 * @param {Electron.IpcMainEvent} event - The IPC event to validate.
 * @returns {Electron.Frame} The validated sender frame.
 * @throws {Error} If the sender frame is missing or fails validation.
 */
export function requireValidMainSender(event) {
    const senderFrame = event.senderFrame;
    if (!senderFrame || !validateMainSender(senderFrame)) {
        throw new Error('Unauthorized sender');
    }
    return senderFrame;
}
