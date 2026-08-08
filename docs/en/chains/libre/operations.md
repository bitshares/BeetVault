# Libre Operations

This page lists the operations BeetVault can process for Libre. Each corresponds to an action a third-party application may request, and every request must be approved before it is broadcast.

Operation names shown here are the identifiers that appear in permission scope selection and in the approval prompt.

## Wallet Requests

Requests handled by the wallet itself rather than broadcast to the chain.

| Action | Name | Description |
|--------|------|-------------|
| `getAccount` | Account Details Request | Asks your wallet for blockchain account details |
| `requestSignature` | Signature Request | Asks your wallet for blockchain signatures |
| `injectedCall` | Injected Call Request | Asks your wallet to handle an injected blockchain operation |

## Chain Operations

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

Before an input method can authorise anything, you choose which of these operations it may request. Anything outside that selection is rejected without prompting.

Scope is configured per input method on its respective page, and is remembered per chain.
