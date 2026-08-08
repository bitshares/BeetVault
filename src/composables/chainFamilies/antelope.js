import { VAULTA_FAMILY } from "@/lib/blockchains/chainFamilies.js";
import { useAccountStore } from "@/stores/accountStore.js";

export default {
    name: "antelope",

    validateRequiredFields({ chain, visualizedParams }) {
        if (VAULTA_FAMILY.includes(chain) && !visualizedParams) {
            return {
                error: true,
                errorCode: "injectedCall.missingFields",
                errorMessage: `Missing required fields for injected ${chain} based call`,
            };
        }
        return null;
    },

    getSigningKey() {
        return useAccountStore().getVaultaKey();
    },

    buildSignParams(request) {
        try {
            return JSON.parse(request.payload.params[1]);
        } catch (error) {
            throw new Error(
                `Antelope transaction payload is not valid JSON: ${error.message}. ` +
                `Received: ${typeof request.payload.params[1] === 'string' ? request.payload.params[1].substring(0, 200) : JSON.stringify(request.payload.params[1])}`
            );
        }
    },

    async preProcess(request, _chain) {
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
