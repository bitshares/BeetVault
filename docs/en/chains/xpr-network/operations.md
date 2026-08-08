# XPR Network Operations

Third-party applications request transactions using a single method: `injectedCall`. The transaction it carries may contain one or more of the XPR Network operations listed below.

When a request arrives, BeetVault checks each operation in the transaction against the scope you configured. If none are permitted, the request is rejected without prompting. Otherwise the transaction is shown for approval.

The identifiers below are what appear in the scope selection list and in the approval prompt.

## Operations

Operations broadcast to the XPR Network network.

| Action | Name | Description |
|--------|------|-------------|
| `stakexpr` | Stake XPR Request | Stake XPR tokens |
| `unstakexpr` | Unstake XPR Request | Unstake XPR tokens |
| `updstakexpr` | Update XPR Stake Request | Update XPR staking amount |
| `refundxpr` | Refund XPR Stake Request | Refund XPR staked tokens |
| `voterclaim` | Claim XPR Voter Rewards Request | Claim XPR voter rewards |
| `voterclaimst` | Claim XPR Voter Staked Rewards Request | Claim XPR voter staked rewards |
| `setperm` | Set Account Permission Request | Set account permission on Proton/XPR |
| `setusername` | Set Proton Username Request | Set a Proton/XPR username |
| `userverify` | Verify Proton User Request | Verify a Proton/XPR user |
| `addkyc` | Add KYC Request | Add KYC information to an account |
| `updatekyc` | Update KYC Request | Update KYC information on an account |
| `removekyc` | Remove KYC Request | Remove KYC information from an account |
| `reg` | Register Proton Fund Request | Register with a Proton community fund |
| `claimreward` | Claim Proton Fund Reward Request | Claim reward from a Proton community fund |
| `process` | Process Proton Fund Request | Process a Proton community fund |
| `transfer` | Transfer Tokens Request | Transfer tokens between accounts |

## Permission Scope

Each input method asks you to choose which operations it may authorise before it will process anything. You can permit everything, or select individual operations.

Your selection is remembered per chain, and applies to every transaction that input method receives.

> **Not an exhaustive list.** The operations above are those with descriptions available. The complete set your chain accepts is shown when configuring scope in the wallet.
