import { createBeautify } from "../Antelope/beautify.js";
import { createAtomicBeautify } from "../Antelope/atomic-beautify.js";

const baseBeautify = createBeautify("WAX");
const atomicHandlers = createAtomicBeautify("ATOMIC");

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
};

export default async function beautify(operation, allowedOperations) {
    if (!operation || !operation.name) return;

    const qualifiedKey = `${operation.account}::${operation.name}`;
    if (handlers[qualifiedKey]) return handlers[qualifiedKey](operation);
    if (handlers[operation.name]) return handlers[operation.name](operation);

    if (atomicHandlers[qualifiedKey]) return atomicHandlers[qualifiedKey](operation);
    if (atomicHandlers[operation.name]) return atomicHandlers[operation.name](operation);

    return baseBeautify(operation, allowedOperations);
}
