import { ipcMain } from "electron";

/**
 * Register a single-use IPC listener that auto-removes after timeout.
 *
 * Prevents orphaned listeners when the renderer never responds (crash,
 * closed popup, navigation, etc.). Returns a Promise tagged with a
 * `cancel()` method for use in races.
 *
 * @param {string} channel - IPC channel to listen on.
 * @param {number} timeoutMs - Max wait time in ms.
 * @returns {Promise<{ event: any, args: any[] }> & { cancel: () => void }}
 */
export function ipcOnceWithTimeout(channel, timeoutMs) {
    let timer;
    let listener;
    let settled = false;

    const promise = new Promise((resolve, reject) => {
        listener = (event, ...args) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve({ event, args });
        };

        ipcMain.once(channel, listener);

        timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            ipcMain.removeListener(channel, listener);
            reject(new Error(`IPC timeout on "${channel}" after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    return Object.assign(promise, {
        cancel() {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            ipcMain.removeListener(channel, listener);
        },
    });
}
