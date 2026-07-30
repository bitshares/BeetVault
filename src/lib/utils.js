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
 * This function is used to derive a key for AES encryption. The hex-encoded
 * SHA-512 hash is passed to the OpenSSL key derivation function (EVP_BytesToKey)
 * during encryption/decryption.
 *
 * @param {string} password - The plaintext password to hash.
 * @returns {string} A 128-character hex string representing the SHA-512 hash.
 */
export function hashPassword(password) {
  return bytesToHex(sha512(new TextEncoder().encode(password)))
}
