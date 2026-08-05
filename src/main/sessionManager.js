import { safeStorage, ipcMain } from 'electron';
import { encrypt, decrypt } from '../lib/crypto.js';
import { v4 as uuidv4 } from 'uuid';
import { validateMainSender, requireValidMainSender } from './securityGuards.js';
import { setAppDir } from '../lib/senderValidation.js';
import getBlockchainAPI, { disconnect } from '../lib/blockchains/blockchainFactory.js';
import { closeAllModals } from './windows.js';

/**
 * The application's HTML directory path, used for sender validation.
 * @type {string|null}
 * @private
 */
let _allowedDir = null;

/**
 * Returns the application directory path.
 *
 * @returns {string|null} The absolute path to the app directory.
 */
export function getAllowedDir() {
    return _allowedDir;
}

/**
 * Registers the application directory path for both this module and the
 * sender validation system.
 *
 * Must be called once during application startup before any IPC
 * handlers are registered.
 *
 * @param {string} dir - Absolute path to the application's root directory.
 * @returns {void}
 */
export function registerAppDir(dir) {
    _allowedDir = dir;
    setAppDir(dir);
}

/**
 * Whether safeStorage encryption is available on this system.
 * @type {boolean}
 * @private
 */
let ENCRYPTION_AVAILABLE = false;

/**
 * Whether the fallback encryption warning has already been shown.
 * @type {boolean}
 * @private
 */
let FALLBACK_WARNED = false;

/**
 * Checks safeStorage availability and logs a warning if unavailable.
 *
 * This function caches the result of `safeStorage.isEncryptionAvailable()`
 * and logs the reason for unavailability on Linux (e.g., no keyring backend).
 *
 * Must be called after `app.whenReady()` as safeStorage requires the
 * app to be initialized.
 *
 * @returns {boolean} True if safeStorage encryption is available.
 */
export function initializeEncryption() {
    ENCRYPTION_AVAILABLE = safeStorage.isEncryptionAvailable();
    if (!ENCRYPTION_AVAILABLE && !FALLBACK_WARNED) {
        FALLBACK_WARNED = true;
        let reason;
        if (process.platform === 'linux') {
            try {
                reason = safeStorage.getSelectedStorageBackend();
            } catch (error) {
                reason = `getSelectedStorageBackend failed: ${error.message}`;
            }
        } else {
            reason = process.platform;
        }
        console.warn(
            '[SECURITY] safeStorage unavailable. Reason: ' + reason +
            '. Seed will be held in memory without OS-level protection.'
        );
    }
    return ENCRYPTION_AVAILABLE;
}

/**
 * Returns whether safeStorage encryption is available.
 *
 * @returns {boolean} True if encryption is available.
 */
export function isEncryptionAvailable() {
    return ENCRYPTION_AVAILABLE;
}

/**
 * The encrypted seed (password) stored in memory. Null when the wallet
 * is locked or no seed has been set.
 *
 * Structure when encryption is available:
 *   `{ fallback: false, buffer: Buffer }`
 * Structure when falling back to plaintext:
 *   `{ fallback: true, seed: Buffer }`
 *
 * @type {{fallback: boolean, buffer?: Buffer, seed?: Buffer}|null}
 * @private
 */
let _encryptedSeed = null;

/**
 * Map of temporarily stored pending keys during import/creation flows.
 * Keys are stored in plaintext and encrypted before being persisted.
 *
 * @type {Map<string, {accountname: string, chain: string, keys: object, created: number}>}
 * @private
 */
const _pendingKeys = new Map();

/**
 * Time-to-live for pending keys before they are automatically cleaned up.
 * @type {number}
 * @private
 */
const PENDING_KEY_TTL_MS = 5 * 60 * 1000;

/**
 * Removes expired entries from the pending keys map.
 *
 * Entries older than {@link PENDING_KEY_TTL_MS} are deleted to prevent
 * stale keys from accumulating in memory.
 *
 * @returns {void}
 * @private
 */
function cleanupPendingKeys() {
    const now = Date.now();
    for (const [token, entry] of _pendingKeys) {
        if (now - entry.created > PENDING_KEY_TTL_MS) {
            _pendingKeys.delete(token);
        }
    }
}

/**
 * Stores a set of plaintext keys temporarily during wallet import/creation.
 *
 * The keys are stored in memory with a UUID token for later retrieval.
 * They are encrypted via {@link encryptPendingKeys} before being persisted.
 *
 * @param {string} accountname - The account name associated with the keys.
 * @param {string} chain - The blockchain identifier (e.g., 'bitshares').
 * @param {object} keys - Map of key types to plaintext key values
 *   (e.g., `{ active: '5K...', owner: '5K...', memo: '5K...' }`).
 * @returns {string} A UUID token that can be used to retrieve or encrypt
 *   the pending keys.
 */
