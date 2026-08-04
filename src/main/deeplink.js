import queryString from 'query-string';
import path from 'path';
import { app } from 'electron';

/**
 * Handles the `second-instance` event on Windows/Linux when a user
 * clicks a protocol link (e.g., `beeteos://...`) while the app is
 * already running.
 *
 * This function:
 *   1. Restores and focuses the main window
 *   2. Extracts the deep link URL from the argv array
 *   3. Validates the scheme prefix (beeteos://, rawbeeteos://, etc.)
 *   4. Parses the query string parameters
 *   5. Sends the parsed data to the renderer via IPC
 *
 * @param {Electron.BrowserWindow|null} mainWindow - The main application
 *   window. If null or destroyed, the function logs an error and returns.
 * @param {string[]} argv - Command-line arguments from the second instance.
 *   Typically contains the deep link URL as one of the arguments.
 * @returns {void}
 */
export function handleSecondInstance(mainWindow, argv) {
    if (!mainWindow) {
        console.error('Main window is not defined.');
        return;
    }

    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }

    mainWindow.focus();

    let deeplink;
    try {
        deeplink = argv.find(
            (arg) =>
                typeof arg === 'string' &&
                (arg.startsWith('beeteos://') ||
                    arg.startsWith('rawbeeteos://') ||
                    arg.startsWith('beetvault://') ||
                    arg.startsWith('rawbeetvault://'))
        );
    } catch (error) {
        console.log(error);
        return;
    }

    if (!deeplink) {
        console.log('No deep link found in argv');
        return;
    }

    const schemePrefix = deeplink.startsWith('rawbeeteos://')
        ? 'rawbeeteos://api/'
        : deeplink.startsWith('rawbeetvault://')
        ? 'rawbeetvault://api/'
        : deeplink.startsWith('beetvault://')
        ? 'beetvault://api/'
        : 'beeteos://api/';

    if (!deeplink.includes(schemePrefix)) {
        console.log('Invalid deep link format');
        return;
    }

    let deeplinkingUrl = deeplink.split(schemePrefix)[1];
    if (!deeplinkingUrl || deeplinkingUrl.length > 4096) {
        console.log('Deep link URL missing or too long');
        return;
    }

    let qs;
    try {
        qs = queryString.parse(deeplinkingUrl);
    } catch (error) {
        console.log(error);
        return;
    }

    if (qs && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
            deeplink.includes('raw') ? 'rawdeeplink' : 'deeplink',
            qs
        );
    }
}

/**
 * Handles the `open-url` event on macOS when a user clicks a protocol
 * link (e.g., `beeteos://...`) while the app is running or being launched.
 *
 * On macOS, Electron delivers deep links via the `open-url` event rather
 * than via `second-instance`. This function:
 *   1. Determines whether the link is a raw or standard deep link
 *   2. Strips the scheme prefix to extract the query string
 *   3. Parses the query string parameters
 *   4. Sends the parsed data to the renderer via IPC
 *
 * @param {Electron.BrowserWindow|null} mainWindow - The main application
 *   window. If null or destroyed, the function logs an error and returns.
 * @param {string} urlString - The full deep link URL string
 *   (e.g., `beeteos://api/?method=transfer&chain=bitshares`).
 * @returns {void}
 */
export function handleOpenUrl(mainWindow, urlString) {
    if (!mainWindow) {
        console.error('Main window is not defined.');
        return;
    }

    let urlType = urlString.includes('raw') ? 'rawdeeplink' : 'deeplink';

    let deeplinkingUrl = urlString
        .replace(/rawbeeteos:\/\/api\//, '')
        .replace(/rawbeetvault:\/\/api\//, '')
        .replace(/beetvault:\/\/api\//, '')
        .replace(/beeteos:\/\/api\//, '');

    let qs;
    try {
        qs = queryString.parse(deeplinkingUrl);
    } catch (error) {
        console.log(error);
        return;
    }

    if (qs && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(urlType, qs);
    }
}
