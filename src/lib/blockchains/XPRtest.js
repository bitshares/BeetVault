import EOSmainnet from "./EOSmainnet.js";

export default class XPRtest extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://testnet.explorer.xprnetwork.org/account/" + object.accountName;
        } else if (object.txid) {
            return "https://testnet.explorer.xprnetwork.org/transaction/" + object.txid;
        } else {
            return false;
        }
    }

}
