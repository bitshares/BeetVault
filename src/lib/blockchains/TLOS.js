import EOSmainnet from "./EOSmainnet.js";

export default class TLOS extends EOSmainnet {

    getExplorer(object, chain) {
        if (object.accountName) {
            return `https://eosauthority.com/account/${object.accountName}?network=telos`;
        } else if (object.txid) {
            return `https://eosauthority.com/transaction/${object.txid}?network=telos`;
        } else {
            return false;
        }
    }

}
