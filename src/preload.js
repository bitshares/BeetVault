import { ipcRenderer, contextBridge } from 'electron';
import { isValidSendChannel, isValidInvokeChannel, isValidListenChannel } from './lib/ipcValidate.js';

function safeSend(channel, ...args) {
    if (!isValidSendChannel(channel)) {
        console.error(`[SECURITY] IPC send blocked: invalid channel "${channel}"`);
        return;
    }
    return ipcRenderer.send(channel, ...args);
}

function safeInvoke(channel, ...args) {
    if (!isValidInvokeChannel(channel)) {
        console.error(`[SECURITY] IPC invoke blocked: invalid channel "${channel}"`);
        return Promise.reject(new Error(`Invalid IPC channel: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args);
}

function safeOn(channel, callback) {
    if (!isValidListenChannel(channel)) {
        console.error(`[SECURITY] IPC on blocked: invalid channel "${channel}"`);
        return;
    }
    return ipcRenderer.on(channel, (event, ...args) => callback(...args));
}

contextBridge.exposeInMainWorld('electron', {
    // MISC
    openURL: async (target) => safeSend('openURL', target),
    notify: async (msg) => safeSend('notify', msg),
    timer: (func) => {
        safeOn('resetTimer', func);
    },
    resetTimer: async () => safeSend('resetTimer'),
    blockchainRequest: async (args) => safeInvoke('blockchainRequest', args),
    setNode: (func) => {
        safeOn('setNode', func);
    },
    memoFromBuffer: async (args) => safeInvoke('memoFromBuffer', args),
    // Stores
    seed: (args) => safeSend('seed', args),
    clearSeed: async () => safeSend('clearSeed'),
    encryptPendingKeys: async (args) => safeInvoke('encryptPendingKeys', args),
    decryptAndSign: async (args) => safeInvoke('decryptAndSign', args),
    decryptAndCreateMemo: async (args) => safeInvoke('decryptAndCreateMemo', args),
    decryptAndSignMessage: async (args) => safeInvoke('decryptAndSignMessage', args),
    // Wallet operations (password pre-hashed by renderer)
    unlockWallet: async (args) => safeInvoke('unlockWallet', args),
    encryptAndStore: async (args) => safeInvoke('encryptAndStore', args),
    decryptWallet: async (args) => safeInvoke('decryptWallet', args),
    setSeedFromPassword: async (args) => safeInvoke('setSeedFromPassword', args),
    getSafeStorageBackend: async () => safeInvoke('getSafeStorageBackend'),
    id: async (args) => safeInvoke('id', args),
    getSignature: async (args) => safeInvoke('getSignature', args),
    verifyCrypto: async (args) => safeInvoke('verifyCrypto', args),
    // Backup and restore functionality
    downloadBackup: async (backupData) => safeSend('downloadBackup', backupData),
    restore: async (args) => safeInvoke('restore', args),
    // Listening for raw/totp deeplink triggers
    onRawDeepLink: (func) => {
        safeOn('rawdeeplink', func);
    },
    onDeepLink: (func) => {
        safeOn('deeplink', func);
    },
    // Creating popups for prompts and receipts
    createPopup: async (popupData) => safeSend('createPopup', popupData),
    popupApproved: (id, func) => {
        safeOn(`popupApproved_${id}`, func);
    },
    popupRejected: (id, func) => {
        safeOn(`popupRejected_${id}`, func);
    },
    createReceipt: async (receiptData) => safeSend('createReceipt', receiptData),
    createError: async (errorData) => safeSend('createError', errorData),
    // Handling injected calls (used by deeplink/QR/TOTP flows via inject.js)
    onInjectedCall: async (func) => {
        safeOn('injectedCall', func);
    },
    injectedCallResponse: async (args) => safeSend('injectedCallResponse', args),
    injectedCallError: async (args) => safeSend('injectedCallError', args),
    //
    onGetSafeAccount: async (func) => {
        safeOn('getSafeAccount', func);
    },
    getSafeAccountResponse: async (args) => safeSend('getSafeAccountResponse', args),
    //
    removeAllListeners: async (msg) => {
        if (isValidListenChannel(msg)) {
            return ipcRenderer.removeAllListeners(msg);
        }
    },
});
