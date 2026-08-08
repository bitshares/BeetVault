# XPR Network Operations

This page lists the operations BeetVault can process for XPR Network. Each corresponds to an action a third-party application may request, and every request must be approved before it is broadcast.

Operation names shown here are the identifiers that appear in permission scope selection and in the approval prompt.

## Wallet Requests

Requests handled by the wallet itself rather than broadcast to the chain.

| Action | Name | Description |
|--------|------|-------------|
| `getAccount` | Account Details Request | Asks your wallet for blockchain account details |
| `requestSignature` | Signature Request | Asks your wallet for blockchain signatures |
| `injectedCall` | Injected Call Request | Asks your wallet to handle an injected blockchain operation |

## Chain Operations

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

Before an input method can authorise anything, you choose which of these operations it may request. Anything outside that selection is rejected without prompting.

Scope is configured per input method on its respective page, and is remembered per chain.
