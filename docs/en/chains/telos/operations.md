# Telos Operations

This page lists the operations BeetVault can process for Telos. Each corresponds to an action a third-party application may request, and every request must be approved before it is broadcast.

Operation names shown here are the identifiers that appear in permission scope selection and in the approval prompt.

## Wallet Requests

Requests handled by the wallet itself rather than broadcast to the chain.

| Action | Name | Description |
|--------|------|-------------|
| `getAccount` | Account Details Request | Asks your wallet for blockchain account details |
| `requestSignature` | Signature Request | Asks your wallet for blockchain signatures |
| `injectedCall` | Injected Call Request | Asks your wallet to handle an injected blockchain operation |

## Chain Operations

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

Before an input method can authorise anything, you choose which of these operations it may request. Anything outside that selection is rejected without prompting.

Scope is configured per input method on its respective page, and is remembered per chain.
