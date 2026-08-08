/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/lib/ipcChannels.js"
/*!********************************!*\
  !*** ./src/lib/ipcChannels.js ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DYNAMIC_LISTEN_PATTERNS: () => (/* binding */ DYNAMIC_LISTEN_PATTERNS),
/* harmony export */   DYNAMIC_SEND_PATTERNS: () => (/* binding */ DYNAMIC_SEND_PATTERNS),
/* harmony export */   INVOKE_CHANNELS: () => (/* binding */ INVOKE_CHANNELS),
/* harmony export */   LISTEN_CHANNELS: () => (/* binding */ LISTEN_CHANNELS),
/* harmony export */   SEND_CHANNELS: () => (/* binding */ SEND_CHANNELS)
/* harmony export */ });
/**
 * IPC Channel Allowlists
 * 
 * Static lists of valid channel names for each IPC direction.
 * Dynamic channels use regex patterns for ID-based channels.
 * 
 * IMPORTANT: These lists must be kept in sync with the preload scripts.
 * If a new IPC channel is added to preload.js or preloadmodal.js,
 * it must also be added here.
 */

// Channels that the renderer sends via ipcRenderer.send()
const SEND_CHANNELS = Object.freeze([
    'openURL',
    'notify',
    'resetTimer',
    'seed',
    'clearSeed',
    'createPopup',
    'createReceipt',
    'createError',
    'createDoc',
    'sendError',
    'injectedCallResponse',
    'injectedCallError',
    'getSafeAccountResponse',
    'downloadBackup',
    'clickedAllow',
    'clickedDeny',
]);

// Channels that the renderer calls via ipcRenderer.invoke()
const INVOKE_CHANNELS = Object.freeze([
    'blockchainRequest',
    'memoFromBuffer',
    'encryptPendingKeys',
    'decryptAndSign',
    'decryptAndCreateMemo',
    'decryptAndSignMessage',
    'unlockWallet',
    'encryptAndStore',
    'decryptWallet',
    'setSeedFromPassword',
    'getSafeStorageBackend',
    'id',
    'getSignature',
    'verifyCrypto',
    'readDoc',
    'readManifest',
    'restore',
]);

// Channels that the renderer listens to via ipcRenderer.on()
const LISTEN_CHANNELS = Object.freeze([
    'resetTimer',
    'setNode',
    'rawdeeplink',
    'deeplink',
    'injectedCall',
    'getSafeAccount',
    'forceLogout',
]);

// Dynamic channels (contain user-generated UUIDs)
// These are validated via regex patterns
const UUID_PATTERN = '[a-f0-9\\-]{36}';

const DYNAMIC_SEND_PATTERNS = Object.freeze([
    new RegExp(`^get:prompt:${UUID_PATTERN}$`),
    new RegExp(`^get:receipt:${UUID_PATTERN}$`),
    new RegExp(`^get:error:${UUID_PATTERN}$`),
]);

const DYNAMIC_LISTEN_PATTERNS = Object.freeze([
    new RegExp(`^popupApproved_${UUID_PATTERN}$`),
    new RegExp(`^popupRejected_${UUID_PATTERN}$`),
    new RegExp(`^respond:prompt:${UUID_PATTERN}$`),
    new RegExp(`^respond:receipt:${UUID_PATTERN}$`),
    new RegExp(`^respond:error:${UUID_PATTERN}$`),
]);


/***/ },

/***/ "./src/lib/ipcValidate.js"
/*!********************************!*\
  !*** ./src/lib/ipcValidate.js ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isValidInvokeChannel: () => (/* binding */ isValidInvokeChannel),
/* harmony export */   isValidListenChannel: () => (/* binding */ isValidListenChannel),
/* harmony export */   isValidSendChannel: () => (/* binding */ isValidSendChannel)
/* harmony export */ });
/* harmony import */ var _ipcChannels_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ipcChannels.js */ "./src/lib/ipcChannels.js");
/**
 * IPC Channel Validation
 * 
 * Validates channel names against allowlists to prevent
 * unauthorized IPC communication from compromised renderers.
 */



/**
 * Check if a channel is valid for ipcRenderer.send()
 */
function isValidSendChannel(channel) {
    if (typeof channel !== 'string') return false;
    return _ipcChannels_js__WEBPACK_IMPORTED_MODULE_0__.SEND_CHANNELS.includes(channel) ||
           _ipcChannels_js__WEBPACK_IMPORTED_MODULE_0__.DYNAMIC_SEND_PATTERNS.some(p => p.test(channel));
}

/**
 * Check if a channel is valid for ipcRenderer.invoke()
 */
function isValidInvokeChannel(channel) {
    if (typeof channel !== 'string') return false;
    return _ipcChannels_js__WEBPACK_IMPORTED_MODULE_0__.INVOKE_CHANNELS.includes(channel);
}

/**
 * Check if a channel is valid for ipcRenderer.on()
 */
function isValidListenChannel(channel) {
    if (typeof channel !== 'string') return false;
    return _ipcChannels_js__WEBPACK_IMPORTED_MODULE_0__.LISTEN_CHANNELS.includes(channel) ||
           _ipcChannels_js__WEBPACK_IMPORTED_MODULE_0__.DYNAMIC_LISTEN_PATTERNS.some(p => p.test(channel));
}


