# Hive Operations

This page lists the operations BeetVault can process for Hive. Each corresponds to an action a third-party application may request, and every request must be approved before it is broadcast.

Operation names shown here are the identifiers that appear in permission scope selection and in the approval prompt.

## Wallet Requests

Requests handled by the wallet itself rather than broadcast to the chain.

| Action | Name | Description |
|--------|------|-------------|
| `getAccount` | Account Details Request | Asks your wallet for blockchain account details |
| `requestSignature` | Signature Request | Asks your wallet for blockchain signatures |
| `injectedCall` | Injected Call Request | Asks your wallet to handle an injected blockchain operation |

## Chain Operations

Operations broadcast to the Hive network.

| Action | Name | Description |
|--------|------|-------------|
| `vote` | Vote Request | Cast a vote on a post or comment |
| `vote2` | Vote 2 Request | Cast a vote 2 on a post or comment |
| `comment` | Comment Request | Create a post or comment |
| `transfer` | Transfer Request | Send assets from one account to another |
| `transfer_to_vesting` | Transfer to Vesting Request | Transfer assets into vesting funds |
| `withdraw_vesting` | Withdraw Vesting Request | Set up a vesting withdrawal schedule |
| `limit_order_create` | Create Limit Order Request | Create a limit order on the market |
| `limit_order_create2` | Create Limit Order 2 Request | Create a limit order with an exchange rate on the market |
| `limit_order_cancel` | Cancel Limit Order Request | Cancel an existing limit order |
| `feed_publish` | Publish Feed Request | Publish a price feed as a witness |
| `convert` | Convert Request | Convert HIVE to HBD or vice versa |
| `collateralized_convert` | Collateralized Convert Request | Convert with collateral HIVE to HBD |
| `account_create` | Create Account Request | Create a new blockchain account |
| `create_claimed_account` | Create Claimed Account Request | Create a new account from a previously claimed one |
| `account_update` | Update Account Request | Update account keys or metadata |
| `account_update2` | Update Account 2 Request | Update account keys and metadata |
| `witness_update` | Update Witness Request | Update witness configuration |
| `witness_set_properties` | Set Witness Properties Request | Set witness properties |
| `account_witness_vote` | Vote for Witness Request | Vote for or against a witness |
| `account_witness_proxy` | Proxy Witness Vote Request | Set a proxy for your witness votes |
| `delete_comment` | Delete Comment Request | Delete a post or comment |
| `custom_json` | Custom JSON Request | Submit a custom JSON operation |
| `comment_options` | Comment Options Request | Set options for a post or comment |
| `set_withdraw_vesting_route` | Set Withdraw Vesting Route Request | Set up a vesting withdrawal route allocation |
| `claim_reward_balance` | Claim Reward Balance Request | Claim accrued rewards |
| `delegate_vesting_shares` | Delegate Vesting Shares Request | Delegate vesting shares to another account |
| `recover_account` | Recover Account Request | Recover a stolen or compromised account |
| `request_account_recovery` | Request Account Recovery Request | Request recovery of an account as a recovery account |
| `change_recovery_account` | Change Recovery Account Request | Change the recovery account of an account |
| `transfer_to_savings` | Transfer to Savings Request | Transfer assets into savings |
| `transfer_from_savings` | Transfer from Savings Request | Request a transfer out of savings |
| `cancel_transfer_from_savings` | Cancel Transfer from Savings Request | Cancel a pending transfer from savings |
| `decline_voting_rights` | Decline Voting Rights Request | Decline voting rights permanently |
| `claim_account` | Claim Account Request | Claim a new account creation |
| `escrow_transfer` | Escrow Transfer Request | Set up an escrow transfer between accounts |
| `escrow_dispute` | Escrow Dispute Request | Raise a dispute on an escrow transfer |
| `escrow_release` | Escrow Release Request | Release funds from an escrow transfer |
| `escrow_approve` | Escrow Approve Request | Approve an escrow transfer |
| `create_proposal` | Create Proposal Request | Create a governance proposal |
| `update_proposal_votes` | Update Proposal Votes Request | Vote for or against proposals |
| `remove_proposal` | Remove Proposal Request | Remove one or more proposals |
| `update_proposal` | Update Proposal Request | Update an existing proposal |
| `recurrent_transfer` | Recurrent Transfer Request | Set up a recurrent transfer schedule |
| `custom_binary` | Custom Binary Request | Submit a custom binary operation |
| `custom` | Custom Operation Request | Submit a custom operation |
| `prove_authority` | Prove Authority Request | Prove ownership of an account authority |

## Permission Scope

Before an input method can authorise anything, you choose which of these operations it may request. Anything outside that selection is rejected without prompting.

Scope is configured per input method on its respective page, and is remembered per chain.
