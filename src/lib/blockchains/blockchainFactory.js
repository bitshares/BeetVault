import { blockchains } from "../../config/config.js";

import BitShares from "./BitShares.js";
import EOSmainnet from "./EOSmainnet.js";
import TLOS from "./TLOS.js";
import BEOS from "./BEOS.js";
import WAX from "./WAX.js";
import WAXtest from "./WAXtest.js";
import EOStest from "./EOStest.js";
import FIO from "./FIO.js";
import FIOtest from "./FIOtest.js";
import Libre from "./Libre.js";
import Libretest from "./Libretest.js";
import XPR from "./XPR.js";
import XPRtest from "./XPRtest.js";

let storedChain;
let lastChain;

export default function getBlockchainAPI(chain = null, node = null) {
    if (!lastChain) {
        lastChain = chain;
    } else if (lastChain && lastChain !== chain) {
        console.log("Switching blockchain!");
        storedChain = undefined;
        lastChain = chain;
    }

    let config;
    try {
        config = blockchains[chain];
    } catch (error) {
        console.log(error);
        return;
    }

    if (!storedChain) {
        try {
            if (chain === "EOS") {
                storedChain = new EOSmainnet(config, node);
            } else if (chain === "BEOS") {
                storedChain = new BEOS(config, node);
            } else if (chain === "TLOS") {
                storedChain = new TLOS(config, node);
            } else if (chain === "WAX") {
                storedChain = new WAX(config, node);
            } else if (chain === "WAXTEST") {
                storedChain = new WAXtest(config, node);
            } else if (chain === "EOSTEST") {
                storedChain = new EOStest(config, node);
            } else if (chain === "FIO") {
                storedChain = new FIO(config, node);
            } else if (chain === "FIOTEST") {
                storedChain = new FIOtest(config, node);
            } else if (chain === "LIBRE") {
                storedChain = new Libre(config, node);
            } else if (chain === "LIBRETEST") {
                storedChain = new Libretest(config, node);
            } else if (chain === "XPR") {
                storedChain = new XPR(config, node);
            } else if (chain === "XPRTEST") {
                storedChain = new XPRtest(config, node);
            } else if (chain === "BTS" || chain === "BTS_TEST") {
                storedChain = new BitShares(config, node);
            }
        } catch (error) {
            console.log(error);
            return;
        }
    }

    return storedChain;
}
