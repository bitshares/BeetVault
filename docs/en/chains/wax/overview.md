# WAX

WAX (Worldwide Asset eXchange) is an Antelope-based blockchain launched in 2019, purpose-built for NFTs, digital collectibles, and blockchain gaming. It hosts a large share of on-chain gaming activity and provides native tooling for NFT creation and trading through the AtomicAssets standard.

Block production uses delegated proof-of-stake with 21 elected guilds. WAX adds a staking-based rewards mechanism that distributes inflation to voters and guilds, and offers fee-free transactions for end users through resource staking.

See [Operations](./operations.md) for the full list of actions BeetVault can broadcast on WAX.

## Technical Specifications

| Property | Value |
|----------|-------|
| Framework | Antelope (formerly EOSIO) |
| Consensus | Delegated Proof-of-Stake (DPoS) |
| Block time | ~0.5 seconds |
| Core token | WAX (WAXP) |
| Account model | Human-readable account names with hierarchical permissions |
| Notable standard | AtomicAssets (NFTs) |
| Transport | HTTP JSON-RPC |
| Launched | 2019 |

## Networks

| Network | Identifier | Symbol | Chain ID |
|---------|-----------|--------|----------|
| Mainnet | `WAX` | WAX | `1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4` |
| Testnet | `WAXTEST` | WAX | `f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12` |

## Block Explorer

<ExternalLink hyperlink="https://eosauthority.com/?network=wax" text="EOS Authority (Mainnet)" />

<ExternalLink hyperlink="https://explorer.antelope.io/network?network=wax" text="Antelope (Mainnet)" />

<ExternalLink hyperlink="https://eosauthority.com/?network=waxtest" text="EOS Authority (Testnet)" />

## Resources

<ExternalLink hyperlink="https://wax.io" text="Official website" />

<ExternalLink hyperlink="https://github.com/worldwide-asset-exchange" text="GitHub organisation" />

## Notes

WAX accounts follow the standard Antelope 12-character naming rules. Because much WAX activity involves NFTs, transactions frequently contain `atomicassets` contract actions — review these carefully in the approval prompt, as NFT transfers are irreversible.
