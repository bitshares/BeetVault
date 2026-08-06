export function createAtomicBeautify(namespace) {
    return {
        "atomicassets::init": (op) => ({
            title: `operations.injected.${namespace}.init.title`,
            opType: "init", method: "init", op, operation: op,
            rows: [],
        }),
        "atomicmarket::init": (op) => ({
            title: `operations.injected.${namespace}.init.title`,
            opType: "init", method: "init", op, operation: op,
            rows: [],
        }),
        "atomicassets::setversion": (op) => ({
            title: `operations.injected.${namespace}.setversion.title`,
            opType: "setversion", method: "setversion", op, operation: op,
            rows: [
                { key: "new_version", params: { new_version: op.data.new_version } },
            ],
        }),
        "atomicmarket::setversion": (op) => ({
            title: `operations.injected.${namespace}.setversion.title`,
            opType: "setversion", method: "setversion", op, operation: op,
            rows: [
                { key: "new_version", params: { new_version: op.data.new_version } },
            ],
        }),
        "atomicassets::addconftoken": (op) => ({
            title: `operations.injected.${namespace}.addconftoken.title`,
            opType: "addconftoken", method: "addconftoken", op, operation: op,
            rows: [
                { key: "token_symbol", params: { token_symbol: op.data.token_symbol } },
                { key: "token_contract", params: { token_contract: op.data.token_contract } },
            ],
        }),
        "atomicmarket::addconftoken": (op) => ({
            title: `operations.injected.${namespace}.addconftoken.title`,
            opType: "addconftoken", method: "addconftoken", op, operation: op,
            rows: [
                { key: "token_symbol", params: { token_symbol: op.data.token_symbol } },
                { key: "token_contract", params: { token_contract: op.data.token_contract } },
            ],
        }),
        "atomicassets::setmarketfee": (op) => ({
            title: `operations.injected.${namespace}.setmarketfee.title`,
            opType: "setmarketfee", method: "setmarketfee", op, operation: op,
            rows: [
                { key: "market_fee", params: { market_fee: op.data.market_fee } },
            ],
        }),
        createcol: (op) => ({
            title: `operations.injected.${namespace}.createcol.title`,
            opType: "createcol", method: "createcol", op, operation: op,
            rows: [
                { key: "author", params: { author: op.data.author } },
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "allow_notify", params: { allow_notify: op.data.allow_notify } },
                { key: "market_fee", params: { market_fee: op.data.market_fee } },
            ],
        }),
        setcoldata: (op) => ({
            title: `operations.injected.${namespace}.setcoldata.title`,
            opType: "setcoldata", method: "setcoldata", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "data", params: { data: JSON.stringify(op.data.data) } },
            ],
        }),
        addcolauth: (op) => ({
            title: `operations.injected.${namespace}.addcolauth.title`,
            opType: "addcolauth", method: "addcolauth", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "account_to_add", params: { account_to_add: op.data.account_to_add } },
            ],
        }),
        remcolauth: (op) => ({
            title: `operations.injected.${namespace}.remcolauth.title`,
            opType: "remcolauth", method: "remcolauth", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "account_to_remove", params: { account_to_remove: op.data.account_to_remove } },
            ],
        }),
        addnotifyacc: (op) => ({
            title: `operations.injected.${namespace}.addnotifyacc.title`,
            opType: "addnotifyacc", method: "addnotifyacc", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "account_to_add", params: { account_to_add: op.data.account_to_add } },
            ],
        }),
        remnotifyacc: (op) => ({
            title: `operations.injected.${namespace}.remnotifyacc.title`,
            opType: "remnotifyacc", method: "remnotifyacc", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "account_to_remove", params: { account_to_remove: op.data.account_to_remove } },
            ],
        }),
        forbidnotify: (op) => ({
            title: `operations.injected.${namespace}.forbidnotify.title`,
            opType: "forbidnotify", method: "forbidnotify", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "notify_forbidden", params: { notify_forbidden: op.data.notify_forbidden } },
            ],
        }),
        admincoledit: (op) => ({
            title: `operations.injected.${namespace}.admincoledit.title`,
            opType: "admincoledit", method: "admincoledit", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "data", params: { data: JSON.stringify(op.data.data) } },
            ],
        }),
        createschema: (op) => ({
            title: `operations.injected.${namespace}.createschema.title`,
            opType: "createschema", method: "createschema", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "schema_name", params: { schema_name: op.data.schema_name } },
                { key: "schema_format", params: { schema_format: JSON.stringify(op.data.schema_format) } },
            ],
        }),
        extendschema: (op) => ({
            title: `operations.injected.${namespace}.extendschema.title`,
            opType: "extendschema", method: "extendschema", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "schema_name", params: { schema_name: op.data.schema_name } },
                { key: "schema_format", params: { schema_format: JSON.stringify(op.data.schema_format) } },
            ],
        }),
        createtempl: (op) => ({
            title: `operations.injected.${namespace}.createtempl.title`,
            opType: "createtempl", method: "createtempl", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "schema_name", params: { schema_name: op.data.schema_name } },
                { key: "template_name", params: { template_name: op.data.template_name ?? "" } },
                { key: "transferable", params: { transferable: op.data.transferable } },
                { key: "burnable", params: { burnable: op.data.burnable } },
                { key: "max_supply", params: { max_supply: op.data.max_supply } },
            ],
        }),
        locktemplate: (op) => ({
            title: `operations.injected.${namespace}.locktemplate.title`,
            opType: "locktemplate", method: "locktemplate", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "template_id", params: { template_id: op.data.template_id } },
            ],
        }),
        mintasset: (op) => ({
            title: `operations.injected.${namespace}.mintasset.title`,
            opType: "mintasset", method: "mintasset", op, operation: op,
            rows: [
                { key: "authorized_minter", params: { authorized_minter: op.data.authorized_minter } },
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "schema_name", params: { schema_name: op.data.schema_name } },
                { key: "template_id", params: { template_id: op.data.template_id } },
                { key: "new_asset_owner", params: { new_asset_owner: op.data.new_asset_owner } },
            ],
        }),
        burnasset: (op) => ({
            title: `operations.injected.${namespace}.burnasset.title`,
            opType: "burnasset", method: "burnasset", op, operation: op,
            rows: [
                { key: "asset_owner", params: { asset_owner: op.data.asset_owner } },
                { key: "asset_id", params: { asset_id: op.data.asset_id } },
            ],
        }),
        setassetdata: (op) => ({
            title: `operations.injected.${namespace}.setassetdata.title`,
            opType: "setassetdata", method: "setassetdata", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "asset_id", params: { asset_id: op.data.asset_id } },
                { key: "new_data", params: { new_data: JSON.stringify(op.data.new_data) } },
            ],
        }),
        "atomicassets::transfer": (op) => ({
            title: `operations.injected.${namespace}.transfer.title`,
            opType: "transfer", method: "transfer", op, operation: op,
            rows: [
                { key: "from", params: { from: op.data.from } },
                { key: "to", params: { to: op.data.to } },
                { key: "asset_ids", params: { asset_ids: JSON.stringify(op.data.asset_ids) } },
                { key: "memo", params: { memo: op.data.memo ?? "" } },
            ],
        }),
        backasset: (op) => ({
            title: `operations.injected.${namespace}.backasset.title`,
            opType: "backasset", method: "backasset", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "asset_id", params: { asset_id: op.data.asset_id } },
            ],
        }),
        announcedepo: (op) => ({
            title: `operations.injected.${namespace}.announcedepo.title`,
            opType: "announcedepo", method: "announcedepo", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "asset_owner", params: { asset_owner: op.data.asset_owner } },
                { key: "asset_ids", params: { asset_ids: JSON.stringify(op.data.asset_ids) } },
            ],
        }),
        createoffer: (op) => ({
            title: `operations.injected.${namespace}.createoffer.title`,
            opType: "createoffer", method: "createoffer", op, operation: op,
            rows: [
                { key: "sender", params: { sender: op.data.sender } },
                { key: "recipient", params: { recipient: op.data.recipient } },
                { key: "sender_asset_ids", params: { sender_asset_ids: JSON.stringify(op.data.sender_asset_ids) } },
                { key: "recipient_asset_ids", params: { recipient_asset_ids: JSON.stringify(op.data.recipient_asset_ids) } },
                { key: "memo", params: { memo: op.data.memo ?? "" } },
            ],
        }),
        acceptoffer: (op) => ({
            title: `operations.injected.${namespace}.acceptoffer.title`,
            opType: "acceptoffer", method: "acceptoffer", op, operation: op,
            rows: [
                { key: "offer_id", params: { offer_id: op.data.offer_id } },
            ],
        }),
        canceloffer: (op) => ({
            title: `operations.injected.${namespace}.canceloffer.title`,
            opType: "canceloffer", method: "canceloffer", op, operation: op,
            rows: [
                { key: "offer_id", params: { offer_id: op.data.offer_id } },
            ],
        }),
        declineoffer: (op) => ({
            title: `operations.injected.${namespace}.declineoffer.title`,
            opType: "declineoffer", method: "declineoffer", op, operation: op,
            rows: [
                { key: "offer_id", params: { offer_id: op.data.offer_id } },
            ],
        }),
        payofferram: (op) => ({
            title: `operations.injected.${namespace}.payofferram.title`,
            opType: "payofferram", method: "payofferram", op, operation: op,
            rows: [
                { key: "payer", params: { payer: op.data.payer } },
                { key: "offer_id", params: { offer_id: op.data.offer_id } },
            ],
        }),
        "atomicassets::withdraw": (op) => ({
            title: `operations.injected.${namespace}.withdraw.title`,
            opType: "withdraw", method: "withdraw", op, operation: op,
            rows: [
                { key: "owner", params: { owner: op.data.owner } },
                { key: "token_to_receive", params: { token_to_receive: op.data.token_to_receive } },
                { key: "quantity", params: { quantity: op.data.quantity } },
            ],
        }),
        "atomicmarket::withdraw": (op) => ({
            title: `operations.injected.${namespace}.withdraw.title`,
            opType: "withdraw", method: "withdraw", op, operation: op,
            rows: [
                { key: "owner", params: { owner: op.data.owner } },
                { key: "token_to_withdraw", params: { token_to_withdraw: op.data.token_to_withdraw } },
            ],
        }),

        // --- AtomicMarket ---

        regmarket: (op) => ({
            title: `operations.injected.${namespace}.regmarket.title`,
            opType: "regmarket", method: "regmarket", op, operation: op,
            rows: [
                { key: "creator", params: { creator: op.data.creator } },
                { key: "marketplace_name", params: { marketplace_name: op.data.marketplace_name } },
            ],
        }),
        "atomicmarket::setmarketfee": (op) => ({
            title: `operations.injected.${namespace}.setmarketfee.title`,
            opType: "setmarketfee", method: "setmarketfee", op, operation: op,
            rows: [
                { key: "maker_market_fee", params: { maker_market_fee: op.data.maker_market_fee } },
                { key: "taker_market_fee", params: { taker_market_fee: op.data.taker_market_fee } },
            ],
        }),
        setminbidinc: (op) => ({
            title: `operations.injected.${namespace}.setminbidinc.title`,
            opType: "setminbidinc", method: "setminbidinc", op, operation: op,
            rows: [
                { key: "minimum_bid_increase", params: { minimum_bid_increase: op.data.minimum_bid_increase } },
            ],
        }),
        adddelphi: (op) => ({
            title: `operations.injected.${namespace}.adddelphi.title`,
            opType: "adddelphi", method: "adddelphi", op, operation: op,
            rows: [
                { key: "listing_symbol", params: { listing_symbol: op.data.listing_symbol } },
                { key: "settlement_symbol", params: { settlement_symbol: op.data.settlement_symbol } },
                { key: "delphi_pair_name", params: { delphi_pair_name: op.data.delphi_pair_name } },
                { key: "invert_delphi_pair", params: { invert_delphi_pair: op.data.invert_delphi_pair } },
            ],
        }),
        addafeectr: (op) => ({
            title: `operations.injected.${namespace}.addafeectr.title`,
            opType: "addafeectr", method: "addafeectr", op, operation: op,
            rows: [
                { key: "bonusfee_id", params: { bonusfee_id: op.data.bonusfee_id } },
                { key: "counter_name_to_add", params: { counter_name_to_add: op.data.counter_name_to_add } },
            ],
        }),
        addbonusfee: (op) => ({
            title: `operations.injected.${namespace}.addbonusfee.title`,
            opType: "addbonusfee", method: "addbonusfee", op, operation: op,
            rows: [
                { key: "fee", params: { fee: op.data.fee } },
                { key: "fee_recipient", params: { fee_recipient: op.data.fee_recipient } },
            ],
        }),
        delbonusfee: (op) => ({
            title: `operations.injected.${namespace}.delbonusfee.title`,
            opType: "delbonusfee", method: "delbonusfee", op, operation: op,
            rows: [
                { key: "bonusfee_id", params: { bonusfee_id: op.data.bonusfee_id } },
            ],
        }),
        stopbonusfee: (op) => ({
            title: `operations.injected.${namespace}.stopbonusfee.title`,
            opType: "stopbonusfee", method: "stopbonusfee", op, operation: op,
            rows: [
                { key: "bonusfee_id", params: { bonusfee_id: op.data.bonusfee_id } },
            ],
        }),
        convcounters: (op) => ({
            title: `operations.injected.${namespace}.convcounters.title`,
            opType: "convcounters", method: "convcounters", op, operation: op,
            rows: [],
        }),
        setdefmktcr: (op) => ({
            title: `operations.injected.${namespace}.setdefmktcr.title`,
            opType: "setdefmktcr", method: "setdefmktcr", op, operation: op,
            rows: [
                { key: "new_creator", params: { new_creator: op.data.new_creator } },
            ],
        }),
        migratebal: (op) => ({
            title: `operations.injected.${namespace}.migratebal.title`,
            opType: "migratebal", method: "migratebal", op, operation: op,
            rows: [
                { key: "from", params: { from: op.data.from } },
                { key: "to", params: { to: op.data.to } },
            ],
        }),
        announcesale: (op) => ({
            title: `operations.injected.${namespace}.announcesale.title`,
            opType: "announcesale", method: "announcesale", op, operation: op,
            rows: [
                { key: "seller", params: { seller: op.data.seller } },
                { key: "asset_ids", params: { asset_ids: JSON.stringify(op.data.asset_ids) } },
                { key: "listing_price", params: { listing_price: op.data.listing_price } },
                { key: "settlement_symbol", params: { settlement_symbol: op.data.settlement_symbol } },
                { key: "maker_marketplace", params: { maker_marketplace: op.data.maker_marketplace ?? "" } },
            ],
        }),
        cancelsale: (op) => ({
            title: `operations.injected.${namespace}.cancelsale.title`,
            opType: "cancelsale", method: "cancelsale", op, operation: op,
            rows: [
                { key: "sale_id", params: { sale_id: op.data.sale_id } },
            ],
        }),
        purchasesale: (op) => ({
            title: `operations.injected.${namespace}.purchasesale.title`,
            opType: "purchasesale", method: "purchasesale", op, operation: op,
            rows: [
                { key: "buyer", params: { buyer: op.data.buyer } },
                { key: "sale_id", params: { sale_id: op.data.sale_id } },
                { key: "intended_delphi_median", params: { intended_delphi_median: op.data.intended_delphi_median ?? "" } },
                { key: "taker_marketplace", params: { taker_marketplace: op.data.taker_marketplace ?? "" } },
            ],
        }),
        assertsale: (op) => ({
            title: `operations.injected.${namespace}.assertsale.title`,
            opType: "assertsale", method: "assertsale", op, operation: op,
            rows: [
                { key: "sale_id", params: { sale_id: op.data.sale_id } },
                { key: "asset_ids_to_assert", params: { asset_ids_to_assert: JSON.stringify(op.data.asset_ids_to_assert) } },
                { key: "listing_price_to_assert", params: { listing_price_to_assert: op.data.listing_price_to_assert } },
                { key: "settlement_symbol_to_assert", params: { settlement_symbol_to_assert: op.data.settlement_symbol_to_assert } },
            ],
        }),
        paysaleram: (op) => ({
            title: `operations.injected.${namespace}.paysaleram.title`,
            opType: "paysaleram", method: "paysaleram", op, operation: op,
            rows: [
                { key: "payer", params: { payer: op.data.payer } },
                { key: "sale_id", params: { sale_id: op.data.sale_id } },
            ],
        }),
        announceauct: (op) => ({
            title: `operations.injected.${namespace}.announceauct.title`,
            opType: "announceauct", method: "announceauct", op, operation: op,
            rows: [
                { key: "seller", params: { seller: op.data.seller } },
                { key: "asset_ids", params: { asset_ids: JSON.stringify(op.data.asset_ids) } },
                { key: "starting_bid", params: { starting_bid: op.data.starting_bid } },
                { key: "duration", params: { duration: op.data.duration } },
                { key: "maker_marketplace", params: { maker_marketplace: op.data.maker_marketplace ?? "" } },
            ],
        }),
        cancelauct: (op) => ({
            title: `operations.injected.${namespace}.cancelauct.title`,
            opType: "cancelauct", method: "cancelauct", op, operation: op,
            rows: [
                { key: "auction_id", params: { auction_id: op.data.auction_id } },
            ],
        }),
        auctionbid: (op) => ({
            title: `operations.injected.${namespace}.auctionbid.title`,
            opType: "auctionbid", method: "auctionbid", op, operation: op,
            rows: [
                { key: "bidder", params: { bidder: op.data.bidder } },
                { key: "auction_id", params: { auction_id: op.data.auction_id } },
                { key: "bid", params: { bid: op.data.bid } },
                { key: "taker_marketplace", params: { taker_marketplace: op.data.taker_marketplace ?? "" } },
            ],
        }),
        auctclaimbuy: (op) => ({
            title: `operations.injected.${namespace}.auctclaimbuy.title`,
            opType: "auctclaimbuy", method: "auctclaimbuy", op, operation: op,
            rows: [
                { key: "auction_id", params: { auction_id: op.data.auction_id } },
            ],
        }),
        auctclaimsel: (op) => ({
            title: `operations.injected.${namespace}.auctclaimsel.title`,
            opType: "auctclaimsel", method: "auctclaimsel", op, operation: op,
            rows: [
                { key: "auction_id", params: { auction_id: op.data.auction_id } },
            ],
        }),
        assertauct: (op) => ({
            title: `operations.injected.${namespace}.assertauct.title`,
            opType: "assertauct", method: "assertauct", op, operation: op,
            rows: [
                { key: "auction_id", params: { auction_id: op.data.auction_id } },
                { key: "asset_ids_to_assert", params: { asset_ids_to_assert: JSON.stringify(op.data.asset_ids_to_assert) } },
            ],
        }),
        payauctram: (op) => ({
            title: `operations.injected.${namespace}.payauctram.title`,
            opType: "payauctram", method: "payauctram", op, operation: op,
            rows: [
                { key: "payer", params: { payer: op.data.payer } },
                { key: "auction_id", params: { auction_id: op.data.auction_id } },
            ],
        }),
        createbuyo: (op) => ({
            title: `operations.injected.${namespace}.createbuyo.title`,
            opType: "createbuyo", method: "createbuyo", op, operation: op,
            rows: [
                { key: "sender", params: { sender: op.data.sender } },
                { key: "recipient", params: { recipient: op.data.recipient } },
                { key: "asset_ids", params: { asset_ids: JSON.stringify(op.data.asset_ids) } },
                { key: "price", params: { price: op.data.price } },
                { key: "memo", params: { memo: op.data.memo ?? "" } },
                { key: "maker_marketplace", params: { maker_marketplace: op.data.maker_marketplace ?? "" } },
            ],
        }),
        cancelbuyo: (op) => ({
            title: `operations.injected.${namespace}.cancelbuyo.title`,
            opType: "cancelbuyo", method: "cancelbuyo", op, operation: op,
            rows: [
                { key: "buyoffer_id", params: { buyoffer_id: op.data.buyoffer_id } },
            ],
        }),
        acceptbuyo: (op) => ({
            title: `operations.injected.${namespace}.acceptbuyo.title`,
            opType: "acceptbuyo", method: "acceptbuyo", op, operation: op,
            rows: [
                { key: "buyoffer_id", params: { buyoffer_id: op.data.buyoffer_id } },
                { key: "expected_asset_ids", params: { expected_asset_ids: JSON.stringify(op.data.expected_asset_ids) } },
                { key: "expected_price", params: { expected_price: op.data.expected_price } },
                { key: "taker_marketplace", params: { taker_marketplace: op.data.taker_marketplace ?? "" } },
            ],
        }),
        declinebuyo: (op) => ({
            title: `operations.injected.${namespace}.declinebuyo.title`,
            opType: "declinebuyo", method: "declinebuyo", op, operation: op,
            rows: [
                { key: "buyoffer_id", params: { buyoffer_id: op.data.buyoffer_id } },
                { key: "decline_memo", params: { decline_memo: op.data.decline_memo ?? "" } },
            ],
        }),
        paybuyoram: (op) => ({
            title: `operations.injected.${namespace}.paybuyoram.title`,
            opType: "paybuyoram", method: "paybuyoram", op, operation: op,
            rows: [
                { key: "payer", params: { payer: op.data.payer } },
                { key: "buyoffer_id", params: { buyoffer_id: op.data.buyoffer_id } },
            ],
        }),
        createtbuyo: (op) => ({
            title: `operations.injected.${namespace}.createtbuyo.title`,
            opType: "createtbuyo", method: "createtbuyo", op, operation: op,
            rows: [
                { key: "buyer", params: { buyer: op.data.buyer } },
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "template_id", params: { template_id: op.data.template_id } },
                { key: "price", params: { price: op.data.price } },
                { key: "maker_marketplace", params: { maker_marketplace: op.data.maker_marketplace ?? "" } },
            ],
        }),
        canceltbuyo: (op) => ({
            title: `operations.injected.${namespace}.canceltbuyo.title`,
            opType: "canceltbuyo", method: "canceltbuyo", op, operation: op,
            rows: [
                { key: "buyoffer_id", params: { buyoffer_id: op.data.buyoffer_id } },
            ],
        }),
        fulfilltbuyo: (op) => ({
            title: `operations.injected.${namespace}.fulfilltbuyo.title`,
            opType: "fulfilltbuyo", method: "fulfilltbuyo", op, operation: op,
            rows: [
                { key: "buyoffer_id", params: { buyoffer_id: op.data.buyoffer_id } },
                { key: "asset_id", params: { asset_id: op.data.asset_id } },
                { key: "expected_price", params: { expected_price: op.data.expected_price } },
                { key: "taker_marketplace", params: { taker_marketplace: op.data.taker_marketplace ?? "" } },
            ],
        }),
        setroyalconf: (op) => ({
            title: `operations.injected.${namespace}.setroyalconf.title`,
            opType: "setroyalconf", method: "setroyalconf", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "founders", params: { founders: JSON.stringify(op.data.founders) } },
                { key: "attribute_mode", params: { attribute_mode: op.data.attribute_mode } },
                { key: "split_founders", params: { split_founders: op.data.split_founders } },
                { key: "split_templates", params: { split_templates: op.data.split_templates } },
                { key: "split_attributes", params: { split_attributes: op.data.split_attributes } },
            ],
        }),
        delroyalconf: (op) => ({
            title: `operations.injected.${namespace}.delroyalconf.title`,
            opType: "delroyalconf", method: "delroyalconf", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
            ],
        }),
        settemplroy: (op) => ({
            title: `operations.injected.${namespace}.settemplroy.title`,
            opType: "settemplroy", method: "settemplroy", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "template_id", params: { template_id: op.data.template_id } },
                { key: "recipients", params: { recipients: JSON.stringify(op.data.recipients) } },
            ],
        }),
        deltemplroy: (op) => ({
            title: `operations.injected.${namespace}.deltemplroy.title`,
            opType: "deltemplroy", method: "deltemplroy", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "template_id", params: { template_id: op.data.template_id } },
            ],
        }),
        setattrroy: (op) => ({
            title: `operations.injected.${namespace}.setattrroy.title`,
            opType: "setattrroy", method: "setattrroy", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "source", params: { source: op.data.source } },
                { key: "field", params: { field: op.data.field } },
                { key: "value", params: { value: JSON.stringify(op.data.value) } },
                { key: "rule_weight", params: { rule_weight: op.data.rule_weight } },
                { key: "recipients", params: { recipients: JSON.stringify(op.data.recipients) } },
            ],
        }),
        delattrroy: (op) => ({
            title: `operations.injected.${namespace}.delattrroy.title`,
            opType: "delattrroy", method: "delattrroy", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "rule_id", params: { rule_id: op.data.rule_id } },
            ],
        }),
        lognewsale: (op) => ({
            title: `operations.injected.${namespace}.lognewsale.title`,
            opType: "lognewsale", method: "lognewsale", op, operation: op,
            rows: [
                { key: "sale_id", params: { sale_id: op.data.sale_id } },
            ],
        }),
        logsalestart: (op) => ({
            title: `operations.injected.${namespace}.logsalestart.title`,
            opType: "logsalestart", method: "logsalestart", op, operation: op,
            rows: [
                { key: "sale_id", params: { sale_id: op.data.sale_id } },
                { key: "offer_id", params: { offer_id: op.data.offer_id } },
            ],
        }),
        lognewauct: (op) => ({
            title: `operations.injected.${namespace}.lognewauct.title`,
            opType: "lognewauct", method: "lognewauct", op, operation: op,
            rows: [
                { key: "auction_id", params: { auction_id: op.data.auction_id } },
            ],
        }),
        logauctstart: (op) => ({
            title: `operations.injected.${namespace}.logauctstart.title`,
            opType: "logauctstart", method: "logauctstart", op, operation: op,
            rows: [
                { key: "auction_id", params: { auction_id: op.data.auction_id } },
            ],
        }),
        lognewbuyo: (op) => ({
            title: `operations.injected.${namespace}.lognewbuyo.title`,
            opType: "lognewbuyo", method: "lognewbuyo", op, operation: op,
            rows: [
                { key: "buyoffer_id", params: { buyoffer_id: op.data.buyoffer_id } },
            ],
        }),
        lognewtbuyo: (op) => ({
            title: `operations.injected.${namespace}.lognewtbuyo.title`,
            opType: "lognewtbuyo", method: "lognewtbuyo", op, operation: op,
            rows: [
                { key: "buyoffer_id", params: { buyoffer_id: op.data.buyoffer_id } },
            ],
        }),
        logroyfound: (op) => ({
            title: `operations.injected.${namespace}.logroyfound.title`,
            opType: "logroyfound", method: "logroyfound", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "asset_id", params: { asset_id: op.data.asset_id } },
                { key: "payouts", params: { payouts: JSON.stringify(op.data.payouts) } },
            ],
        }),
        logroytempl: (op) => ({
            title: `operations.injected.${namespace}.logroytempl.title`,
            opType: "logroytempl", method: "logroytempl", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "asset_id", params: { asset_id: op.data.asset_id } },
                { key: "template_id", params: { template_id: op.data.template_id } },
                { key: "payouts", params: { payouts: JSON.stringify(op.data.payouts) } },
            ],
        }),
        logroyattr: (op) => ({
            title: `operations.injected.${namespace}.logroyattr.title`,
            opType: "logroyattr", method: "logroyattr", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "asset_id", params: { asset_id: op.data.asset_id } },
                { key: "rule_id", params: { rule_id: op.data.rule_id } },
                { key: "payouts", params: { payouts: JSON.stringify(op.data.payouts) } },
            ],
        }),
        logroydust: (op) => ({
            title: `operations.injected.${namespace}.logroydust.title`,
            opType: "logroydust", method: "logroydust", op, operation: op,
            rows: [
                { key: "collection_name", params: { collection_name: op.data.collection_name } },
                { key: "collection_author", params: { collection_author: op.data.collection_author } },
                { key: "amount", params: { amount: op.data.amount } },
            ],
        }),
    };
}
