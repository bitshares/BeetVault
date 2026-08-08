import { getChainFamily } from "@/lib/blockchains/chainFamilies.js";
import bts from "./bts.js";
import antelope from "./antelope.js";
import hive from "./hive.js";

const handlers = { bts, antelope, hive };

export function getChainHandler(chain) {
    const family = getChainFamily(chain);
    return handlers[family] || null;
}
