import { EOS_FAMILY } from "@/lib/blockchains/chainFamilies.js";

export default {
    name: "eos",

    validateRequiredFields({ chain, visualizedParams }) {
        if (EOS_FAMILY.includes(chain) && !visualizedParams) {
            return {
                error: true,
                errorCode: "injectedCall.missingFields",
                errorMessage: `Missing required fields for injected ${chain} based call`,
            };
        }
        return null;
    },

    getSigningKey(store) {
        return store.getters["AccountStore/getEOSKey"]();
    },

    buildSignParams(request) {
        try {
            return JSON.parse(request.payload.params[1]);
        } catch (error) {
            throw new Error(
                `EOS transaction payload is not valid JSON: ${error.message}. ` +
                `Received: ${typeof request.payload.params[1] === 'string' ? request.payload.params[1].substring(0, 200) : JSON.stringify(request.payload.params[1])}`
            );
        }
    },

    async preProcess(_store, request, _chain) {
        return request;
    },

    buildPopupContents({ request, visualizedAccount, visualizedParams }) {
        return {
            request: request,
            visualizedAccount: visualizedAccount,
            visualizedParams: JSON.stringify(visualizedParams),
        };
    },
};
