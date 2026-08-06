import Antelope, {
    BASE_EOSIO_OPERATIONS,
    ATOMIC_ASSETS_OPERATIONS,
    ATOMIC_MARKET_OPERATIONS,
} from "./Antelope.js";
import * as Actions from "../Actions.js";
import beautify from "./Vaulta/beautify.js";

const vaultaSystemOperations = [
    "setalimits", "setacctram", "setacctnet", "setacctcpu",
    "setinflation", "setpayfactor", "setschedule", "delschedule",
    "execschedule", "unvest",
    "denynames", "undenynames", "denyhashadd", "denyhashrm",
    "channel_to_system_fees", "logsystemfee",
    "donatetorex", "setrexmature",
    "buyramself", "ramtransfer", "ramburn", "buyramburn",
    "logbuyram", "logsellram", "logramchange",
    "regfinkey", "actfinkey", "delfinkey", "switchtosvnn",
    "limitauthchg", "wasmcfg",
    "cfgpowerup", "powerup", "powerupexec", "onblock",
];

export default class VaultaMainnet extends Antelope {
    get operations() {
        return [
            Actions.INJECTED_CALL,
            ...BASE_EOSIO_OPERATIONS,
            ...ATOMIC_ASSETS_OPERATIONS,
            ...ATOMIC_MARKET_OPERATIONS,
            ...vaultaSystemOperations,
        ];
    }

    get beautifyModule() {
        return beautify;
    }

    getExplorer(object, chain) {
        if (object.accountName) {
            return `https://eosauthority.com/account/${object.accountName}?network=vaulta`;
        } else if (object.txid) {
            return `https://eosauthority.com/transaction/${object.txid}?network=vaulta`;
        } else {
            return false;
        }
    }
}