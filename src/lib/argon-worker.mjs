/**
 * @file Argon2id key derivation worker thread.
 *
 * Runs Argon2id (RFC 9106) in a dedicated worker thread so the Electron main
 * process never blocks during the memory-hard derivation (64-512 MiB, <1-40s).
 *
 * The worker receives its input via workerData, derives the key synchronously,
 * posts the result back as a transferable ArrayBuffer, then exits cleanly.
 *
 * This file MUST have a .mjs extension because it uses ESM import syntax and
 * the project's package.json does not set "type": "module". Node.js loads
 * worker_threads files as CommonJS by default; the .mjs extension forces ESM
 * loading.
 *
 * @module argon-worker
 */

import { parentPort, workerData } from "worker_threads";
import { argon2id } from "@noble/hashes/argon2.js";
import { utf8ToBytes } from "@noble/ciphers/utils.js";

const { password, salt, params } = workerData;

try {
    const passwordBytes = typeof password === "string"
        ? utf8ToBytes(password)
        : new Uint8Array(password);

    const saltBytes = new Uint8Array(salt);

    const key = argon2id(passwordBytes, saltBytes, params);

    if (!key || key.length !== 32) {
        throw new Error(`Argon2id produced invalid key: length=${key?.length}`);
    }

    const keyBuffer = new Uint8Array(key);
    parentPort.postMessage(
        { success: true, buffer: keyBuffer.buffer },
        [keyBuffer.buffer]
    );

    passwordBytes.fill(0);
    parentPort.close();
} catch (error) {
    console.error(`[ARGON_WORKER] Error: ${error.message}`);
    parentPort.postMessage({ success: false, error: error.message });
    parentPort.close();
}
