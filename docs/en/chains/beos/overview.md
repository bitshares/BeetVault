# BEOS

BEOS is an Antelope-based blockchain designed as a bridge between the BitShares and Antelope ecosystems. It allows assets to move between chains and provides a distribution mechanism in which participants earn BEOS by temporarily depositing assets onto the network.

BEOS occupies a smaller niche than the other supported chains and is primarily of interest to users already active in the BitShares ecosystem.

See [Operations](./operations.md) for the full list of actions BeetVault can broadcast on BEOS.

## Technical Specifications

| Property | Value |
|----------|-------|
| Framework | Antelope (formerly EOSIO) |
| Consensus | Delegated Proof-of-Stake (DPoS) |
| Block time | ~0.5 seconds |
| Core token | BEOS |
| Account model | Human-readable account names with hierarchical permissions |
| Focus | BitShares to Antelope asset bridging |
| Transport | HTTP JSON-RPC |

## Networks

| Network | Identifier | Symbol | Chain ID |
|---------|-----------|--------|----------|
| Mainnet | `BEOS` | BEOS | `cbef47b0b26d2b8407ec6a6f91284100ec32d288a39d4b4bbd49655f7c484112` |

> **No testnet.** BeetVault does not include a BEOS test network. All BEOS activity occurs on mainnet with real assets.

## Block Explorer

<ExternalLink hyperlink="https://explore.beos.world" text="BEOS Explorer" />

## Resources

<ExternalLink hyperlink="https://beos.world" text="Official website" />

## Notes

Because no testnet is configured, there is no way to rehearse a BEOS transaction before broadcasting it. Review operations especially carefully in the approval prompt.

Bridging operations move assets between chains and cannot be reversed once confirmed. Verify destination addresses on both sides before approving.
