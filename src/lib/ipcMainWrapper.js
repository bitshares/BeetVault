import { ipcMain } from "electron";

/**
 * Register a single-use IPC listener that auto-removes after timeout
 * or when the optional AbortSignal is aborted.
 *
 * Prevents orphaned listeners when the renderer never responds (crash,
 * closed popup, navigation, etc.).
 *
 * @param {string} channel - IPC channel to listen on.
 * @param {number} timeoutMs - Max wait time in ms.
 * @param {AbortSignal} [abortSignal] - Optional signal for external cancellation.
 * @returns {Promise<{ event: any, args: any[] }> & { cancel: () => void }}
 */
export function ipcOnceWithTimeout(channel, timeoutMs, abortSignal) {
    let listener;
    let settled = false;
    let timeoutSignal;
    let reject;

    const onTimeout = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(`IPC timeout on "${channel}" after ${timeoutMs}ms`));
    };

    const onAbort = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(`Aborted: "${channel}"`));
    };

    function cleanup() {
        timeoutSignal.removeEventListener("timeout", onTimeout);
        if (abortSignal) {
            abortSignal.removeEventListener("abort", onAbort);
        }
        ipcMain.removeListener(channel, listener);
    }

    const promise = new Promise((res, rej) => {
        reject = rej;

        if (abortSignal?.aborted) {
            settled = true;
            reject(new Error(`Aborted: "${channel}"`));
            return;
        }

        listener = (event, ...args) => {
            if (settled) return;
            settled = true;
            cleanup();
            res({ event, args });
        };

        timeoutSignal = AbortSignal.timeout(timeoutMs);
        timeoutSignal.addEventListener("timeout", onTimeout, { once: true });

        if (abortSignal) {
            abortSignal.addEventListener("abort", onAbort, { once: true });
        }

        ipcMain.once(channel, listener);
    });

    return Object.assign(promise, {
        cancel() {
            if (settled) return;
            settled = true;
            cleanup();
        },
    });
}
