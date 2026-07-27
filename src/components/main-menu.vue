<script setup>
    import { ref, computed, watch, onBeforeUnmount } from "vue";
    import { useI18n } from "vue-i18n";

    import router from "../router/index.js";
    import store from "../store/index.js";
    import { Button } from '@/components/ui/ui/button';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/ui/dropdown-menu';
    import { Menu, Home, Plus, KeyRound, Upload, Code, QrCode, PenLine, ShieldCheck, Download, Settings, Network, LogOut } from 'lucide-vue-next';

    const iconMap = {
        home: Home,
        add: Plus,
        generating_tokens: KeyRound,
        upload: Upload,
        raw_on: Code,
        qr_code_2: QrCode,
        pen_line: PenLine,
        shield_check: ShieldCheck,
        download: Download,
        settings: Settings,
        lan: Network,
        logout: LogOut,
    };

    let open = ref(false);
    let lastIndex = ref(0);
    const { t } = useI18n({ useScope: "global" });

    let consoleErrorBuffer = [];
    window.addEventListener('error', (event) => {
        consoleErrorBuffer.push({
            message: event.message,
            source: event.filename,
            line: event.lineno,
            timestamp: new Date().toISOString()
        });
        if (consoleErrorBuffer.length > 20) consoleErrorBuffer.shift();
    });

    let items = computed(() => {
        return [
            {
                text: t("common.actionBar.Home"),
                index: 0,
                icon: "home",
                url: "/dashboard"
            },
            {
                text: t("common.actionBar.New"),
                index: 1,
                icon: "add",
                url: "/add-account"
            },
            {
                text: t("common.actionBar.TOTP"),
                index: 2,
                icon: "generating_tokens",
                url: "/totp"
            },
            {
                text: t("common.actionBar.Local"),
                index: 3,
                icon: "upload",
                url: "/local"
            },
            {
                text: t("common.actionBar.RAW"),
                index: 4,
                icon: "raw_on",
                url: "/raw-link"
            },
            {
                text: t("common.actionBar.QR"),
                index: 5,
                icon: "qr_code_2",
                url: "/qr"
            },
            {
                text: t("common.actionBar.SignMsg"),
                index: 6,
                icon: "pen_line",
                url: "/sign-message"
            },
            {
                text: t("common.actionBar.VerifyMsg"),
                index: 7,
                icon: "shield_check",
                url: "/verify-message"
            },
            {
                text: t("common.actionBar.Backup"),
                index: 8,
                icon: "download",
                url: "/backup"
            },
            {
                text: t("common.actionBar.Settings"),
                index: 9,
                icon: "settings",
                url: "/settings"
            },
            {
                text: t("common.actionBar.changeNodes"),
                index: 10,
                icon: "lan",
                url: "/nodes"
            },
            {
                text: t("common.actionBar.Logout"),
                index: 11,
                icon: "logout",
                url: "/"
            }
        ]
    });

    const hexToString = (hex) => {
        const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        return new TextDecoder().decode(bytes);
    };

    function onChange(data) {
        lastIndex.value = data.index;

        if (data.index === 11) {
            console.log("User logged out.");
            store.dispatch("WalletStore/logout");
            router.replace("/");
        }

        router.replace(items.value[data.index].url);
    }

    let logoutTimer = null;
    function clearLogoutTimer() {
        if (logoutTimer) {
            clearTimeout(logoutTimer);
            logoutTimer = null;
        }
    }

    onBeforeUnmount(() => {
        clearLogoutTimer();
    });

    function startLogoutTimer() {
        if (!store.state.WalletStore.isUnlocked) {
            return;
        }

        clearLogoutTimer();

        let timeoutMinutes = store.getters["SettingsStore/getLogoutTimeout"];
        if (!timeoutMinutes || timeoutMinutes <= 0) {
            return;
        }

        logoutTimer = setTimeout(() => {
            console.log("wallet timed logout");
            store.dispatch("WalletStore/logout");
            router.replace("/");
        }, timeoutMinutes * 60 * 1000);
    }

    watch(
        lastIndex,
        (newValue, oldValue) => {
            if (items.value[oldValue]) {
                console.log(
                    `User navigated from ${items.value[oldValue].text} to ${items.value[newValue].text}`
                );
            } else if (newValue === oldValue) {
                console.log(`Page ${items.value[newValue].text} is in use...`);
            }

            window.electron.removeAllListeners("injectedCall");

            if (store.state.WalletStore.isUnlocked) {
                const decryptKey = async (encryptedKey) => {
                    return new Promise(async (resolve, reject) => {
                        let signature = await window.electron.getSignature(
                            "decrypt"
                        );
                        if (!signature) {
                            console.log("Signature failure");
                            return reject("signature failure");
                        }

                        let isValid;
                        try {
                            isValid = await window.electron.verifyCrypto({
                                signedMessage: signature.signedMessage,
                                msgHash: signature.msgHash,
                                pubk: signature.pubk,
                            });
                        } catch (error) {
                            console.log(error);
                        }

                        if (!isValid) {
                            console.log("invalid signature");
                            return reject("invalid signature");
                        }

                        console.log("Was valid, proceeding to decrypt");
                        let decryptedKey;
                        try {
                            decryptedKey = await window.electron.decrypt({
                                data: encryptedKey,
                                inject: true,
                            });
                        } catch (error) {
                            console.log(error);
                            return reject("decrypt failure");
                        }

                        if (!decryptedKey) {
                            console.log("Decryption failure");
                            return reject("decryption failure");
                        }

                        return resolve(decryptedKey);
                    });
                };

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

                    if (
                        ["BTS", "BTS_TEST"].includes(chain) &&
                        ((!visualizedAccount && account && !account.accountName) ||
                            !visualizedParams)
                    ) {
                        console.log("Missing required fields for injected call");
                        window.electron.injectedCallError({
                            id: request.id,
                            result: {
                                isError: true,
                                method: "injectedCall.missingFields",
                                error: "Missing required fields for injected BTS call",
                            },
                        });
                        return;
                    }

                    if (
                        ["EOS", "BEOS", "TLOS", "TLOSTEST", "WAX", "WAXTEST", "EOSTEST", "FIO", "FIOTEST", "LIBRE", "LIBRETEST", "XPR", "XPRTEST", "HIVE"].includes(chain) &&
                        !visualizedParams
                    ) {
                        console.log(
                            `Missing required fields for injected ${chain} based call`
                        );
                        window.electron.injectedCallError({
                            id: request.id,
                            result: {
                                isError: true,
                                method: "injectedCall.missingFields",
                                error: `Missing required fields for injected ${chain} based call`,
                            },
                        });
                        return;
                    }

                    const popupContents = ["EOS", "BEOS", "TLOS", "TLOSTEST", "WAX", "WAXTEST", "EOSTEST", "FIO", "FIOTEST", "LIBRE", "LIBRETEST", "XPR", "XPRTEST", "HIVE"].includes(chain)
                        ? {
                            request: request,
                            visualizedAccount: visualizedAccount,
                            visualizedParams: JSON.stringify(visualizedParams),
                        }
                        : {
                            request: request,
                            visualizedAccount:
                                visualizedAccount || account.accountName,
                            visualizedParams: JSON.stringify(visualizedParams),
                        };

                    if (chain === "BTS" && foundIDs.length) {
                        popupContents["isBlockedAccount"] = isBlocked;
                    }

                    if (
                        chain === "BTS" &&
                        (!blockedAccounts || !blockedAccounts.length)
                    ) {
                        popupContents["serverError"] = true;
                    }

                    try {
                        window.electron.createPopup(popupContents);
                    } catch (error) {
                        window.electron.createError({
                            id: request.id,
                            title: t('common.popup.error.popupCreationFailed'),
                            errorMessage: t('common.popup.error.popupCreationFailedDesc'),
                            terminalError: String(error),
                            consoleLogs: [...consoleErrorBuffer],
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

                    store.dispatch("WalletStore/notifyUser", {
                        notify: "request",
                        message: t("common.apiUtils.inject"),
                    });

                    window.electron.popupApproved(request.id, async (args) => {
                        let _request = request;
                        if (
                            ["BTS", "TEST", "BTS_TEST"].includes(chain) &&
                            request.payload.memo
                        ) {
                            const readableParameters = JSON.parse(request.payload.params[1]);
                            let operations = readableParameters.operations;
                            const fromID = operations && operations.length ? operations[0][1].from : null;
                            if (!fromID) {
                                console.log("No id found");
                                return;
                            }

                            let _requiredMemoKey = store.getters["AccountStore/getPrivateMemoKey"](fromID, chain);

                            let processedKey;
                            try {
                                processedKey = await decryptKey(_requiredMemoKey);
                            } catch (error) {
                                console.log(error);
                                return;
                            }

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

                                let _blockchainRequest;
                                try {
                                    _blockchainRequest =
                                        await window.electron.blockchainRequest({
                                            methods: ["createMemoObject"],
                                            account: null,
                                            chain,
                                            from,
                                            to,
                                            optionalNonce: nonce ?? undefined,
                                            message,
                                            memoKey: processedKey
                                        });
                                } catch (error) {
                                    console.log(error);
                                }

                                if (
                                    _blockchainRequest &&
                                    _blockchainRequest.createMemoObject
                                ) {
                                    const _updatedOperation = operation;
                                    _updatedOperation[1].memo = _blockchainRequest.createMemoObject;

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
                                        let feeRequest = await window.electron.blockchainRequest({
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
                        }

                        let finalResult;
                        let notifyTXT = "";

                        let txType =
                            _request.payload.params[0] ?? "signAndBroadcast";
                        if (txType == "broadcast") {
                            try {
                                finalResult =
                                    await window.electron.blockchainRequest({
                                        methods: ["broadcastTransaction"],
                                        account: null,
                                        chain: chain,
                                        operation: _request.payload.params,
                                    });
                            } catch (error) {
                                console.log(error);
                                window.electron.createError({
                                    id: _request.id,
                                    title: t('common.popup.error.broadcastFailed'),
                                    errorMessage: t('common.popup.error.broadcastFailedDesc'),
                                    terminalError: String(error),
                                    consoleLogs: [...consoleErrorBuffer],
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
                                    consoleLogs: [...consoleErrorBuffer],
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

                        let activeKey;
                        if (["BTS", "BTS_TEST"].includes(chain)) {
                            try {
                                activeKey = request.payload.account_id
                                    ? store.getters["AccountStore/getActiveKey"](
                                        request
                                    )
                                    : store.getters[
                                        "AccountStore/getCurrentActiveKey"
                                    ]();
                            } catch (error) {
                                console.log(error);
                                window.electron.createError({
                                    id: request.id,
                                    title: t('common.popup.error.keyRetrievalFailed'),
                                    errorMessage: t('common.popup.error.keyRetrievalFailedDesc'),
                                    terminalError: String(error),
                                    consoleLogs: [...consoleErrorBuffer],
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
                        } else if (["EOS", "BEOS", "TLOS", "TLOSTEST", "WAX", "WAXTEST", "EOSTEST", "FIO", "FIOTEST", "LIBRE", "LIBRETEST", "XPR", "XPRTEST"].includes(chain)) {
                            activeKey = store.getters["AccountStore/getEOSKey"]();
                        } else if (["HIVE"].includes(chain)) {
                            activeKey = store.getters["AccountStore/getHiveKey"](request);
                        }

                        let signingKey;
                        try {
                            signingKey = await decryptKey(activeKey);
                        } catch (error) {
                            console.log(error);
                            window.electron.createError({
                                id: request.id,
                                title: t('common.popup.error.keyDecryptionFailed'),
                                errorMessage: t('common.popup.error.keyDecryptionFailedDesc'),
                                terminalError: String(error),
                                consoleLogs: [...consoleErrorBuffer],
                                timestamp: new Date().toISOString(),
                                context: `Attempting to decrypt signing key for a ${chain} transaction`
                            });
                            window.electron.injectedCallError({
                                id: request.id,
                                result: {
                                    isError: true,
                                    method: "injectedCall.getKey",
                                    error: error,
                                },
                            });
                            return;
                        }

                        if (txType == "signAndBroadcast") {
                            try {
                                if (["BTS", "BTS_TEST"].includes(chain)) {
                                    finalResult =
                                        await window.electron.blockchainRequest({
                                            methods: ["signAndBroadcast"],
                                            account: null,
                                            chain: chain,
                                            operation: request.payload.params,
                                            signingKey: signingKey,
                                        });
                                } else if (
                                    ["EOS", "BEOS", "TLOS", "TLOSTEST", "WAX", "WAXTEST", "EOSTEST", "FIO", "FIOTEST", "LIBRE", "LIBRETEST", "XPR", "XPRTEST", "HIVE"].includes(chain)
                                ) {
                                    finalResult =
                                        await window.electron.blockchainRequest({
                                            methods: ["signAndBroadcast"],
                                            account: null,
                                            chain: chain,
                                            operation: JSON.parse(
                                                request.payload.params[1]
                                            ),
                                            signingKey: signingKey,
                                        });
                                }
                            } catch (error) {
                                console.log(error);
                                window.electron.createError({
                                    id: request.id,
                                    title: t('common.popup.error.signAndBroadcastFailed'),
                                    errorMessage: t('common.popup.error.signAndBroadcastFailedDesc'),
                                    terminalError: String(error),
                                    consoleLogs: [...consoleErrorBuffer],
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
                                consoleLogs: [...consoleErrorBuffer],
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

                        if (args?.result?.receipt) {
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
                                console.log(error);
                            }
                        }

                        window.electron.injectedCallResponse({
                            id: request.id,
                            result: { result: finalResult },
                        });
                    });

                    window.electron.popupRejected(request.id, (result) => {
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
            }
            startLogoutTimer();
        },
        { immediate: true }
    );

    watch(
        () => router.currentRoute.value,
        (newRoute) => {
            if (newRoute.path === '/') {
                clearLogoutTimer();
            }

            const matchingItem = items.value.find(
                (item) => item.url === newRoute.path
            );
            if (matchingItem) {
                lastIndex.value = matchingItem.index;
            }
        }
    );

    watch(
        () => store.state.WalletStore.isUnlocked,
        (isUnlocked) => {
            if (isUnlocked) {
                startLogoutTimer();
                window.electron.setNode((data) => {
                    const _currentChain = store.getters["AccountStore/getChain"];
                    store.dispatch("SettingsStore/setNode", {
                        chain: _currentChain,
                        node: data,
                    });
                });
                window.electron.onGetSafeAccount((arg) => {
                    let account =
                        store.getters["AccountStore/getCurrentSafeAccount"]();
                    window.electron.getSafeAccountResponse(account);
                });
            } else {
                clearLogoutTimer();
            }
        },
        { immediate: true }
    );
</script>

<template>
    <div class="relative">
        <Button
            v-if="store.state.WalletStore.isUnlocked"
            size="icon-sm"
            class="rounded-full"
            @click="open = true"
        >
            <Menu class="h-4 w-4" />
        </Button>

        <DropdownMenu :open="open" @update:open="open = $event">
            <DropdownMenuTrigger as-child>
                <span />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                style="border: 1px solid #c7088e"
            >
                <DropdownMenuItem
                    v-for="item in items"
                    :key="item.icon"
                    @click="onChange(item)"
                >
                    <component
                        :is="iconMap[item.icon]"
                        class="h-4 w-4"
                        :class="lastIndex === item.index ? 'text-gray-500' : ''"
                    />
                    <span>{{ item.text }}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>
