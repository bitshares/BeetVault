import EOSmainnet from "./EOSmainnet.js";

export default class WAX extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return `https://eosauthority.com/account/${object.accountName}?network=wax`;
        } else if (object.txid) {
            return `https://eosauthority.com/transaction/${object.txid}?network=wax`;
        } else {
            return false;
        }
    }

}
