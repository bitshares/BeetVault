# Telos

Telos is an Antelope-based blockchain launched in 2018, emphasising governance, decentralisation, and equitable token distribution. It launched without a public sale and caps the number of tokens any single account could hold at genesis, in a deliberate effort to avoid concentrated ownership.

The network operates delegated proof-of-stake with 21 active block producers and a large standby set. Telos also runs an EVM-compatible layer (tEVM) alongside the native Antelope environment, though BeetVault interacts with the native layer.

See [Operations](./operations.md) for the full list of actions BeetVault can broadcast on Telos.

## Technical Specifications

| Property | Value |
|----------|-------|
| Framework | Antelope (formerly EOSIO) |
| Consensus | Delegated Proof-of-Stake (DPoS) |
| Block time | ~0.5 seconds |
| Core token | TLOS |
| Account model | Human-readable account names with hierarchical permissions |
| Governance | Telos Decide on-chain voting framework |
| Transport | HTTP JSON-RPC |
| Launched | 2018 |

## Networks

| Network | Identifier | Symbol | Chain ID |
|---------|-----------|--------|----------|
| Mainnet | `TLOS` | TLOS | `4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11` |
| Testnet | `TLOSTEST` | TLOS | `1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f` |

## Block Explorer

<ExternalLink hyperlink="https://eosauthority.com/?network=telos" text="EOS Authority (Mainnet)" />

<ExternalLink hyperlink="https://explorer.antelope.io/network?network=telos" text="Antelope (Mainnet)" />

<ExternalLink hyperlink="https://eosauthority.com/?network=telostest" text="EOS Authority (Testnet)" />

<ExternalLink hyperlink="https://explorer.antelope.io/network?network=telos-testnet" text="Antelope (Testnet)" />

## Resources

<ExternalLink hyperlink="https://telos.net" text="Official website" />

<ExternalLink hyperlink="https://github.com/telosnetwork" text="GitHub organisation" />

## Notes

Telos supports both a native Antelope environment and an EVM layer. BeetVault operates on the native layer — EVM transactions require a separate Ethereum-compatible wallet.
