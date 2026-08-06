import Antelope, {
    ATOMIC_ASSETS_OPERATIONS,
    ATOMIC_MARKET_OPERATIONS,
} from "./Antelope.js";
import beautify from "./FIO/beautify.js";

const fioAddressOperations = [
    "regdomain", "renewdomain", "regaddress", "renewaddress",
    "addaddress", "remaddress", "remalladdr", "setdomainpub",
    "xferdomain", "xferaddress", "burnexpired", "burndomain", "burnaddress",
    "decrcounter", "xferescrow", "regdomadd", "bind2eosio",
    "addnft", "remnft", "remallnfts", "burnnfts", "addbundles", "updcryptkey",
];

const fioTokenOperations = [
    "create", "issue", "transfer", "trnsfiopubky", "trnsloctoks", "mintfio", "retire", "fipxlviii",
];

const fioPermsOperations = [
    "addperm", "remperm", "clearperm",
];

const fioSystemOperations = [
    "newaccount", "newfioacc", "regproducer", "regiproducer", "regproxy", "regiproxy",
    "unregprod", "unregproxy", "voteproducer", "voteproxy",
    "updatepower", "incram", "unlocktokens", "updlocked", "addlocked",
    "addgenlocked", "modgenlocked", "ovrwrtgenlck", "clrgenlocked",
    "auditvote", "resetaudit", "setautoproxy", "crautoproxy", "inhibitunlck",
    "burnaction", "fipxlviiilck",
    "updateauth", "linkauth", "unlinkauth", "deleteauth", "canceldelay",
    "onblock", "onerror", "setabi", "setcode", "setparams", "setpriv",
    "rmvproducer", "updtrevision",
];

const fioRequestObtOperations = [
    "recordobt", "newfundsreq", "rejectfndreq", "cancelfndreq", "migrtrx",
];

const fioStakingOperations = [
    "stakefio", "unstakefio", "incgrewards", "recorddaily",
];

const fioTreasuryOperations = [
    "tpidclaim", "startclock", "bprewdupdate", "fdtnrwdupdat", "bppoolupdate", "bpclaim", "paystake",
];

const fioFeeOperations = [
    "setfeevote", "bundlevote", "setfeemult", "computefees",
];

const fioTpidOperations = [
    "updatetpid", "rewardspaid",
];

const fioEscrowOperations = [
    "listdomain", "cxlistdomain", "buydomain", "setmrkplcfg", "cxburned",
];

const fioOracleOperations = [
    "wraptokens", "unwraptokens", "regoracle", "unregoracle", "setoraclefee", "wrapdomain", "unwrapdomain",
];

export default class FIO extends Antelope {
    get operations() {
        return [
            ...fioAddressOperations,
            ...fioTokenOperations,
            ...fioPermsOperations,
            ...fioSystemOperations,
            ...fioRequestObtOperations,
            ...fioStakingOperations,
            ...fioTreasuryOperations,
            ...fioFeeOperations,
            ...fioTpidOperations,
            ...fioEscrowOperations,
            ...fioOracleOperations,
            ...ATOMIC_ASSETS_OPERATIONS,
            ...ATOMIC_MARKET_OPERATIONS,
        ];
    }

    get beautifyModule() {
        return beautify;
    }

    getTokenContract() {
        return "fio.token";
    }

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://fio.bloks.io/account/" + object.accountName;
        } else if (object.txid) {
            return "https://fio.bloks.io/transaction/" + object.txid;
        } else {
            return false;
        }
    }
}