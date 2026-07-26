import EOSmainnet from "./EOSmainnet.js";

export default class WAX extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://waxblock.io/account/" + object.accountName;
        } else if (object.txid) {
            return "https://waxblock.io/transaction/" + object.txid;
        } else {
            return false;
        }
    }

}
