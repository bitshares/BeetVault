import EOSmainnet from "./EOSmainnet.js";

export default class TLOStest extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return `https://eosauthority.com/account/${object.accountName}?network=telostest`;
        } else if (object.txid) {
            return `https://eosauthority.com/transaction/${object.txid}?network=telostest`;
        } else {
            return false;
        }
    }

}
