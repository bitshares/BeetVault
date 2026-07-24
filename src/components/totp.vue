<script setup>
    import { watchEffect, ref, computed, onMounted, watch, toRaw } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/ui/button';
    import { Card } from '@/components/ui/ui/card';
    import { Input } from '@/components/ui/ui/input';
    import { Alert, AlertDescription } from '@/components/ui/ui/alert';
    import { Badge } from '@/components/ui/ui/badge';
    import { Shield, Clock, Loader2 } from 'lucide-vue-next';
    import { useClipboard } from '@vueuse/core';


    import AccountSelect from "./account-select";
    import Operations from "./blockchains/operations";

    import store from '../store/index.js';
    import router from '../router/index.js';

    const { copy } = useClipboard();

    function copyToClipboard() {
        copy(currentCode.value);
    }

    const { t } = useI18n({ useScope: 'global' });

    let chain = computed(() => {
        return store.getters['AccountStore/getChain'];
    });

    let selectedAccount = computed(() => {
        if (!store.state.WalletStore.isUnlocked) {
            return;
        }
        return store.getters["AccountStore/getCurrentSafeAccount"]()
    })

    watch(selectedAccount, async (newVal, oldVal) => {
        console.log("User changed account - resetting configured scope!")
        chosenScope.value = null;
        selectedRows.value = null;
    }, {immediate: true});
    
    let compatible = ref(false);
    let operationTypes = ref([]);
    watchEffect(() => {
        async function initialize() {
            let blockchainResponse;
            try {
                blockchainResponse = await window.electron.blockchainRequest({
                    methods: ["supportsTOTP", "getOperationTypes"],
                    chain: chain.value
                });
            } catch (error) {
                console.log(error);
                return;
            }

            if (!blockchainResponse) {
                console.log("No blockchain response");
                return;
            }

            const { supportsTOTP, getOperationTypes } = blockchainResponse;
            if (supportsTOTP) {
                compatible.value = supportsTOTP;
            }
            if (getOperationTypes) {
                operationTypes.value = getOperationTypes;
            }
        }

        if (chain.value) {
            initialize();
        }
    })

    let selectedRows = ref();
    let chosenScope = ref();
    function setScope(newValue) {
        window.electron.resetTimer();
        chosenScope.value = newValue;
        if (newValue === 'AllowAll') {
            const _ids = operationTypes.value.map(type => type.id);
            selectedRows.value = _ids;
            store.dispatch(
                "SettingsStore/setChainPermissions",
                {
                    chain: chain.value,
                    rows: _ids
                }
            );
        }
    }

    function goBack() {
        window.electron.resetTimer();
        chosenScope.value = null;
        selectedRows.value = null;
        //
        timestamp.value = null;
        newCodeRequested.value = null;
        timeLimit.value = null;
        progress.value = 0;
    }

    let timestamp = ref();
    let newCodeRequested = ref(false);
    function requestCode() {
        window.electron.resetTimer();
        newCodeRequested.value = true;
        timestamp.value = new Date();
    }
 
    let timeLimit = ref();
    function setTime(time) {
        timeLimit.value = time;
    }

    let progress = ref(0);
    watchEffect(() => {
        setInterval(
            () => {
                if (!timestamp.value) {
                    return;
                } else if (progress.value >= timeLimit.value) {
                    progress.value = 0;
                    newCodeRequested.value = false;
                    timestamp.value = null;
                } else {
                    let currentTimestamp = new Date();
                    var seconds = (currentTimestamp.getTime() - timestamp.value.getTime()) / 1000;
                    progress.value = seconds;
                }
            },
            1000
        );
    });

    let currentCode = ref();
    let copyContents = ref();
    watchEffect(() => {
        async function getNewCode() {
            window.electron.resetTimer();
            let blockchainResponse;
            try {
                blockchainResponse = await window.electron.blockchainRequest({
                    methods: ["totpCode"],
                    chain: chain.value,
                    timestamp: timestamp.value
                });
            } catch (error) {
                console.log(error);
                return;
            }

            if (!blockchainResponse || !blockchainResponse.code) {
                console.log("No blockchain response");
                return;
            }

            const { code } = blockchainResponse;
            currentCode.value = code;
            copyContents.value = {text: code, success: () => {console.log('copied code')}};
        }

        if (timestamp && timestamp.value) {
            getNewCode();
        }
    });

    let deepLinkInProgress = ref(false);
    window.electron.onDeepLink(async (args) => {
        if (!store.state.WalletStore.isUnlocked || router.currentRoute.value.path != "/totp") {
            console.log("Wallet must be unlocked for deeplinks to work.");
            window.electron.notify(t("common.totp.promptFailure"));
            return;
        }

        let account = store.getters['AccountStore/getCurrentSafeAccount']();
        if (!account || !currentCode.value) {
            console.log('Insufficient state to proceed')
            window.electron.notify(t("common.totp.promptFailure"));
            return;
        }

        window.electron.resetTimer();
        deepLinkInProgress.value = true;
        let blockchainResponse;
        try {
            blockchainResponse = await window.electron.blockchainRequest({
                methods: ["totpDeeplink"],
                chain: chain.value,
                currentCode: currentCode.value,
                allowedOperations: toRaw(selectedRows.value),
                requestContent: args.request
            });
        } catch (error) {
            console.log(error);
            deepLinkInProgress.value = false;
            window.electron.notify(t("common.totp.failed"));
            return;
        }

        if (!blockchainResponse || !blockchainResponse.totpDeeplink) {
            console.log("No blockchain response");
            deepLinkInProgress.value = false;
            window.electron.notify(t("common.totp.failed"));
            return;
        }

        console.log({result: blockchainResponse.totpDeeplink})
        window.electron.notify(t("common.local.promptSuccess"));
        deepLinkInProgress.value = false;
    });

    onMounted(() => {
        if (!store.state.WalletStore.isUnlocked) {
            console.log("logging user out...");
            store.dispatch("WalletStore/logout");
            router.replace("/");
            return;
        }
    });
