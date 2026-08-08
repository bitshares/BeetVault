# FIO Operations

This page lists the operations BeetVault can process for FIO. Each corresponds to an action a third-party application may request, and every request must be approved before it is broadcast.

Operation names shown here are the identifiers that appear in permission scope selection and in the approval prompt.

## Wallet Requests

Requests handled by the wallet itself rather than broadcast to the chain.

| Action | Name | Description |
|--------|------|-------------|
| `getAccount` | Account Details Request | Asks your wallet for blockchain account details |
| `requestSignature` | Signature Request | Asks your wallet for blockchain signatures |
| `injectedCall` | Injected Call Request | Asks your wallet to handle an injected blockchain operation |

## Chain Operations

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

Before an input method can authorise anything, you choose which of these operations it may request. Anything outside that selection is rejected without prompting.

Scope is configured per input method on its respective page, and is remembered per chain.
