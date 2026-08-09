# Introduction

Interacting with any blockchain can be cumbersome if you are not familiar with how a blockchain works (private keys and signatures) and haven't dug through the plentiful features that each blockchain offers.

In general, every action on a blockchain requires a cryptographic signature of the required private keys for the action, and when you are using third party tools (especially closed source ones), the question about trust quickly arises ("Are they gonna steal my private keys?").

BeetVault aims to solve these trust concerns, whilst additionally facilitating private key management for the everyday Graphene and Antelope based blockchain user.

A general rule of thumb for the inexperienced: Never ever expose your private keys on the internet, and if that is ever needed, stay vigilant and do your due diligence.

# BeetVault - Your Graphene & Antelope blockchain companion

BeetVault is a locally installed stand-alone key and identity manager and signing app for Graphene and Antelope based blockchains, heavily influenced by the [Beet](https://github.com/bitshares/beet) and [Scatter](https://github.com/GetScatter) wallets.

BeetVault allows separate account management while being in full control of what data to expose to third parties.

Private keys are stored locally and encrypted, protected by a wallet master password.

All transactions suggested by third parties must be confirmed before being broadcast.

Telegram channel: https://t.me/beetapp

## Supported blockchains

| Blockchain | Symbol | Family | Testnet |
|------------|--------|--------|---------|
| BitShares | BTS | Graphene | Yes |
| Vaulta *(formerly EOS)* | A | Antelope | Yes |
| WAX | WAX | Antelope | Yes |
| Telos | TLOS | Antelope | Yes |
| FIO | FIO | Antelope | Yes |
| Libre | LIBRE | Antelope | Yes |
| XPR Network *(formerly Proton)* | XPR | Antelope | Yes |
| BEOS | BEOS | Antelope | No |
| Hive | HIVE | Hive | No |

Hive accounts support balance viewing and message signing, but not the deeplink, QR, or file based transaction methods described below.

## Features / User Guide

On first run, you will be prompted to create a new wallet to hold your keys. You pick a name for the wallet, enter your first account / address (in the case of BitShares that is the account name, active and memo private keys) and select a password to protect your wallet. You can add several accounts of different chains to one wallet.

Wallet data is encrypted using Argon2id for memory-hard key derivation, HKDF-SHA-256 for key separation, and XChaCha20-Poly1305 for authenticated encryption. The decrypted seed is held in memory only and is cleared on logout, on a configurable inactivity timeout, and when the system sleeps or locks.

The app will generate your public keys from those private keys and verify them against the ones stored on-chain for the account name / address you provided. Depending on the blockchain you are adding, different import options are available.

Once your keys and account are verified, you will be redirected to the dashboard view which currently displays your account details and balances.

### Requesting transactions from third party applications

BeetVault accepts transaction requests through four input methods. None of them require an external package or a running local server, and each request must be **explicitly** approved by the user inside the app before anything is broadcast.

- **TOTP deeplinks** (`beetvault://`) — the wallet generates a short-lived passcode which the requesting application uses to encrypt its payload. Encryption uses XChaCha20-Poly1305 with a SHA-256 derived key.
- **Raw deeplinks** (`rawbeetvault://`) — an unencrypted, URL-encoded transaction payload for direct signing.
- **QR codes** — scan with a camera, drag in an image, or upload a file. Useful for air-gapped or cross-device signing.
- **Local JSON files** — upload a transaction payload from disk. Unlike the other methods, this has no size limit, making it the right choice for large batches of operations.

The legacy `beeteos://` and `rawbeeteos://` schemes remain registered for backwards compatibility.

Before any of these can be used, the user configures which operation types a given input method is permitted to authorise, so the scope of what a third party can request is bounded.

### Other features

- **Message signing and verification** — prove account ownership off-chain, or verify a signature someone else produced.
- **Encrypted backups** — export a wallet to an encrypted `.beet` file and restore it on any BeetVault installation.
- **Multi-account management** — hold accounts from several chains in a single wallet and switch between them.
- **Node selection** — choose between the bundled RPC endpoints per chain, or point at your own.
- **Built-in documentation** — a dedicated documentation window covering each input method, every supported chain, and a developer integration guide. Available from the main menu, and translated across the wallet's supported locales.

## For end users

Releases are bundled as installers and are available at https://github.com/beetapp/beetvault/releases

    ATTENTION

BeetVault binaries will never be hosted anywhere but within GitHub releases. If you find BeetVault binaries anywhere else, it is likely a phishing attempt.

## For developers

BeetVault is an [electron-based app](https://www.electronjs.org) for [cross-platform compatibility](https://www.electron.build), utilising the [Vue 3 framework](https://blog.vuejs.org/posts/vue-3-as-the-new-default.html), [Tailwind CSS](https://tailwindcss.com) with [shadcn-vue](https://www.shadcn-vue.com) components, [Pinia](https://pinia.vuejs.org) for state management and [vue-i18n](https://vue-i18n.intlify.dev) for localisation.

To run BeetVault it's simply a case of

```bash
# clone
git clone https://github.com/beetapp/beetvault
cd beetvault

# install dependencies
npm install

# start BeetVault
npm run start
```

If you are on Linux you may need to run `sudo apt-get install libudev-dev` before starting BeetVault.

### Integrating your application

If you are building an application that needs BeetVault to sign transactions, the in-app **Developer Guide** (Documentation → Developer Guide) documents the request envelope format, the encoding pipeline for each input method, per-chain differences between Graphene and Antelope transactions, and the size limits that apply to deeplinks and QR codes.

The same content lives in this repository under `docs/en/`, and is bundled into the application at build time.

## Current Limitations

BeetVault currently only supports single-signature accounts (one private key to unlock the blockchain action), and depending on the blockchain different import options may be available.

Please open an issue to add support for your desired way.

## Encountered an issue? Want a new feature?

Open a [new issue](https://github.com/beetapp/beetvault/issues/) on github.

If you're skilled in Vue, electron or even just want to help localize the wallet, then fork the repo, create a new branch for your idea/task and submit a pull request for peer review.
