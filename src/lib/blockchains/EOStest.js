import EOSmainnet from "./EOSmainnet.js";

export default class EOStest extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://jungle4.cryptolions.io/v2/explore/account/" + object.accountName;
        } else if (object.txid) {
            return "https://jungle4.cryptolions.io/v2/explore/transaction/" + object.txid;
        } else {
            return false;
        }
    }

}
