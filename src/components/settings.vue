<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';

    import AccountSelect from "./account-select";
    import { Button } from '@/components/ui/ui/button';
    import { Input } from '@/components/ui/ui/input';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/ui/card';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ui/select';
    import { Spinner } from '@/components/ui/ui/spinner';

    import { useWalletStore } from '@/stores/walletStore.js';
    import { useAccountStore } from '@/stores/accountStore.js';
    import { useSettingsStore } from '@/stores/settingsStore.js';
    import { usePopupStore } from '@/stores/popupStore.js';
    import router from '../router/index.js';
    import { useProcessing } from '../composables/useProcessing.js';

    const { t } = useI18n({ useScope: 'global' });
    const walletStore = useWalletStore();
    const accountStore = useAccountStore();
    const settingsStore = useSettingsStore();
    const popupStore = usePopupStore();

    let hasActivePopup = computed(() => popupStore.hasActivePopup);

    let walletpass = ref("");
    let passincorrect = ref("");
    let deleting = ref(false);

    const { isProcessing, startProcessing, stopProcessing } = useProcessing();

    let selectedAccount = computed(() => {
        if (!walletStore.isUnlocked) {
            return;
        }
        return accountStore.getCurrentSafeAccount()
    })

    let accountQuantity = computed(() => {
        if (!walletStore.isUnlocked) {
            return 0;
        }
        return accountStore.getAccountQuantity;
    })

    let selectedTimeout = ref("5");

    onMounted(() => {
        let stored = settingsStore.getLogoutTimeout;
        selectedTimeout.value = String(stored);
    });

    function updateLogoutTimeout(value) {
        selectedTimeout.value = value;
        settingsStore.setLogoutTimeout({
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
        if (!walletStore.isUnlocked || router.currentRoute.value.path != "/settings") {
            return;
        }
        if (deleting.value) return;
        deleting.value = true;
        startProcessing();
        window.electron.resetTimer();

        walletStore.deleteAccountFromWallet({
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
                walletpass.value = "";
                deleting.value = false;
                stopProcessing();
                window.electron.notify(t('common.start.invalid_password'));
            });
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
        <div class="content px-4 py-3 space-y-4 overflow-y-auto min-h-0">
            <Card class="w-full max-w-md mx-auto">
                <CardHeader class="pb-2">
                    <CardTitle>
                        <span class="underline font-semibold">{{ t('common.settings.label') }}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent class="space-y-3 p-4 pt-0">
                    <AccountSelect :disabled="deleting || hasActivePopup" />

                    <div v-if="accountQuantity && accountQuantity > 1" class="space-y-4">
                        <p class="text-sm text-justify">{{ t('common.settings.prompt') }}</p>

                        <div class="space-y-2">
                            <Input
                                id="inputPassword"
                                v-model="walletpass"
                                type="password"
                                class="w-full"
                                :placeholder="t('common.password_placeholder')"
                                :disabled="deleting"
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
                            <Button variant="outline" @click="router.replace('/dashboard')" :disabled="deleting || hasActivePopup">
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