# BEOS Operations

Third-party applications request transactions using a single method: `injectedCall`. The transaction it carries may contain one or more BEOS operations.

When a request arrives, BeetVault checks each operation in the transaction against the scope you configured. If none are permitted, the request is rejected without prompting. Otherwise the transaction is shown for approval.

## Operations

BEOS uses the standard Antelope operation set without chain-specific additions, so the operations available are the same as those documented for [Vaulta](../vaulta/operations.md).

This covers account management, resource allocation (CPU, NET, RAM), REX, staking, producer registration and voting, and the AtomicAssets NFT standards.

## Permission Scope

Each input method asks you to choose which operations it may authorise before it will process anything. You can permit everything, or select individual operations.

Your selection is remembered per chain, and applies to every transaction that input method receives.

> **Not an exhaustive list.** The Vaulta page documents the operations with descriptions available. The complete set BEOS accepts is shown when configuring scope in the wallet.

## Notes

BEOS has no testnet in BeetVault, so operations cannot be rehearsed before broadcasting. Review each approval prompt carefully — particularly for bridging operations, which move assets between chains and cannot be reversed.
