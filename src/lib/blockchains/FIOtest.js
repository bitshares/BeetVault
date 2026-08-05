import FIO from "./FIO.js";

export default class FIOtest extends FIO {

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
