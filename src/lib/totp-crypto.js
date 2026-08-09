/**
 * @file TOTP deeplink encryption — XChaCha20-Poly1305 + SHA-256 KDF.
 *
 * Provides lightweight authenticated encryption for short-lived TOTP
 * deeplink payloads. Unlike the wallet encryption engine (`crypto.js`),
 * which uses memory-hard Argon2id for long-lived secrets, this module
 * prioritizes speed and third-party compatibility.
 *
 * ## Design Rationale
 *
 * TOTP deeplink payloads are transient — the passcode used to encrypt them
 * expires within 60 seconds to 10 minutes. Memory-hard key derivation
 * (Argon2id at 256 MiB) provides no meaningful security benefit for data
 * with such a short lifespan, while imposing:
 *   - 8-15 seconds of compute per operation
 *   - 256 MiB of peak memory usage
 *   - A complex binary wire format that browser dApps cannot easily produce
 *
 * This module instead uses a single SHA-256 hash for key derivation
 * (sub-millisecond) and XChaCha20-Poly1305 for authenticated encryption.
 *
 * ## Why XChaCha20-Poly1305
 *
 * - **Constant-time by design** — no table lookups, immune to cache-timing attacks
 * - **Fast in software** — no AES-NI hardware dependency
 * - **192-bit nonce** — random nonces are collision-safe without counter management
 * - **Widely available** — implemented in Web Crypto API, libsodium, and most
 *   crypto libraries across languages
 *
 * ## Wire Format (v1)
 *
 * ```
 * Base64( version(1) | nonce(24) | ciphertext_with_tag )
 * ```
 *
 * | Offset | Length | Field | Description |
 * |--------|--------|-------|-------------|
 * | 0      | 1      | Version | Format version byte (0x01) |
 * | 1      | 24     | Nonce | CSPRNG-generated XChaCha20 nonce |
 * | 25     | varies | Ciphertext + Tag | AEAD output (plaintext_len + 16 tag) |
 *
 * Total overhead: 1 + 24 + 16 = 41 bytes (before Base64).
 *
 * The leading version byte distinguishes this format from the wallet's v4
 * format (which begins with ASCII "v4" = 0x76 0x34) and allows future
 * cryptographic upgrades without ambiguity.
 *
 * @module totp-crypto
 */

import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes, utf8ToBytes, bytesToUtf8 } from '@noble/ciphers/utils.js';
import { sha256 } from '@noble/hashes/sha2.js';

/** @type {number} Wire format version byte. */
const VERSION_BYTE = 0x01;

/** @type {number} XChaCha20 nonce length in bytes (192 bits). */
const NONCE_LENGTH = 24;

/** @type {number} Poly1305 authentication tag length in bytes. */
const TAG_LENGTH = 16;

/** @type {number} Minimum valid ciphertext length (version + nonce + tag). */
const MIN_CIPHERTEXT_LENGTH = 1 + NONCE_LENGTH + TAG_LENGTH;

/**
 * Derives a 32-byte encryption key from a TOTP passcode.
 *
 * Uses a single SHA-256 hash rather than a memory-hard KDF. This is
 * appropriate because the passcode is short-lived and single-use — an
 * attacker who obtains the ciphertext has only until the code expires
 * to attempt recovery, and the code changes on every request.
 *
 * @param {string} code - The TOTP passcode.
 * @returns {Uint8Array} A 32-byte key suitable for XChaCha20-Poly1305.
 * @private
 */
function deriveKey(code) {
    return sha256(utf8ToBytes(code));
}

/**
 * Encrypts a plaintext payload using a TOTP passcode.
 *
 * @param {string} plaintext - The data to encrypt (typically a JSON string).
 * @param {string} code - The TOTP passcode to derive the key from.
 * @returns {string} Base64-encoded ciphertext in v1 wire format.
 * @throws {Error} If the plaintext or code is missing.
 *
 * @example
 * const encrypted = encryptTOTP(JSON.stringify(request), '4f2a8b1c9d3e7f0');
 */
export function encryptTOTP(plaintext, code) {
    if (typeof plaintext !== 'string' || !plaintext) {
        throw new Error('Plaintext must be a non-empty string');
    }
    if (typeof code !== 'string' || !code) {
        throw new Error('TOTP code must be a non-empty string');
    }

    const key = deriveKey(code);
    const nonce = randomBytes(NONCE_LENGTH);

    const cipher = xchacha20poly1305(key, nonce);
    const ciphertext = cipher.encrypt(utf8ToBytes(plaintext));

    const output = new Uint8Array(1 + NONCE_LENGTH + ciphertext.length);
    output[0] = VERSION_BYTE;
    output.set(nonce, 1);
    output.set(ciphertext, 1 + NONCE_LENGTH);

    key.fill(0);

    return Buffer.from(output).toString('base64');
}

/**
 * Decrypts a TOTP deeplink payload using the current passcode.
 *
 * Verifies the Poly1305 authentication tag — decryption fails if the
 * ciphertext was tampered with or the wrong passcode is supplied.
 *
 * @param {string} ciphertextBase64 - Base64-encoded v1 wire format ciphertext.
 * @param {string} code - The TOTP passcode to derive the key from.
 * @returns {string} The decrypted plaintext.
 * @throws {Error} If the ciphertext is too short, has an unsupported version
 *   byte, or fails authentication (wrong code or tampered data).
 *
 * @example
 * const plaintext = decryptTOTP(encrypted, '4f2a8b1c9d3e7f0');
 */
export function decryptTOTP(ciphertextBase64, code) {
    if (typeof ciphertextBase64 !== 'string' || !ciphertextBase64) {
        throw new Error('Ciphertext must be a non-empty string');
    }
    if (typeof code !== 'string' || !code) {
        throw new Error('TOTP code must be a non-empty string');
    }

    const raw = Buffer.from(ciphertextBase64, 'base64');

    if (raw.length < MIN_CIPHERTEXT_LENGTH) {
        throw new Error('TOTP ciphertext too short');
    }

    if (raw[0] !== VERSION_BYTE) {
        throw new Error(
            `Unsupported TOTP crypto version: 0x${raw[0].toString(16).padStart(2, '0')}`
        );
    }

    const nonce = new Uint8Array(raw.subarray(1, 1 + NONCE_LENGTH));
    const ciphertext = new Uint8Array(raw.subarray(1 + NONCE_LENGTH));

    const key = deriveKey(code);

    let plaintextBytes;
    try {
        const cipher = xchacha20poly1305(key, nonce);
        plaintextBytes = cipher.decrypt(ciphertext);
    } finally {
        key.fill(0);
    }

    return bytesToUtf8(plaintextBytes);
}