export function storePendingKey(accountname, chain, keys) {
    cleanupPendingKeys();
    const token = uuidv4();
    _pendingKeys.set(token, {
        accountname,
        chain,
        keys,
        created: Date.now()
    });
    return token;
}

/**
 * Retrieves and deletes a pending key entry by token.
 *
 * @param {string} token - The UUID token returned by {@link storePendingKey}.
 * @returns {{accountname: string, chain: string, keys: object, created: number}}
 *   The pending key entry.
 * @throws {Error} If the token is invalid or has expired.
 */
export function retrievePendingKey(token) {
    const pending = _pendingKeys.get(token);
    if (!pending) {
        throw new Error('Invalid or expired token');
    }
    _pendingKeys.delete(token);
    return pending;
}

/**
 * Stores the password/seed in memory using safeStorage or a plaintext
 * fallback.
 *
 * If safeStorage is available, the password is encrypted via
 * `safeStorage.encryptString()`. If encryption fails or is unavailable,
 * the password is stored as a raw Buffer with a `fallback: true` flag.
 *
 * @param {string} password - The pre-hashed password (SHA-512 hex) to store.
 * @returns {void}
 * @private
 */
function _storeSeed(password) {
    if (!ENCRYPTION_AVAILABLE) {
        _encryptedSeed = { fallback: true, seed: Buffer.from(password, 'utf8') };
    } else {
        try {
            const buffer = safeStorage.encryptString(password);
            _encryptedSeed = { fallback: false, buffer: buffer };
        } catch (error) {
            console.warn('[SECURITY] safeStorage.encryptString failed, falling back:', error.message);
            ENCRYPTION_AVAILABLE = false;
            _encryptedSeed = { fallback: true, seed: Buffer.from(password, 'utf8') };
        }
    }
}

/**
 * Stores the seed password in memory.
 *
 * This is called by the `seed` IPC handler when the renderer sends
 * the user's password directly.
 *
 * @param {string} password - The pre-hashed password (SHA-512 hex) to store.
 * @returns {void}
 */
export function storeSeed(password) {
    _storeSeed(password);
}

/**
 * Stores a pre-hashed password as the in-memory encryption seed.
 *
 * Used during wallet restore to set the seed without going through the
 * unlock flow. Identical behavior to {@link storeSeed}.
 *
 * @param {string} password - The pre-hashed password (SHA-512 hex) to store.
 * @returns {void}
 */
export function setSeedFromPassword(password) {
    _storeSeed(password);
}

/**
 * Decrypts and returns the stored seed (password).
 *
 * If the seed was stored with safeStorage encryption, it is decrypted
 * via `safeStorage.decryptString()`. If stored as a fallback plaintext
 * Buffer, it is converted to a UTF-8 string.
 *
 * @returns {string|null} The decrypted seed, or null if no seed is stored
 *   or decryption fails.
 */
export function decryptSeed() {
    if (!_encryptedSeed) {
        return null;
    }
    if (_encryptedSeed.fallback) {
        return _encryptedSeed.seed.toString('utf8');
    }
    try {
        return safeStorage.decryptString(_encryptedSeed.buffer);
    } catch (error) {
        console.warn('[SECURITY] safeStorage.decryptString failed:', error.message);
        ENCRYPTION_AVAILABLE = false;
        return null;
    }
}

/**
 * Checks whether a seed is currently stored in memory.
 *
 * @returns {boolean} True if a seed is stored (wallet is unlocked).
 */
export function hasSeed() {
    return !!_encryptedSeed;
}

/**
 * Clears the stored seed and performs a full session logout.
 *
 * This is the `clearSeed` IPC handler entry point. It:
 *   1. Zero-fills the seed buffer (if using fallback)
 *   2. Nullifies the encrypted seed
 *   3. Clears all pending keys
 *   4. Disconnects from all blockchain APIs
 *   5. Removes orphaned IPC listeners
 *   6. Closes all open modal windows
 *
 * @returns {void}
 */
export function clearSeed() {
    console.log('SEED CLEARED');
    _logout();
}

