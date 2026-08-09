# BitShares

BitShares is a decentralised exchange and financial platform launched in 2014, built on the Graphene blockchain framework. It provides an on-chain order book, user-issued assets, and price-stable smart assets (bitAssets) backed by collateral in the core BTS token.

Governance operates through delegated proof-of-stake: stakeholders vote for witnesses who produce blocks, and for committee members who set network parameters such as fees. A worker proposal system funds development from the reserve pool.

See [Operations](./operations.md) for the full list of actions BeetVault can broadcast on BitShares.

## Technical Specifications

| Property | Value |
|----------|-------|
| Framework | Graphene |
| Consensus | Delegated Proof-of-Stake (DPoS) |
| Block time | ~3 seconds |
| Core token | BTS |
| Account model | Named accounts with separate owner, active, and memo key authorities |
| Transport | WebSocket RPC |
| Launched | 2014 |

## Networks

| Network | Identifier | Symbol | Chain ID |
|---------|-----------|--------|----------|
| Mainnet | `BTS` | BTS | `4018d7844c78f6a6c41c6a552b898022310fc5dec06da467ee7905a8dad512c8` |
| Testnet | `BTS_TEST` | TEST | `39f5e2ede1f8bc1a3a54a7914414e3779e33193f1f5693510e73cb7a87617447` |

## Block Explorer

<ExternalLink hyperlink="https://blocksights.info" text="BlockSights" />

Accounts, transactions, operations, assets, and markets. Testnet data is available on the same explorer via a `?network=testnet` parameter.

## Resources

<ExternalLink hyperlink="https://bitshares.org" text="Official website" />

<ExternalLink hyperlink="https://github.com/bitshares" text="GitHub organisation" />

## Notes

BitShares is the only chain BeetVault supports that uses a distinct **memo key**. This key is separate from the owner and active authorities and is used to encrypt transfer memos. BeetVault also prefers the memo key when signing messages, falling back to the active key when no memo key is available.

Because the mainnet and testnet share an explorer, links generated for testnet accounts include an explicit network parameter.
