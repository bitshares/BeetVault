import { createBeautify } from "../Antelope/beautify.js";

const baseBeautify = createBeautify("FIO");

const handlers = {
    regaddress: (op) => ({
        title: "operations.injected.FIO.regaddress.title",
        opType: "regaddress", method: "regaddress", op, operation: op,
        rows: [
            { key: "fio_address", params: { fio_address: op.data.fio_address } },
            { key: "owner_fio_public_key", params: { owner_fio_public_key: op.data.owner_fio_public_key } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    renewaddress: (op) => ({
        title: "operations.injected.FIO.renewaddress.title",
        opType: "renewaddress", method: "renewaddress", op, operation: op,
        rows: [
            { key: "fio_address", params: { fio_address: op.data.fio_address } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    regdomain: (op) => ({
        title: "operations.injected.FIO.regdomain.title",
        opType: "regdomain", method: "regdomain", op, operation: op,
        rows: [
            { key: "fio_domain", params: { fio_domain: op.data.fio_domain } },
            { key: "owner_fio_public_key", params: { owner_fio_public_key: op.data.owner_fio_public_key } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    renewdomain: (op) => ({
        title: "operations.injected.FIO.renewdomain.title",
        opType: "renewdomain", method: "renewdomain", op, operation: op,
        rows: [
            { key: "fio_domain", params: { fio_domain: op.data.fio_domain } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    addaddress: (op) => ({
        title: "operations.injected.FIO.addaddress.title",
        opType: "addaddress", method: "addaddress", op, operation: op,
        rows: [
            { key: "fio_address", params: { fio_address: op.data.fio_address } },
            { key: "chain_code", params: { chain_code: op.data.chain_code } },
            { key: "token_code", params: { token_code: op.data.token_code } },
            { key: "public_address", params: { public_address: op.data.public_address } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    remaddress: (op) => ({
        title: "operations.injected.FIO.remaddress.title",
        opType: "remaddress", method: "remaddress", op, operation: op,
        rows: [
            { key: "fio_address", params: { fio_address: op.data.fio_address } },
            { key: "chain_code", params: { chain_code: op.data.chain_code } },
            { key: "token_code", params: { token_code: op.data.token_code } },
            { key: "token_public_address", params: { token_public_address: op.data.token_public_address } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    xferdomain: (op) => ({
        title: "operations.injected.FIO.xferdomain.title",
        opType: "xferdomain", method: "xferdomain", op, operation: op,
        rows: [
            { key: "fio_domain", params: { fio_domain: op.data.fio_domain } },
            { key: "new_owner_key", params: { new_owner_key: op.data.new_owner_key } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    xferaddress: (op) => ({
        title: "operations.injected.FIO.xferaddress.title",
        opType: "xferaddress", method: "xferaddress", op, operation: op,
        rows: [
            { key: "fio_address", params: { fio_address: op.data.fio_address } },
            { key: "new_owner_key", params: { new_owner_key: op.data.new_owner_key } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    burnexpired: (op) => ({
        title: "operations.injected.FIO.burnexpired.title",
        opType: "burnexpired", method: "burnexpired", op, operation: op,
        rows: [
            { key: "fio_address", params: { fio_address: op.data.fio_address } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    trnsfiopubky: (op) => ({
        title: "operations.injected.FIO.trnsfiopubky.title",
        opType: "trnsfiopubky", method: "trnsfiopubky", op, operation: op,
        rows: [
            { key: "payee_fio_public_key", params: { payee_fio_public_key: op.data.payee_fio_public_key } },
            { key: "amount", params: { amount: op.data.amount } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    recordobt: (op) => ({
        title: "operations.injected.FIO.recordobt.title",
        opType: "recordobt", method: "recordobt", op, operation: op,
        rows: [
            { key: "payer_fio_address", params: { payer_fio_address: op.data.payer_fio_address } },
            { key: "payee_fio_address", params: { payee_fio_address: op.data.payee_fio_address } },
            { key: "amount", params: { amount: op.data.amount } },
            { key: "chain_code", params: { chain_code: op.data.chain_code } },
            { key: "token_code", params: { token_code: op.data.token_code } },
            { key: "obt_id", params: { obt_id: op.data.obt_id } },
            { key: "memo", params: { memo: op.data.memo ?? "" } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    newfundsreq: (op) => ({
        title: "operations.injected.FIO.newfundsreq.title",
        opType: "newfundsreq", method: "newfundsreq", op, operation: op,
        rows: [
            { key: "payer_fio_address", params: { payer_fio_address: op.data.payer_fio_address } },
            { key: "payee_fio_address", params: { payee_fio_address: op.data.payee_fio_address } },
            { key: "amount", params: { amount: op.data.amount } },
            { key: "chain_code", params: { chain_code: op.data.chain_code } },
            { key: "token_code", params: { token_code: op.data.token_code } },
            { key: "memo", params: { memo: op.data.memo ?? "" } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    stakefio: (op) => ({
        title: "operations.injected.FIO.stakefio.title",
        opType: "stakefio", method: "stakefio", op, operation: op,
        rows: [
            { key: "amount", params: { amount: op.data.amount } },
            { key: "fio_public_key", params: { fio_public_key: op.data.fio_public_key } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    unstakefio: (op) => ({
        title: "operations.injected.FIO.unstakefio.title",
        opType: "unstakefio", method: "unstakefio", op, operation: op,
        rows: [
            { key: "amount", params: { amount: op.data.amount } },
            { key: "fio_public_key", params: { fio_public_key: op.data.fio_public_key } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    newfioacc: (op) => ({
        title: "operations.injected.FIO.newfioacc.title",
        opType: "newfioacc", method: "newfioacc", op, operation: op,
        rows: [
            { key: "owner_fio_public_key", params: { owner_fio_public_key: op.data.owner_fio_public_key } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    regproducer: (op) => ({
        title: "operations.injected.FIO.regproducer.title",
        opType: "regproducer", method: "regproducer", op, operation: op,
        rows: [
            { key: "fio_address", params: { fio_address: op.data.fio_address } },
            { key: "fio_pub_key", params: { fio_pub_key: op.data.fio_pub_key } },
            { key: "url", params: { url: op.data.url } },
            { key: "location", params: { location: op.data.location } },
        ],
    }),
    voteproducer: (op) => ({
        title: "operations.injected.FIO.voteproducer.title",
        opType: "voteproducer", method: "voteproducer", op, operation: op,
        rows: [
            { key: "fio_address", params: { fio_address: op.data.fio_address } },
            { key: "producers", params: { producers: JSON.stringify(op.data.producers) } },
        ],
    }),
    listdomain: (op) => ({
        title: "operations.injected.FIO.listdomain.title",
        opType: "listdomain", method: "listdomain", op, operation: op,
        rows: [
            { key: "fio_domain", params: { fio_domain: op.data.fio_domain } },
            { key: "sale_price", params: { sale_price: op.data.sale_price } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    buydomain: (op) => ({
        title: "operations.injected.FIO.buydomain.title",
        opType: "buydomain", method: "buydomain", op, operation: op,
        rows: [
            { key: "fio_domain", params: { fio_domain: op.data.fio_domain } },
            { key: "buyer_key", params: { buyer_key: op.data.buyer_key } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    wraptokens: (op) => ({
        title: "operations.injected.FIO.wraptokens.title",
        opType: "wraptokens", method: "wraptokens", op, operation: op,
        rows: [
            { key: "chain_code", params: { chain_code: op.data.chain_code } },
            { key: "public_address", params: { public_address: op.data.public_address } },
            { key: "amount", params: { amount: op.data.amount } },
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    bpclaim: (op) => ({
        title: "operations.injected.FIO.bpclaim.title",
        opType: "bpclaim", method: "bpclaim", op, operation: op,
        rows: [
            { key: "fio_address", params: { fio_address: op.data.fio_address } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    setfeevote: (op) => ({
        title: "operations.injected.FIO.setfeevote.title",
        opType: "setfeevote", method: "setfeevote", op, operation: op,
        rows: [
            { key: "max_fee", params: { max_fee: op.data.max_fee } },
            { key: "tpid", params: { tpid: op.data.tpid } },
        ],
    }),
    transfer: (op) => ({
        title: "operations.injected.FIO.transfer.title",
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