/**
 * @file Wallet encryption engine — Argon2id + AES-256-GCM.
 *
 * Provides authenticated encryption for wallet data using:
 * - **Argon2id** (RFC 9106) for memory-hard key derivation
 * - **AES-256-GCM** for authenticated encryption (confidentiality + integrity)
 *
 * Key derivation runs in a dedicated worker thread (`argon-worker.mjs`) to
 * avoid blocking the Electron main process.
 *
 * ## Wire Format (v3)
 *
 * ```
 * Base64( "v3" | t(4 BE) | m(4 BE) | salt(32) | nonce(12) | ciphertext_with_tag )
 * ```
 *
 * | Offset | Length | Field | Description |
 * |--------|--------|-------|-------------|
 * | 0      | 2      | Prefix | ASCII "v3" |
 * | 2      | 4      | t | Argon2id time cost (Big-Endian Uint32) |
 * | 6      | 4      | m | Argon2id memory cost in KiB (Big-Endian Uint32) |
 * | 10     | 32     | Salt | CSPRNG-generated |
 * | 42     | 12     | Nonce | CSPRNG-generated |
 * | 54     | varies | Ciphertext + Tag | GCM output (plaintext_len + 16 tag) |
 *
 * Total overhead: 2 + 4 + 4 + 32 + 12 + 16 = 70 bytes (before Base64).
 *
 * Parameters `t` and `m` are encoded directly in the header so the format is
 * self-describing. A file created today always decrypts correctly regardless of
 * how UI tier defaults change in the future.
 *
 * ## Security Tiers
 *
 * The UI presents three tiers as a convenience. Each maps to (t, m) pairs:
 *
 * | Tier | t | m (KiB) | m (MiB) | Est. Time | Use Case |
 * |------|---|---------|---------|-----------|----------|
 * | Low | 3 | 65,536 | 64 | ~2-4s | Older hardware, quick unlock |
 * | Medium | 3 | 262,144 | 256 | ~8-15s | **Default.** Good balance. |
 * | High | 3 | 524,288 | 512 | ~15-25s | High-security, modern hardware |
 *
 * @module crypto
 */

import { gcm } from "@noble/ciphers/aes.js";
import { randomBytes } from "@noble/ciphers/utils.js";
import { utf8ToBytes } from "@noble/ciphers/utils.js";
import { Worker } from "worker_threads";
import path from "path";

/** @type {string} Absolute path to the Argon2id worker thread script. */
const WORKER_PATH = path.join(__dirname, "lib", "argon-worker.mjs");

/** @type {Uint8Array} Wire format prefix: ASCII "v3". */
const PREFIX = new Uint8Array([0x76, 0x33]);

/** @type {number} Salt length in bytes. */
const SALT_LENGTH = 32;

/** @type {number} AES-GCM nonce length in bytes. */
const NONCE_LENGTH = 12;

/** @type {number} AES-GCM authentication tag length in bytes. */
const TAG_LENGTH = 16;

/** @type {number} Header length: prefix(2) + t(4) + m(4). */
const HEADER_LENGTH = PREFIX.length + 4 + 4;

/** @type {number} Minimum valid ciphertext length (header + salt + nonce + tag). */
const MIN_CIPHERTEXT_LENGTH = HEADER_LENGTH + SALT_LENGTH + NONCE_LENGTH + TAG_LENGTH;

/**
 * UI tier presets mapping labels to Argon2id parameters.
 *
 * Each tier defines:
 * - `t` — time cost (iterations)
 * - `m` — memory cost in KiB
 * - `p` — parallelism (threads, always 1 for single-worker derivation)
 *
 * @type {{ low: ArgonParams, medium: ArgonParams, high: ArgonParams }}
 */
const TIERS = {
    low:    { t: 3, m: 2 ** 16, p: 1 },  // 64 MiB
    medium: { t: 3, m: 2 ** 18, p: 1 },  // 256 MiB (default)
    high:   { t: 3, m: 2 ** 19, p: 1 },  // 512 MiB
};

/** @type {string} Default tier used when none is specified. */
const DEFAULT_TIER = "medium";

/** @type {TextDecoder} Reusable decoder for converting bytes to strings. */
const textDecoder = new TextDecoder();

/**
 * @typedef {Object} ArgonParams
 * @property {number} t - Time cost (iterations). Range: 1-10.
 * @property {number} m - Memory cost in KiB. Range: 2^14 - 2^24.
 * @property {number} p - Parallelism (threads). Always 1.
 * @property {number} [dkLen] - Desired key length in bytes. Default: 32.
 */

/**
 * Derive a 32-byte AES-256 key using Argon2id in a worker thread.
 *
 * Spawns a one-shot worker that runs Argon2id synchronously, posts the
 * derived key back, then exits. The main process is never blocked.
 *
 * @param {string|Uint8Array} password - Password or passphrase to derive from.
 * @param {Uint8Array} salt - 32-byte CSPRNG salt.
 * @param {ArgonParams} params - Argon2id parameters (t, m, p).
 * @returns {Promise<Uint8Array>} Derived 32-byte key.
 * @throws {Error} If the worker exits with a non-zero code.
 */