/**
 * Performs a full session logout by clearing all sensitive state.
 *
 * This is the internal logout implementation shared by {@link clearSeed}
 * and {@link forceLogout}. It:
 *   1. Zero-fills the seed buffer to prevent memory recovery
 *   2. Nullifies the encrypted seed reference
 *   3. Clears all pending keys
 *   4. Disconnects from all blockchain APIs
 *   5. Removes orphaned IPC listeners (getSafeAccountResponse, etc.)
 *   6. Closes all open modal (prompt) windows
 *
 * @returns {void}
 * @private
 */
function _logout() {
    console.log('[SECURITY] logout: clearing session');
    if (!_encryptedSeed) {
        return;
    }
    console.log('[SECURITY] forceLogout: clearing session');

    if (_encryptedSeed && _encryptedSeed.seed) {
        _encryptedSeed.seed.fill(0);
    }

    _encryptedSeed = null;
    _pendingKeys.clear();

    disconnect();

    ipcMain.removeAllListeners('getSafeAccountResponse');
    ipcMain.removeAllListeners('injectedCallResponse');
    ipcMain.removeAllListeners('injectedCallError');

    closeAllModals();
}

/**
 * Performs a full session logout and notifies the renderer.
 *
 * Used by power-monitor events (suspend, shutdown, lock-screen) and
 * the `before-quit` handler. In addition to clearing all session state
 * via {@link _logout}, it sends a `forceLogout` message to the renderer
 * so it can reset its in-memory state.
 *
 * @param {function} getMainWindow - Function that returns the main
 *   BrowserWindow instance. Passed as a getter to avoid circular
 *   dependency with windows.js.
 * @returns {void}
 */
export function forceLogout(getMainWindow) {
    if (!_encryptedSeed) {
        return;
    }
    _logout();

    if (getMainWindow && getMainWindow()) {
        const mainWindow = getMainWindow();
        if (!mainWindow.isDestroyed()) {
            mainWindow.webContents.send('forceLogout');
        }
    }
}

/**
 * Encrypts pending vault-stored keys and returns the encrypted map.
 *
 * During wallet creation, private keys are temporarily stored in the
 * `_pendingKeys` Map keyed by a UUID token. This handler encrypts each
 * key with Argon2id + AES-256-GCM, deletes the pending entry, and
 * returns the encrypted map.
 *
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {{ token: string, password: string, tier?: string }} arg
 *   - `token` — UUID identifying the pending keys entry.
 *   - `password` — Pre-hashed password (SHA-512 hex) for encryption.
 *   - `tier` — Optional security tier ("low", "medium", "high"). Defaults to "medium".
 * @returns {Promise<Object<string, string>>} Map of key types to Base64-encoded
 *   encrypted keys in v3 wire format.
 * @throws {Error} If the sender is unauthorized, token is invalid/expired,
 *   or encryption fails.
 */
export async function encryptPendingKeys(event, arg) {
    const senderFrame = requireValidMainSender(event);
    const { token, password, tier } = arg;
    const pending = retrievePendingKey(token);

    const encrypted = {};
    for (const [keytype, value] of Object.entries(pending.keys)) {
        try {
            encrypted[keytype] = await encrypt(value, password, tier || 'medium');
        } catch (error) {
            console.log({ error });
            throw new Error('Encryption failure');
        }
    }
    return encrypted;
}

/**
 * Decrypts a private key and uses it to sign a blockchain transaction.
 *
 * Decrypts the encrypted key using the stored seed, signs the operation
 * with the blockchain API, broadcasts the signed transaction, and returns
 * the broadcast response.
 *
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {{ encryptedKey: string, chain: string, operation: object }} arg
 *   - `encryptedKey` — Base64-encoded v3 encrypted private key.
 *   - `chain` — Blockchain identifier (e.g., "eos", "bitshares").
 *   - `operation` — The blockchain operation object to sign.
 * @param {Object<string, string>} chainNodes - Map of chain identifiers
 *   to their current RPC node URLs. Updated by the blockchainRequest handler.
 * @returns {Promise<object>} The broadcast response from the blockchain.
 * @throws {Error} If the sender is unauthorized, wallet is locked,
 *   key decryption fails, or signing/broadcasting fails.
 */
