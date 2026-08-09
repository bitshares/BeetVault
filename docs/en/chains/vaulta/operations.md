# Vaulta Operations

Third-party applications request transactions using a single method: `injectedCall`. The transaction it carries may contain one or more of the Vaulta operations listed below.

When a request arrives, BeetVault checks each operation in the transaction against the scope you configured. If none are permitted, the request is rejected without prompting. Otherwise the transaction is shown for approval.

The identifiers below are what appear in the scope selection list and in the approval prompt.

## Operations

Operations broadcast to the Vaulta network.

| Action | Name | Description |
|--------|------|-------------|
| `setalimits` | Set account limits request | Setting account resource limits operation |
| `setacctram` | Set account RAM limits request | Setting account RAM limits operation |
| `setacctnet` | Set account NET limits request | Setting account NET limits operation |
| `setacctcpu` | Set account CPU limits request | Setting account CPU limits operation |
| `activate` | Activate protocol feature request | Activating protocol feature operation |
| `delegatebw` | Delegate bandwidth request | Delegating bandwidth operation |
| `setrex` | Set REX balance request | Setting REX balance operation |
| `deposit` | Deposit to REX fund request | Depositing to REX fund operation |
| `buyrex` | Buy REX request | Buying REX operation |
| `unstaketorex` | Unstake to REX request | Unstaking to REX operation |
| `sellrex` | Sell REX request | Selling REX operation |
| `cnclrexorder` | Cancel REX order request | Cancelling REX order operation |
| `rentcpu` | Rent CPU request | Renting CPU operation |
| `rentnet` | Rent NET request | Renting NET operation |
| `fundcpuloan` | Fund CPU Loan request | Funding CPU Loan operation |
| `fundnetloan` | Fund NET Loan request | Funding NET Loan operation |
| `defcpuloan` | Defund CPU Loan request | Defunding CPU Loan operation |
| `defnetloan` | Defund NET Loan request | Defunding NET Loan operation |
| `updaterex` | Update REX request | Updating REX operation |
| `rexexec` | Execute REX request | Executing REX operation |
| `consolidate` | Consolidate REX request | Consolidating REX operation |
| `mvtosavings` | Move REX to Savings Request | Moving REX to savings operation |
| `mvfrsavings` | Move REX from Savings Request | Moving REX from savings operation |
| `closerex` | Close REX Request | Closing REX operation |
| `undelegatebw` | Undelegate Bandwidth Request | Undelegating Bandwidth operation |
| `buyram` | Buy RAM Request | Buying RAM operation |
| `buyrambytes` | Buy RAM Bytes Request | Buying RAM Bytes operation |
| `sellram` | Sell RAM Request | Selling RAM operation |
| `refund` | Refund Request | Refund operation |
| `regproducer` | Register Producer Request | Registering Producer operation |
| `unregprod` | Unregister Producer Request | Unregistering Producer operation |
| `setram` | Set RAM Request | Setting RAM operation |
| `setramrate` | Set RAM Rate Request | Setting RAM Rate operation |
| `voteproducer` | Vote Producer Request | Voting Producer operation |
| `regproxy` | Register Proxy Request | Registering Proxy operation |
| `setparams` | Set Parameters Request | Setting Parameters operation |
| `claimrewards` | Claim Rewards Request | Claiming Rewards operation |
| `setpriv` | Set Privilege Request | Setting Privilege operation |
| `rmvproducer` | Remove Producer Request | Removing Producer operation |
| `updtrevision` | Update Revision Request | Updating Revision operation |
| `bidname` | Bid Name Request | Bidding Name operation |
| `bidrefund` | Bid Refund Request | Refunding Bid operation |
| `ramtransfer` | RAM Transfer Request | Transferring RAM operation |

## Permission Scope

Each input method asks you to choose which operations it may authorise before it will process anything. You can permit everything, or select individual operations.

Your selection is remembered per chain, and applies to every transaction that input method receives.

> **Not an exhaustive list.** The operations above are those with descriptions available. The complete set your chain accepts is shown when configuring scope in the wallet.
