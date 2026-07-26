import EOSmainnet from "./EOSmainnet.js";

export default class WAXtest extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://testnet.waxblock.io/account/" + object.accountName;
        } else if (object.txid) {
            return "https://testnet.waxblock.io/transaction/" + object.txid;
        } else {
            return false;
        }
    }

}
