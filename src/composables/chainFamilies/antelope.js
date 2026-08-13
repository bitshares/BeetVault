import { VAULTA_FAMILY } from "@/lib/blockchains/chainFamilies.js";
import { useAccountStore } from "@/stores/accountStore.js";
import { decodeEsr } from "@wharfkit/signing-request";

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
        const params = request.payload.params[1];
        const isEsr = request.payload.encoding === 'esr' || request._encoding === 'esr';

        if (isEsr && typeof params === 'string') {
            try {
                const decoded = decodeEsr(params);
                const rawActions = decoded.getRawActions().map((a) => ({
                    account: String(a.account),
                    name: String(a.name),
                    authorization: (a.authorization || []).map((auth) => ({
                        actor: String(auth.actor),
                        permission: String(auth.permission),
                    })),
                    data: a.data,
                }));
                const signer = rawActions[0]?.authorization?.[0]?.actor || '';
                const userAccount = useAccountStore().getVaultaAccount();
                return {
                    actions: rawActions,
                    _esrRequest: decoded,
                    _signer: signer,
                    _encoding: 'esr',
                    _userAccount: userAccount,
                };
            } catch (error) {
                console.log({ error, location: 'buildSignParams.esr' });
            }
        }

        if (typeof params === 'string') {
            try {
                const tx = JSON.parse(params);
                if (request._nullJson) {
                    const userAccount = useAccountStore().getVaultaAccount();
                    tx._nullJson = true;
                    tx._userAccount = userAccount;
                }
                return tx;
            } catch (error) {
                throw new Error(
                    `Antelope transaction payload is not valid JSON: ${error.message}. ` +
                    `Received: ${params.substring(0, 200)}`
                );
            }
        }

        if (request._nullJson) {
            const userAccount = useAccountStore().getVaultaAccount();
            params._nullJson = true;
            params._userAccount = userAccount;
        }
        return params;
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
