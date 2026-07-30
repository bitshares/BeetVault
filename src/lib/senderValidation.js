/**
 * Sender Validation Utilities
 *
 * Validates that IPC event senders originate from allowed pages.
 * Used by both background.js and inject.js to prevent unauthorized
 * IPC communication from compromised renderers or iframes.
 */

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
export function validateSender(senderFrame) {
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
export function validateMainSender(senderFrame) {
    try {
        const senderUrl = new URL(senderFrame.url);
        if (senderUrl.protocol !== 'file:') return false;
        const filename = senderUrl.pathname.split('/').pop();
        return filename === 'index.html';
    } catch {
        return false;
    }
}
