<script setup>
    import { ref, computed, watchEffect, onMounted, toRaw } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/ui/button';
    import { Card } from '@/components/ui/ui/card';
    import { Badge } from '@/components/ui/ui/badge';
    import { Shield, ThumbsUp, Loader2 } from 'lucide-vue-next';

    import AccountSelect from "./account-select";
    import Operations from "./blockchains/operations";
    
    import store from '../store/index.js';
    import router from '../router/index.js';
    import { watch } from 'vue';

    const { t } = useI18n({ useScope: 'global' });

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
            store.dispatch(
                "SettingsStore/setChainPermissions",
                {
                    chain: chain.value,
                    rows: _ids
                }
            );
        }
    }

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

    let chain = computed(() => {
        return store.getters['AccountStore/getChain'];
    });

    let compatibleChain = ref();
    let operationTypes = ref([]);
    watchEffect(() => {
        async function initialize() {
            let blockchainRequest;
            try {
                blockchainRequest = await window.electron.blockchainRequest(
                    { 
                        methods: ['supportsTOTP', 'getOperationTypes'],
                        chain: chain.value
                    }
                );
            } catch (error) {
                console.error(error);
            }

            if (blockchainRequest) {
                const { supportsTOTP, getOperationTypes } = blockchainRequest;
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
        if (!store.state.WalletStore.isUnlocked || router.currentRoute.value.path != "/raw-link") {
            console.log("Wallet must be unlocked for raw deeplinks to work.");
            window.electron.notify(t("common.raw.promptFailure"));
            return;
        }

        let account = store.getters['AccountStore/getCurrentSafeAccount']();
        if (!account) {
            console.log('No account')
            deepLinkInProgress.value = false;
            return;
        }
        
        window.electron.resetTimer();

        deepLinkInProgress.value = true;

        let blockchainRequest;
        try {
            blockchainRequest = await window.electron.blockchainRequest(
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

        if (!blockchainRequest || !blockchainRequest.getRawLink) {
            console.log("Raw link processing error");
            window.electron.notify(t("common.raw.promptFailure"));
            deepLinkInProgress.value = false;
            return;
        }
        
        console.log({result: blockchainRequest.getRawLink});
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
    <div
        class="bottom p-0"
    >
        <span v-if="operationTypes && compatibleChain">
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
                    {{ t('common.raw.label') }}
                </p>
                <p style="marginBottom:0px;">
                    {{ t('common.raw.desc') }}
                </p>
                <Card
                    class="shadow-md border"
                    style="marginTop: 5px;"
                >
                    <span v-if="!chosenScope">
                        <p>
                            {{ t('common.chosenScope.title.rawLink') }}
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
                            <Badge variant="default" class="flex items-center gap-1">
                                <ThumbsUp class="h-3 w-3" />
                                Ready for raw links!
                            </Badge>
                        </div>
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
                    {{ t('common.raw.exit') }}
                </Button>
            </router-link>
        </span>
        <span v-else>
            Unsupported chain.
        </span>
    </div>
</template>
