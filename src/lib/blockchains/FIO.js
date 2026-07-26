import EOSmainnet from "./EOSmainnet.js";

export default class FIO extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://fio.bloks.io/account/" + object.accountName;
        } else if (object.txid) {
            return "https://fio.bloks.io/transaction/" + object.txid;
        } else {
            return false;
        }
    }

}
