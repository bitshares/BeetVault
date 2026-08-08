<script setup>
    import { watch, ref, computed, watchEffect } from "vue";
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/ui/button';
    import { Input } from '@/components/ui/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ui/select';
    import { Checkbox } from '@/components/ui/ui/checkbox';
    import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/ui/tooltip';
    import { Separator } from '@/components/ui/ui/separator';
    import { ScrollArea } from '@/components/ui/ui/scroll-area';
    import { Spinner } from '@/components/ui/ui/spinner';
    import { Info } from 'lucide-vue-next';

    import ImportCloudPass from "./blockchains/bitshares/ImportCloudPass";
    import ImportBinFile from "./blockchains/bitshares/ImportBinFile";
    import ImportMemo from "./blockchains/bitshares/ImportMemo";
    import ImportKeys from "./blockchains/ImportKeys";

    import { useWalletStore } from '@/stores/walletStore.js';
    import { useAccountStore } from '@/stores/accountStore.js';
    import { blockchainRequest } from '@/lib/blockchainRequestHelper.js';
    import router from '../router/index.js';
    import { blockchains } from "../config/config.js";
    import { useProcessing } from '../composables/useProcessing.js';

    const { startProcessing, stopProcessing } = useProcessing();

    const { t } = useI18n({ useScope: 'global' });
    const walletStore = useWalletStore();
    const accountStore = useAccountStore();

    let importMethod = ref(null);
    let walletname = ref("");
    let password = ref("");
    let securityTier = ref("medium");
    let step = ref(1);
    let stepMessage = ref(t('common.step_counter', {step_no: 1}));

    watch(step, async (newVal, oldVal) => {
        if (newVal !== oldVal) {
            if (walletStore.isUnlocked) {
                window.electron.resetTimer();
            }
            stepMessage.value = t('common.step_counter', {step_no: newVal});
        }
    }, {immediate: true});

    let s1c = ref("");
    let selectedChain = ref(0);
    let selectedImport = ref(0);

    let accounts_to_import = ref(null);
    let confirmPassword = ref(null);
    let saving = ref(false);

    let userHasWallet = computed(() => {
        let hasWallet;
        try {
        hasWallet = walletStore.getHasWallet;
        } catch (error) {
            console.log(error);
            return [];
        }
        return hasWallet;
    });

    let chainList = computed(() => {
        return Object.values(blockchains).sort((a, b) => {
            if (!!a.testnet != !!b.testnet) {
                return a.testnet ? 1 : -1;
            }
            return a.name > b.name;
        });
    });

    let createNewWallet = computed(() => {
        return !walletStore.isUnlocked;
    });

    let selectedImportOptions = ref([]);
    watchEffect(() => {
        async function lookup() {
            let blockchainResponse;
            try {
                blockchainResponse = await blockchainRequest({
                    methods: ["getImportOptions"],
                    chain: selectedChain.value
                });
            } catch (error) {
                console.log(error);
                return;
            }
            
            if (blockchainResponse.getImportOptions) {
                selectedImportOptions.value = blockchainResponse.getImportOptions;
            }
        }

        if (selectedChain.value) {
            lookup();
        }
    });

    watch(selectedChain, async (newVal, oldVal) => {
        if (newVal !== oldVal) {
            if (walletStore.isUnlocked) {
                window.electron.resetTimer();
            }
            selectedImport.value = 0;
        }
    }, {immediate: true});

    let selectedImportOption = computed(() => {
        if (!selectedChain.value || !selectedChain.value) {
            return null;
        }

        let useImport = !selectedImport.value || !selectedImport.value
            ? selectedImportOptions.value[0]
            : selectedImport.value;

        return selectedImportOptions.value.find(option => { return option.type == useImport.type; });
    });

    function step1() {
        step.value = 1;
    }

    function step2() {

        if (userHasWallet.value == true && createNewWallet.value == false) {
            console.log('adding to existing wallet')
            step.value = 2;
            let fetchedName;
            try {
                fetchedName = walletStore.getWalletName;
            } catch (error) {
                console.log(error);
                return;
            }
            walletname.value = fetchedName;
            return;
        }

        if (walletname.value.trim() == "") {
            window.electron.notify(t("common.empty_wallet_error"));
            s1c.value = "border-red-500 ring-red-500";
            return;
        }

        let walletList = walletStore.getWalletList;
        if (walletList.map(wallet => wallet.name).includes(walletname.value.trim())) {
            window.electron.notify(t("common.duplicate_wallet_error"));
            s1c.value = "border-red-500 ring-red-500";
            return;
        }

        walletname.value = walletname.value.trim();
        step.value = 2;
    }

    function _handleError(err) {
        if (err == "invalid") {
            window.electron.notify(t("common.invalid_password"));
        } else if (err == "update_failed") {
            window.electron.notify(t("common.update_failed"));
        } else if (err.key) {
            window.electron.notify(t(`common.${err.key}`));
        } else {
            window.electron.notify(err.toString());
        }
    }

    async function addAccounts() {
        if (saving.value) return;
        saving.value = true;
        startProcessing();

        if (!accounts_to_import.value) {
            window.electron.notify(t(`common.addAccount.none_selected`));
            saving.value = false;
            stopProcessing();
            return;
        }

        if (!password.value || password.value === "") {
            window.electron.notify(t(`common.confirm_pass_error`));
            saving.value = false;
            stopProcessing();
            return;
        }

        if ((!userHasWallet.value || createNewWallet.value) && password.value !== confirmPassword.value) {
            window.electron.notify(t(`common.confirm_pass_error`));
            saving.value = false;
            stopProcessing();
            return;
        }

        for (let account of accounts_to_import.value) {
            if (!userHasWallet.value || createNewWallet.value) {
                try {
                    await walletStore.saveWallet({
                        walletname: walletname.value,
                        password: password.value,
                        walletdata: account.account,
                        tier: securityTier.value
                    });
                } catch (error) {
                    console.log(error);
                    _handleError(error);
                    saving.value = false;
                    password.value = "";
                    confirmPassword.value = "";
                    stopProcessing();
                    return;
                }
            } else {
                account.password = password.value;
                account.walletname = walletname.value;

                try {
                    await accountStore.addAccount(account);
                } catch (error) {
                    console.log(error);
                    _handleError(error);
                    saving.value = false;
                    password.value = "";
                    confirmPassword.value = "";
                    stopProcessing();
                    return;
                }
            }
        }

        stopProcessing();
        password.value = "";
        confirmPassword.value = "";

        if (walletStore.isUnlocked) {
            walletStore.logout();
        }
        router.replace("/");
    }
