/**
 * IPC Channel Validation
 * 
 * Validates channel names against allowlists to prevent
 * unauthorized IPC communication from compromised renderers.
 */

import {
    SEND_CHANNELS,
    INVOKE_CHANNELS,
    LISTEN_CHANNELS,
    DYNAMIC_SEND_PATTERNS,
    DYNAMIC_LISTEN_PATTERNS,
} from './ipcChannels.js';

/**
 * Check if a channel is valid for ipcRenderer.send()
 */
export function isValidSendChannel(channel) {
    if (typeof channel !== 'string') return false;
    return SEND_CHANNELS.includes(channel) ||
           DYNAMIC_SEND_PATTERNS.some(p => p.test(channel));
}

/**
 * Check if a channel is valid for ipcRenderer.invoke()
 */
export function isValidInvokeChannel(channel) {
    if (typeof channel !== 'string') return false;
    return INVOKE_CHANNELS.includes(channel);
}

/**
 * Check if a channel is valid for ipcRenderer.on()
 */
export function isValidListenChannel(channel) {
    if (typeof channel !== 'string') return false;
    return LISTEN_CHANNELS.includes(channel) ||
           DYNAMIC_LISTEN_PATTERNS.some(p => p.test(channel));
}