function deriveKey(password, salt, params) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(WORKER_PATH, {
            workerData: {
                password: typeof password === "string" ? password : Array.from(password),
                salt: Array.from(salt),
                params
            }
        });
        worker.on("message", (keyArray) => resolve(new Uint8Array(keyArray)));
        worker.on("error", reject);
        worker.on("exit", (code) => {
            if (code !== 0) reject(new Error("Worker exited with code " + code));
        });
    });
}

/**
 * Encode a 32-bit unsigned integer as 4 bytes in big-endian order.
 *
 * @param {number} value - Unsigned 32-bit integer.
 * @returns {Buffer} 4-byte big-endian buffer.
 */
function encodeUint32BE(value) {
    const buf = Buffer.alloc(4);
    buf.writeUInt32BE(value, 0);
    return buf;
}

/**
 * Decode a 32-bit unsigned integer from 4 bytes in big-endian order.
 *
 * @param {Buffer} buf - Buffer to read from.
 * @param {number} offset - Byte offset to start reading.
 * @returns {number} Decoded unsigned 32-bit integer.
 */
function decodeUint32BE(buf, offset) {
    return buf.readUInt32BE(offset);
}

/**
 * Encrypt plaintext using Argon2id + AES-256-GCM.
 *
 * Derives a 32-byte key via Argon2id (in a worker thread), encrypts with
 * AES-256-GCM, and returns a Base64-encoded v3 wire format string.
 *
 * The `tier` parameter accepts either a label ("low", "medium", "high") or
 * a raw `{ t, m, p }` object for custom parameters.
 *
 * @param {string} plaintext - Data to encrypt (will be UTF-8 encoded).
 * @param {string} passphrase - Passphrase for Argon2id key derivation.
 * @param {string|ArgonParams} [tier="medium"] - Security tier label or
 *   raw Argon2id parameters.
 * @returns {Promise<string>} Base64-encoded ciphertext in v3 wire format.
 * @throws {Error} If tier is invalid or parameters are out of range.
 *
 * @example
 * // Using tier label
 * const encrypted = await encrypt("secret data", "my-password", "medium");
 *
 * @example
 * // Using raw parameters
 * const encrypted = await encrypt("secret data", "my-password", { t: 3, m: 65536, p: 1 });
 */
export async function encrypt(plaintext, passphrase, tier = DEFAULT_TIER) {
    const params = typeof tier === "string" ? TIERS[tier] : tier;
    if (!params || !params.t || !params.m) {
        throw new Error("Invalid tier or parameters");
    }

    const salt = randomBytes(SALT_LENGTH);
    const nonce = randomBytes(NONCE_LENGTH);
    const key = await deriveKey(passphrase, salt, params);

    const cipher = gcm(key, nonce);
    const ciphertext = cipher.encrypt(utf8ToBytes(plaintext));

    const output = Buffer.concat([
        Buffer.from(PREFIX),
        encodeUint32BE(params.t),
        encodeUint32BE(params.m),
        Buffer.from(salt),
        Buffer.from(nonce),
        Buffer.from(ciphertext)
    ]);

    // Zeroize key material
    key.fill(0);

    return output.toString("base64");
}

/**
 * Decrypt a v3 wire format ciphertext using Argon2id + AES-256-GCM.
 *
 * Reads the Argon2id parameters (t, m) directly from the wire format header,
 * derives the key in a worker thread, and decrypts with AES-256-GCM.
 *
 * @param {string} ciphertextBase64 - Base64-encoded v3 wire format ciphertext.
 * @param {string} passphrase - Passphrase for Argon2id key derivation.
 * @returns {Promise<string>} Decrypted plaintext string.
 * @throws {Error} If ciphertext is too short, has invalid prefix, or
 *   contains out-of-range parameters.
 * @throws {Error} If GCM authentication tag verification fails (wrong
 *   passphrase or tampered data).
 *
 * @example
 * const plaintext = await decrypt(encrypted, "my-password");
 */
export async function decrypt(ciphertextBase64, passphrase) {
    const raw = Buffer.from(ciphertextBase64, "base64");

    if (raw.length < MIN_CIPHERTEXT_LENGTH) {
        throw new Error("Ciphertext too short");
    }

    if (raw[0] !== 0x76 || raw[1] !== 0x33) {
        throw new Error("Invalid v3 format");
    }

    const t = decodeUint32BE(raw, 2);
    const m = decodeUint32BE(raw, 6);

    if (t < 1 || t > 10) throw new Error("Invalid Argon2id t parameter: " + t);
    if (m < 2 ** 14 || m > 2 ** 24) throw new Error("Invalid Argon2id m parameter: " + m);

    let offset = HEADER_LENGTH;
    const salt = raw.subarray(offset, offset + SALT_LENGTH); offset += SALT_LENGTH;
    const nonce = raw.subarray(offset, offset + NONCE_LENGTH); offset += NONCE_LENGTH;
    const ciphertext = raw.subarray(offset);

    const key = await deriveKey(passphrase, salt, { t, m, p: 1, dkLen: 32 });

    const cipher = gcm(key, nonce);
    const plaintextBytes = cipher.decrypt(ciphertext);

    // Zeroize key material
    key.fill(0);

    return textDecoder.decode(plaintextBytes);
}
