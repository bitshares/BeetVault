import Antelope, {
    BASE_EOSIO_OPERATIONS,
    ATOMIC_ASSETS_OPERATIONS,
    ATOMIC_MARKET_OPERATIONS,
} from "./Antelope.js";
import * as Actions from "../Actions.js";
import beautify from "./XPR/beautify.js";

const xprSystemOperations = [
    "stakexpr", "unstakexpr", "updstakexpr", "refundxpr",
    "voterclaim", "voterclaimst", "vrwrdsharing", "setxprvconf",
    "kickbp", "voteprodsys", "ramlimitset", "setramoption",
    "buyramsys", "sellramsys", "buyrambsys", "ontransfer",
];

const protonAccountOperations = [
    "setperm", "setperm2", "remove", "reqperm",
    "setusername", "setuserava", "userverify",
    "newaccres", "updateraccs", "updateaacts", "updateac",
    "addkyc", "updatekyc", "removekyc",
    "addkycprov", "rmvkycprov", "blkycprov",
];

const cfundOperations = [
    "reg", "unreg", "activate", "claimreward", "process",
];

const tokenRegistryOperations = [
    "reg", "update", "remove", "updblacklist",
];

export default class XPR extends Antelope {
    get operations() {
        return [
            Actions.INJECTED_CALL,
            ...BASE_EOSIO_OPERATIONS,
            ...ATOMIC_ASSETS_OPERATIONS,
            ...ATOMIC_MARKET_OPERATIONS,
            ...xprSystemOperations,
            ...protonAccountOperations,
            ...cfundOperations,
            ...tokenRegistryOperations,
        ];
    }

    get beautifyModule() {
        return beautify;
    }

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://explorer.xprnetwork.org/account/" + object.accountName;
        } else if (object.txid) {
            return "https://explorer.xprnetwork.org/transaction/" + object.txid;
        } else {
            return false;
        }
    }
}