import { blockchains } from "../config/config.js";

const ACCOUNT_DISPLAY_LIMIT = 20;

export function formatAccountName(accountName) {
    if (!accountName) return "";
    if (accountName.length > ACCOUNT_DISPLAY_LIMIT) {
        return accountName.substring(0, ACCOUNT_DISPLAY_LIMIT) + "...";
    }
    return accountName;
}

export function formatChain(chain) {
    if (!blockchains[chain]) {
        return "Unknown blockchain";
    } else {
        return blockchains[chain].name + (blockchains[chain].testnet ? " (Testnet)" : "");
    }
}
