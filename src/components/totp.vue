<script setup>
    import { watchEffect, ref, computed, onMounted, watch, toRaw } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/ui/card';
    import { Input } from '@/components/ui/ui/input';
    import { Alert, AlertDescription } from '@/components/ui/ui/alert';
    import { Badge } from '@/components/ui/ui/badge';
    import { Shield, Clock, Loader2, Copy, X } from 'lucide-vue-next';
    import { useClipboard } from '@vueuse/core';


    import AccountSelect from "./account-select";
    import Operations from "./blockchains/operations";

    import { useWalletStore } from "@/stores/walletStore.js";
    import { useAccountStore } from "@/stores/accountStore.js";
    import { useSettingsStore } from "@/stores/settingsStore.js";
    import { usePopupStore } from "@/stores/popupStore.js";
    import { blockchainRequest } from '@/lib/blockchainRequestHelper.js';
    import router from '../router/index.js';

    const { copy } = useClipboard();

    let hasActivePopup = computed(() => popupStore.hasActivePopup);

    function copyToClipboard() {
        copy(currentCode.value);
    }

    const { t } = useI18n({ useScope: "global" });
    const walletStore = useWalletStore();
    const accountStore = useAccountStore();
    const settingsStore = useSettingsStore();
    const popupStore = usePopupStore();

    let chain = computed(() => {
        return accountStore.getChain;
    });

    let selectedAccount = computed(() => {
        if (!walletStore.isUnlocked) {
            return;
        }
        return accountStore.getCurrentSafeAccount()
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
                blockchainResponse = await blockchainRequest({
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
            settingsStore.setChainPermissions(
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
        timestamp.value = null;
        newCodeRequested.value = null;
        timeLimit.value = null;
        progress.value = 0;
        showWarning.value = false;
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
    let showWarning = ref(false);
    let copyContents = ref();
    watchEffect(() => {
        async function getNewCode() {
            window.electron.resetTimer();
            let blockchainResponse;
            try {
                blockchainResponse = await blockchainRequest({
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
            showWarning.value = true;
            copyContents.value = {text: code, success: () => {console.log('copied code')}};
        }

        if (timestamp && timestamp.value) {
            getNewCode();
        }
    });

    let deepLinkInProgress = ref(false);
    window.electron.onDeepLink(async (args) => {
        if (!walletStore.isUnlocked || router.currentRoute.value.path != "/totp") {
            console.log("Wallet must be unlocked for deeplinks to work.");
            window.electron.notify(t("common.totp.promptFailure"));
            return;
        }

        let account = accountStore.getCurrentSafeAccount();
        if (!account || !currentCode.value) {
            console.log('Insufficient state to proceed')
            window.electron.notify(t("common.totp.promptFailure"));
            return;
        }

        window.electron.resetTimer();
        deepLinkInProgress.value = true;
        let blockchainResponse;
        try {
            blockchainResponse = await blockchainRequest({
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
        if (!walletStore.isUnlocked) {
            console.log("logging user out...");
            walletStore.logout();
            router.replace("/");
            return;
        }
    });
</script>

<template>
    <div class="bottom p-0">
        <div v-if="compatible" class="px-4 py-3 space-y-4">
            <AccountSelect :disabled="hasActivePopup" />

            <div v-if="deepLinkInProgress" class="flex flex-col items-center gap-2">
                <p class="mb-0">{{ t('common.totp.inProgress') }}</p>
                <Card class="w-full max-w-sm shadow-sm border">
                    <CardContent class="flex flex-col items-center py-4">
                        <Loader2 class="h-6 w-6 animate-spin" />
                    </CardContent>
                </Card>
            </div>

            <div v-else class="space-y-4">
                <p class="mb-0">{{ t('common.totp.label') }}</p>
                <p class="mb-0">{{ t('common.totp.desc') }}</p>

                <Card class="w-full shadow-sm border">
                    <CardContent class="space-y-4 p-4">
                        <div v-if="!chosenScope">
                            <p class="mb-3">{{ t('common.chosenScope.title.totp') }}</p>
                            <div class="flex flex-wrap gap-2">
                                <Button @click="setScope('Configure')">
                                    {{ t('common.chosenScope.yes') }}
                                </Button>
                                <Button variant="outline" @click="setScope('AllowAll')">
                                    {{ t('common.chosenScope.no') }}
                                </Button>
                            </div>
                        </div>

                        <div v-else-if="chosenScope == 'Configure' && !selectedRows">
                            <Operations
                                :ops="operationTypes"
                                :chain="chain"
                                @selected="(ops) => selectedRows = ops"
                                @exit="() => {
                                    chosenScope = null;
                                    selectedRows = null;
                                }"
                            />
                        </div>

                        <div v-if="chosenScope && selectedRows" class="space-y-3">
                            <div class="flex flex-wrap gap-2">
                                <Badge variant="secondary" class="flex items-center gap-1">
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

                            <div v-if="!newCodeRequested && selectedRows && selectedRows.length > 0 && !timeLimit" class="flex flex-wrap gap-2">
                                <Button variant="outline" @click="setTime(60)">60s</Button>
                                <Button variant="outline" @click="setTime(180)">3m</Button>
                                <Button variant="outline" @click="setTime(600)">10m</Button>
                            </div>

                            <div v-if="!newCodeRequested && selectedRows && selectedRows.length > 0 && timeLimit">
                                <Button @click="requestCode">
                                    {{ t('common.totp.request') }}
                                </Button>
                            </div>

                            <div v-if="currentCode && newCodeRequested" class="flex items-center gap-2">
                                <Input
                                    v-model="currentCode"
                                    readonly
                                    class="flex-1"
                                />
                                <Button variant="outline" size="icon" @click="copyToClipboard" :aria-label="t('common.copy')">
                                    <Copy class="h-4 w-4" />
                                </Button>
                            </div>

                            <Alert v-if="currentCode && newCodeRequested && showWarning" variant="secondary" class="border-yellow-500 bg-yellow-50">
                                <AlertDescription class="flex items-center justify-between">
                                    {{ t('common.totp.warning') }}
                                    <Button variant="ghost" size="icon" class="h-5 w-5" @click="showWarning = false" :aria-label="t('common.close')">
                                        <X class="h-4 w-4" />
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div class="flex flex-wrap gap-2 pt-2">
                <Button v-if="chosenScope && selectedRows" variant="outline" @click="goBack" :disabled="hasActivePopup">
                    {{ t('common.qr.back') }}
                </Button>
                <Button variant="outline" @click="router.replace('/dashboard')" :disabled="hasActivePopup">
                    {{ t('common.totp.exit') }}
                </Button>
            </div>
        </div>

        <div v-else class="px-4 py-3">
            {{ t('common.totp.unsupported') }}
        </div>
    </div>
</template>