export async function decryptAndSign(event, arg, chainNodes) {
    const senderFrame = requireValidMainSender(event);
    const { encryptedKey, chain, operation } = arg;

    const seed = decryptSeed();
    if (!seed) {
        throw new Error('Wallet not unlocked');
    }

    let signingKey;
    try {
        signingKey = await decrypt(encryptedKey, seed);
    } catch (error) {
        console.log({ error, location: 'decryptAndSign.decrypt' });
        throw new Error('Key decryption failed');
    }

    if (!signingKey) {
        throw new Error('Key decryption returned empty');
    }

    let blockchain;
    try {
        blockchain = await getBlockchainAPI(chain, chainNodes[chain] || null);
    } catch (error) {
        console.log({ error, location: 'decryptAndSign.getBlockchain' });
        throw new Error('Failed to get blockchain API');
    }

    let transaction;
    try {
        transaction = await blockchain.sign(operation, signingKey);
    } catch (error) {
        const errData = {
            code: error.code,
            message: error.message || 'Transaction signing failed',
            data: error.data,
            location: 'decryptAndSign.blockchain.sign',
        };
        const err = new Error(errData.message);
        err.message = JSON.stringify(errData);
        throw err;
    }

    if (transaction) {
        let broadcastResponse;
        try {
            broadcastResponse = await blockchain.broadcast(transaction);
        } catch (error) {
            const errData = {
                code: error.code,
                message: error.message || 'Transaction broadcast failed',
                data: error.data,
                digest: error.digest,
                transaction: error.transaction,
                location: 'decryptAndSign.blockchain.broadcast',
            };
            const err = new Error(errData.message);
            err.message = JSON.stringify(errData);
            throw err;
        }
        return broadcastResponse;
    }

    throw new Error('No transaction returned from sign');
}

/**
 * Decrypts a memo key and creates an encrypted memo object.
 *
 * Decrypts the memo key using the stored seed, then uses the blockchain
 * API to create an encrypted memo object for transferring messages
 * between accounts.
 *
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {{ encryptedKey: string, chain: string, from: string, to: string, nonce: string, message: string }} arg
 *   - `encryptedKey` — Base64-encoded v3 encrypted memo key.
 *   - `chain` — Blockchain identifier.
 *   - `from` — Sender account name.
 *   - `to` — Recipient account name.
 *   - `nonce` — Memo nonce for encryption.
 *   - `message` — Plaintext message to encrypt in the memo.
 * @param {Object<string, string>} chainNodes - Map of chain identifiers
 *   to their current RPC node URLs.
 * @returns {Promise<object>} The encrypted memo object.
 * @throws {Error} If the sender is unauthorized, wallet is locked,
 *   key decryption fails, or memo creation fails.
 */
export async function decryptAndCreateMemo(event, arg, chainNodes) {
    const senderFrame = requireValidMainSender(event);
    const { encryptedKey, chain, from, to, nonce, message } = arg;

    const seed = decryptSeed();
    if (!seed) {
        throw new Error('Wallet not unlocked');
    }

    let memoKey;
    try {
        memoKey = await decrypt(encryptedKey, seed);
    } catch (error) {
        console.log({ error, location: 'decryptAndCreateMemo.decrypt' });
        throw new Error('Key decryption failed');
    }

    let blockchain;
    try {
        blockchain = await getBlockchainAPI(chain, chainNodes[chain] || null);
    } catch (error) {
        console.log({ error, location: 'decryptAndCreateMemo.getBlockchain' });
        throw new Error('Failed to get blockchain API');
    }

    let memoObject;
    try {
        memoObject = blockchain._createMemoObject(from, to, nonce, message, memoKey);
    } catch (error) {
        console.log({ error, location: 'decryptAndCreateMemo.createMemo' });
        throw new Error('Memo creation failed');
    }

    return memoObject;
}

/**
 * Decrypts a private key and uses it to sign a text message.
 *
 * Decrypts the key using the stored seed, then signs the message using
 * the blockchain API's signMessage method.
 *
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {{ encryptedKey: string, chain: string, accountName: string, messageText: string }} arg
 *   - `encryptedKey` — Base64-encoded v3 encrypted private key.
 *   - `chain` — Blockchain identifier.
 *   - `accountName` — Account name that owns the signing key.
 *   - `messageText` — The text message to sign.
 * @param {Object<string, string>} chainNodes - Map of chain identifiers
 *   to their current RPC node URLs.
 * @returns {Promise<object>} The signed message object.
 * @throws {Error} If the sender is unauthorized, wallet is locked,
 *   key decryption fails, or message signing fails.
 */
export async function decryptAndSignMessage(event, arg, chainNodes) {
    const senderFrame = requireValidMainSender(event);
    const { encryptedKey, chain, accountName, messageText } = arg;

    const seed = decryptSeed();
    if (!seed) {
        throw new Error('Wallet not unlocked');
    }

    let signingKey;
    try {
        signingKey = await decrypt(encryptedKey, seed);
    } catch (error) {
        console.log({ error, location: 'decryptAndSignMessage.decrypt' });
        throw new Error('Key decryption failed');
    }

    let blockchain;
    try {
        blockchain = await getBlockchainAPI(chain, chainNodes[chain] || null);
    } catch (error) {
        console.log({ error, location: 'decryptAndSignMessage.getBlockchain' });
        throw new Error('Failed to get blockchain API');
    }

    let signedMessage;
    try {
        signedMessage = await blockchain.signMessage(signingKey, accountName, messageText, chain);
    } catch (error) {
        console.log({ error, location: 'decryptAndSignMessage.signMessage' });
        throw new Error('Message signing failed');
    }

    return signedMessage;
}

