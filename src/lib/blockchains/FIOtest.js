import EOSmainnet from "./EOSmainnet.js";

export default class FIOtest extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://fio-test.bloks.io/account/" + object.accountName;
        } else if (object.txid) {
            return "https://fio-test.bloks.io/transaction/" + object.txid;
        } else {
            return false;
        }
    }

}
