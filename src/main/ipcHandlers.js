import { ipcMain, app, dialog } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fsPromises from 'fs/promises';
import * as secp from '@noble/secp256k1';
import { hexToBytes } from '@noble/hashes/utils.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hmac } from '@noble/hashes/hmac.js';
import { validateSender, validateMainSender } from './securityGuards.js';
import { encrypt, decrypt } from '../lib/crypto.js';
import {
    createModal,
    createReceipt,
    createError,
    createDoc,
    onNotify,
    handleOpenURL,
    handleClickAllow,
    handleClickDeny,
} from './windows.js';
import { readDocFile, readManifest } from './docs.js';
import {
    handleBlockchainRequest,
    readFileSecure,
    parseDeeplink,
} from './blockchainHandler.js';
import * as sessionManager from './sessionManager.js';
import { getSignature } from '../lib/SecureRemote.js';

/**
 * Required secp256k1 hash function setup. Must be done once before any
 * signature verification or key derivation operations.
 * @type {void}
 */
secp.hashes.sha256 = sha256;
secp.hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg);

/**
 * Registers all IPC handlers for the main process.
 *
 * This function is called once during `createWindow()` after the app
 * is ready. It wires up all `ipcMain.handle` and `ipcMain.on` listeners
 * that the renderer process communicates with.
 *
 * Handler categories:
 *   - **Blockchain**: `blockchainRequest`, `memoFromBuffer`
 *   - **Window management**: `createPopup`, `createReceipt`, `createError`
 *   - **Security**: `getSignature`, `verifyCrypto`, `id`
 *   - **Session**: `seed`, `clearSeed`, `unlockWallet`, `setSeedFromPassword`
 *   - **Encryption**: `encryptPendingKeys`, `decryptAndSign`, `decryptAndCreateMemo`,
 *     `decryptAndSignMessage`, `encryptAndStore`, `decryptWallet`
 *   - **Backup**: `downloadBackup`, `restore`
 *   - **UI**: `notify`, `openURL`, `clickedAllow`, `clickedDeny`, `sendError`
 *   - **Info**: `getSafeStorageBackend`
 *
 * @param {object} deps - Dependency injection for testability and to avoid
 *   circular imports.
 * @param {function} deps.getMainWindow - Returns the main BrowserWindow.
 * @param {function} deps.getChainNodes - Returns the shared chain nodes map.
 * @param {function} deps.decryptSeed - Returns the stored seed/decrypts it.
 * @param {function} deps.getSignatureFn - Fetches a remote signature for
 *   backup validation.
 * @returns {void}
 */
