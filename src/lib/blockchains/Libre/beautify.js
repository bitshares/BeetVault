import { createBeautify } from "../Antelope/beautify.js";
import { createAtomicBeautify } from "../Antelope/atomic-beautify.js";

const baseBeautify = createBeautify("LIBRE");
const atomicHandlers = createAtomicBeautify("LIBRE");

const handlers = {
    voteproducer: (op) => ({
        title: "operations.injected.LIBRE.voteproducer.title",
        opType: "voteproducer", method: "voteproducer", op, operation: op,
        rows: [
            { key: "voter", params: { voter: op.data.voter } },
            { key: "producers", params: { producers: JSON.stringify(op.data.producers) } },
        ],
    }),
    regproducer: (op) => ({
        title: "operations.injected.LIBRE.regproducer.title",
        opType: "regproducer", method: "regproducer", op, operation: op,
        rows: [
            { key: "producer", params: { producer: op.data.producer } },
            { key: "producer_key", params: { producer_key: op.data.producer_key } },
            { key: "url", params: { url: op.data.url } },
            { key: "location", params: { location: op.data.location } },
        ],
    }),
    claimrewards: (op) => ({
        title: "operations.injected.LIBRE.claimrewards.title",
        opType: "claimrewards", method: "claimrewards", op, operation: op,
        rows: [
            { key: "owner", params: { owner: op.data.owner } },
        ],
    }),
    setalimits: (op) => ({
        title: "operations.injected.LIBRE.setalimits.title",
        opType: "setalimits", method: "setalimits", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
            { key: "ram_bytes", params: { ram_bytes: op.data.ram_bytes } },
            { key: "net_weight", params: { net_weight: op.data.net_weight } },
            { key: "cpu_weight", params: { cpu_weight: op.data.cpu_weight } },
        ],
    }),
    "stake.libre::transfer": (op) => ({
        title: "operations.injected.LIBRE.stake.title",
        opType: "stake", method: "stake", op, operation: op,
        rows: [
            { key: "from", params: { from: op.data.from } },
            { key: "to", params: { to: op.data.to } },
            { key: "quantity", params: { quantity: op.data.quantity } },
            { key: "memo", params: { memo: op.data.memo ?? "" } },
        ],
    }),
    unstake: (op) => ({
        title: "operations.injected.LIBRE.unstake.title",
        opType: "unstake", method: "unstake", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
            { key: "index", params: { index: op.data.index } },
        ],
    }),
    claim: (op) => ({
        title: "operations.injected.LIBRE.claim.title",
        opType: "claim", method: "claim", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
            { key: "index", params: { index: op.data.index } },
        ],
    }),
    transfer: (op) => ({
        title: "operations.injected.LIBRE.transfer.title",
        opType: "transfer", method: "transfer", op, operation: op,
        rows: [
            { key: "from", params: { from: op.data.from } },
            { key: "to", params: { to: op.data.to } },
            { key: "quantity", params: { quantity: op.data.quantity } },
            { key: "memo", params: { memo: op.data.memo ?? "" } },
        ],
    }),
};

export default async function beautify(operation) {
    if (!operation || !operation.name) return;

    const qualifiedKey = `${operation.account}::${operation.name}`;
    if (handlers[qualifiedKey]) return handlers[qualifiedKey](operation);
    if (handlers[operation.name]) return handlers[operation.name](operation);

    if (atomicHandlers[qualifiedKey]) return atomicHandlers[qualifiedKey](operation);
    if (atomicHandlers[operation.name]) return atomicHandlers[operation.name](operation);

    return baseBeautify(operation);
}