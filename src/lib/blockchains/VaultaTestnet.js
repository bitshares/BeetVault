import VaultaMainnet from "./VaultaMainnet.js";

export default class VaultaTestnet extends VaultaMainnet {

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