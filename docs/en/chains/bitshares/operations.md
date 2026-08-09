# BitShares Operations

Third-party applications request transactions using a single method: `injectedCall`. The transaction it carries may contain one or more of the BitShares operations listed below.

When a request arrives, BeetVault checks each operation in the transaction against the scope you configured. If none are permitted, the request is rejected without prompting. Otherwise the transaction is shown for approval.

The identifiers below are what appear in the scope selection list and in the approval prompt.

## Operations

Operations broadcast to the BitShares network.

| Action | Name | Description |
|--------|------|-------------|
| `transfer` | Transfer Request | Send assets from one account to another |
| `limit_order_create` | Limit order create request | An offer to sell an amount of an asset at a specified exchange rate by a certain time |
| `limit_order_cancel` | Limit order cancel request | Cancelling a limit order operation |
| `call_order_update` | Call order update request | Updating an existing call order |
| `account_create` | Account create request | Creating a new account |
| `account_update` | Account update request | This operation is used to update an existing account. It can be used to update the authorities, or adjust the options on the account. |
| `account_whitelist` | Account whitelist request | This operation is used to whitelist and blacklist accounts, primarily for transacting in whitelisted assets |
| `account_upgrade` | Account upgrade request | This operation is used to upgrade an account to a member, or renew its subscription. |
| `account_transfer` | Account transfer request | Transfers the account to another account while clearing the white list |
| `asset_create` | Asset create request | Creates an asset on the Bitshares blockchain |
| `asset_update` | Asset update request | Updates an asset's settings |
| `asset_update_bitasset` | Asset update bitasset request | Update created bitasset settings |
| `asset_update_feed_producers` | Asset update feed producers request | Update the list of approved feed producers for created bitasset |
| `asset_issue` | Asset issue request | Issue your created assets to individuals |
| `asset_reserve` | Asset reserve request | Reserve your created assets |
| `asset_fund_fee_pool` | Asset fund fee pool request | Fund the fee pool for your created asset |
| `asset_settle` | Asset settle request | Settle an asset in your portfolio |
| `asset_global_settle` | Asset global settle request | Globally settle one of your created bitassets |
| `asset_publish_feed` | Asset publish feed request | Publish a price feed for a bitasset |
| `witness_create` | Witness create request | Create a witness account |
| `witness_update` | Witness update request | Update your witness account |
| `proposal_create` | Proposal create request | Create a blockchain operation proposal |
| `proposal_update` | Proposal update request | Update a blockchain operation proposal |
| `proposal_delete` | Proposal delete request | Delete a blockchain operation proposal |
| `withdraw_permission_create` | Withdraw permission create request | Create a withdraw permission |
| `withdraw_permission_update` | Withdraw permission update request | Update a withdraw permission |
| `withdraw_permission_claim` | Withdraw permission claim request | Claim from a withdraw permission |
| `withdraw_permission_delete` | Withdraw permission delete request | Delete a withdraw permission |
| `committee_member_create` | Committee member create request | Create a committee member account |
| `committee_member_update` | Committee member update request | Update your committee member account details |
| `committee_member_update_global_parameters` | Committee member update global parameters request | Publish your committee member stance on Bitshares blockchain global parameter values |
| `vesting_balance_create` | Vesting balance create request | Create a vesting balance |
| `vesting_balance_withdraw` | Vesting balance withdraw request | Withdraw from a vesting balance |
| `worker_create` | Worker create request | Create a worker proposal |
| `custom` | Custom request | Provides a generic way to add higher level protocols on top of witness consensus |
| `assert` | Assert request | Assert that some conditions are true. |
| `balance_claim` | Balance claim request | Claim from a balance |
| `override_transfer` | Override transfer request | Override a transfer operation |
| `transfer_to_blind` | Transfer to blind request | Transfer assets to a blind destination |
| `blind_transfer` | Blind transfer request | Transfer blind assets in a blind manner |
| `transfer_from_blind` | Transfer from blind request | Withdraw assets from a blind balance |
| `asset_claim_fees` | Asset claim fees request | Claim the fees from an asset |
| `bid_collateral` | Bid collateral request | Bid on a bitassets backing collateral when globally settled |
| `asset_claim_pool` | Asset claim pool request | Transfers BTS from the fee pool of a specified asset back to the issuer's balance |
| `asset_update_issuer` | Asset update issuer request | Update issuer of an asset to a new administrator account. |
| `htlc_create` | HTLC create request | Create a hash time locked contract (HTLC) operation |
| `htlc_redeem` | HTLC Redeem request | Redeem the contents of a HTLC operation |
| `htlc_extend` | HTLC Extend request | Extend the duration of an HTLC operation |
| `custom_authority_create` | Custom authority create request | Create a new custom authority. |
| `custom_authority_update` | Custom authority update request | Update a custom authority. |
| `custom_authority_delete` | Custom authority delete request | Delete a custom authority. |
| `ticket_create` | Ticket create request | Create a new ticket. |
| `ticket_update` | Ticket update request | Update an existing ticket. |
| `liquidity_pool_create` | Liquidity pool create request | Create a liquidity pool |
| `liquidity_pool_delete` | Liquidity pool delete request | Delete a liquidity pool |
| `liquidity_pool_deposit` | Liquidity pool deposit request | Deposit funds into a liquidity pool |
| `liquidity_pool_withdraw` | Liquidity pool withdraw request | Withdraw funds from a liquidity pool |
| `liquidity_pool_exchange` | Liquidity pool exchange request | Exchange with a liquidity pool. |
| `samet_fund_create` | SameT fund create request | Create a new SameT Fund. A SameT Fund is a fund which can be used by a borrower and have to be repaid in the same transaction. |
| `samet_fund_delete` | SameT fund delete request | Delete a SameT fund object. |
| `samet_fund_update` | SameT fund update request | Update a SameT fund object. |
| `samet_fund_borrow` | SameT fund borrow request | Borrow from a SameT fund. |
| `samt_fund_repay` | SameT fund repay request | Repay debt to a SameT fund. |
| `credit_offer_create` | Credit offer create request | Create a new credit offer. A credit offer is a fund that can be used by other accounts who provide certain collateral. |
| `credit_offer_delete` | Credit offer delete request | Delete a credit offer. |
| `credit_offer_update` | Credit offer update request | Update a credit offer |
| `credit_offer_accept` | Credit offer accept request | Accept a credit offer and create a credit deal. |
| `credit_deal_repay` | Credit deal repay request | Repay a credit deal. |
| `liquidity_pool_update_operation` | Liquidity pool update request | Update a liquidity pool |
| `credit_deal_update_operation` | Credit deal update request | Update a credit deal |
| `limit_order_update_operation` | Limit order update request | Update a limit order |

## Permission Scope

Each input method asks you to choose which operations it may authorise before it will process anything. You can permit everything, or select individual operations.

Your selection is remembered per chain, and applies to every transaction that input method receives.

> **Not an exhaustive list.** The operations above are those with descriptions available. The complete set your chain accepts is shown when configuring scope in the wallet.
