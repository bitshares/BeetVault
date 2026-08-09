/**
 * IPC Wrapper Module
 *
 * Provides safe wrapper functions around ipcRenderer that validate
 * channel names against allowlists before forwarding calls.
 *
 * This module is shared by both preload scripts to avoid code duplication.
 */

import { ipcRenderer } from 'electron';
import {
    isValidSendChannel,
    isValidInvokeChannel,
    isValidListenChannel,
} from './ipcValidate.js';

/**
 * Send a message to the main process via a validated channel.
 *
 * @param {string} channel - The IPC channel name to send on.
 * @param {...*} args - Arguments to pass with the message.
 * @returns {boolean} True if the send was allowed and forwarded, false if blocked.
 */
export function safeSend(channel, ...args) {
    if (!isValidSendChannel(channel)) {
        console.error(`[SECURITY] IPC send blocked: invalid channel "${channel}"`);
        return false;
    }
    return ipcRenderer.send(channel, ...args);
}

/**
 * Invoke a handler in the main process via a validated channel.
 *
 * @param {string} channel - The IPC channel name to invoke.
 * @param {...*} args - Arguments to pass with the invocation.
 * @returns {Promise<*>} A promise that resolves with the handler's response,
 *   or rejects with an error if the channel is invalid.
 */
export function safeInvoke(channel, ...args) {
    if (!isValidInvokeChannel(channel)) {
        console.error(`[SECURITY] IPC invoke blocked: invalid channel "${channel}"`);
        return Promise.reject(new Error(`Invalid IPC channel: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args);
}

/**
 * Register a listener for messages from the main process on a validated channel.
 *
 * @param {string} channel - The IPC channel name to listen on.
 * @param {Function} callback - Function to call when a message is received.
 * @returns {boolean} True if the listener was registered, false if blocked.
 */
export function safeOn(channel, callback) {
    if (!isValidListenChannel(channel)) {
        console.error(`[SECURITY] IPC on blocked: invalid channel "${channel}"`);
        return false;
    }
    return ipcRenderer.on(channel, (event, ...args) => callback(...args));
}

/**
 * Remove all listeners for a validated channel.
 *
 * @param {string} channel - The IPC channel name to remove listeners from.
 * @returns {boolean} True if listeners were removed, false if blocked.
 */
export function safeRemoveAllListeners(channel) {
    if (!isValidListenChannel(channel)) {
        console.error(`[SECURITY] removeAllListeners blocked: invalid channel "${channel}"`);
        return false;
    }
    return ipcRenderer.removeAllListeners(channel);
}
