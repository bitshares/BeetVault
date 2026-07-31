<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';

    import AccountSelect from "./account-select";
    import { Button } from '@/components/ui/ui/button';
    import { Input } from '@/components/ui/ui/input';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/ui/card';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ui/select';
    import { Spinner } from '@/components/ui/ui/spinner';

    import store from '../store/index.js';
    import router from '../router/index.js';
    import { useProcessing } from '../composables/useProcessing.js';

    const { t } = useI18n({ useScope: 'global' });

    let walletpass = ref("");
    let passincorrect = ref("");
    let deleting = ref(false);

    const { isProcessing, startProcessing, stopProcessing } = useProcessing();

    let selectedAccount = computed(() => {
        if (!store.state.WalletStore.isUnlocked) {
            return;
        }
        return store.getters["AccountStore/getCurrentSafeAccount"]()
    })

    let accountQuantity = computed(() => {
        if (!store.state.WalletStore.isUnlocked) {
            return 0;
        }
        return store.getters["AccountStore/getAccountQuantity"];
    })

    let selectedTimeout = ref("5");

    onMounted(() => {
        let stored = store.getters["SettingsStore/getLogoutTimeout"];
        selectedTimeout.value = String(stored);
    });

    function updateLogoutTimeout(value) {
        selectedTimeout.value = value;
        store.dispatch("SettingsStore/setLogoutTimeout", {
            timeout: Number(value)
        });
    }

    const logoutOptions = [
        { value: "1", label: "1 min" },
        { value: "2", label: "2 min" },
        { value: "5", label: "5 min" },
        { value: "10", label: "10 min" },
        { value: "15", label: "15 min" },
        { value: "0", label: "Never" }
    ];

    async function deleteAccount() {
        if (!store.state.WalletStore.isUnlocked || router.currentRoute.value.path != "/settings") {
            return;
        }
        if (deleting.value) return;
        deleting.value = true;
        startProcessing();
        window.electron.resetTimer();

        store
            .dispatch("WalletStore/deleteAccountFromWallet", {
                accountName: selectedAccount.value.accountName,
                chain: selectedAccount.value.chain,
                wallet_pass: walletpass.value
            })
            .then(async () => {
                window.electron.notify(t('common.settings.deleted'));
                deleting.value = false;
                stopProcessing();
                router.replace("/");
                passincorrect.value = "";
                walletpass.value = "";
            })
            .catch(() => {
                passincorrect.value = "border-red-500 ring-red-500";
                deleting.value = false;
                stopProcessing();
                window.electron.notify(t('common.start.invalid_password'));
            });
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
        <div class="content px-4 py-3 space-y-4 overflow-y-auto min-h-0">
            <Card class="w-full max-w-md mx-auto">
                <CardHeader class="pb-2">
                    <CardTitle>
                        <span class="underline font-semibold">{{ t('common.settings.label') }}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent class="space-y-3 p-4 pt-0">
                    <AccountSelect />

                    <div v-if="accountQuantity && accountQuantity > 1" class="space-y-4">
                        <p class="text-sm text-justify">{{ t('common.settings.prompt') }}</p>

                        <div class="space-y-2">
                            <Input
                                id="inputPassword"
                                v-model="walletpass"
                                type="password"
                                class="w-full"
                                :placeholder="t('common.password_placeholder')"
                                required
                                :class="passincorrect"
                                @focus="passincorrect = ''"
                            />
                        </div>

                        <div class="flex justify-end gap-2 pt-2">
                            <Button type="button" @click="deleteAccount" :disabled="deleting">
                                <Spinner v-if="deleting" class="mr-2" />
                                {{ deleting ? t('common.deleting') : t('common.settings.button') }}
                            </Button>
                            <Button variant="outline" @click="router.replace('/dashboard')" :disabled="deleting">
                                {{ t('common.settings.exit') }}
                            </Button>
                        </div>
                    </div>

                    <div v-else class="space-y-4">
                        <p class="text-sm text-justify">{{ t('common.settings.insufficient') }}</p>
                    </div>
                </CardContent>
            </Card>

            <Card class="w-full max-w-md mx-auto">
                <CardHeader class="pb-2">
                    <CardTitle>
                        <span class="underline font-semibold">{{ t('common.settings.logoutTitle') }}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent class="space-y-3 p-4 pt-0">
                    <p class="text-sm text-justify">{{ t('common.settings.logoutDesc') }}</p>

                    <Select :model-value="selectedTimeout" @update:model-value="updateLogoutTimeout">
                        <SelectTrigger class="w-full">
                            <SelectValue :placeholder="t('common.settings.logoutPlaceholder')" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="option in logoutOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        </div>
    </div>
</template>