</script>

<template>
    <div class="bottom p-0">
        <div class="content px-4 py-3">
            <h4 class="text-lg font-bold mt-2 mb-4">
                {{ stepMessage }}
            </h4>

            <ScrollArea class="flex-1">
                <div v-if="step == 1" id="step1" class="space-y-4">
                    <template v-if="createNewWallet">
                        <Tooltip>
                            <TooltipTrigger as-child>
                                <p class="mb-2 font-semibold text-sm">
                                    {{ t('common.friendly_cta') }} <Info class="inline h-3 w-3" />
                                </p>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{{ t('common.tooltip_friendly_cta') }}</p>
                            </TooltipContent>
                        </Tooltip>
                        <Input
                            id="inputWallet"
                            v-model="walletname"
                            type="text"
                            class="mb-3"
                            :class="s1c"
                            :placeholder="t('common.walletname_placeholder')"
                            required
                            @focus="s1c = ''"
                        />
                    </template>

                    <p class="mb-2 font-semibold text-sm">
                        {{ t('common.chain_cta') }}
                    </p>
                    <Select v-model="selectedChain" @update:model-value="s1c = ''">
                        <SelectTrigger class="w-full">
                            <SelectValue :placeholder="t('common.select_chain')" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem
                                v-for="chain in chainList"
                                :key="chain.identifier"
                                :value="chain.identifier"
                            >
                                <span v-if="chain.testnet">
                                    {{ t('common.testnet_prefix') }} {{ chain.name }} ({{ chain.identifier }})
                                </span>
                                <span v-else>
                                    {{ chain.name }} ({{ chain.identifier }})
                                </span>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <div v-if="selectedImportOptions.length > 0">
                        <p class="mb-2 font-semibold text-sm">
                            {{ t('common.bts_importtype_cta') }}
                        </p>
                        <Select v-model="selectedImport" @update:model-value="s1c = ''">
                            <SelectTrigger class="w-full">
                                <SelectValue :placeholder="t('common.import_placeholder')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    v-for="option in selectedImportOptions"
                                    :key="option.type"
                                    :value="option"
                                >
                                    {{ t(`common.${option.translate_key}`) }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div class="flex justify-end gap-2 pt-2">
                        <Button variant="outline" @click="router.replace(createNewWallet ? '/' : '/dashboard')">
                            {{ t('common.cancel_btn') }}
                        </Button>

                        <template v-if="selectedImportOptions.length > 0">
                            <Button v-if="selectedImport != 0" type="submit" @click="step2">
                                {{ t('common.next_btn') }}
                            </Button>
                            <Button v-else disabled type="submit">
                                {{ t('common.next_btn') }}
                            </Button>
                        </template>
                        <template v-else>
                            <Button v-if="walletname !== '' && selectedChain !== 0" type="submit" @click="step2">
                                {{ t('common.next_btn') }}
                            </Button>
                            <Button v-else disabled type="submit">
                                {{ t('common.next_btn') }}
                            </Button>
                        </template>
                    </div>
                </div>

                <div v-else-if="step == 2" id="step2" class="space-y-4">
                    <ImportKeys
                        v-if="selectedImportOption.type == 'ImportKeys'"
                        v-model="importMethod"
                        :chain="selectedChain"
                        @back="() => step -= 1"
                        @continue="() => step = 3"
                        @imported="(x) => accounts_to_import = x"
                        @processing="(val) => val ? startProcessing() : stopProcessing()"
                    />
                    <ImportCloudPass
                        v-else-if="selectedImportOption.type == 'bitshares/ImportCloudPass'"
                        v-model="importMethod"
                        :chain="selectedChain"
                        @back="() => step -= 1"
                        @continue="() => step = 3"
                        @imported="(x) => accounts_to_import = x"
                        @processing="(val) => val ? startProcessing() : stopProcessing()"
                    />
                    <ImportBinFile
                        v-else-if="selectedImportOption.type == 'bitshares/ImportBinFile'"
                        v-model="importMethod"
                        :chain="selectedChain"
                        @back="() => step -= 1"
                        @continue="() => step = 3"
                        @imported="(x) => accounts_to_import = x"
                        @processing="(val) => val ? startProcessing() : stopProcessing()"
                    />
                    <ImportMemo
                        v-else-if="selectedImportOption.type == 'bitshares/ImportMemo'"
                        v-model="importMethod"
                        :chain="selectedChain"
                        @back="() => step -= 1"
                        @continue="() => step = 3"
                        @imported="(x) => accounts_to_import = x"
                        @processing="(val) => val ? startProcessing() : stopProcessing()"
                    />
                    <div v-else>
                        {{ t('common.noImportOption') }}
                    </div>
                </div>

                    <div v-else-if="step == 3" id="step3" class="space-y-4">
                    <div>
                        <p class="mb-4 text-sm text-muted-foreground">
                            {{ t('common.add_account_password_cta') }}
                        </p>

                        <Input
                            id="inputPass"
                            v-model="password"
                            type="password"
                            class="mb-3"
                            :placeholder="t('common.password_placeholder')"
                            :disabled="saving"
                            required
                        />

                        <template v-if="createNewWallet">
                            <p class="mb-2 font-semibold text-sm">
                                {{ t('common.confirm_cta') }}
                            </p>
                            <Input
                                id="inputConfirmPass"
                                v-model="confirmPassword"
                                type="password"
                                class="mb-3"
                                :placeholder="t('common.confirm_placeholder')"
                                :disabled="saving"
                                required
                            />
                        </template>

                        <template v-if="createNewWallet">
                            <p class="mb-2 font-semibold text-sm">
                                {{ t('common.security_tier_cta') }}
                            </p>
                            <Select v-model="securityTier" :disabled="saving">
                                <SelectTrigger class="w-full mb-3">
                                    <SelectValue :placeholder="t('common.select_tier')" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">
                                        {{ t('common.tier_low') }}
                                    </SelectItem>
                                    <SelectItem value="medium">
                                        {{ t('common.tier_medium') }}
                                    </SelectItem>
                                    <SelectItem value="high">
                                        {{ t('common.tier_high') }}
                                    </SelectItem>
                                    <SelectItem value="max">
                                        {{ t('common.tier_max') }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </template>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <Button variant="outline" @click="step -= 1" :disabled="saving">
                            {{ t('common.back_btn') }}
                        </Button>

                        <Button type="submit" @click="addAccounts" :disabled="saving">
                            <Spinner v-if="saving" class="mr-2" />
                            <template v-if="saving">
                                {{ t('common.processing') }}
                            </template>
                            <template v-else>
                                {{ t('common.next_btn') }}
                            </template>
                        </Button>
                    </div>
                </div>
            </ScrollArea>
        </div>
    </div>
</template>