# WAX Operations

This page lists the operations BeetVault can process for WAX. Each corresponds to an action a third-party application may request, and every request must be approved before it is broadcast.

Operation names shown here are the identifiers that appear in permission scope selection and in the approval prompt.

## Wallet Requests

Requests handled by the wallet itself rather than broadcast to the chain.

| Action | Name | Description |
|--------|------|-------------|
| `getAccount` | Account Details Request | Asks your wallet for blockchain account details |
| `requestSignature` | Signature Request | Asks your wallet for blockchain signatures |
| `injectedCall` | Injected Call Request | Asks your wallet to handle an injected blockchain operation |

## Chain Operations

Operations broadcast to the WAX network.

| Action | Name | Description |
|--------|------|-------------|
| `regproposer` | Register WPS Proposer Request | Register a WPS proposer account |
| `regproposal` | Register WPS Proposal Request | Register a new WPS proposal |
| `voteproposal` | Vote WPS Proposal Request | Vote on a WPS proposal |
| `claimfunds` | Claim WPS Funds Request | Claim funds from an approved WPS proposal |
| `voterclaim` | Claim WPS Voter Rewards Request | Claim WPS voter rewards |
| `voterclaimst` | Claim WPS Voter Staked Rewards Request | Claim WPS voter staked rewards |
| `awardgenesis` | Award Genesis Request | Award genesis tokens to an account |
| `claimgenesis` | Claim Genesis Request | Claim genesis tokens |

## NFT Operations

WAX supports the AtomicAssets and AtomicMarket standards for NFTs and NFT trading. These operations are available in addition to the chain operations above.

