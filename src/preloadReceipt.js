import { contextBridge } from 'electron';
import { safeSend, safeOn } from './lib/ipcWrapper.js';

contextBridge.exposeInMainWorld('electron', {
    getLocationSearch: () => window.location.search,
    getReceipt: (id) => {
        safeSend(`get:receipt:${id}`);
    },
    onReceipt: (id, func) => {
        safeOn(`respond:receipt:${id}`, func);
    },
});
