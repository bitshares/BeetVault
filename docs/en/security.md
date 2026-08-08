# Security

Security is a core priority in BeetVault. This document explains how your data is protected.

## How Your Keys Are Stored

Private keys are **never stored in plaintext**. When you create or import a wallet:

1. Your password is hashed using **Argon2id** (memory-hard key derivation)
2. The master key is expanded via **HKDF-SHA-256** into separate subkeys
3. Your wallet data is encrypted with **XChaCha20-Poly1305** (AEAD)
4. Encrypted data is stored in the local BeetDB (IndexedDB) database

## Seed Phrase

The seed phrase generated during wallet creation is the **master recovery mechanism**:

- It is derived from 128 bits of entropy
- It can restore all accounts in your wallet
- It is displayed **once** during creation — BeetVault cannot show it again

> **Critical:** If you lose your seed phrase, there is **no way** to recover your wallet. BeetVault has no "forgot password" mechanism by design.

## Session Management

When you unlock your wallet:

- The decrypted seed is held **in memory only** (never persisted to disk)
- A configurable inactivity timer (default: 5 minutes) locks the wallet automatically
- System sleep, shutdown, or lock-screen events force immediate logout
- Manual logout clears all in-memory secrets

## Encryption Systems

BeetVault uses two distinct encryption schemes, each matched to its threat model:

| Use case | Key derivation | Cipher | Rationale |
|----------|----------------|--------|-----------|
| Wallet data & backups | Argon2id (64–512 MiB) + HKDF-SHA-256 | XChaCha20-Poly1305 | Long-lived secrets — memory-hard KDF resists offline brute-force; HKDF enables efficient key hierarchy |
| TOTP deeplinks | SHA-256 | XChaCha20-Poly1305 | Transient payloads — passcode expires in 60s–10min, so speed matters more |

Using a memory-hard KDF for TOTP payloads would add seconds of compute for no security benefit, since the passcode is single-use and short-lived. Both schemes provide authenticated encryption, so tampering is always detected.

## Backup Security

Backup files (`.beet`) are:

- Encrypted with your wallet password
- Protected with authenticated encryption (XChaCha20-Poly1305)
- Verified against a remote signature to detect tampering before import

## Best Practices

1. **Use a strong, unique password** — at least 16 characters with mixed case, numbers, and symbols
2. **Store your seed phrase offline** — write it on paper or etch it on metal, never store digitally
3. **Set a short logout timeout** — especially on shared or portable devices
4. **Keep BeetVault updated** — security patches are released regularly
5. **Verify download sources** — only download BeetVault from official channels
