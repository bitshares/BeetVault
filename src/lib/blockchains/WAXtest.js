import WAX from "./WAX.js";

export default class WAXtest extends WAX {

    getExplorer(object, chain) {
        if (object.accountName) {
            return `https://eosauthority.com/account/${object.accountName}?network=waxtest`;
        } else if (object.txid) {
            return `https://eosauthority.com/transaction/${object.txid}?network=waxtest`;
        } else {
            return false;
        }
    }

}
