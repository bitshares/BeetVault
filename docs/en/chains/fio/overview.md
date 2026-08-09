# FIO

FIO (Foundation for Interwallet Operability) is an Antelope-based blockchain launched in 2020 that addresses a usability problem rather than a financial one: replacing long, error-prone cryptocurrency addresses with human-readable identifiers.

A FIO Handle takes the form `username@domain` and can be mapped to wallet addresses across many different blockchains. Instead of copying a raw address, a sender resolves the handle and the FIO protocol supplies the correct address for the target chain. The protocol also supports payment requests and encrypted metadata attached to transactions.

See [Operations](./operations.md) for the full list of actions BeetVault can broadcast on FIO.

## Technical Specifications

| Property | Value |
|----------|-------|
| Framework | Antelope (formerly EOSIO) |
| Consensus | Delegated Proof-of-Stake (DPoS) |
| Block time | ~0.5 seconds |
| Core token | FIO |
| Account model | Antelope accounts plus FIO Handles (`username@domain`) |
| Distinguishing feature | Cross-chain human-readable addressing |
| Transport | HTTP JSON-RPC |
| Launched | 2020 |

## Networks

| Network | Identifier | Symbol | Chain ID |
|---------|-----------|--------|----------|
| Mainnet | `FIO` | FIO | `21dcae42c0182200e93f954a074011f9048a7624c6fe81d3c9541a614a88bd1c` |
| Testnet | `FIOTEST` | FIO | `b20901380af44ef59c5918439a1f9a41d83669020319a80574b804a5f95cbd7e` |

## Block Explorers

<ExternalLink hyperlink="https://fio.bloks.io" text="FIO Bloks (mainnet)" />

<ExternalLink hyperlink="https://fio-test.bloks.io" text="FIO Bloks (testnet)" />

## Resources

<ExternalLink hyperlink="https://fio.net" text="Official website" />

<ExternalLink hyperlink="https://github.com/fioprotocol" text="GitHub organisation" />

## Notes

FIO Handles and domains are registered on-chain and renew periodically. Registration and renewal operations appear as standard chain actions in the approval prompt.

Because FIO is designed for cross-chain addressing, a FIO account may hold address mappings for chains that BeetVault does not itself support. Those mappings are data records on FIO — they do not grant BeetVault access to the referenced chains.
