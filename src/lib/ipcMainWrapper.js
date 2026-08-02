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
    let listener;
    let settled = false;
    let timeoutSignal;

    const onTimeout = () => {
        if (settled) return;
        settled = true;
        ipcMain.removeListener(channel, listener);
        reject(new Error(`IPC timeout on "${channel}" after ${timeoutMs}ms`));
    };

    let reject;
    const promise = new Promise((res, rej) => {
        reject = rej;
        listener = (event, ...args) => {
            if (settled) return;
            settled = true;
            timeoutSignal.removeEventListener("timeout", onTimeout);
            res({ event, args });
        };

        timeoutSignal = AbortSignal.timeout(timeoutMs);
        timeoutSignal.addEventListener("timeout", onTimeout, { once: true });
        ipcMain.once(channel, listener);
    });

    return Object.assign(promise, {
        cancel() {
            if (settled) return;
            settled = true;
            timeoutSignal.removeEventListener("timeout", onTimeout);
            ipcMain.removeListener(channel, listener);
        },
    });
}
