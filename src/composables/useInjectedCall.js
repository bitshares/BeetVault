import { watch } from "vue";
import { getChainHandler } from "./chainFamilies/index.js";
import { useKeyManager } from "./useKeyManager.js";
import { useTransactionSigner } from "./useTransactionSigner.js";
import { serializeError } from "../lib/utils.js";
import { useWalletStore } from "@/stores/walletStore.js";
import { usePopupStore } from "@/stores/popupStore.js";

export function useInjectedCall(lastIndex, { consoleErrorBuffer, t, startLogoutTimer }) {
    const { getSigningKey } = useKeyManager();
    const { signAndBroadcast, broadcastOnly } = useTransactionSigner();

    function parseErrorData(error) {
        if (!error) return null;

        const msg = error.message || String(error);

        // Try direct JSON parse first (non-IPC errors)
        try {
            const parsed = JSON.parse(msg);
            if (parsed && typeof parsed === 'object' && (parsed.message || parsed.data)) {
                return parsed;
            }
        } catch (e) {
            // not pure JSON, continue
        }

        // Handle IPC-wrapped errors: "Error invoking remote method 'blockchainRequest': Error: {JSON}"
        const jsonMatch = msg.match(/Error:\s*(\{[\s\S]*\})/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                if (parsed && typeof parsed === 'object') {
                    return parsed;
                }
            } catch (e) {
                // JSON parse failed
            }
        }

        return null;
    }

    function formatError(error) {
        const parsed = parseErrorData(error);
        if (parsed) {
            return JSON.stringify(parsed, null, 4);
        }
        return String(error);
    }

    function getErrorMessage(error) {
        const parsed = parseErrorData(error);
        if (parsed && parsed.message) {
            return parsed.message;
        }
        return String(error);
    }

    watch(
        lastIndex,
        () => {
            window.electron.removeAllListeners("injectedCall");

            if (!useWalletStore().isUnlocked) {
                return;
            }

            window.electron.onInjectedCall(async (args) => {
                const {
                    request,
                    chain,
                    account,
                    visualizedAccount,
                    visualizedParams,
                    isBlocked,
                    blockedAccounts,
                    foundIDs,
                } = args;

                const handler = getChainHandler(chain);

                // 1. Validate required fields
                if (handler && handler.validateRequiredFields) {
                    const fieldError = handler.validateRequiredFields({
                        chain,
                        visualizedAccount,
                        account,
                        visualizedParams,
                        isBlocked,
                        blockedAccounts,
                        foundIDs,
                    });
                    if (fieldError) {
                        console.log(fieldError.errorMessage);
                        window.electron.injectedCallError({
                            id: request.id,
                            result: {
                                isError: true,
                                method: fieldError.errorCode,
                                error: fieldError.errorMessage,
                            },
                        });
                        return;
                    }
                }

                // 2. Validate key authority (Hive-specific)
                if (handler && handler.validateKeyAuthority) {
                    try {
                        const keyAuthError = handler.validateKeyAuthority(
                            request,
                            visualizedParams
                        );
                        if (keyAuthError && keyAuthError.denied) {
                            console.log(`Key type validation failed: ${keyAuthError.error}`);
                            window.electron.createError({
                                id: request.id,
                                titleKey: 'common.popup.error.insufficientKeyAuthority',
                                errorMessageKey: 'common.popup.error.insufficientKeyAuthorityDesc',
                                errorMessageParams: { keyType: keyAuthError.userKeyType, error: keyAuthError.error.split(": ")[1] || keyAuthError.error },
                                terminalError: `Key type validation failed: ${JSON.stringify(keyAuthError.deniedOps)}`,
                                consoleLogs: [...consoleErrorBuffer.value],
                                timestamp: new Date().toISOString(),
                                contextKey: 'common.popup.error.contextSignAndBroadcast',
                                contextParams: { chain }
                            });
                            window.electron.injectedCallError({
                                id: request.id,
                                result: {
                                    isError: true,
                                    method: keyAuthError.errorCode,
                                    error: keyAuthError.error,
                                },
                            });
                            return;
                        }
                    } catch (error) {
                        console.log("Key type validation error:", error);
                    }
                }

                // 3. Build popup contents
                const popupContents = handler && handler.buildPopupContents
                    ? handler.buildPopupContents({
                        request,
                        chain,
                        visualizedAccount,
                        account,
                        visualizedParams,
                        isBlocked,
                        blockedAccounts,
                        foundIDs,
                    })
                    : {
                        request: request,
                        visualizedAccount: visualizedAccount,
                        visualizedParams: JSON.stringify(visualizedParams),
                    };

                // 4. Create popup
                usePopupStore().popupOpened();
                try {
                    window.electron.createPopup(popupContents);
                } catch (error) {
                    usePopupStore().popupClosed();
                    window.electron.createError({
                        id: request.id,
                        titleKey: 'common.popup.error.popupCreationFailed',
                        errorMessageKey: 'common.popup.error.popupCreationFailedDesc',
                        terminalError: String(error),
                        consoleLogs: [...consoleErrorBuffer.value],
                        timestamp: new Date().toISOString(),
                        contextKey: 'common.popup.error.contextProcess',
                        contextParams: { chain }
                    });
                    window.electron.injectedCallError({
                        id: request.id,
                        result: {
                            isError: true,
                            method: "injectedCall.createPopup",
                            error: serializeError(error),
                        },
                    });
                    return;
                }

                // 5. Notify user
                useWalletStore().notifyUser({
                    notify: "request",
                    message: t("common.apiUtils.inject"),
                });

                // 6. Await approval
                let popupApproved = false;
                window.electron.popupApproved(request.id, async (approvalArgs) => {
                    if (popupApproved) return;
                    popupApproved = true;
                    usePopupStore().popupClosed();

                    let _request = request;

                    // 6a. Pre-process (BTS memo handling)
                    if (handler && handler.preProcess) {
                        try {
                            _request = await handler.preProcess(
                                _request,
                                chain
                            );
                        } catch (error) {
                            console.log(error);
                            window.electron.createError({
                                id: request.id,
                                titleKey: 'common.popup.error.processFailed',
                                errorMessage: getErrorMessage(error),
                                terminalError: formatError(error),
                                consoleLogs: [...consoleErrorBuffer.value],
                                timestamp: new Date().toISOString(),
                                contextKey: 'common.popup.error.contextProcess',
                                contextParams: { chain }
                            });
                            window.electron.injectedCallError({
                                id: request.id,
                                result: {
                                    isError: true,
                                    method: "injectedCall.preProcess",
                                    error: serializeError(error),
                                },
                            });
                            return;
                        }
                    }

                    let finalResult;
                    let notifyTXT = "";

                    let txType = _request.payload.params[0] ?? "signAndBroadcast";

                    // 6b. Broadcast-only path
                    if (txType == "broadcast") {
                        try {
                            finalResult = await broadcastOnly(chain, _request);
                        } catch (error) {
                            console.log(error);
                            window.electron.createError({
                                id: _request.id,
                                titleKey: 'common.popup.error.broadcastFailed',
                                errorMessage: getErrorMessage(error),
                                terminalError: formatError(error),
                                consoleLogs: [...consoleErrorBuffer.value],
                                timestamp: new Date().toISOString(),
                                contextKey: 'common.popup.error.contextBroadcast',
                                contextParams: { chain }
                            });
                            window.electron.injectedCallError({
                                id: _request.id,
                                result: {
                                    isError: true,
                                    method: "injectedCall.blockchain.broadcast",
                                    error: serializeError(error),
                                },
                            });
                            return;
                        }

                        if (!finalResult || !finalResult.broadcastTransaction) {
                            window.electron.createError({
                                id: _request.id,
                                titleKey: 'common.popup.error.broadcastFailed',
                                errorMessageKey: 'common.popup.error.noResultDesc',
                                terminalErrorKey: 'common.popup.error.noResultTerminal',
                                consoleLogs: [...consoleErrorBuffer.value],
                                timestamp: new Date().toISOString(),
                                contextKey: 'common.popup.error.contextBroadcast',
                                contextParams: { chain }
                            });
                            window.electron.injectedCallError({
                                id: _request.id,
                                result: {
                                    isError: true,
                                    method: "injectedCall.finalResult",
                                    error: "No final result",
                                },
                            });
                            return;
                        }

                        useWalletStore().notifyUser({
                            notify: "request",
                            message: t("common.apiUtils.broadcast"),
                        });
                        window.electron.injectedCallResponse({
                            id: _request.id,
                            result: {
                                result: finalResult.broadcastTransaction,
                            },
                        });
                        return;
                    }

                    // 6c. Sign and broadcast path (generic: bts.js getSigningKey may be async and does
                    // authority detection internally, returning single encrypted WIF string)
                    let signingKey;
                    try {
                        signingKey = await getSigningKey(chain, request);
                    } catch (error) {
                        console.log(error);
                        window.electron.createError({
                            id: request.id,
                            titleKey: 'common.popup.error.keyRetrievalFailed',
                            errorMessage: getErrorMessage(error),
                            terminalError: formatError(error),
                            consoleLogs: [...consoleErrorBuffer.value],
                            timestamp: new Date().toISOString(),
                            contextKey: 'common.popup.error.contextKeyRetrieval',
                            contextParams: { chain }
                        });
                        window.electron.injectedCallError({
                            id: request.id,
                            result: {
                                isError: true,
                                method: "injectedCall.getSigningKey",
                                error: serializeError(error),
                            },
                        });
                        return;
                    }

                    if (txType == "signAndBroadcast") {
                        try {
                            finalResult = await signAndBroadcast(
                                chain,
                                request,
                                signingKey
                            );
                        } catch (error) {
                            console.log(error);
                            window.electron.createError({
                                id: request.id,
                                titleKey: 'common.popup.error.signAndBroadcastFailed',
                                errorMessage: getErrorMessage(error),
                                terminalError: formatError(error),
                                consoleLogs: [...consoleErrorBuffer.value],
                                timestamp: new Date().toISOString(),
                                contextKey: 'common.popup.error.contextSignAndBroadcast',
                                contextParams: { chain }
                            });
                            window.electron.injectedCallError({
                                id: request.id,
                                result: {
                                    isError: true,
                                    method: "injectedCall.blockchain.broadcast",
                                    error: serializeError(error),
                                },
                            });
                            return;
                        }
                        notifyTXT = t("common.apiUtils.signAndBroadcast");
                    }

                    if (!finalResult) {
                        window.electron.createError({
                            id: request.id,
                            titleKey: 'common.popup.error.signAndBroadcastFailed',
                            errorMessageKey: 'common.popup.error.noResultDesc',
                            terminalErrorKey: 'common.popup.error.noResultTerminal',
                            consoleLogs: [...consoleErrorBuffer.value],
                            timestamp: new Date().toISOString(),
                            contextKey: 'common.popup.error.contextSignAndBroadcast',
                            contextParams: { chain }
                        });
                        window.electron.injectedCallError({
                            id: request.id,
                            result: {
                                isError: true,
                                method: "injectedCall.finalResult",
                                error: "No final result",
                            },
                        });
                        return;
                    }

                    useWalletStore().notifyUser({
                        notify: "request",
                        message: notifyTXT,
                    });

                    if (approvalArgs?.result?.receipt) {
                        try {
                            window.electron.createReceipt({
                                request: request,
                                result: finalResult,
                                notifyTXT: notifyTXT,
                                receipt: {
                                    visualizedAccount:
                                        popupContents.visualizedAccount,
                                    visualizedParams:
                                        popupContents.visualizedParams,
                                },
                            });
                        } catch (error) {
                            console.error(error);
                        }
                    }

                    window.electron.injectedCallResponse({
                        id: request.id,
                        result: { result: finalResult },
                    });
                });

                window.electron.popupRejected(request.id, (result) => {
                    usePopupStore().popupClosed();
                    window.electron.injectedCallError({
                        id: request.id,
                        result: {
                            isError: true,
                            method: "injectedCall.popupRejected",
                            error: result,
                        },
                    });
                });
            });
            if (startLogoutTimer) {
                startLogoutTimer();
            }
        },
        { immediate: true }
    );
}
