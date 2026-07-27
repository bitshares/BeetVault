import { getChainFamily } from "@/lib/blockchains/chainFamilies.js";
import bts from "./bts.js";
import eos from "./eos.js";
import hive from "./hive.js";

const handlers = { bts, eos, hive };

export function getChainHandler(chain) {
    const family = getChainFamily(chain);
    return handlers[family] || null;
}
