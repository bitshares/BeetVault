import { getChainHandler } from "./chainFamilies/index.js";

export function useKeyManager() {

    function getSigningKey(store, chain, request) {
        const handler = getChainHandler(chain);
        if (!handler || !handler.getSigningKey) {
            throw new Error(`No key retrieval handler for chain: ${chain}`);
        }
        return handler.getSigningKey(store, request);
    }

    return { getSigningKey };
}
