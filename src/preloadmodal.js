import { contextBridge } from 'electron';
import { safeSend, safeInvoke, safeOn } from './lib/ipcWrapper.js';

contextBridge.exposeInMainWorld('electron', {
    blockchainRequest: async (args) => safeInvoke('blockchainRequest', args),
    clickedAllow: async (allowData) => safeSend('clickedAllow', allowData),
    clickedDeny: async (denyData) => safeSend('clickedDeny', denyData),
    resetTimer: async () => safeSend('resetTimer'),
    getLocationSearch: () => window.location.search,
    getPrompt: (id) => {
        safeSend(`get:prompt:${id}`);
    },
    onPrompt: (id, func) => {
        safeOn(`respond:prompt:${id}`, func);
    },
    getReceipt: (id) => {
        safeSend(`get:receipt:${id}`);
    },
    onReceipt: (id, func) => {
        safeOn(`respond:receipt:${id}`, func);
    },
    getError: (id) => {
        safeSend(`get:error:${id}`);
    },
    onError: (id, func) => {
        safeOn(`respond:error:${id}`, func);
    },
});
