import { contextBridge } from 'electron';
import { safeSend, safeInvoke } from './lib/ipcWrapper.js';

contextBridge.exposeInMainWorld('electron', {
    getLocationSearch: () => window.location.search,
    openURL: (target) => safeSend('openURL', target),
    createDoc: (arg) => safeSend('createDoc', arg),
    readDoc: (arg) => safeInvoke('readDoc', arg),
    readManifest: () => safeInvoke('readManifest'),
    sendError: (errorData) => safeSend('sendError', errorData),
});
