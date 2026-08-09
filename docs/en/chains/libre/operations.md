# Libre Operations

Third-party applications request transactions using a single method: `injectedCall`. The transaction it carries may contain one or more of the Libre operations listed below.

When a request arrives, BeetVault checks each operation in the transaction against the scope you configured. If none are permitted, the request is rejected without prompting. Otherwise the transaction is shown for approval.

The identifiers below are what appear in the scope selection list and in the approval prompt.

## Operations

Operations broadcast to the Libre network.

| Action | Name | Description |
|--------|------|-------------|
| `voteproducer` | Vote Libre Producer Request | Vote for Libre block producers |
| `regproducer` | Register Libre Producer Request | Register as a Libre block producer |
| `claimrewards` | Claim Libre Rewards Request | Claim Libre block producing rewards |
| `setalimits` | Set Account Limits Request | Set account resource limits on Libre |
| `stake` | Stake Libre Tokens Request | Stake Libre tokens via the stake contract |
| `unstake` | Unstake Libre Tokens Request | Unstake Libre tokens |
| `claim` | Claim Libre Staking Rewards Request | Claim Libre staking rewards |
| `transfer` | Transfer Tokens Request | Transfer tokens between accounts |

## Permission Scope

Each input method asks you to choose which operations it may authorise before it will process anything. You can permit everything, or select individual operations.

Your selection is remembered per chain, and applies to every transaction that input method receives.

> **Not an exhaustive list.** The operations above are those with descriptions available. The complete set your chain accepts is shown when configuring scope in the wallet.
