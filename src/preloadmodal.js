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
