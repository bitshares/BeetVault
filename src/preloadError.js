import { contextBridge } from 'electron';
import { safeSend, safeOn } from './lib/ipcWrapper.js';

contextBridge.exposeInMainWorld('electron', {
    getLocationSearch: () => window.location.search,
    getError: (id) => {
        safeSend(`get:error:${id}`);
    },
    onError: (id, func) => {
        safeOn(`respond:error:${id}`, func);
    },
    sendError: async (errorData) => safeSend('sendError', errorData),
});
