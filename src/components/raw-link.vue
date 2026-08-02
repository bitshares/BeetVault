<script setup>
    import { ref, computed, watch, watchEffect, onMounted, toRaw } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/ui/button';
    import { Card, CardContent } from '@/components/ui/ui/card';
    import { Badge } from '@/components/ui/ui/badge';
    import { Shield, ThumbsUp, Loader2, Info } from 'lucide-vue-next';

    import AccountSelect from "./account-select";
    import Operations from "./blockchains/operations";
    
    import { useWalletStore } from '@/stores/walletStore.js';
    import { useAccountStore } from '@/stores/accountStore.js';
    import { useSettingsStore } from '@/stores/settingsStore.js';
    import { usePopupStore } from '@/stores/popupStore.js';
    import { blockchainRequest } from '@/lib/blockchainRequestHelper.js';
    import router from '../router/index.js';

    const { t } = useI18n({ useScope: 'global' });
    const walletStore = useWalletStore();
    const accountStore = useAccountStore();
    const settingsStore = useSettingsStore();
    const popupStore = usePopupStore();

    let hasActivePopup = computed(() => popupStore.hasActivePopup);

    let selectedRows = ref();
    let chosenScope = ref();

    function goBack() {
        window.electron.resetTimer();
        chosenScope.value = null;
        selectedRows.value = null;
    }

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

    let chain = computed(() => {
        return accountStore.getChain;
    });

    let compatibleChain = ref();
    let operationTypes = ref([]);
    watchEffect(() => {
        async function initialize() {
            let blockchainResponse;
            try {
                blockchainResponse = await blockchainRequest(
                    { 
                        methods: ['supportsTOTP', 'getOperationTypes'],
                        chain: chain.value
                    }
                );
            } catch (error) {
                console.error(error);
            }

            if (blockchainResponse) {
                const { supportsTOTP, getOperationTypes } = blockchainResponse;
                if (supportsTOTP) {
                    compatibleChain.value = supportsTOTP;
                }
                if (getOperationTypes) {
                    operationTypes.value = getOperationTypes;
                }
            }
        }
        if (chain.value) {
            initialize();
        }
    });

    let deepLinkInProgress = ref(false);
    window.electron.onRawDeepLink(async (args) => {
        if (!walletStore.isUnlocked || router.currentRoute.value.path != "/raw-link") {
            console.log("Wallet must be unlocked for raw deeplinks to work.");
            window.electron.notify(t("common.raw.promptFailure"));
            return;
        }

        let account = accountStore.getCurrentSafeAccount();
        if (!account) {
            console.log('No account')
            deepLinkInProgress.value = false;
            return;
        }
        
        window.electron.resetTimer();

        deepLinkInProgress.value = true;

        let blockchainResponse;
        try {
            blockchainResponse = await blockchainRequest(
                { 
                    methods: ['getRawLink'],
                    chain: account.chain,
                    requestBody: args.request,
                    allowedOperations: toRaw(selectedRows.value)
                }
            );
        } catch (error) {
            console.log({error});
            deepLinkInProgress.value = false;
            window.electron.notify(t("common.raw.promptFailure"));
            return;
        }

        if (!blockchainResponse || !blockchainResponse.getRawLink) {
            console.log("Raw link processing error");
            window.electron.notify(t("common.raw.promptFailure"));
            deepLinkInProgress.value = false;
            return;
        }
        
        console.log({result: blockchainResponse.getRawLink});
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
        <div v-if="operationTypes && compatibleChain" class="px-4 py-3 space-y-4">
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
                <p class="mb-0">{{ t('common.raw.label') }}</p>
                <p class="mb-0">{{ t('common.raw.desc') }}</p>

                <Card class="w-full shadow-sm border">
                    <CardContent class="space-y-4 p-4">
                        <div v-if="!chosenScope">
                            <p class="mb-3">{{ t('common.chosenScope.title.rawLink') }}</p>
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
                                <Badge variant="default" class="flex items-center gap-1">
                                    <ThumbsUp class="h-3 w-3" />
                                    {{ t('common.raw.ready') }}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div class="flex flex-wrap gap-2 pt-2">
                <Button v-if="chosenScope && selectedRows" variant="outline" @click="goBack" :disabled="hasActivePopup">
                    {{ t('common.qr.back') }}
                </Button>
                <router-link :to="'/dashboard'" replace>
                    <Button variant="outline" :disabled="hasActivePopup">
                        {{ t('common.raw.exit') }}
                    </Button>
                </router-link>
            </div>
        </div>

        <div v-else class="px-4 py-3">
            {{ t('common.chain.unsupported') }}
        </div>
    </div>
</template>