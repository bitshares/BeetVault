import EOSmainnet from "./EOSmainnet.js";

export default class TLOStest extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://telos-testnet.antelope.tools/account/" + object.accountName;
        } else if (object.txid) {
            return "https://telos-testnet.antelope.tools/transaction/" + object.txid;
        } else {
            return false;
        }
    }

}
