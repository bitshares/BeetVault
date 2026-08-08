# Vaulta

Vaulta is the blockchain formerly known as EOS. Launched in 2018 following one of the largest token distributions in the industry, the network rebranded to Vaulta in 2025 with a stated focus on Web3 banking and financial services. The underlying protocol remains Antelope (previously EOSIO).

The network uses delegated proof-of-stake with 21 active block producers elected by token holders. Resources — CPU, network bandwidth, and RAM — are allocated through staking and an on-chain RAM market rather than per-transaction fees, so end users can often transact without direct cost.

See [Operations](./operations.md) for the full list of actions BeetVault can broadcast on Vaulta.

## Technical Specifications

| Property | Value |
|----------|-------|
| Framework | Antelope (formerly EOSIO) |
| Consensus | Delegated Proof-of-Stake (DPoS) |
| Block time | ~0.5 seconds |
| Core token | A (formerly EOS) |
| Account model | Human-readable account names with hierarchical permissions |
| Resource model | Staked CPU/NET, purchased RAM |
| Transport | HTTP JSON-RPC |
| Launched | 2018 (rebranded 2025) |

## Networks

| Network | Identifier | Symbol | Chain ID |
|---------|-----------|--------|----------|
| Mainnet | `VAULTA` | A | `aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906` |
| Testnet | `VAULTATEST` | A | `73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d` |

The testnet is **Jungle 4**, a long-running community-operated Antelope test network.

## Block Explorers

<ExternalLink hyperlink="https://eosauthority.com" text="EOS Authority (mainnet)" />

<ExternalLink hyperlink="https://jungle4.cryptolions.io" text="Jungle 4 explorer (testnet)" />

## Resources

<ExternalLink hyperlink="https://vaulta.com" text="Official website" />

<ExternalLink hyperlink="https://github.com/AntelopeIO" text="Antelope GitHub organisation" />

## Notes

The rebrand from EOS to Vaulta changed the network name and core token symbol (EOS to A), but chain IDs and account data were unaffected. Documentation and tooling across the ecosystem may still refer to EOS.

Mainnet and testnet use different explorers, so account links differ between the two networks.