/**
 * Unlocks a wallet by decrypting its encrypted data.
 *
 * The password is expected to be pre-hashed (SHA-512 hex) by the renderer
 * before being sent to the main process. The password is stored via
 * Electron's safeStorage for later use in signing operations.
 *
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {{ encryptedData: string, password: string }} arg
 *   - `encryptedData` — The encrypted wallet data blob.
 *   - `password` — Pre-hashed password (SHA-512 hex).
 * @returns {Promise<string>} The decrypted wallet data as a JSON string.
 * @throws {Error} If the sender is unauthorized or decryption fails.
 */
export async function unlockWallet(event, arg) {
    const senderFrame = requireValidMainSender(event);
    const { encryptedData, password } = arg;

    _storeSeed(password);

    let decryptedWallet;
    try {
        decryptedWallet = await decrypt(encryptedData, password);
    } catch (error) {
        console.log({ error, location: 'unlockWallet.decrypt' });
        throw new Error('Wallet decryption failed');
    }

    return decryptedWallet;
}

/**
 * Encrypts arbitrary data with Argon2id + AES-256-GCM and returns
 * the Base64-encoded v3 wire format string.
 *
 * Used by the renderer to encrypt wallet blobs, individual keys, and
 * other sensitive data before storing in IndexedDB.
 *
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {{ data: string, password: string, tier?: string }} arg
 *   - `data` — Plaintext string to encrypt.
 *   - `password` — Pre-hashed password (SHA-512 hex) for key derivation.
 *   - `tier` — Optional security tier ("low", "medium", "high") or raw
 *     `{ t, m, p }` parameters. Defaults to "medium".
 * @returns {Promise<string>} Base64-encoded ciphertext in v3 wire format.
 * @throws {Error} If the sender is unauthorized or encryption fails.
 */
export async function encryptAndStore(event, arg) {
    const senderFrame = requireValidMainSender(event);
    const { data, password, tier } = arg;

    let encrypted;
    try {
        encrypted = await encrypt(data, password, tier || 'medium');
    } catch (error) {
        console.log({ error, location: 'encryptAndStore.encrypt' });
        throw new Error('Encryption failed');
    }

    return encrypted;
}

/**
 * Decrypts wallet data using the stored in-memory seed.
 *
 * Used for authorization checks (verifying the user knows the password)
 * and for re-encrypting wallet data after adding/removing accounts.
 * The seed is the pre-hashed password that was stored during unlockWallet.
 *
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {{ data: string }} arg
 *   - `data` — Base64-encoded v3 encrypted wallet data.
 * @returns {Promise<string>} Decrypted plaintext (usually JSON).
 * @throws {Error} If the sender is unauthorized, wallet is not unlocked,
 *   or decryption fails.
 */
export async function decryptWallet(event, arg) {
    const senderFrame = requireValidMainSender(event);
    const { data } = arg;

    const seed = decryptSeed();
    if (!seed) {
        throw new Error('Wallet not unlocked');
    }

    let decrypted;
    try {
        decrypted = await decrypt(data, seed);
    } catch (error) {
        console.log({ error, location: 'decryptWallet.decrypt' });
        throw new Error('Decryption failed');
    }

    return decrypted;
}

/**
 * Returns information about the safeStorage encryption backend.
 *
 * On Linux, returns the selected password manager backend name (e.g.,
 * "gnome_libsecret", "kwallet5", "basic_text"). On other platforms,
 * returns the platform name since `getSelectedStorageBackend()` is
 * Linux-only.
 *
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @returns {Promise<{available: boolean, backend: string}>} Encryption
 *   availability and backend name.
 */
export async function getSafeStorageBackend(event) {
    const senderFrame = requireValidMainSender(event);
    let backend;
    if (process.platform === 'linux') {
        try {
            backend = safeStorage.getSelectedStorageBackend();
        } catch (error) {
            backend = `error: ${error.message}`;
        }
    } else {
        backend = process.platform;
    }
    return {
        available: ENCRYPTION_AVAILABLE,
        backend: backend
    };
}
