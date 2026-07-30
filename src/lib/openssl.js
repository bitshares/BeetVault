import crypto from "crypto";

/** Length of the salt in bytes (OpenSSL standard). */
const SALT_LENGTH = 8;

/**
 * Derives a key and IV from a password and salt using OpenSSL's EVP_BytesToKey algorithm.
 *
 * This is the key derivation function used by crypto-js AES and OpenSSL when encrypting
 * with a passphrase. It uses MD5 as the hash function with a single iteration.
 *
 * @param {Buffer} password - The password/passphrase as a UTF-8 Buffer.
 * @param {Buffer} salt - The 8-byte salt.
 * @returns {{ key: Buffer, iv: Buffer }} An object containing the 32-byte key and 16-byte IV.
 */
function evpBytesToKey(password, salt) {
    let d = Buffer.alloc(0);
    let dList = [];
    while (dList.length < 3) {
        const hash = crypto.createHash("md5");
        hash.update(Buffer.concat([d, password, salt]));
        d = hash.digest();
        dList.push(d);
    }
    const key = Buffer.concat([dList[0], dList[1]]);
    const iv = dList[2];
    return { key, iv };
}

/**
 * Encrypts plaintext using AES-256-CBC with OpenSSL-compatible key derivation.
 *
 * Produces a Base64-encoded string in the OpenSSL "Salted__" format:
 * `Base64("Salted__" + salt(8 bytes) + ciphertext)`
 *
 * This is fully compatible with crypto-js's `AES.encrypt(plaintext, passphrase).toString()`.
 *
 * @param {string} plaintext - The plaintext string to encrypt.
 * @param {string} passphrase - The passphrase used for key derivation.
 * @returns {string} Base64-encoded ciphertext in OpenSSL format.
 */
function encrypt(plaintext, passphrase) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const passwordBytes = Buffer.from(passphrase, "utf8");
    const { key, iv } = evpBytesToKey(passwordBytes, salt);

    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const ciphertext = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final()
    ]);

    const salted = Buffer.concat([
        Buffer.from("Salted__", "ascii"),
        salt,
        ciphertext
    ]);

    return salted.toString("base64");
}

/**
 * Decrypts ciphertext in OpenSSL "Salted__" format using AES-256-CBC.
 *
 * Accepts both Base64-encoded strings and raw binary data (Buffer, Uint8Array, ArrayBuffer).
 * This is fully compatible with crypto-js's `AES.decrypt(ciphertext, passphrase)`.
 *
 * @param {string|Buffer|Uint8Array|ArrayBuffer} ciphertextInput - The encrypted data, either as a Base64 string or raw bytes.
 * @param {string} passphrase - The passphrase used for key derivation.
 * @returns {string} The decrypted plaintext string.
 * @throws {Error} If the ciphertext is too short or not in OpenSSL format.
 * @throws {Error} If decryption fails (e.g., wrong passphrase or corrupted data).
 */
function decrypt(ciphertextInput, passphrase) {
    let ciphertextBytes;
    if (typeof ciphertextInput === "string") {
        ciphertextBytes = Buffer.from(ciphertextInput, "base64");
    } else if (Buffer.isBuffer(ciphertextInput)) {
        ciphertextBytes = ciphertextInput;
    } else if (ciphertextInput instanceof Uint8Array) {
        ciphertextBytes = Buffer.from(ciphertextInput);
    } else if (ciphertextInput instanceof ArrayBuffer) {
        ciphertextBytes = Buffer.from(ciphertextInput);
    } else {
        ciphertextBytes = Buffer.from(String(ciphertextInput), "base64");
    }

    if (ciphertextBytes.length < 16 + SALT_LENGTH) {
        throw new Error("Ciphertext too short");
    }

    const magic = ciphertextBytes.slice(0, 8).toString("ascii");
    if (magic !== "Salted__") {
        throw new Error("Invalid magic: not OpenSSL Salted__ format");
    }

    const salt = ciphertextBytes.slice(8, 16);
    const ciphertext = ciphertextBytes.slice(16);

    const passwordBytes = Buffer.from(passphrase, "utf8");
    const { key, iv } = evpBytesToKey(passwordBytes, salt);

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    const plaintextBytes = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
    ]);

    return plaintextBytes.toString("utf8");
}

export { encrypt, decrypt };
