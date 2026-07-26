import EOSmainnet from "./EOSmainnet.js";

export default class Libre extends EOSmainnet {

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
