# Libre

Libre is an Antelope-based blockchain launched in 2022, focused on Bitcoin-adjacent financial applications. It provides wrapped Bitcoin (pBTC), a Bitcoin-backed stablecoin, and lending products, positioning itself as a settlement and DeFi layer that complements Bitcoin rather than competing with it.

The chain runs delegated proof-of-stake with elected block producers, and is governed by the Libre DAO, whose token holders vote on protocol parameters and treasury allocation.

See [Operations](./operations.md) for the full list of actions BeetVault can broadcast on Libre.

## Technical Specifications

| Property | Value |
|----------|-------|
| Framework | Antelope (formerly EOSIO) |
| Consensus | Delegated Proof-of-Stake (DPoS) |
| Block time | ~0.5 seconds |
| Core token | LIBRE |
| Account model | Human-readable account names with hierarchical permissions |
| Focus | Bitcoin-backed DeFi and settlement |
| Transport | HTTP JSON-RPC |
| Launched | 2022 |

## Networks

| Network | Identifier | Symbol | Chain ID |
|---------|-----------|--------|----------|
| Mainnet | `LIBRE` | LIBRE | `38b1d7815474d0c60683ecbea321d723e83f5da6ae5f1c1f9fecc69d9ba96465` |
| Testnet | `LIBRETEST` | LIBRE | `b64646740308df2ee06c6b72f34c0f7fa066d940e831f752db2006fcc2b78dee` |

## Block Explorers

<ExternalLink hyperlink="https://www.libreblocks.io" text="LibreBlocks (mainnet)" />

<ExternalLink hyperlink="https://tools.libre.org" text="Libre Tools (testnet)" />

## Resources

<ExternalLink hyperlink="https://libre.org" text="Official website" />

<ExternalLink hyperlink="https://github.com/Libre-Chain" text="GitHub organisation" />

## Notes

Operations involving wrapped Bitcoin interact with bridge contracts. As with any bridged asset, review the destination and amount carefully in the approval prompt before signing — bridge transactions are irreversible once broadcast.
