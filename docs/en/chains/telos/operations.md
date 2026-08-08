# Telos Operations

Third-party applications request transactions using a single method: `injectedCall`. The transaction it carries may contain one or more of the Telos operations listed below.

When a request arrives, BeetVault checks each operation in the transaction against the scope you configured. If none are permitted, the request is rejected without prompting. Otherwise the transaction is shown for approval.

The identifiers below are what appear in the scope selection list and in the approval prompt.

## Operations

Operations broadcast to the Telos network.

| Action | Name | Description |
|--------|------|-------------|
| `newballot` | Create Decide Ballot Request | Create a new Telos Decide ballot |
| `castvote` | Cast Decide Vote Request | Cast a vote on a Telos Decide ballot |
| `openvoting` | Open Decide Voting Request | Open voting on a Telos Decide ballot |
| `closevoting` | Close Decide Voting Request | Close voting on a Telos Decide ballot |
| `cancelballot` | Cancel Decide Ballot Request | Cancel a Telos Decide ballot |
| `deleteballot` | Delete Decide Ballot Request | Delete a Telos Decide ballot |
| `regvoter` | Register Decide Voter Request | Register a Telos Decide voter |
| `stake` | Stake TLOS Request | Stake TLOS tokens |
| `unstake` | Unstake TLOS Request | Unstake TLOS tokens |
| `newtreasury` | Create Decide Treasury Request | Create a new Telos Decide treasury |
| `mint` | Mint Decide Tokens Request | Mint Telos Decide tokens |
| `burn` | Burn Decide Tokens Request | Burn Telos Decide tokens |
| `claimpayment` | Claim Decide Payment Request | Claim Telos Decide worker payment |
| `regcommittee` | Register Decide Committee Request | Register a Telos Decide committee |
| `raw` | Raw EVM Transaction Request | Submit a raw EVM transaction on Telos |
| `create` | Create EVM Account Request | Create a new Telos EVM account |
| `withdraw` | Withdraw from EVM Request | Withdraw from Telos EVM to native chain |
| `reclaim` | Reclaim Treasury Tokens Request | Reclaim treasury tokens from a voter back to the manager |

## Permission Scope

Each input method asks you to choose which operations it may authorise before it will process anything. You can permit everything, or select individual operations.

Your selection is remembered per chain, and applies to every transaction that input method receives.

> **Not an exhaustive list.** The operations above are those with descriptions available. The complete set your chain accepts is shown when configuring scope in the wallet.
