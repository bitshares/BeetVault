import { BTS_FAMILY, VAULTA_FAMILY, HIVE_FAMILY } from "./blockchains/chainFamilies.js";
import { validateSender } from "./senderValidation.js";
import { ipcOnceWithTimeout } from "./ipcMainWrapper.js";

function isBadActor(actor, blockedAccounts) {
    return blockedAccounts.some((x) => x === actor);
}

export async function inject(blockchain, request, webContents, allowedOperations) {
    let isBlocked = false;
    let blockedAccounts;
    let foundIDs = [];
    let regexBTS = /1\.2\.\d+/g;

    if (blockchain._config.identifier === "BTS") {
        // Decentralized warn list
        let stringifiedPayload = JSON.stringify(request);
        let regexMatches = stringifiedPayload.matchAll(regexBTS);
        for (const match of regexMatches) {
            foundIDs.push(match[0]);
        }

        if (foundIDs.length) {
            // Won't catch account names, only account IDs
            try {
                blockedAccounts = await blockchain.getBlockedAccounts();
            } catch (error) {
                console.log(error);
            }

            if (blockedAccounts) {
                isBlocked = foundIDs.some((id) => isBadActor(id, blockedAccounts));
            }
        }
    }

    let visualizedParams;
    try {
        visualizedParams = await blockchain.visualize(
            request.payload.params,
            allowedOperations
        );
    } catch (error) {
        console.log(error);
    }

    if (
        blockchain._config.identifier === "BTS" &&
        !isBlocked &&
        visualizedParams
    ) {
        // account names will have 1.2.x in parenthesis now - check again
        if (!blockedAccounts) {
            try {
                blockedAccounts = await blockchain.getBlockedAccounts();
            } catch (error) {
                console.log(error);
            }
        }

        let strVirtParams = JSON.stringify(visualizedParams);
        let regexMatches = strVirtParams.matchAll(regexBTS);

        for (const match of regexMatches) {
            foundIDs.push(match[0]);
        }

        if (blockedAccounts) {
            isBlocked = foundIDs.some((id) => isBadActor(id, blockedAccounts));
        }
    }

    let types = blockchain.getOperationTypes();

    let account = "";
    let visualizedAccount;
    if (BTS_FAMILY.includes(blockchain._config.identifier)) {
        let fromField = types.find((type) => type.method === request.type).from;
        if (!fromField || !fromField.length) {
            const _account = async () => {
                webContents.send("getSafeAccount");
                const { event, args } = await ipcOnceWithTimeout("getSafeAccountResponse", 10_000);
                if (!validateSender(event.senderFrame)) {
                    throw new Error('Unauthorized sender');
                }
                return args[0];
            };

            account = await _account();
        } else {
            let visualizeContents = request.payload[fromField];
            try {
                visualizedAccount = await blockchain.visualize(
                    visualizeContents
                );
            } catch (error) {
                console.log(error);
            }
        }
    } else if (
        VAULTA_FAMILY.includes(blockchain._config.identifier)
    ) {
        const params = request.payload.params[1];
        const _actions =
            typeof params === "string"
                ? JSON.parse(params).actions
                : params.actions;

        visualizedAccount = _actions[0].authorization[0].actor;
    } else if (HIVE_FAMILY.includes(blockchain._config.identifier)) {
        const params = request.payload.params[1];
        const parsed =
            typeof params === "string" ? JSON.parse(params) : params;
        const ops = parsed.operations || parsed.actions || [];
        const firstOp = ops[0];
        const firstOpData = Array.isArray(firstOp) ? firstOp[1] : firstOp?.data;
        visualizedAccount = firstOpData?.from || "";
    }

    const _injectedCall = (
        _apiobj,
        _chain,
        _account,
        _visualizedAccount,
        _visualizedParams,
        _isBlocked,
        _blockedAccounts,
        _foundIDs
    ) => {
        webContents.send("injectedCall", {
            request: _apiobj,
            chain: _chain,
            account: _account,
            visualizedAccount: _visualizedAccount,
            visualizedParams: _visualizedParams,
            isBlocked: _isBlocked,
            blockedAccounts: _blockedAccounts,
            foundIDs: _foundIDs,
        });

        const abortController = new AbortController();
        const onResult = ipcOnceWithTimeout("injectedCallResponse", 300_000, abortController.signal);
        const onError = ipcOnceWithTimeout("injectedCallError", 300_000, abortController.signal);

        onResult.catch(() => null);
        onError.catch(() => null);

        return Promise.race([
            onResult.then(r => ({ type: "response", ...r })),
            onError.then(r => ({ type: "error", ...r })),
        ]).finally(() => {
            abortController.abort();
        });
    };

    let injectedCallResult;
    try {
        const result = await _injectedCall(
            request,
            blockchain._config.identifier,
            account,
            visualizedAccount,
            visualizedParams,
            isBlocked,
            blockedAccounts,
            foundIDs
        );
        if (result.type === "error") {
            throw result.args[0];
        }
        if (!validateSender(result.event.senderFrame)) {
            throw new Error('Unauthorized sender');
        }
        injectedCallResult = result.args[0];
    } catch (error) {
        console.log({ error, location: "_injectedCall" });
    }

    return injectedCallResult;
}
