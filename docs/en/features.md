# Features

BeetVault provides a comprehensive set of features for managing your blockchain assets.

## Transaction Operations

BeetVault supports signing and broadcasting transactions across all supported blockchains:

- **Transfers** — Send tokens to other accounts
- **Votes** — Cast governance votes for witnesses, committee members, or workers
- **Staking** — Stake tokens for power or voting weight
- **Custom Operations** — Sign arbitrary contract operations

## Multiple Authorization Methods

Interact with BeetVault in multiple ways:

### Deep Links
Open `beetvault://api/` protocol links from dApps to trigger transaction signing directly. Legacy `beeteos://api/` links are also supported.

Two deeplink types are available:
- **Standard deeplinks** (`beetvault://api/`): TOTP-encrypted, time-limited payloads
- **Raw deeplinks** (`rawbeetvault://api/`): Unencrypted payloads for direct signing

### QR Codes
Scan QR codes containing transaction payloads for air-gapped signing workflows.

### Injected Calls
Web applications can request transaction signing through BeetVault's injected provider interface.

### Raw Transactions
Manually construct and sign raw transaction JSON through the Local and Raw Deeplink screens.

> **Note for dApp developers:** Deeplinks are subject to a ~2,048 character browser URL limit, and QR codes are constrained by image data capacity and scan reliability. For large transactions, use the [JSON File](./deeplinks/json-file/overview.md) method, which has no size restriction.

> **Chain support:** All four input methods work on every supported chain, including Hive. See [Blockchains](./blockchains.md).

## Security Features

- **Local key storage** — Private keys never leave your device
- **Password encryption** — All wallet data is encrypted with your password using Argon2id + AES-256-GCM
- **Session timeout** — Automatic logout after configurable inactivity periods
- **Sandboxed execution** — Renderer process is isolated from system APIs

## Backup & Restore

- **Encrypted backups** — Export your entire wallet as an encrypted `.beet` file
- **Restore anywhere** — Import backups on any BeetVault instance with your password
- **Selective restore** — Choose which accounts to restore from a backup

## Multi-Account Management

- Manage accounts across multiple blockchains simultaneously
- Switch between accounts quickly from the dashboard
- Per-account permission management

## Network Configuration

- Custom node configuration per blockchain
- Switch between predefined and custom RPC endpoints
- Network health indicators
