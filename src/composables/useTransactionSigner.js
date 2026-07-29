import { getChainHandler } from "./chainFamilies/index.js";

export function useTransactionSigner() {

    async function signAndBroadcast(chain, request, encryptedKey) {
        const handler = getChainHandler(chain);
        if (!handler || !handler.buildSignParams) {
            throw new Error(`No sign params handler for chain: ${chain}`);
        }

        const operation = handler.buildSignParams(request);

        return await window.electron.decryptAndSign({
            encryptedKey: encryptedKey,
            chain: chain,
            operation: operation,
        });
    }

    async function broadcastOnly(chain, request) {
        return await window.electron.blockchainRequest({
            methods: ["broadcastTransaction"],
            account: null,
            chain: chain,
            operation: request.payload.params,
        });
    }

    return { signAndBroadcast, broadcastOnly };
}
