import Antelope, {
    BASE_EOSIO_OPERATIONS,
    ATOMIC_ASSETS_OPERATIONS,
    ATOMIC_MARKET_OPERATIONS,
} from "./Antelope.js";
import * as Actions from "../Actions.js";
import beautify from "./TLOS/beautify.js";

const telosSystemOperations = [
    "setpayrates", "regfinkey", "actfinkey", "delfinkey", "limitauthchg",
];

const telosDecideOperations = [
    "init", "setversion", "updatefee", "updatetime",
    "newtreasury", "edittrsinfo", "toggle", "mint", "transfer", "burn",
    "reclaim", "mutatemax", "setunlocker", "lock", "unlock",
    "addfunds", "editpayrate",
    "newballot", "editdetails", "togglebal", "editminmax", "addoption", "rmvoption",
    "openvoting", "cancelballot", "deleteballot", "postresults", "closevoting",
    "broadcast", "archive", "unarchive",
    "regvoter", "unregvoter", "castvote", "unvoteall", "stake", "unstake", "refresh",
    "rebalance", "cleanupvote", "forfeitwork", "claimpayment", "withdraw",
    "regcommittee", "addseat", "removeseat", "assignseat", "setupdater", "delcommittee",
];

const telosEvmOperations = [
    "raw", "create", "withdraw", "call",
];

export default class TLOS extends Antelope {
    get operations() {
        const baseWithoutBidding = BASE_EOSIO_OPERATIONS.filter(
            (op) => op !== "bidname" && op !== "bidrefund"
        );
        return [
            Actions.INJECTED_CALL,
            ...baseWithoutBidding,
            ...ATOMIC_ASSETS_OPERATIONS,
            ...ATOMIC_MARKET_OPERATIONS,
            ...telosSystemOperations,
            ...telosDecideOperations,
            ...telosEvmOperations,
        ];
    }

    get beautifyModule() {
        return beautify;
    }

    getExplorer(object, chain) {
        if (object.accountName) {
            return `https://eosauthority.com/account/${object.accountName}?network=telos`;
        } else if (object.txid) {
            return `https://eosauthority.com/transaction/${object.txid}?network=telos`;
        } else {
            return false;
        }
    }
}