import EOSmainnet from "./EOSmainnet.js";

export default class Libretest extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://testnet.libre.org/account/" + object.accountName;
        } else if (object.txid) {
            return "https://testnet.libre.org/transaction/" + object.txid;
        } else {
            return false;
        }
    }

}
