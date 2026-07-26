import EOSmainnet from "./EOSmainnet.js";

export default class XPR extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://explorer.xprnetwork.org/account/" + object.accountName;
        } else if (object.txid) {
            return "https://explorer.xprnetwork.org/transaction/" + object.txid;
        } else {
            return false;
        }
    }

}
