# Frequently Asked Questions

## General

### What is BeetVault?
BeetVault is a desktop cryptocurrency wallet for BitShares, Hive, Vaulta, and other Graphene/Antelope-based blockchains. It provides a secure interface for managing accounts, signing transactions, and interacting with decentralized applications.

### Is BeetVault free?
Yes, BeetVault is open-source software released under the MIT license. There are no fees charged by the wallet itself — you only pay the standard blockchain network fees for transactions.

### Which operating systems are supported?
BeetVault runs on Windows 10+, macOS 10.15+, and Linux (Ubuntu 18.04+, Fedora, and others via AppImage).

## Accounts & Keys

### How many accounts can I manage?
There is no hard limit. You can manage as many accounts across as many blockchains as you need.

### Can I import accounts from other wallets?
Yes, you can import accounts by providing the private keys (WIF format) during account creation. You can also restore from a BeetVault `.beet` backup file.

### What happens if I lose my password?
If you have your seed phrase, you can create a new wallet and restore your accounts. Without the seed phrase, the encrypted wallet data cannot be recovered — this is by design for security.

## Transactions

### Why did my transaction fail?
Transactions can fail for several reasons: insufficient balance, expired transaction, missing authority, or node connectivity issues. The error window will provide specific details.

### Can I cancel a submitted transaction?
No — once a transaction is broadcast to the network and included in a block, it is irreversible. Always verify transaction details in the modal window before approving.

### How long do transactions take?
Most transactions are included in the next block (1-3 seconds for Graphene chains, varies by network). During high network congestion, it may take longer.

## Security

### Are my private keys safe?
Private keys are encrypted with your password and stored locally. They are never transmitted to any server. The decryption happens in memory only when you unlock the wallet.

### Does BeetVault collect any data?
No. BeetVault does not collect, transmit, or store any personal data on external servers. All wallet data stays on your device.

## Technical

### Where is my wallet data stored?
Wallet data is stored in an IndexedDB database within BeetVault's application data directory. The data is encrypted at rest.

### Can I run multiple instances?
No — BeetVault uses a single-instance lock to prevent running multiple copies simultaneously, which could lead to data corruption.

### How do I update BeetVault?
Download the new version and install it over the existing installation. Your wallet data is preserved across updates.
