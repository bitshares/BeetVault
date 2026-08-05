import { createBeautify } from "../Antelope/beautify.js";

const baseBeautify = createBeautify("WAX");

const handlers = {
    regproposer: (op) => ({
        title: "operations.injected.WAX.regproposer.title",
        opType: "regproposer", method: "regproposer", op, operation: op,
        rows: [
            { key: "proposer", params: { proposer: op.data.proposer } },
            { key: "proposer_key", params: { proposer_key: op.data.proposer_key } },
        ],
    }),
    regproposal: (op) => ({
        title: "operations.injected.WAX.regproposal.title",
        opType: "regproposal", method: "regproposal", op, operation: op,
        rows: [
            { key: "proposer", params: { proposer: op.data.proposer } },
            { key: "proposal_name", params: { proposal_name: op.data.proposal_name } },
            { key: "title", params: { title: op.data.title } },
            { key: "pay_amount", params: { pay_amount: op.data.pay_amount } },
        ],
    }),
    voteproposal: (op) => ({
        title: "operations.injected.WAX.voteproposal.title",
        opType: "voteproposal", method: "voteproposal", op, operation: op,
        rows: [
            { key: "voter", params: { voter: op.data.voter } },
            { key: "proposal_name", params: { proposal_name: op.data.proposal_name } },
            { key: "vote", params: { vote: op.data.vote } },
        ],
    }),
    claimfunds: (op) => ({
        title: "operations.injected.WAX.claimfunds.title",
        opType: "claimfunds", method: "claimfunds", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
            { key: "proposal_name", params: { proposal_name: op.data.proposal_name } },
        ],
    }),
    voterclaim: (op) => ({
        title: "operations.injected.WAX.voterclaim.title",
        opType: "voterclaim", method: "voterclaim", op, operation: op,
        rows: [
            { key: "owner", params: { owner: op.data.owner } },
        ],
    }),
    voterclaimst: (op) => ({
        title: "operations.injected.WAX.voterclaimst.title",
        opType: "voterclaimst", method: "voterclaimst", op, operation: op,
        rows: [
            { key: "owner", params: { owner: op.data.owner } },
            { key: "amount", params: { amount: op.data.amount } },
        ],
    }),
    awardgenesis: (op) => ({
        title: "operations.injected.WAX.awardgenesis.title",
        opType: "awardgenesis", method: "awardgenesis", op, operation: op,
        rows: [
            { key: "receiver", params: { receiver: op.data.receiver } },
            { key: "amount", params: { amount: op.data.amount } },
        ],
    }),
    claimgenesis: (op) => ({
        title: "operations.injected.WAX.claimgenesis.title",
        opType: "claimgenesis", method: "claimgenesis", op, operation: op,
        rows: [
            { key: "receiver", params: { receiver: op.data.receiver } },
        ],
    }),
    "atomicassets::transfer": (op) => ({
        title: "operations.injected.WAX.transfer.title",
        opType: "transfer", method: "transfer", op, operation: op,
        rows: [
            { key: "from", params: { from: op.data.from } },
            { key: "to", params: { to: op.data.to } },
            { key: "asset_ids", params: { asset_ids: JSON.stringify(op.data.asset_ids) } },
            { key: "memo", params: { memo: op.data.memo ?? "" } },
        ],
    }),
    createcol: (op) => ({
        title: "operations.injected.WAX.createcol.title",
        opType: "createcol", method: "createcol", op, operation: op,
        rows: [
            { key: "author", params: { author: op.data.author } },
            { key: "collection_name", params: { collection_name: op.data.collection_name } },
            { key: "allow_notify", params: { allow_notify: op.data.allow_notify } },
            { key: "market_fee", params: { market_fee: op.data.market_fee } },
        ],
    }),
    mintasset: (op) => ({
        title: "operations.injected.WAX.mintasset.title",
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
        title: "operations.injected.WAX.burnasset.title",
        opType: "burnasset", method: "burnasset", op, operation: op,
        rows: [
            { key: "asset_owner", params: { asset_owner: op.data.asset_owner } },
            { key: "asset_id", params: { asset_id: op.data.asset_id } },
        ],
    }),
    createoffer: (op) => ({
        title: "operations.injected.WAX.createoffer.title",
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
        title: "operations.injected.WAX.acceptoffer.title",
        opType: "acceptoffer", method: "acceptoffer", op, operation: op,
        rows: [
            { key: "offer_id", params: { offer_id: op.data.offer_id } },
        ],
    }),
    announcesale: (op) => ({
        title: "operations.injected.WAX.announcesale.title",
        opType: "announcesale", method: "announcesale", op, operation: op,
        rows: [
            { key: "seller", params: { seller: op.data.seller } },
            { key: "asset_ids", params: { asset_ids: JSON.stringify(op.data.asset_ids) } },
            { key: "listing_price", params: { listing_price: op.data.listing_price } },
            { key: "settlement_symbol", params: { settlement_symbol: op.data.settlement_symbol } },
        ],
    }),
    purchasesale: (op) => ({
        title: "operations.injected.WAX.purchasesale.title",
        opType: "purchasesale", method: "purchasesale", op, operation: op,
        rows: [
            { key: "buyer", params: { buyer: op.data.buyer } },
            { key: "sale_id", params: { sale_id: op.data.sale_id } },
            { key: "taker_marketplace", params: { taker_marketplace: op.data.taker_marketplace } },
        ],
    }),
    announceauct: (op) => ({
        title: "operations.injected.WAX.announceauct.title",
        opType: "announceauct", method: "announceauct", op, operation: op,
        rows: [
            { key: "seller", params: { seller: op.data.seller } },
            { key: "asset_ids", params: { asset_ids: JSON.stringify(op.data.asset_ids) } },
            { key: "starting_bid", params: { starting_bid: op.data.starting_bid } },
            { key: "duration", params: { duration: op.data.duration } },
        ],
    }),
    auctionbid: (op) => ({
        title: "operations.injected.WAX.auctionbid.title",
        opType: "auctionbid", method: "auctionbid", op, operation: op,
        rows: [
            { key: "bidder", params: { bidder: op.data.bidder } },
            { key: "auction_id", params: { auction_id: op.data.auction_id } },
            { key: "bid", params: { bid: op.data.bid } },
        ],
    }),
    createbuyo: (op) => ({
        title: "operations.injected.WAX.createbuyo.title",
        opType: "createbuyo", method: "createbuyo", op, operation: op,
        rows: [
            { key: "buyer", params: { buyer: op.data.buyer } },
            { key: "recipient", params: { recipient: op.data.recipient } },
            { key: "asset_ids", params: { asset_ids: JSON.stringify(op.data.asset_ids) } },
            { key: "price", params: { price: op.data.price } },
            { key: "memo", params: { memo: op.data.memo ?? "" } },
        ],
    }),
    "atomicassets::withdraw": (op) => ({
        title: "operations.injected.WAX.withdraw.title",
        opType: "withdraw", method: "withdraw", op, operation: op,
        rows: [
            { key: "owner", params: { owner: op.data.owner } },
            { key: "token_to_receive", params: { token_to_receive: op.data.token_to_receive } },
            { key: "quantity", params: { quantity: op.data.quantity } },
        ],
    }),
    "atomicmarket::withdraw": (op) => ({
        title: "operations.injected.WAX.withdraw.title",
        opType: "withdraw", method: "withdraw", op, operation: op,
        rows: [
            { key: "owner", params: { owner: op.data.owner } },
            { key: "token_to_receive", params: { token_to_receive: op.data.token_to_receive } },
            { key: "quantity", params: { quantity: op.data.quantity } },
        ],
    }),
};

export default async function beautify(operation) {
    if (!operation || !operation.name) return;

    const qualifiedKey = `${operation.account}::${operation.name}`;
    if (handlers[qualifiedKey]) return handlers[qualifiedKey](operation);
    if (handlers[operation.name]) return handlers[operation.name](operation);

    return baseBeautify(operation);
}