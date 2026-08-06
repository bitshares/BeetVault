import Antelope, {
    BASE_EOSIO_OPERATIONS,
    ATOMIC_ASSETS_OPERATIONS,
    ATOMIC_MARKET_OPERATIONS,
} from "./Antelope.js";
import * as Actions from "../Actions.js";
import beautify from "./WAX/beautify.js";

const waxSystemOperations = [
    "regproposer", "editproposer", "rmvproposer",
    "regproposal", "editproposal", "rmvproposal",
    "regreviewer", "editreviewer", "rmvreviewer",
    "regcommittee", "edcommittee", "rmvcommittee",
    "approve", "acceptprop", "rejectprop", "rejectfund", "removerefund",
    "claimfunds", "voteproposal", "rmvcompleted",
    "setwpsenv", "setwpsstate", "update_wps_votes",
    "voterclaim", "voterclaimst", "claim_producer_rewards",
    "awardgenesis", "claimgenesis", "delgenesis",
];

export default class WAX extends Antelope {
    get operations() {
        return [
            Actions.INJECTED_CALL,
            ...BASE_EOSIO_OPERATIONS,
            ...ATOMIC_ASSETS_OPERATIONS,
            ...ATOMIC_MARKET_OPERATIONS,
            ...waxSystemOperations,
        ];
    }

    get beautifyModule() {
        return beautify;
    }

    getExplorer(object, chain) {
        if (object.accountName) {
            return `https://eosauthority.com/account/${object.accountName}?network=wax`;
        } else if (object.txid) {
            return `https://eosauthority.com/transaction/${object.txid}?network=wax`;
        } else {
            return false;
        }
    }
}
