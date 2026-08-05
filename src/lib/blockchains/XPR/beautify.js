import { createBeautify } from "../Antelope/beautify.js";

const baseBeautify = createBeautify("XPR");

const handlers = {
    stakexpr: (op) => ({
        title: "operations.injected.XPR.stakexpr.title",
        opType: "stakexpr", method: "stakexpr", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
            { key: "quantity", params: { quantity: op.data.quantity } },
        ],
    }),
    unstakexpr: (op) => ({
        title: "operations.injected.XPR.unstakexpr.title",
        opType: "unstakexpr", method: "unstakexpr", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
            { key: "quantity", params: { quantity: op.data.quantity } },
        ],
    }),
    updstakexpr: (op) => ({
        title: "operations.injected.XPR.updstakexpr.title",
        opType: "updstakexpr", method: "updstakexpr", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
            { key: "quantity", params: { quantity: op.data.quantity } },
        ],
    }),
    refundxpr: (op) => ({
        title: "operations.injected.XPR.refundxpr.title",
        opType: "refundxpr", method: "refundxpr", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
        ],
    }),
    voterclaim: (op) => ({
        title: "operations.injected.XPR.voterclaim.title",
        opType: "voterclaim", method: "voterclaim", op, operation: op,
        rows: [
            { key: "owner", params: { owner: op.data.owner } },
        ],
    }),
    voterclaimst: (op) => ({
        title: "operations.injected.XPR.voterclaimst.title",
        opType: "voterclaimst", method: "voterclaimst", op, operation: op,
        rows: [
            { key: "owner", params: { owner: op.data.owner } },
            { key: "amount", params: { amount: op.data.amount } },
        ],
    }),
    setperm: (op) => ({
        title: "operations.injected.XPR.setperm.title",
        opType: "setperm", method: "setperm", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
            { key: "permission", params: { permission: op.data.permission } },
            { key: "allowed_actions", params: { allowed_actions: JSON.stringify(op.data.allowed_actions) } },
        ],
    }),
    setusername: (op) => ({
        title: "operations.injected.XPR.setusername.title",
        opType: "setusername", method: "setusername", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
            { key: "username", params: { username: op.data.username } },
        ],
    }),
    userverify: (op) => ({
        title: "operations.injected.XPR.userverify.title",
        opType: "userverify", method: "userverify", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
            { key: "is_verified", params: { is_verified: op.data.is_verified } },
        ],
    }),
    addkyc: (op) => ({
        title: "operations.injected.XPR.addkyc.title",
        opType: "addkyc", method: "addkyc", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
            { key: "kyc_provider", params: { kyc_provider: op.data.kyc_provider } },
            { key: "kyc_app_id", params: { kyc_app_id: op.data.kyc_app_id } },
            { key: "kyc_status", params: { kyc_status: op.data.kyc_status } },
        ],
    }),
    updatekyc: (op) => ({
        title: "operations.injected.XPR.updatekyc.title",
        opType: "updatekyc", method: "updatekyc", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
            { key: "kyc_provider", params: { kyc_provider: op.data.kyc_provider } },
            { key: "kyc_app_id", params: { kyc_app_id: op.data.kyc_app_id } },
            { key: "kyc_status", params: { kyc_status: op.data.kyc_status } },
        ],
    }),
    removekyc: (op) => ({
        title: "operations.injected.XPR.removekyc.title",
        opType: "removekyc", method: "removekyc", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
        ],
    }),
    "cfund.proton::reg": (op) => ({
        title: "operations.injected.XPR.reg.title",
        opType: "reg", method: "reg", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
        ],
    }),
    "cfund.proton::claimreward": (op) => ({
        title: "operations.injected.XPR.claimreward.title",
        opType: "claimreward", method: "claimreward", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
        ],
    }),
    "cfund.proton::process": (op) => ({
        title: "operations.injected.XPR.process.title",
        opType: "process", method: "process", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
        ],
    }),
    "token.proton::reg": (op) => ({
        title: "operations.injected.XPR.reg.title",
        opType: "reg", method: "reg", op, operation: op,
        rows: [
            { key: "account", params: { account: op.data.account } },
        ],
    }),
    transfer: (op) => ({
        title: "operations.injected.XPR.transfer.title",
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

    return baseBeautify(operation);
}