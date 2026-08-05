import Antelope, { BASE_EOSIO_OPERATIONS } from "./Antelope.js";
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

const atomicAssetsOperations = [
    "init", "setversion", "addconftoken", "setmarketfee",
    "createcol", "setcoldata", "addcolauth", "remcolauth",
    "addnotifyacc", "remnotifyacc", "forbidnotify", "admincoledit",
    "createschema", "extendschema",
    "createtempl", "locktemplate",
    "mintasset", "burnasset", "setassetdata", "transfer", "backasset", "announcedepo",
    "createoffer", "acceptoffer", "canceloffer", "declineoffer", "payofferram",
    "withdraw",
];

const atomicMarketOperations = [
    "init", "setversion", "regmarket", "setmarketfee", "setminbidinc",
    "addconftoken", "adddelphi", "addafeectr", "addbonusfee", "delbonusfee",
    "stopbonusfee", "convcounters",
    "announcesale", "cancelsale", "purchasesale", "assertsale", "paysaleram", "withdraw",
    "announceauct", "cancelauct", "auctionbid", "auctclaimbuy", "auctclaimsel",
    "assertauct", "payauctram",
    "createbuyo", "cancelbuyo", "acceptbuyo", "declinebuyo", "paybuyoram",
    "createtbuyo", "canceltbuyo", "fulfilltbuyo",
    "lognewsale", "logsalestart", "lognewauct", "logauctstart", "lognewbuyo", "lognewtbuyo",
];

export default class WAX extends Antelope {
    get operations() {
        return [
            Actions.INJECTED_CALL,
            ...BASE_EOSIO_OPERATIONS,
            ...waxSystemOperations,
            ...atomicAssetsOperations,
            ...atomicMarketOperations,
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