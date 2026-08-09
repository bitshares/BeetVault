/**
 * Sender Validation Utilities
 *
 * Validates that IPC event senders originate from allowed pages.
 * Used by both background.js and inject.js to prevent unauthorized
 * IPC communication from compromised renderers or iframes.
 */

const VALID_SENDER_PAGES = ['index.html', 'modal.html', 'receipt.html', 'error.html', 'doc.html'];

/**
 * The directory containing the app's HTML pages.
 * Set once by background.js via setAppDir() after it determines __dirname,
 * which is the same directory as the HTML files in both dev and production.
 */
let _allowedDir = null;

/**
 * Registers the app's HTML directory for path validation.
 * Must be called once from background.js with its __dirname.
 *
 * @param {string} dir - The directory containing index.html, modal.html, etc.
 */
export function setAppDir(dir) {
    _allowedDir = dir;
}

/**
 * Checks that a file: URL points to a file within the allowed app directory.
 *
 * @param {string} pathname - The pathname from a file: URL.
 * @returns {boolean} True if the file is in the allowed directory.
 */
function isInAllowedDir(pathname) {
    if (!_allowedDir) return true; // fallback: skip path check if dir not set

    // Convert _allowedDir to URL pathname format for direct comparison.
    // On Windows: C:\Users\...\app -> /C:/Users/.../app
    // On Linux:   /mnt/c/.../app    -> /mnt/c/.../app (no change)
    const allowedUrlPath = _allowedDir.startsWith('/')
        ? _allowedDir
        : '/' + _allowedDir.replace(/\\/g, '/');

    // Decode the URL pathname and strip the filename to get the directory
    const decoded = decodeURIComponent(pathname);
    const senderDir = decoded.replace(/[/\\][^/\\]+$/, '');

    return senderDir === allowedUrlPath;
}

/**
 * Validates that an IPC sender is from an allowed HTML page.
 *
 * Checks that the sender's URL uses the file: protocol, the page filename
 * is in the list of allowed sender pages, and the file resides within the
 * app's registered directory.
 *
 * @param {Electron.WebFrame} senderFrame - The sender frame from the IPC event.
 * @returns {boolean} True if the sender is from an allowed page.
 */
export function validateSender(senderFrame) {
    try {
        const senderUrl = new URL(senderFrame.url);
        if (senderUrl.protocol !== 'file:') return false;

        const filename = senderUrl.pathname.split('/').pop();
        if (!VALID_SENDER_PAGES.includes(filename)) return false;

        return isInAllowedDir(senderUrl.pathname);
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
        if (filename !== 'index.html') return false;

        return isInAllowedDir(senderUrl.pathname);
    } catch {
        return false;
    }
}
