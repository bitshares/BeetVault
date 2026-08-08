<script setup>
    import { ref, computed, watchEffect, inject, watch, onMounted, toRaw } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/ui/button';
    import { Card, CardContent } from '@/components/ui/ui/card';
    import { Loader2 } from 'lucide-vue-next';

    import AccountSelect from "./account-select";
    import Operations from "./blockchains/operations";
    import QRDrag from "./qr/Drag";
    import QRScan from "./qr/Scan";
    import QRUpload from "./qr/Upload";

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

    let chosenScope = ref();
    let qrInProgress = ref(false);
    let qrChoice = ref();
    let selectedRows = ref();

    function goBack() {
        window.electron.resetTimer();
        chosenScope.value = null;
        selectedRows.value = null;
    }

    function undoQRChoice () {
        window.electron.resetTimer();
        qrChoice.value = null;
    }
  
    function setChoice(choice) {
        window.electron.resetTimer();
        qrChoice.value = choice;
    }

    const chain = computed(() => {
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

    async function evaluateQR (data) {
        if (!data) {
            return;
        }
        window.electron.resetTimer();
        qrInProgress.value = true;

        let blockchainResponse;
        try {
            blockchainResponse = await blockchainRequest({
                methods: ["processQR"],
                chain: chain.value,
                qrChoice: qrChoice.value,
                qrData: data,
                allowedOperations: toRaw(selectedRows.value),
                location: 'qrData'
            });
        } catch (error) {
            console.log({error});
            window.electron.notify(t("common.qr.promptFailure"));
            qrInProgress.value = false;
            return;
        }

        if (!blockchainResponse || !blockchainResponse.processQR) {
            console.log("QR code processing error");
            window.electron.notify(t("common.qr.promptFailure"));
            qrInProgress.value = false;
            return;
        }

        window.electron.notify(t("common.qr.prompt_success"));
        qrInProgress.value = false;
    }
     
    let compatible = ref(false);
    let operationTypes = ref([]);
    watchEffect(() => {
        async function initialize() {
            let blockchainResponse;
            try {
                blockchainResponse = await blockchainRequest({
                    methods: ["supportsQR", "getOperationTypes"],
                    chain: chain.value
                });
            } catch (error) {
                console.log({error});
                return;
            }

            if (!blockchainResponse) {
                return;
            }

            const { supportsQR, getOperationTypes } = blockchainResponse;
            if (supportsQR) {
                compatible.value = supportsQR;
            }
            if (getOperationTypes) {
                operationTypes.value = getOperationTypes;
            }
        }
        
        if (chain.value) {
            initialize();
        }
    });

    function setScope(newValue) {
        window.electron.resetTimer();
        chosenScope.value = newValue;
        if (newValue === 'AllowAll') {
            const _rows = operationTypes.value
                .map(type => type.id)
                .filter(id => id !== 'injectedCall')
            selectedRows.value = _rows
        settingsStore.setChainPermissions(
            {
                chain: chain.value,
                rows: _rows
            }
        )
        }
    }

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
            <div v-if="qrInProgress" class="flex flex-col items-center gap-2">
                <p class="mb-0">{{ t('common.qr.progress') }}</p>
                <Loader2 class="h-6 w-6 animate-spin" />
            </div>

            <div v-else class="space-y-4">
                <AccountSelect :disabled="hasActivePopup" />

                <div v-if="!chosenScope" class="space-y-3">
                    <p class="mb-0">{{ t('common.qr.label') }}</p>

                    <Card class="w-full shadow-sm border">
                        <CardContent class="p-4">
                            <p class="mb-3">{{ t('common.chosenScope.title.qr') }}</p>
                            <div class="flex flex-wrap gap-2">
                                <Button @click="setScope('Configure')">
                                    {{ t('common.chosenScope.yes') }}
                                </Button>
                                <Button variant="outline" @click="setScope('AllowAll')">
                                    {{ t('common.chosenScope.no') }}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
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
            </div>

            <div v-if="chosenScope && selectedRows" class="space-y-4">
                <div v-if="qrChoice && qrChoice === 'Scan'">
                    <QRScan @detection="(qr) => evaluateQR(qr)" />
                    <div class="flex justify-end pt-2">
                        <Button variant="outline" @click="undoQRChoice" :disabled="hasActivePopup">
                            {{ t('common.qr.back') }}
                        </Button>
                    </div>
                </div>
                <div v-else-if="qrChoice && qrChoice === 'Drag'">
                    <QRDrag @detection="(qr) => evaluateQR(qr)" />
                    <div class="flex justify-end pt-2">
                        <Button variant="outline" @click="undoQRChoice" :disabled="hasActivePopup">
                            {{ t('common.qr.back') }}
                        </Button>
                    </div>
                </div>
                <div v-else-if="qrChoice && qrChoice === 'Upload'">
                    <QRUpload @detection="(qr) => evaluateQR(qr)" />
                    <div class="flex justify-end pt-2">
                        <Button variant="outline" @click="undoQRChoice" :disabled="hasActivePopup">
                            {{ t('common.qr.back') }}
                        </Button>
                    </div>
                </div>
                <div v-else class="space-y-3">
                    <p class="mb-0">{{ t('common.qr.main.title') }}</p>
                    <div class="flex flex-col gap-2">
                        <Button @click="setChoice('Drag')" :disabled="hasActivePopup">
                            {{ t('common.qr.main.drag') }}
                        </Button>
                        <Button @click="setChoice('Scan')" :disabled="hasActivePopup">
                            {{ t('common.qr.main.scan') }}
                        </Button>
                        <Button @click="setChoice('Upload')" :disabled="hasActivePopup">
                            {{ t('common.qr.main.upload') }}
                        </Button>
                    </div>
                </div>
            </div>

        </div>

        <div v-else class="px-4 py-3">
            {{ t('common.qr.unsupported') }}
        </div>

        <div class="flex justify-between items-center px-4 pt-2 pb-4">
            <Button v-if="chosenScope && selectedRows && !qrChoice" variant="outline" @click="goBack" :disabled="hasActivePopup">
                {{ t('common.qr.back') }}
            </Button>
            <div v-else></div>
            <Button variant="outline" @click="router.replace('/dashboard')" :disabled="hasActivePopup">
                {{ t('common.qr.exit') }}
            </Button>
        </div>
    </div>
</template>