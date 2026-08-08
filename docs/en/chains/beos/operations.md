# BEOS Operations

BEOS uses the standard Antelope operation set without chain-specific additions. The operations available are the same as those documented for [Vaulta](../vaulta/operations.md), since both run the base Antelope system contracts.

This covers account management, resource allocation (CPU, NET, RAM), staking, producer voting, and the AtomicAssets NFT standards.

## Wallet Requests

Requests handled by the wallet itself rather than broadcast to the chain.

| Action | Name | Description |
|--------|------|-------------|
| `getAccount` | Account Details Request | Asks your wallet for blockchain account details |
| `requestSignature` | Signature Request | Asks your wallet for blockchain signatures |
| `injectedCall` | Injected Call Request | Asks your wallet to sign and broadcast a transaction |

## Chain Operations

BEOS accepts the base Antelope system operations. See the [Vaulta operations page](../vaulta/operations.md) for the full list with descriptions — resource management, REX, staking, producer registration and voting, RAM trading, and account limits all apply identically.

## Permission Scope

Before an input method can authorise anything, you choose which of these operations it may request. Anything outside that selection is rejected without prompting.

Scope is configured per input method on its respective page, and is remembered per chain.

## Notes

BEOS has no testnet in BeetVault, so operations cannot be rehearsed before broadcasting. Review each approval prompt carefully — particularly for bridging operations, which move assets between chains and cannot be reversed.
