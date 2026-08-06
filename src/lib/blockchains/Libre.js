import Antelope, {
    ATOMIC_ASSETS_OPERATIONS,
    ATOMIC_MARKET_OPERATIONS,
} from "./Antelope.js";
import * as Actions from "../Actions.js";
import beautify from "./Libre/beautify.js";

const libreSystemOperations = [
    "init", "activate", "regproducer", "regproducer2", "unregprod",
    "voteproducer", "vonstake", "kickbp", "setalimits", "setparams",
    "setpriv", "rmvproducer", "claimrewards", "updtrevision", "onblock", "migrate",
];

const libreNativeOperations = [
    "newaccount", "updateauth", "deleteauth", "linkauth", "unlinkauth",
    "canceldelay", "onerror", "setabi", "setcode",
];

const stakeLibreOperations = [
    "stake", "unstake", "claim", "updatevp", "mintprocess",
];

const libreRewardOperations = [
    "init", "addpool", "rmpool", "setblockrwd", "setinterval", "updateall", "claim", "receipt",
];

const libreFarmingOperations = [
    "stake", "withdraw",
];

export default class Libre extends Antelope {
    get operations() {
        return [
            Actions.INJECTED_CALL,
            ...libreSystemOperations,
            ...libreNativeOperations,
            ...stakeLibreOperations,
            ...libreRewardOperations,
            ...libreFarmingOperations,
            ...ATOMIC_ASSETS_OPERATIONS,
            ...ATOMIC_MARKET_OPERATIONS,
        ];
    }

    get beautifyModule() {
        return beautify;
    }

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://www.libreblocks.io/account/" + object.accountName;
        } else if (object.txid) {
            return "https://www.libreblocks.io/tx/" + object.txid;
        } else {
            return false;
        }
    }
}