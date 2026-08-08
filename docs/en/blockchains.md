# Blockchains

BeetVault supports nine blockchains across three protocol families. Each has its own page covering technical specifications, network identifiers, block explorers, and any chain-specific behaviour.

## Supported Chains

| Blockchain | Symbol | Family | Testnet |
|------------|--------|--------|---------|
| [BitShares](./chains/bitshares/overview.md) | BTS | Graphene | Yes |
| [Vaulta](./chains/vaulta/overview.md) | A | Antelope | Yes |
| [WAX](./chains/wax/overview.md) | WAX | Antelope | Yes |
| [Telos](./chains/telos/overview.md) | TLOS | Antelope | Yes |
| [FIO](./chains/fio/overview.md) | FIO | Antelope | Yes |
| [Libre](./chains/libre/overview.md) | LIBRE | Antelope | Yes |
| [XPR Network](./chains/xpr-network/overview.md) | XPR | Antelope | Yes |
| [BEOS](./chains/beos/overview.md) | BEOS | Antelope | No |
| [Hive](./chains/hive/overview.md) | HIVE | Hive | No |

## Protocol Families

Chain family determines how transactions are structured and how BeetVault communicates with the network.

### Graphene

**BitShares.** WebSocket RPC transport, ~3 second blocks, and operations identified by numeric type. BitShares uses a separate memo key alongside its owner and active authorities.

### Antelope

**Vaulta, WAX, Telos, FIO, Libre, XPR Network, BEOS.** HTTP JSON-RPC transport, sub-second blocks, and actions identified by name. Accounts use human-readable names with hierarchical permissions, and resources are staked rather than paid per transaction.

### Hive

**Hive.** A Graphene-derived protocol with its own transaction format and a four-tier key hierarchy including a posting key for social operations.

## Testnets

Seven chains provide a test network for rehearsing transactions without risking real assets. **BEOS and Hive are mainnet-only** in BeetVault — transactions on those chains always involve real value.

Testnets use separate chain IDs, and in some cases separate block explorers. Each chain page lists both.

## Node Selection

BeetVault ships with multiple RPC endpoints per chain. Switch between them using the **Change node** entry in the main menu — useful if a node becomes slow or unreachable.