| Action | Name | Description |
|--------|------|-------------|
| `init` | Initialize Contract Request | Initialize the contract configuration |
| `setversion` | Set Contract Version Request | Set the contract version |
| `addconftoken` | Add Config Token Request | Add a token to the supported tokens list |
| `setmarketfee` | Set Market Fee Request | Set the collection market fee |
| `createcol` | Create NFT Collection Request | Create a new NFT collection |
| `setcoldata` | Set Collection Data Request | Edit collection data |
| `addcolauth` | Add Collection Auth Request | Add an authorized account to a collection |
| `remcolauth` | Remove Collection Auth Request | Remove an authorized account from a collection |
| `addnotifyacc` | Add Notify Account Request | Add a notification account to a collection |
| `remnotifyacc` | Remove Notify Account Request | Remove a notification account from a collection |
| `forbidnotify` | Toggle Notify Forbidden Request | Toggle the collection notification flag |
| `admincoledit` | Admin Edit Collection Request | Admin edit collection data |
| `createschema` | Create Schema Request | Create a new asset schema |
| `extendschema` | Extend Schema Request | Extend schema attributes |
| `createtempl` | Create Template Request | Create a new asset template |
| `locktemplate` | Lock Template Request | Lock a template from further modifications |
| `mintasset` | Mint NFT Asset Request | Mint a new NFT asset |
| `burnasset` | Burn NFT Asset Request | Burn an NFT asset |
| `setassetdata` | Set Asset Data Request | Set mutable asset data |
| `transfer` | Transfer NFT Request | Transfer NFT assets between accounts |
| `backasset` | Return Asset Request | Return an asset to the collection deposit |
| `announcedepo` | Announce Deposit Request | Announce a collection deposit |
| `createoffer` | Create NFT Offer Request | Create a new NFT offer |
| `acceptoffer` | Accept NFT Offer Request | Accept an NFT offer |
| `canceloffer` | Cancel NFT Offer Request | Cancel an NFT offer |
| `declineoffer` | Decline NFT Offer Request | Decline an NFT offer |
| `payofferram` | Pay Offer RAM Request | Pay for the RAM of an offer |
| `withdraw` | Withdraw NFT Request | Withdraw NFT assets to a token balance |
| `regmarket` | Register Marketplace Request | Register a new marketplace |
| `setminbidinc` | Set Minimum Bid Increase Request | Set the minimum auction bid increase |
| `adddelphi` | Add Delphi Pair Request | Add a Delphi oracle symbol pair |
| `addafeectr` | Add Fee Counter Request | Add a counter name to a bonus fee |
| `addbonusfee` | Add Bonus Fee Request | Add a new bonus fee |
| `delbonusfee` | Delete Bonus Fee Request | Delete a bonus fee |
| `stopbonusfee` | Stop Bonus Fee Request | Stop a bonus fee from applying to new listings |
| `convcounters` | Convert Counters Request | Convert deprecated config counters to the counters table |
| `setdefmktcr` | Set Default Marketplace Creator Request | Set the creator of the default marketplace |
| `migratebal` | Migrate Balances Request | Migrate accumulated balances between accounts |
| `announcesale` | Announce NFT Sale Request | Announce an NFT for sale |
| `cancelsale` | Cancel NFT Sale Request | Cancel an NFT sale listing |
| `purchasesale` | Purchase NFT Sale Request | Purchase an NFT from a sale |
| `assertsale` | Assert Sale Details Request | Assert sale details for verification |
| `paysaleram` | Pay Sale RAM Request | Pay for the RAM of a sale |
| `announceauct` | Announce NFT Auction Request | Announce an NFT auction |
| `cancelauct` | Cancel NFT Auction Request | Cancel an NFT auction |
| `auctionbid` | Bid on NFT Auction Request | Place a bid on an NFT auction |
| `auctclaimbuy` | Claim Auction as Buyer Request | Claim auction assets as the winning bidder |
| `auctclaimsel` | Claim Auction as Seller Request | Claim the final bid as the auction seller |
| `assertauct` | Assert Auction Details Request | Assert auction details for verification |
| `payauctram` | Pay Auction RAM Request | Pay for the RAM of an auction |
| `createbuyo` | Create NFT Buy Order Request | Create a new NFT buy order |
| `cancelbuyo` | Cancel Buy Offer Request | Cancel a buy offer |
| `acceptbuyo` | Accept Buy Offer Request | Accept a buy offer |
| `declinebuyo` | Decline Buy Offer Request | Decline a buy offer |
| `paybuyoram` | Pay Buy Offer RAM Request | Pay for the RAM of a buy offer |
| `createtbuyo` | Create Template Buy Offer Request | Create a buy offer for any asset of a template |
| `canceltbuyo` | Cancel Template Buy Offer Request | Cancel a template buy offer |
| `fulfilltbuyo` | Fulfill Template Buy Offer Request | Fulfill a template buy offer with an asset |
| `setroyalconf` | Set Royalty Config Request | Set a collection's royalty split configuration |
| `delroyalconf` | Delete Royalty Config Request | Delete a collection's royalty split configuration |
| `settemplroy` | Set Template Royalty Request | Set royalty recipients for a template |
| `deltemplroy` | Delete Template Royalty Request | Delete royalty recipients for a template |
| `setattrroy` | Set Attribute Royalty Request | Set an attribute royalty rule |
| `delattrroy` | Delete Attribute Royalty Request | Delete an attribute royalty rule |
| `lognewsale` | Log New Sale | Notification: A new sale was created |
| `logsalestart` | Log Sale Start | Notification: A sale became active |
| `lognewauct` | Log New Auction | Notification: A new auction was created |
| `logauctstart` | Log Auction Start | Notification: An auction became active |
| `lognewbuyo` | Log New Buy Offer | Notification: A new buy offer was created |
| `lognewtbuyo` | Log New Template Buy Offer | Notification: A new template buy offer was created |
| `logroyfound` | Log Founders Royalty | Notification: Founders royalty was distributed |
| `logroytempl` | Log Template Royalty | Notification: Template royalty was distributed |
| `logroyattr` | Log Attribute Royalty | Notification: Attribute royalty was distributed |
| `logroydust` | Log Royalty Dust | Notification: Royalty dust was sent to the collection author |

## Permission Scope

Before an input method can authorise anything, you choose which of these operations it may request. Anything outside that selection is rejected without prompting.

Scope is configured per input method on its respective page, and is remembered per chain.
