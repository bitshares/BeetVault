import { watch } from "vue";
import { getChainHandler } from "./chainFamilies/index.js";
import { useKeyManager } from "./useKeyManager.js";
import { useTransactionSigner } from "./useTransactionSigner.js";

export function useInjectedCall(lastIndex, { store, consoleErrorBuffer, t, startLogoutTimer }) {
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

            if (!store.state.WalletStore.isUnlocked) {
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
                            store,
                            request,
                            visualizedParams
                        );
                        if (keyAuthError && keyAuthError.denied) {
                            console.log(`Key type validation failed: ${keyAuthError.error}`);
                            window.electron.createError({
                                id: request.id,
                                title: "Insufficient Key Authority",
                                errorMessage: `Your imported key type (${keyAuthError.userKeyType}) cannot perform the requested operations: ${keyAuthError.error.split(": ")[1] || keyAuthError.error}. Please import an account with a higher-level key (active or owner) for this transaction.`,
                                terminalError: `Key type validation failed: ${JSON.stringify(keyAuthError.deniedOps)}`,
                                consoleLogs: [...consoleErrorBuffer.value],
                                timestamp: new Date().toISOString(),
                                context: `Attempting to sign ${chain} transaction with ${keyAuthError.userKeyType} key`
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
                store.dispatch("PopupStore/popupOpened");
                try {
                    window.electron.createPopup(popupContents);
                } catch (error) {
                    store.dispatch("PopupStore/popupClosed");
                    window.electron.createError({
                        id: request.id,
                        title: t('common.popup.error.popupCreationFailed'),
                        errorMessage: t('common.popup.error.popupCreationFailedDesc'),
                        terminalError: String(error),
                        consoleLogs: [...consoleErrorBuffer.value],
                        timestamp: new Date().toISOString(),
                        context: `Attempting to process a ${chain} transaction request`
                    });
                    window.electron.injectedCallError({
                        id: request.id,
                        result: {
                            isError: true,
                            method: "injectedCall.createPopup",
                            error: error,
                        },
                    });
                    return;
                }

                // 5. Notify user
                store.dispatch("WalletStore/notifyUser", {
                    notify: "request",
                    message: t("common.apiUtils.inject"),
                });

                // 6. Await approval
                let popupApproved = false;
                window.electron.popupApproved(request.id, async (approvalArgs) => {
                    if (popupApproved) return;
                    popupApproved = true;
                    store.dispatch("PopupStore/popupClosed");

                    let _request = request;

                    // 6a. Pre-process (BTS memo handling)
                    if (handler && handler.preProcess) {
                        _request = await handler.preProcess(
                            store,
                            _request,
                            chain
                        );
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
                                title: t('common.popup.error.broadcastFailed'),
                                errorMessage: getErrorMessage(error),
                                terminalError: formatError(error),
                                consoleLogs: [...consoleErrorBuffer.value],
                                timestamp: new Date().toISOString(),
                                context: `Attempting to broadcast a ${chain} transaction`
                            });
                            window.electron.injectedCallError({
                                id: _request.id,
                                result: {
                                    isError: true,
                                    method: "injectedCall.blockchain.broadcast",
                                    error: error,
                                },
                            });
                            return;
                        }

                        if (!finalResult || !finalResult.broadcastTransaction) {
                            window.electron.createError({
                                id: _request.id,
                                title: t('common.popup.error.broadcastFailed'),
                                errorMessage: t('common.popup.error.noResultDesc'),
                                terminalError: "No final result returned from broadcast",
                                consoleLogs: [...consoleErrorBuffer.value],
                                timestamp: new Date().toISOString(),
                                context: `Attempting to broadcast a ${chain} transaction`
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

                        store.dispatch("WalletStore/notifyUser", {
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

                    // 6c. Sign and broadcast path
                    let activeKey;
                    try {
                        activeKey = getSigningKey(store, chain, request);
                    } catch (error) {
                        console.log(error);
                        window.electron.createError({
                            id: request.id,
                            title: t('common.popup.error.keyRetrievalFailed'),
                            errorMessage: getErrorMessage(error),
                            terminalError: formatError(error),
                            consoleLogs: [...consoleErrorBuffer.value],
                            timestamp: new Date().toISOString(),
                            context: `Attempting to retrieve active key for a ${chain} transaction`
                        });
                        window.electron.injectedCallError({
                            id: request.id,
                            result: {
                                isError: true,
                                method: "injectedCall.getActiveKey",
                                error: error,
                            },
                        });
                        return;
                    }

                    if (txType == "signAndBroadcast") {
                        try {
                            finalResult = await signAndBroadcast(
                                chain,
                                request,
                                activeKey
                            );
                        } catch (error) {
                            console.log(error);
                            window.electron.createError({
                                id: request.id,
                                title: t('common.popup.error.signAndBroadcastFailed'),
                                errorMessage: getErrorMessage(error),
                                terminalError: formatError(error),
                                consoleLogs: [...consoleErrorBuffer.value],
                                timestamp: new Date().toISOString(),
                                context: `Attempting to sign and broadcast a ${chain} transaction`
                            });
                            window.electron.injectedCallError({
                                id: request.id,
                                result: {
                                    isError: true,
                                    method: "injectedCall.blockchain.broadcast",
                                    error: error,
                                },
                            });
                            return;
                        }
                        notifyTXT = t("common.apiUtils.signAndBroadcast");
                    }

                    if (!finalResult || !finalResult.signAndBroadcast) {
                        window.electron.createError({
                            id: request.id,
                            title: t('common.popup.error.signAndBroadcastFailed'),
                            errorMessage: t('common.popup.error.noResultDesc'),
                            terminalError: "No final result returned from sign and broadcast",
                            consoleLogs: [...consoleErrorBuffer.value],
                            timestamp: new Date().toISOString(),
                            context: `Attempting to sign and broadcast a ${chain} transaction`
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

                    store.dispatch("WalletStore/notifyUser", {
                        notify: "request",
                        message: notifyTXT,
                    });

                    if (approvalArgs?.result?.receipt) {
                        try {
                            window.electron.createReceipt({
                                request: request,
                                result: finalResult.signAndBroadcast,
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
                    store.dispatch("PopupStore/popupClosed");
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