export function registerIPCHandlers({
    getMainWindow,
    getChainNodes,
    decryptSeed,
    getSignatureFn,
}) {
    const chainNodes = getChainNodes();

    /**
     * Converts a UTF-8 buffer to its hexadecimal representation.
     * @param {Electron.IpcMainInvokeEvent} event
     * @param {{ msg: string }} arg - The UTF-8 string to convert.
     * @returns {string} Hex-encoded string.
     */
    ipcMain.handle('memoFromBuffer', async (event, arg) => {
        if (!validateSender(event.senderFrame)) throw new Error('Unauthorized');
        const { msg } = arg;
        return Buffer.from(msg).toString('hex');
    });

    /**
     * Dispatches blockchain API requests to the blockchainHandler module.
     * @see handleBlockchainRequest for full parameter documentation.
     */
    ipcMain.handle('blockchainRequest', async (event, arg) => {
        return handleBlockchainRequest(event, arg);
    });

    /**
     * Generates and returns a new UUID v4 identifier.
     * Used by the renderer for unique request IDs.
     */
    ipcMain.handle('id', (event, arg) => {
        if (!validateSender(event.senderFrame)) throw new Error('Unauthorized');
        return uuidv4();
    });

    /**
     * Fetches a cryptographic signature from a remote server.
     * Used during backup to verify the backup file's integrity.
     */
    ipcMain.handle('getSignature', async (event, arg) => {
        if (!validateSender(event.senderFrame)) throw new Error('Unauthorized');
        let response;
        try {
            response = await getSignatureFn(arg);
        } catch (error) {
            console.log(error);
        }
        return response;
    });

    /**
     * Verifies a secp256k1 signature against a message hash and public key.
     * Used by the renderer to verify remote signatures.
     */
    ipcMain.handle('verifyCrypto', async (event, arg) => {
        if (!validateSender(event.senderFrame)) throw new Error('Unauthorized');
        const { signedMessage, msgHash, pubk } = arg;
        let isValid;
        try {
            isValid = secp.verify(hexToBytes(signedMessage), hexToBytes(msgHash), pubk, { prehash: false });
        } catch (error) {
            console.log(error);
        }
        return isValid;
    });

    /**
     * Handles the user clicking "Allow" on a modal prompt.
     * @see handleClickAllow
     */
    ipcMain.on('clickedAllow', (event, arg) => {
        handleClickAllow(event, arg);
    });

    /**
     * Handles the user clicking "Deny" on a modal prompt.
     * @see handleClickDeny
     */
    ipcMain.on('clickedDeny', (event, arg) => {
        handleClickDeny(event, arg);
    });

    /**
     * Displays a native OS notification from the main process.
     * @see onNotify
     */
    ipcMain.on('notify', (event, arg) => {
        onNotify(event, arg);
    });

    /**
     * Opens an external URL in the default browser (domain-restricted).
     * @see handleOpenURL
     */
    ipcMain.on('openURL', (event, arg) => {
        handleOpenURL(event, arg);
    });

    /**
     * Creates a modal (prompt/approve/deny) BrowserWindow.
     * @see createModal
     */
    ipcMain.on('createPopup', async (event, arg) => {
        if (!validateSender(event.senderFrame)) return;
        try {
            await createModal(arg, event);
        } catch (error) {
            console.log(error);
        }
    });

    /**
     * Creates a receipt BrowserWindow to display transaction results.
     * @see createReceipt
     */
    ipcMain.on('createReceipt', async (event, arg) => {
        if (!validateSender(event.senderFrame)) return;
        try {
            await createReceipt(arg, event);
        } catch (error) {
            console.log(error);
        }
    });

    /**
     * Creates an error BrowserWindow for failed operations.
     * @see createError
     */
    ipcMain.on('createError', async (event, arg) => {
        if (!validateSender(event.senderFrame)) return;
        try {
            await createError(arg, event);
        } catch (error) {
            console.log(error);
        }
    });

    /**
     * Creates or focuses the documentation BrowserWindow.
     * @see createDoc
     */
    ipcMain.on('createDoc', (event, arg) => {
        if (!validateSender(event.senderFrame)) return;
        try {
            createDoc(arg);
        } catch (error) {
            console.log(error);
        }
    });

    /**
     * Reads a documentation markdown file for the requested locale.
     * Falls back to English if the locale-specific file is missing.
     */
    ipcMain.handle('readDoc', async (event, arg) => {
        if (!validateSender(event.senderFrame)) throw new Error('Unauthorized');
        const { locale, path: docPath } = arg;
        return readDocFile(__dirname, locale, docPath);
    });

    /**
     * Reads and returns the documentation navigation manifest.
     */
    ipcMain.handle('readManifest', async (event) => {
        if (!validateSender(event.senderFrame)) throw new Error('Unauthorized');
        return readManifest(__dirname);
    });

    /**
     * Logs renderer-forwarded uncaught errors for crash reporting.
     */
    ipcMain.on('sendError', async (event, arg) => {
        if (!validateSender(event.senderFrame)) return;
        console.error(`[RENDERER] ${event.senderFrame?.url || ''}: ${arg}`);
    });

    /**
     * Exports the current wallet as an encrypted .beet backup file.
     * Prompts the user for a save location via the native file dialog.
     * @see handleDownloadBackup
     */
    ipcMain.on('downloadBackup', async (event, arg) => {
        try {
            await handleDownloadBackup(event, arg, decryptSeed);
        } catch (error) {
            console.log(error);
        }
    });

    /**
     * Restores a wallet from an encrypted .beet backup file.
     * @see handleRestore
     */
    ipcMain.handle('restore', async (event, arg) => {
        return handleRestore(event, arg);
    });

    /**
     * Encrypts pending vault-stored keys and returns the encrypted map.
     * @see sessionManager.encryptPendingKeys
     */
    ipcMain.handle('encryptPendingKeys', async (event, arg) => {
        return sessionManager.encryptPendingKeys(event, arg);
    });

    /**
     * Decrypts a private key and uses it to sign + broadcast a transaction.
     * @see sessionManager.decryptAndSign
     */
    ipcMain.handle('decryptAndSign', async (event, arg) => {
        return sessionManager.decryptAndSign(event, arg, chainNodes);
    });

    /**
     * Decrypts a memo key and creates an encrypted memo object.
     * @see sessionManager.decryptAndCreateMemo
     */
    ipcMain.handle('decryptAndCreateMemo', async (event, arg) => {
        return sessionManager.decryptAndCreateMemo(event, arg, chainNodes);
    });

    /**
     * Decrypts a private key and uses it to sign a text message.
     * @see sessionManager.decryptAndSignMessage
     */
    ipcMain.handle('decryptAndSignMessage', async (event, arg) => {
        return sessionManager.decryptAndSignMessage(event, arg, chainNodes);
    });

    /**
     * Unlocks the wallet by decrypting its data and storing the seed.
     * @see sessionManager.unlockWallet
     */
    ipcMain.handle('unlockWallet', async (event, arg) => {
        return sessionManager.unlockWallet(event, arg);
    });

    /**
     * Encrypts arbitrary data with Argon2id + HKDF + XChaCha20-Poly1305.
     * @see sessionManager.encryptAndStore
     */
    ipcMain.handle('encryptAndStore', async (event, arg) => {
        return sessionManager.encryptAndStore(event, arg);
    });

    /**
     * Decrypts wallet data using the stored in-memory seed.
     * @see sessionManager.decryptWallet
     */
    ipcMain.handle('decryptWallet', async (event, arg) => {
        return sessionManager.decryptWallet(event, arg);
    });

    /**
     * Stores a pre-hashed password as the in-memory encryption seed.
     * Used during wallet restore.
     */
    ipcMain.handle('setSeedFromPassword', async (event, arg) => {
        if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
        const { password } = arg;
        sessionManager.setSeedFromPassword(password);
        return true;
    });

    /**
     * Returns information about the safeStorage encryption backend.
     * @see sessionManager.getSafeStorageBackend
     */
    ipcMain.handle('getSafeStorageBackend', async (event) => {
        return sessionManager.getSafeStorageBackend(event);
    });

    /**
     * Stores the seed password in memory via safeStorage or fallback.
     * Called by the renderer after password verification.
     */
    ipcMain.on('seed', (event, arg) => {
        if (!validateMainSender(event.senderFrame)) return;
        console.log('SEEDED');
        sessionManager.storeSeed(arg);
    });

    /**
     * Clears the stored seed and performs a full session logout.
     * Called by the renderer when the user explicitly logs out.
     */
    ipcMain.on('clearSeed', (event) => {
        if (!validateMainSender(event.senderFrame)) return;
        sessionManager.clearSeed();
    });
}

