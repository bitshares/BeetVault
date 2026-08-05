import { createBeautify } from "../Antelope/beautify.js";

const baseBeautify = createBeautify("TLOS");

const handlers = {
    newballot: (op) => ({
        title: "operations.injected.TLOS.newballot.title",
        opType: "newballot", method: "newballot", op, operation: op,
        rows: [
            { key: "title", params: { title: op.data.title } },
            { key: "description", params: { description: op.data.description } },
            { key: "treasury_symbol", params: { treasury_symbol: op.data.treasury_symbol } },
            { key: "category", params: { category: op.data.category } },
            { key: "voting_method", params: { voting_method: op.data.voting_method } },
            { key: "quorum", params: { quorum: op.data.quorum } },
            { key: "duration", params: { duration: op.data.duration } },
        ],
    }),
    castvote: (op) => ({
        title: "operations.injected.TLOS.castvote.title",
        opType: "castvote", method: "castvote", op, operation: op,
        rows: [
            { key: "voter", params: { voter: op.data.voter } },
            { key: "ballot_name", params: { ballot_name: op.data.ballot_name } },
            { key: "votes", params: { votes: JSON.stringify(op.data.votes) } },
        ],
    }),
    openvoting: (op) => ({
        title: "operations.injected.TLOS.openvoting.title",
        opType: "openvoting", method: "openvoting", op, operation: op,
        rows: [
            { key: "ballot_name", params: { ballot_name: op.data.ballot_name } },
        ],
    }),
    closevoting: (op) => ({
        title: "operations.injected.TLOS.closevoting.title",
        opType: "closevoting", method: "closevoting", op, operation: op,
        rows: [
            { key: "ballot_name", params: { ballot_name: op.data.ballot_name } },
        ],
    }),
    cancelballot: (op) => ({
        title: "operations.injected.TLOS.cancelballot.title",
        opType: "cancelballot", method: "cancelballot", op, operation: op,
        rows: [
            { key: "ballot_name", params: { ballot_name: op.data.ballot_name } },
        ],
    }),
    deleteballot: (op) => ({
        title: "operations.injected.TLOS.deleteballot.title",
        opType: "deleteballot", method: "deleteballot", op, operation: op,
        rows: [
            { key: "ballot_name", params: { ballot_name: op.data.ballot_name } },
        ],
    }),
    regvoter: (op) => ({
        title: "operations.injected.TLOS.regvoter.title",
        opType: "regvoter", method: "regvoter", op, operation: op,
        rows: [
            { key: "voter", params: { voter: op.data.voter } },
            { key: "treasury_symbol", params: { treasury_symbol: op.data.treasury_symbol } },
        ],
    }),
    stake: (op) => ({
        title: "operations.injected.TLOS.stake.title",
        opType: "stake", method: "stake", op, operation: op,
        rows: [
            { key: "voter", params: { voter: op.data.voter } },
            { key: "quantity", params: { quantity: op.data.quantity } },
        ],
    }),
    unstake: (op) => ({
        title: "operations.injected.TLOS.unstake.title",
        opType: "unstake", method: "unstake", op, operation: op,
        rows: [
            { key: "voter", params: { voter: op.data.voter } },
            { key: "quantity", params: { quantity: op.data.quantity } },
        ],
    }),
    newtreasury: (op) => ({
        title: "operations.injected.TLOS.newtreasury.title",
        opType: "newtreasury", method: "newtreasury", op, operation: op,
        rows: [
            { key: "manager", params: { manager: op.data.manager } },
            { key: "max_supply", params: { max_supply: op.data.max_supply } },
            { key: "access_type", params: { access_type: op.data.access_type } },
        ],
    }),
    mint: (op) => ({
        title: "operations.injected.TLOS.mint.title",
        opType: "mint", method: "mint", op, operation: op,
        rows: [
            { key: "to", params: { to: op.data.to } },
            { key: "quantity", params: { quantity: op.data.quantity } },
            { key: "memo", params: { memo: op.data.memo ?? "" } },
        ],
    }),
    burn: (op) => ({
        title: "operations.injected.TLOS.burn.title",
        opType: "burn", method: "burn", op, operation: op,
        rows: [
            { key: "quantity", params: { quantity: op.data.quantity } },
            { key: "memo", params: { memo: op.data.memo ?? "" } },
        ],
    }),
    claimpayment: (op) => ({
        title: "operations.injected.TLOS.claimpayment.title",
        opType: "claimpayment", method: "claimpayment", op, operation: op,
        rows: [
            { key: "worker", params: { worker: op.data.worker } },
        ],
    }),
    regcommittee: (op) => ({
        title: "operations.injected.TLOS.regcommittee.title",
        opType: "regcommittee", method: "regcommittee", op, operation: op,
        rows: [
            { key: "committee_name", params: { committee_name: op.data.committee_name } },
            { key: "account", params: { account: op.data.account } },
        ],
    }),
    raw: (op) => ({
        title: "operations.injected.TLOS.raw.title",
        opType: "raw", method: "raw", op, operation: op,
        rows: [
            { key: "tx_hex", params: { tx_hex: op.data.tx_hex } },
        ],
    }),
    "eosio.evm::withdraw": (op) => ({
        title: "operations.injected.TLOS.withdraw.title",
        opType: "withdraw", method: "withdraw", op, operation: op,
        rows: [
            { key: "to", params: { to: op.data.to } },
            { key: "quantity", params: { quantity: op.data.quantity } },
        ],
    }),
    "eosio.evm::create": (op) => ({
        title: "operations.injected.TLOS.create.title",
        opType: "create", method: "create", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
            { key: "data", params: { data: op.data.data } },
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