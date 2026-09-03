import { BTS_FAMILY } from "@/lib/blockchains/chainFamilies.js";
import { useAccountStore } from "@/stores/accountStore.js";
import { blockchainRequest } from '@/lib/blockchainRequestHelper.js';

const hexToString = (hex) => {
    const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    return new TextDecoder().decode(bytes);
};

/**
 * Renderer-side pubkey cache. Keyed by `${encryptedActive}|${encryptedOwner}`.
 * When the account switches, the encrypted key strings change, so the cache
 * auto-invalidates. Cleared on logout (via forceLogout event).
 * @type {Map<string, {active: string|null, owner: string|null}>}
 */
const _pubkeyCache = new Map();

export default {
    name: "bts",

    validateRequiredFields({ chain, visualizedAccount, account, visualizedParams }) {
        if (
            BTS_FAMILY.includes(chain) &&
            ((!visualizedAccount && account && !account.accountName) ||
                !visualizedParams)
        ) {
            return {
                error: true,
                errorCode: "injectedCall.missingFields",
                errorMessage: "Missing required fields for injected BTS call",
            };
        }
        return null;
    },

    async getSigningKey(request) {
        const store = useAccountStore();
        const encryptedActive = store.getCurrentActiveKey();
        const encryptedOwner = store.getCurrentOwnerKey();

        if (!encryptedActive && !encryptedOwner) {
            throw new Error('No signing keys available for current account');
        }

        // Derive pubkeys in main process (decrypt + secp256k1).
        // Cached in renderer keyed by encrypted key strings — when the account
        // switches, the strings change, so the cache auto-invalidates.
        const cacheKey = `${encryptedActive || ''}|${encryptedOwner || ''}`;
        let pubkeys = _pubkeyCache.get(cacheKey);
        if (!pubkeys) {
            pubkeys = await window.electron.derivePubkeys({
                encryptedKeys: { active: encryptedActive, owner: encryptedOwner },
                chain: request.payload.chain
            });
            _pubkeyCache.set(cacheKey, pubkeys);
        }

        const available = Object.values(pubkeys).filter(Boolean);
        if (!available.length) {
            throw new Error('Failed to derive public keys from encrypted keys');
        }

        // Ask the blockchain which keys are actually required for this operation
        const resp = await blockchainRequest({
            methods: ['getRequiredSignatures'],
            chain: request.payload.chain,
            operation: request.payload.params,
            availableKeys: available
        });
        const required = resp?.getRequiredSignatures || [];

        if (!required.length) {
            throw new Error('Insufficient key authority: no available keys match what the blockchain requires');
        }

        // Map required pub back to encrypted key
        if (required.includes(pubkeys.owner)) {
            return encryptedOwner;
        }
        return encryptedActive;
    },

    buildSignParams(request) {
        return request.payload.params;
    },

    async preProcess(request, chain) {
        let _request = request;

        if (!request.payload.memo) {
            return _request;
        }

        let readableParameters;
        try {
            readableParameters = JSON.parse(request.payload.params[1]);
        } catch (error) {
            throw new Error(
                `BTS transaction payload is not valid JSON: ${error.message}. ` +
                `Received: ${typeof request.payload.params[1] === 'string' ? request.payload.params[1].substring(0, 200) : JSON.stringify(request.payload.params[1])}`
            );
        }
        let operations = readableParameters.operations;
        const fromID = operations && operations.length ? operations[0][1].from : null;
        if (!fromID) {
            return _request;
        }

        let _requiredMemoKey = useAccountStore().getPrivateMemoKey(fromID, chain);

        let processedOperations = [];
        for (let operation of operations) {
            if (operation[0] !== 0 || !operation[1].hasOwnProperty("memo")) {
                continue;
            }
            let memo = operation[1].memo;
            let from = memo.from;
            let to = memo.to;
            let nonce = memo.nonce;
            let message = hexToString(memo.message);

            let memoObject;
            try {
                memoObject = await window.electron.decryptAndCreateMemo({
                    encryptedKey: _requiredMemoKey,
                    chain,
                    from,
                    to,
                    nonce: nonce ?? undefined,
                    message
                });
            } catch (error) {
                console.log(error);
            }

            if (memoObject) {
                const _updatedOperation = operation;
                _updatedOperation[1].memo = memoObject;

                let memoFromBuffer;
                try {
                    memoFromBuffer = await window.electron.memoFromBuffer({
                        msg: _updatedOperation[1].memo.message,
                    });
                } catch (error) {
                    console.log(error);
                }

                _updatedOperation[1].memo.message = memoFromBuffer;
                processedOperations.push(_updatedOperation);
            }
        }

        if (processedOperations.length) {
            let _updatedRequest = { ...request };

            let _updatedOperations = [];
            for (let operation of processedOperations) {
                try {
                    let feeRequest = await blockchainRequest({
                        methods: ["calculateFee"],
                        account: null,
                        chain,
                        operation: operation
                    });

                    if (feeRequest && feeRequest.calculateFee) {
                        let updatedOperation = feeRequest.calculateFee.operations[0];
                        _updatedOperations.push(updatedOperation);
                    }
                } catch (error) {
                    console.log(error);
                }
            }

            _updatedRequest.payload.params[1] = JSON.stringify({
                ...readableParameters,
                operations: _updatedOperations
            });

            _request = _updatedRequest;
        }

        return _request;
    },

    buildPopupContents({ request, chain, visualizedAccount, account, visualizedParams, isBlocked, blockedAccounts, foundIDs }) {
        const contents = {
            request: request,
            visualizedAccount: visualizedAccount || account.accountName,
            visualizedParams: JSON.stringify(visualizedParams),
        };

        if (foundIDs && foundIDs.length) {
            contents.isBlockedAccount = isBlocked;
        }

        if (chain !== "BTS_TEST" && (!blockedAccounts || !blockedAccounts.length)) {
            contents.serverError = true;
        }

        return contents;
    },
};
