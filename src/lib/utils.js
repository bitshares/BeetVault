import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { sha512 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'

/**
 * Merges class names with Tailwind CSS conflict resolution.
 *
 * @param {...(string|undefined|null|boolean|object)} inputs - Class name values to merge.
 * @returns {string} The merged class string with Tailwind conflicts resolved.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Hashes a password using SHA-512 and returns the hex-encoded digest.
 *
 * Used as an IPC obfuscation layer: the renderer sends this hash to the main
 * process, which then uses it as the passphrase for Argon2id key derivation.
 * The plaintext password never crosses the IPC boundary.
 *
 * @param {string} password - The plaintext password to hash.
 * @returns {string} A 128-character hex string representing the SHA-512 hash.
 */
export function hashPassword(password) {
  return bytesToHex(sha512(new TextEncoder().encode(password)))
}

/**
 * Serializes an error object for safe transmission over IPC.
 *
 * Error objects do not serialize correctly via Electron's structured clone
 * algorithm — `message`, `stack`, and custom properties are dropped. This
 * helper extracts the relevant fields into a plain object.
 *
 * @param {Error|string|*} error - The error to serialize.
 * @returns {{ message: string, name?: string, stack?: string, code?: * }} A plain object.
 */
export function serializeError(error) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
    };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
}
