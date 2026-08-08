# FIO Operations

Third-party applications request transactions using a single method: `injectedCall`. The transaction it carries may contain one or more of the FIO operations listed below.

When a request arrives, BeetVault checks each operation in the transaction against the scope you configured. If none are permitted, the request is rejected without prompting. Otherwise the transaction is shown for approval.

The identifiers below are what appear in the scope selection list and in the approval prompt.

## Operations

Operations broadcast to the FIO network.

| Action | Name | Description |
|--------|------|-------------|
| `regaddress` | Register FIO Address Request | Register a new FIO address |
| `renewaddress` | Renew FIO Address Request | Renew an existing FIO address |
| `regdomain` | Register FIO Domain Request | Register a new FIO domain |
| `renewdomain` | Renew FIO Domain Request | Renew an existing FIO domain |
| `addaddress` | Add FIO Address Link Request | Link a chain address to a FIO address |
| `remaddress` | Remove FIO Address Link Request | Remove a chain address link from a FIO address |
| `xferdomain` | Transfer FIO Domain Request | Transfer a FIO domain to a new owner |
| `xferaddress` | Transfer FIO Address Request | Transfer a FIO address to a new owner |
| `burnexpired` | Burn Expired FIO Request | Burn an expired FIO address or domain |
| `trnsfiopubky` | Transfer FIO Tokens Request | Transfer FIO tokens to a public key |
| `recordobt` | Record OBT Data Request | Record off-chain transaction data on the FIO chain |
| `newfundsreq` | Request FIO Funds Request | Request funds via FIO protocol |
| `stakefio` | Stake FIO Request | Stake FIO tokens |
| `unstakefio` | Unstake FIO Request | Unstake FIO tokens |
| `newfioacc` | Create FIO Account Request | Create a new FIO account |
| `regproducer` | Register FIO Producer Request | Register as an FIO block producer |
| `voteproducer` | Vote FIO Producers Request | Vote for FIO block producers |
| `listdomain` | List FIO Domain for Sale Request | List a FIO domain for sale on the marketplace |
| `buydomain` | Buy FIO Domain Request | Buy a FIO domain from the marketplace |
| `wraptokens` | Wrap Tokens to FIO Request | Wrap tokens from another chain to the FIO chain |
| `bpclaim` | Claim Block Producer Reward Request | Claim FIO block producer rewards |
| `setfeevote` | Set Fee Vote Request | Vote on FIO fee values |
| `transfer` | Transfer FIO Tokens Request | Transfer FIO tokens between accounts |

## Permission Scope

Each input method asks you to choose which operations it may authorise before it will process anything. You can permit everything, or select individual operations.

Your selection is remembered per chain, and applies to every transaction that input method receives.

> **Not an exhaustive list.** The operations above are those with descriptions available. The complete set your chain accepts is shown when configuring scope in the wallet.
