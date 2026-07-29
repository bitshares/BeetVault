import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { sha512 } from '@noble/hashes/sha512'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function hashPassword(password) {
  return Buffer.from(sha512(password)).toString('hex')
}
