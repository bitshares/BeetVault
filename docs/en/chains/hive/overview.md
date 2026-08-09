# Hive

Hive is a delegated proof-of-stake blockchain launched in 2020 as a community-led fork of Steem. It is built around social media and content publishing: posts, comments, and votes are stored on-chain, and authors earn rewards from an inflation pool distributed according to stake-weighted voting.

The ecosystem includes blogging front-ends, games, and marketplaces built directly on the chain. Governance runs through elected witnesses who produce blocks in rotation, with stakeholders voting using vested stake (Hive Power).

See [Operations](./operations.md) for the full list of actions BeetVault can broadcast on Hive.

## Technical Specifications

| Property | Value |
|----------|-------|
| Framework | Graphene-derived (Hive-specific) |
| Consensus | Delegated Proof-of-Stake (DPoS) |
| Block time | ~3 seconds |
| Core tokens | HIVE, HBD (Hive Backed Dollar) |
| Account model | Named accounts with owner, active, posting, and memo key roles |
| Distinguishing feature | On-chain social content and rewards |
| Transport | HTTP JSON-RPC |
| Launched | 2020 |

## Networks

| Network | Identifier | Symbol | Chain ID |
|---------|-----------|--------|----------|
| Mainnet | `HIVE` | HIVE | `beeab0de00000000000000000000000000000000000000000000000000000000` |

> **No testnet.** BeetVault does not include a Hive test network.

## Input Method Support

| Method | Supported |
|--------|-----------|
| TOTP Deeplink | Yes |
| Raw Deeplink | Yes |
| QR Code | Yes |
| JSON File | Yes |

### What Hive accounts can do

| Feature | Available |
|---------|-----------|
| View account balances | Yes |
| [Sign messages](../../sign-message.md) | Yes |
| [Verify messages](../../verify-message.md) | Yes |
| Deeplink / QR / file transactions | Yes |

## Block Explorer

<ExternalLink hyperlink="https://hiveblocks.com" text="HiveBlocks" />

## Resources

<ExternalLink hyperlink="https://hive.io" text="Official website" />

<ExternalLink hyperlink="https://github.com/openhive-network" text="GitHub organisation" />

## Notes

Hive uses a four-tier key hierarchy. The **posting** key authorises social actions such as posting and voting, while the **active** key authorises transfers and financial operations. Keeping these separate limits the damage if a posting key is exposed.

HBD is a stablecoin soft-pegged to the US dollar and backed by the HIVE supply through a conversion mechanism.
