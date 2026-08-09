import Antelope from "./Antelope.js";
import beautify from "./Vaulta/beautify.js";

export default class BEOS extends Antelope {

    get beautifyModule() {
        return beautify;
    }

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://explore.beos.world/accounts/" + object.accountName;
        } else if (object.txid && object.blocknum) {
            return `https://explore.beos.world/transactions/${object.blocknum}/${object.txid}`;
        } else {
            return false;
        }
    }

}