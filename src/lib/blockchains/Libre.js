import EOSmainnet from "./EOSmainnet.js";

export default class Libre extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://librebloks.io/account/" + object.accountName;
        } else if (object.txid) {
            return "https://librebloks.io/transaction/" + object.txid;
        } else {
            return false;
        }
    }

}
