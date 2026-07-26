import EOSmainnet from "./EOSmainnet.js";

export default class Libretest extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://tools.libre.org/account/testnet/" + object.accountName;
        } else if (object.txid) {
            return "https://testnet.libre.org/v2/history/get_transaction?id=test" + object.txid;
        } else {
            return false;
        }
    }

}
