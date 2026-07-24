<script setup>
import { ref, computed, onMounted, watch, toRaw } from "vue";
import { useI18n } from "vue-i18n";
import { Button } from '@/components/ui/ui/button';
import { Card, CardContent } from '@/components/ui/ui/card';
import { Input } from '@/components/ui/ui/input';
import { Loader2 } from 'lucide-vue-next';

import AccountSelect from "./account-select";
import Operations from "./blockchains/operations";

import store from "../store/index.js";
import router from "../router/index.js";

const { t } = useI18n({ useScope: "global" });

let chosenScope = ref();
let selectedRows = ref();
let inProgress = ref(false);

function goBack() {
    window.electron.resetTimer();
    chosenScope.value = null;
    selectedRows.value = null;
}

let chain = computed(() => {
    return store.getters["AccountStore/getChain"];
});

let selectedAccount = computed(() => {
    if (!store.state.WalletStore.isUnlocked) {
        return;
    }
    return store.getters["AccountStore/getCurrentSafeAccount"]();
});

watch(
    selectedAccount,
    async (newVal, oldVal) => {
        console.log("User changed account - resetting configured scope!");
        chosenScope.value = null;
        selectedRows.value = null;
    },
    { immediate: true }
);

let supportsLocal = ref(false);
let operationTypes = ref([]);
onMounted(async () => {
    async function initialize() {
        let blockchainResponse;
        try {
            blockchainResponse = await window.electron.blockchainRequest({
                methods: ["supportsLocal", "getOperationTypes"],
                chain: chain.value,
                location: "local",
            });
        } catch (error) {
            console.log({ error });
            inProgress.value = false;
            window.electron.notify(t("common.local.promptFailure"));
            console.log("BlockchainRequest failure");
            return;
        }

        if (blockchainResponse.supportsLocal) {
            supportsLocal.value = blockchainResponse.supportsLocal;
        }

        if (blockchainResponse.getOperationTypes) {
            operationTypes.value = blockchainResponse.getOperationTypes;
        }
    }

    initialize();
});

function setScope(newValue) {
    window.electron.resetTimer();
    chosenScope.value = newValue;
    if (newValue === "AllowAll") {
        const _ids = operationTypes.value.map((type) => type.id);
        selectedRows.value = _ids;
        store.dispatch("SettingsStore/setChainPermissions", {
            chain: chain.value,
            rows: _ids,
        });
    }
}

async function onFileUpload(a) {
    window.electron.resetTimer();
    inProgress.value = true;

    let account = store.getters["AccountStore/getCurrentSafeAccount"]();
    if (!account) {
        console.log("No account selected");
        inProgress.value = false;
        return;
    }

    let blockchainResponse;
    try {
        blockchainResponse = await window.electron.blockchainRequest({
            methods: ["localFileUpload"],
            chain: chain.value,
            filePath: a[0].sourceFile.path,
            allowedOperations: toRaw(selectedRows.value),
        });
    } catch (error) {
        console.log({ error });
        inProgress.value = false;
        window.electron.notify(t("common.local.promptFailure"));
        return;
    }

    if (!blockchainResponse || !blockchainResponse.localFileUpload) {
        console.log({
            msg: "No blockchain response",
            blockchainResponse,
            request: {
                methods: ["localFileUpload"],
                chain: chain.value,
                filePath: a[0].sourceFile.path,
                allowedOperations: toRaw(selectedRows.value),
            },
        });
        inProgress.value = false;
        window.electron.notify(t("common.local.promptFailure"));
        return;
    }

    inProgress.value = false;
    window.electron.notify(t("common.local.promptSuccess"));
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
        <div v-if="supportsLocal" class="px-4 py-3 space-y-4">
            <AccountSelect />

            <div v-if="!chosenScope" class="space-y-3">
                <p class="mb-0">{{ t("common.local.label") }}</p>
                <p class="mb-0">{{ t("common.local.desc") }}</p>

                <Card class="w-full shadow-sm border">
                    <CardContent class="space-y-4 p-4">
                        <div v-if="!selectedRows">
                            <p class="mb-3">{{ t("common.chosenScope.title.local") }}</p>
                            <div class="flex flex-wrap gap-2">
                                <Button @click="setScope('Configure')">
                                    {{ t("common.chosenScope.yes") }}
                                </Button>
                                <Button variant="outline" @click="setScope('AllowAll')">
                                    {{ t("common.chosenScope.no") }}
                                </Button>
                            </div>
                        </div>

                        <div v-else-if="chosenScope == 'Configure' && !selectedRows">
                            <Operations
                                :ops="operationTypes"
                                :chain="chain"
                                @selected="(ops) => (selectedRows = ops)"
                                @exit="
                                    () => {
                                        chosenScope = null;
                                        selectedRows = null;
                                    }
                                "
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div v-if="chosenScope && selectedRows" class="space-y-4">
                <div v-if="!inProgress" class="space-y-3">
                    <p>{{ t("common.local.label") }}</p>
                    <p>{{ t("common.local.desc") }}</p>
                    <h4 class="text-lg font-bold">{{ t("common.local.upload") }}</h4>
                    <Input
                        type="file"
                        accept="application/json"
                        @change="onFileUpload($event)"
                        class="w-full"
                    />
                </div>

                <div v-else class="flex flex-col items-center gap-2 py-4">
                    <Loader2 class="h-6 w-6 animate-spin" />
                    <p class="text-lg font-bold">{{ t("common.local.progress") }}</p>
                </div>
            </div>

            <div class="flex flex-wrap gap-2 pt-2">
                <Button v-if="chosenScope && selectedRows" variant="outline" @click="goBack">
                    {{ t("common.local.back") }}
                </Button>
                <Button variant="outline" @click="router.replace('/dashboard')">
                    {{ t("common.local.exit") }}
                </Button>
            </div>
        </div>

        <div v-else class="px-4 py-3">
            {{ t("common.local.unsupported") }}
        </div>
    </div>
</template>