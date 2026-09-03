import { contextBridge } from 'electron';
import { safeSend, safeInvoke, safeOn, safeRemoveAllListeners } from './lib/ipcWrapper.js';

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
    createDoc: async (docData) => safeSend('createDoc', docData),
    sendError: async (errorData) => safeSend('sendError', errorData),
    // Handling injected calls (used by deeplink/QR/TOTP flows via inject.js)
    onInjectedCall: async (func) => {
        safeOn('injectedCall', func);
    },
    injectedCallResponse: async (args) => safeSend('injectedCallResponse', args),
    injectedCallError: async (args) => safeSend('injectedCallError', args),
    //
    onForceLogout: (func) => {
        safeOn('forceLogout', func);
    },
    //
    onGetSafeAccount: async (func) => {
        safeOn('getSafeAccount', func);
    },
    getSafeAccountResponse: async (args) => safeSend('getSafeAccountResponse', args),
    //
    removeAllListeners: async (msg) => safeRemoveAllListeners(msg),
    derivePubkeys: async (args) => safeInvoke('derivePubkeys', args),
});