/**
 * Exports the current wallet as an encrypted .beet backup file.
 *
 * This function:
 *   1. Validates the sender and checks the wallet is unlocked
 *   2. Prompts the user for a save location via the native file dialog
 *   3. Fetches a cryptographic signature from the remote server
 *   4. Verifies the signature to ensure the backup hasn't been tampered with
 *   5. Encrypts the wallet data with the user's seed
 *   6. Writes the encrypted data to the selected file
 *
 * @param {Electron.IpcMainEvent} event - The IPC event.
 * @param {object} arg - Backup arguments.
 * @param {string} arg.walletName - Name of the wallet to backup.
 * @param {string} [arg.walletTier] - Security tier (defaults to 'medium').
 * @param {string} arg.accounts - JSON string of accounts to include.
 * @param {function} decryptSeedFn - Function that returns the current
 *   stored seed, or null if the wallet is locked.
 * @returns {Promise<void>}
 * @private
 */
async function handleDownloadBackup(event, arg, decryptSeedFn) {
    if (!validateMainSender(event.senderFrame)) return;
    const { walletName, walletTier, accounts } = arg;
    const seed = decryptSeedFn();
    if (!seed) {
        console.error('Cannot backup: wallet not unlocked');
        return;
    }
    let toLocalPath = path.resolve(
        app.getPath('desktop'),
        `BeetBackup-${walletName}-${new Date().toISOString().slice(0, 10)}.beet`
    );
    dialog
        .showSaveDialog({ defaultPath: toLocalPath })
        .then(async (result) => {
            if (result.canceled) {
                console.log('Cancelled saving backup.');
                return;
            }

            const response = await getSignature('backup');
            if (!response) {
                console.log('Error: No signature');
                return;
            }

            let isValid;
            try {
                isValid = secp.verify(hexToBytes(response.signedMessage), hexToBytes(response.msgHash), response.pubk, { prehash: false });
            } catch (error) {
                console.log(error);
                return;
            }

            if (!isValid) {
                console.log('Failed to backup wallet (validation)');
                return;
            }

            let encrypted;
            try {
                encrypted = await encrypt(
                    JSON.stringify({
                        wallet: walletName,
                        tier: walletTier || 'medium',
                        accounts: JSON.parse(accounts),
                    }),
                    seed
                );
            } catch (error) {
                console.log(`encrypt: ${error}`);
                return;
            }

            if (!encrypted) {
                console.log('Failed to backup wallet (encryption)');
                return;
            }

            if (encrypted) {
                await fsPromises.writeFile(result.filePath, encrypted);
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * Restores a wallet from an encrypted .beet backup file.
 *
 * Decrypts the backup file data using the provided seed and returns
 * the parsed wallet JSON.
 *
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {{ fileData: string, seed: string }} arg
 *   - `fileData` — The encrypted backup file contents.
 *   - `seed` — The password/seed to decrypt with.
 * @returns {Promise<object>} The parsed wallet data.
 * @throws {Error} If the sender is unauthorized, file data is invalid,
 *   decryption fails, or the backup format is invalid.
 * @private
 */
async function handleRestore(event, arg) {
    if (!validateMainSender(event.senderFrame)) throw new Error('Unauthorized');
    const { fileData, seed } = arg;

    if (!fileData) {
        console.log('Invalid restore file data');
        throw new Error('Invalid file data');
    }

    let decryptedData;
    try {
        decryptedData = await decrypt(fileData, seed);
    } catch (error) {
        console.log(error);
        throw new Error('Decryption failed');
    }

    if (!decryptedData) {
        console.log('Wallet restore failed');
        throw new Error('Wallet restore failed');
    }

    let parsed;
    try {
        parsed = JSON.parse(decryptedData);
    } catch (error) {
        console.log('Failed to parse restored data:', error);
        throw new Error('Invalid backup format');
    }

    return parsed;
}
