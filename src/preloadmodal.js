import { contextBridge } from 'electron';
import { safeSend, safeOn } from './lib/ipcWrapper.js';

contextBridge.exposeInMainWorld('electron', {
    getLocationSearch: () => window.location.search,
    resetTimer: async () => safeSend('resetTimer'),
    getPrompt: (id) => {
        safeSend(`get:prompt:${id}`);
    },
    onPrompt: (id, func) => {
        safeOn(`respond:prompt:${id}`, func);
    },
    clickedAllow: async (allowData) => safeSend('clickedAllow', allowData),
    clickedDeny: async (denyData) => safeSend('clickedDeny', denyData),
});