</script>

<template>
    <div class="bottom p-0">
        <span v-if="compatible">
            <AccountSelect />
            <span v-if="deepLinkInProgress">
                <p style="marginBottom:0px;">
                    {{ t('common.totp.inProgress') }}
                </p>
                <Card
                    class="shadow-md border"
                    style="marginTop: 5px;"
                >
                    <br>
                    <Loader2 class="h-6 w-6 animate-spin" />
                    <br>
                </Card>
            </span>
            <span v-else>
                <p style="marginBottom:0px;">
                    {{ t('common.totp.label') }}
                </p>
                <p style="marginBottom:0px;">
                    {{ t('common.totp.desc') }}
                </p>
                <Card
                    class="shadow-md border"
                    style="marginTop: 5px;"
                >
                    <span v-if="!chosenScope">
                        <p>
                            {{ t('common.chosenScope.title.totp') }}
                        </p>
                        <Button
                            style="margin-right:5px; margin-bottom: 5px;"
                            @click="setScope('Configure')"
                        >
                            {{ t('common.chosenScope.yes') }}
                        </Button>
                        <Button
                            style="margin-right:5px; margin-bottom: 5px;"
                            @click="setScope('AllowAll')"
                        >
                            {{ t('common.chosenScope.no') }}
                        </Button>
                    </span>
                    <span v-else-if="chosenScope == 'Configure' && !selectedRows">
                        <Operations
                            :ops="operationTypes"
                            :chain="chain"
                            @selected="(ops) => selectedRows = ops"
                            @exit="() => {
                                chosenScope = null;
                                selectedRows = null;
                            }"
                        />
                    </span>

                    <span v-if="chosenScope && selectedRows">
                        <div class="flex flex-wrap gap-2">
                            <Badge variant="secondary" class="flex items-center gap-1" style="margin-left:30px;">
                                <Shield class="h-3 w-3" />
                                {{ selectedRows ? selectedRows.length : 0 }} {{ t('common.totp.chosen') }}
                            </Badge>
                            <Badge
                                v-if="selectedRows && selectedRows.length && newCodeRequested"
                                variant="secondary"
                                class="flex items-center gap-1"
                            >
                                <Clock class="h-3 w-3" />
                                {{ t('common.totp.time') }}: {{ timeLimit - progress.toFixed(0) }}s
                            </Badge>
                        </div>
                        <span
                            v-if="!newCodeRequested && selectedRows && selectedRows.length > 0 && !timeLimit"
                            style="padding-left: 20px;"
                        >
                            <Button
                                style="margin-right:10px; margin-bottom: 10px;"
                                @click="setTime(60)"
                            >
                                60s
                            </Button>
                            <Button
                                style="margin-right:10px; margin-bottom: 10px;"
                                @click="setTime(180)"
                            >
                                3m
                            </Button>
                            <Button
                                style="margin-bottom: 10px;"
                                @click="setTime(600)"
                            >
                                10m
                            </Button>
                        </span>
                        <span>
                            <Button
                                v-if="!newCodeRequested && selectedRows && selectedRows.length > 0 && timeLimit"
                                style="margin-left: 30px; margin-right:5px; margin-bottom: 10px;"
                                @click="requestCode"
                            >
                                {{ t('common.totp.request') }}
                            </Button>
                        </span>
                        <div v-if="currentCode && newCodeRequested" class="flex items-center gap-1" style="margin:5px;">
                            <Input
                                v-model="currentCode"
                                readonly
                                class="flex-1"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                @click="copyToClipboard"
                            >
                                content_copy
                            </Button>
                        </div>
                        <Alert
                            v-if="currentCode && newCodeRequested"
                            class="border-yellow-500 bg-yellow-50"
                            style="margin:10px;"
                        >
                            <AlertDescription class="flex items-center justify-between">
                                {{ t('common.totp.warning') }}
                                <button @click="currentCode = null" class="ml-2">×</button>
                            </AlertDescription>
                        </Alert>
                    </span>
                </Card>
            </span>

            <Button
                v-if="chosenScope && selectedRows"
                style="margin-right:5px"
                @click="goBack"
            >
                {{ t('common.qr.back') }}
            </Button>
            <router-link
                :to="'/dashboard'"
                replace
            >
                <Button
                    variant="outline"
                    class="step_btn"
                >
                    {{ t('common.totp.exit') }}
                </Button>
            </router-link>
        </span>
        <span v-else>
            {{ t('common.totp.unsupported') }}
        </span>
    </div>
</template>