/***/ },

/***/ "./src/lib/ipcWrapper.js"
/*!*******************************!*\
  !*** ./src/lib/ipcWrapper.js ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   safeInvoke: () => (/* binding */ safeInvoke),
/* harmony export */   safeOn: () => (/* binding */ safeOn),
/* harmony export */   safeRemoveAllListeners: () => (/* binding */ safeRemoveAllListeners),
/* harmony export */   safeSend: () => (/* binding */ safeSend)
/* harmony export */ });
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! electron */ "electron");
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _ipcValidate_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ipcValidate.js */ "./src/lib/ipcValidate.js");
/**
 * IPC Wrapper Module
 *
 * Provides safe wrapper functions around ipcRenderer that validate
 * channel names against allowlists before forwarding calls.
 *
 * This module is shared by both preload scripts to avoid code duplication.
 */




/**
 * Send a message to the main process via a validated channel.
 *
 * @param {string} channel - The IPC channel name to send on.
 * @param {...*} args - Arguments to pass with the message.
 * @returns {boolean} True if the send was allowed and forwarded, false if blocked.
 */
function safeSend(channel, ...args) {
    if (!(0,_ipcValidate_js__WEBPACK_IMPORTED_MODULE_1__.isValidSendChannel)(channel)) {
        console.error(`[SECURITY] IPC send blocked: invalid channel "${channel}"`);
        return false;
    }
    return electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.send(channel, ...args);
}

/**
 * Invoke a handler in the main process via a validated channel.
 *
 * @param {string} channel - The IPC channel name to invoke.
 * @param {...*} args - Arguments to pass with the invocation.
 * @returns {Promise<*>} A promise that resolves with the handler's response,
 *   or rejects with an error if the channel is invalid.
 */
function safeInvoke(channel, ...args) {
    if (!(0,_ipcValidate_js__WEBPACK_IMPORTED_MODULE_1__.isValidInvokeChannel)(channel)) {
        console.error(`[SECURITY] IPC invoke blocked: invalid channel "${channel}"`);
        return Promise.reject(new Error(`Invalid IPC channel: ${channel}`));
    }
    return electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke(channel, ...args);
}

/**
 * Register a listener for messages from the main process on a validated channel.
 *
 * @param {string} channel - The IPC channel name to listen on.
 * @param {Function} callback - Function to call when a message is received.
 * @returns {boolean} True if the listener was registered, false if blocked.
 */
function safeOn(channel, callback) {
    if (!(0,_ipcValidate_js__WEBPACK_IMPORTED_MODULE_1__.isValidListenChannel)(channel)) {
        console.error(`[SECURITY] IPC on blocked: invalid channel "${channel}"`);
        return false;
    }
    return electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.on(channel, (event, ...args) => callback(...args));
}

/**
 * Remove all listeners for a validated channel.
 *
 * @param {string} channel - The IPC channel name to remove listeners from.
 * @returns {boolean} True if listeners were removed, false if blocked.
 */
function safeRemoveAllListeners(channel) {
    if (!(0,_ipcValidate_js__WEBPACK_IMPORTED_MODULE_1__.isValidListenChannel)(channel)) {
        console.error(`[SECURITY] removeAllListeners blocked: invalid channel "${channel}"`);
        return false;
    }
    return electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.removeAllListeners(channel);
}


/***/ },

/***/ "electron"
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
(module) {

module.exports = require("electron");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	const __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		const cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			const e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			const getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter/value functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			if(Array.isArray(definition)) {
/******/ 				var i = 0;
/******/ 				while(i < definition.length) {
/******/ 					var key = definition[i++];
/******/ 					var binding = definition[i++];
/******/ 					if(!__webpack_require__.o(exports, key)) {
/******/ 						if(binding === 0) {
/******/ 							Object.defineProperty(exports, key, { enumerable: true, value: definition[i++] });
/******/ 						} else {
/******/ 							Object.defineProperty(exports, key, { enumerable: true, get: binding });
/******/ 						}
/******/ 					} else if(binding === 0) { i++; }
/******/ 				}
/******/ 			} else {
/******/ 				for(var key in definition) {
/******/ 					if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 						Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
let __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*****************************!*\
  !*** ./src/preloadError.js ***!
  \*****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! electron */ "electron");
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _lib_ipcWrapper_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./lib/ipcWrapper.js */ "./src/lib/ipcWrapper.js");



electron__WEBPACK_IMPORTED_MODULE_0__.contextBridge.exposeInMainWorld('electron', {
    getLocationSearch: () => window.location.search,
    getError: (id) => {
        (0,_lib_ipcWrapper_js__WEBPACK_IMPORTED_MODULE_1__.safeSend)(`get:error:${id}`);
    },
    onError: (id, func) => {
        (0,_lib_ipcWrapper_js__WEBPACK_IMPORTED_MODULE_1__.safeOn)(`respond:error:${id}`, func);
    },
    sendError: async (errorData) => (0,_lib_ipcWrapper_js__WEBPACK_IMPORTED_MODULE_1__.safeSend)('sendError', errorData),
});

})();

/******/ })()
;
//# sourceMappingURL=preloadError.js.map