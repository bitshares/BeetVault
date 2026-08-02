import { HIVE_FAMILY } from "@/lib/blockchains/chainFamilies.js";

const POSTING_OPS = [
    "vote", "vote2", "comment", "custom_json", "delete_comment",
    "comment_options", "claim_reward_balance", "delegate_vesting_shares",
    "set_withdraw_vesting_route", "create_proposal", "update_proposal_votes",
    "remove_proposal", "update_proposal",
];

const OWNER_OPS = [
    "account_create", "create_claimed_account",
    "request_account_recovery", "recover_account",
    "change_recovery_account", "decline_voting_rights",
];

const KEY_HIERARCHY = { "owner": 3, "active": 2, "posting": 1, "memo": 0 };

function getRequiredKeyType(opName) {
    if (OWNER_OPS.includes(opName)) return "owner";
    if (POSTING_OPS.includes(opName)) return "posting";
    return "active";
}

function validateKeyAuthority(store, request, visualizedParams) {
    const parsedParams = typeof visualizedParams === "string"
        ? JSON.parse(visualizedParams)
        : visualizedParams;
    const actions = parsedParams.actions || [];

    const hiveKeyInfo = store.getters["AccountStore/getHiveKey"](request);
    if (!hiveKeyInfo || !hiveKeyInfo.keyType) {
        return {
            denied: true,
            error: "Could not determine key type for this account",
            errorCode: "injectedCall.keyTypeValidation",
        };
    }

    const userKeyType = hiveKeyInfo.keyType;
    const userLevel = KEY_HIERARCHY[userKeyType] || 0;
    const deniedOps = [];

    for (const action of actions) {
        const opName = action.op;
        if (!opName) continue;

        const requiredKeyType = getRequiredKeyType(opName);
        const requiredLevel = KEY_HIERARCHY[requiredKeyType] || 0;

        if (userLevel < requiredLevel) {
            deniedOps.push({
                op: opName,
                required: requiredKeyType,
                have: userKeyType,
            });
        }
    }

    if (deniedOps.length > 0) {
        const opList = deniedOps
            .map(d => `${d.op} (requires ${d.required} key, have ${d.have} key)`)
            .join(", ");
        return {
            denied: true,
            error: `Key type mismatch: ${opList}`,
            errorCode: "injectedCall.keyTypeValidation",
            userKeyType,
            deniedOps,
        };
    }

    return null;
}

export default {
    name: "hive",

    validateRequiredFields({ chain, visualizedParams }) {
        if (HIVE_FAMILY.includes(chain) && !visualizedParams) {
            return {
                error: true,
                errorCode: "injectedCall.missingFields",
                errorMessage: `Missing required fields for injected ${chain} based call`,
            };
        }
        return null;
    },

    validateKeyAuthority,

    getSigningKey(store, request) {
        return store.getters["AccountStore/getHiveKey"](request);
    },

    buildSignParams(request) {
        try {
            return JSON.parse(request.payload.params[1]);
        } catch (error) {
            throw new Error(
                `Hive transaction payload is not valid JSON: ${error.message}. ` +
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
