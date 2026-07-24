<script setup>
    import { ref, computed, watchEffect, inject, watch, onMounted, toRaw } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/ui/button';
    import { Card } from '@/components/ui/ui/card';
    import { Loader2 } from 'lucide-vue-next';

    import AccountSelect from "./account-select";
    import Operations from "./blockchains/operations";
    import QRDrag from "./qr/Drag";
    import QRScan from "./qr/Scan";
    import QRUpload from "./qr/Upload";

    import store from '../store/index.js';
    import router from '../router/index.js';

    const { t } = useI18n({ useScope: 'global' });

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

    async function evaluateQR (data) {
        if (!data) {
            return;
        }
        window.electron.resetTimer();
        qrInProgress.value = true;

        let blockchainResponse;
        try {
            blockchainResponse = await window.electron.blockchainRequest({
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
                blockchainResponse = await window.electron.blockchainRequest({
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
            const _rows = operationTypes.value.map(type => type.id)
            selectedRows.value = _rows
            store.dispatch(
                "SettingsStore/setChainPermissions",
                {
                    chain: chain.value,
                    rows: _rows
                }
            )
        }
    }

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
            <span v-if="qrInProgress">
                <p>
                    {{ t('common.qr.progress') }}
                </p>
                <Loader2 class="h-6 w-6 animate-spin" />
            </span>
            <span v-else>
                <AccountSelect />
                <p
                    v-if="!chosenScope"
                    style="marginBottom:0px;"
                >
                    {{ t('common.qr.label') }}
                </p>
                <Card
                    v-if="!selectedRows"
                    class="shadow-md border"
                    style="marginTop: 5px;"
                >
                    <span v-if="!chosenScope">
                        <p>
                            {{ t('common.chosenScope.title.qr') }}
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
                </Card>
            </span>

            
            <span v-if="chosenScope && selectedRows">
                <span v-if="qrChoice && qrChoice === 'Scan'">
                    <QRScan @detection="(qr) => evaluateQR(qr)" />
                    <br>
                    <Button @click="undoQRChoice()">
                        {{ t('common.qr.back') }}
                    </Button>
                </span>
                <span v-else-if="qrChoice && qrChoice === 'Drag'">
                    <QRDrag @detection="(qr) => evaluateQR(qr)" />
                    <br>
                    <Button @click="undoQRChoice()">
                        {{ t('common.qr.back') }}
                    </Button>
                </span>
                <span v-else-if="qrChoice && qrChoice === 'Upload'">
                    <QRUpload @detection="(qr) => evaluateQR(qr)" />
                    <br>
                    <Button @click="undoQRChoice()">
                        {{ t('common.qr.back') }}
                    </Button>
                </span>
                <span v-else>
                    <p style="marginBottom:0px;">
                        {{ t('common.qr.main.title') }}
                    </p>
                    <br>
                    <Button
                        style="margin-bottom: 10px;"
                        @click="setChoice('Drag')"
                    >
                        {{ t('common.qr.main.drag') }}
                    </Button>
                    <br>
                    <Button
                        style="margin-bottom: 10px;"
                        @click="setChoice('Scan')"
                    >
                        {{ t('common.qr.main.scan') }}
                    </Button>
                    <br>
                    <Button
                        style="margin-bottom: 10px;"
                        @click="setChoice('Upload')"
                    >
                        {{ t('common.qr.main.upload') }}
                    </Button>
                </span>
            </span>

            <br>
            <Button
                v-if="chosenScope && selectedRows && !qrChoice"
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
                    {{ t('common.qr.exit') }}
                </Button>
            </router-link>
        </span>
        <span v-else>
            {{ t('common.qr.unsupported') }}
        </span>
    </div>
</template>
