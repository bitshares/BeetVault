import { ipcRenderer, contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    // MISC
    openURL: async (target) => ipcRenderer.send('openURL', target),
    notify: async (msg) => ipcRenderer.send('notify', msg),
    timer: (func) => {
        ipcRenderer.on(`resetTimer`, (event, data) => {
            func(data);
        });
    },
    resetTimer: async () => await ipcRenderer.send('resetTimer'),
    blockchainRequest: async (args) => await ipcRenderer.invoke('blockchainRequest', args),
    setNode: (func) => {
        ipcRenderer.on('setNode', (event, args) => {
            func(args);
        });
    },
    memoFromBuffer: async (args) => await ipcRenderer.invoke('memoFromBuffer', args),
    // Stores
    seed: (args) => ipcRenderer.send('seed', args),
    decrypt: async (args) => await ipcRenderer.invoke('decrypt', args),
    id: async (args) => await ipcRenderer.invoke('id', args),
    aesEncrypt: async (args) => await ipcRenderer.invoke('aesEncrypt', args),
    aesDecrypt: async (args) => await ipcRenderer.invoke('aesDecrypt', args),
    sha512: async (args) => await ipcRenderer.invoke('sha512', args),
    getSignature: async (args) => await ipcRenderer.invoke('getSignature', args),
    verifyCrypto: async (args) => await ipcRenderer.invoke('verifyCrypto', args),
    // Backup and restore functionality
    downloadBackup: async (backupData) => ipcRenderer.send('downloadBackup', backupData),
    restore: async (args) => await ipcRenderer.invoke('restore', args),
    // Listening for raw/totp deeplink triggers
    onRawDeepLink: (func) => {
        ipcRenderer.on('rawdeeplink', (event, args) => {
            func(args);
        });
    },
    onDeepLink: (func) => {
        ipcRenderer.on('deeplink', (event, args) => {
            func(args);
        });
    },
    // Creating popups for prompts and receipts
    createPopup: async (popupData) => ipcRenderer.send('createPopup', popupData),
    popupApproved: (id, func) => {
        ipcRenderer.on(`popupApproved_${id}`, (event, data) => {
            func(data);
        });
    },
    popupRejected: (id, func) => {
        ipcRenderer.on(`popupRejected_${id}`, (event, data) => {
            func(data);
        });
    },
    createReceipt: async (receiptData) => await ipcRenderer.send('createReceipt', receiptData),
    createError: async (errorData) => ipcRenderer.send('createError', errorData),
    // Handling injected calls (used by deeplink/QR/TOTP flows via inject.js)
    onInjectedCall: async (func) => {
        ipcRenderer.on("injectedCall", (event, data) => {
            func(data);
        })
    },
    injectedCallResponse: async (args) => await ipcRenderer.send('injectedCallResponse', args),
    injectedCallError: async (args) => await ipcRenderer.send('injectedCallError', args),
    //
    onGetSafeAccount: async (func) => {
        ipcRenderer.on("getSafeAccount", (event, data) => {
            func(data);
        })
    },
    getSafeAccountResponse: async (args) => await ipcRenderer.send('getSafeAccountResponse', args),
    //
    removeAllListeners: async (msg) => await ipcRenderer.removeAllListeners(msg),
});
