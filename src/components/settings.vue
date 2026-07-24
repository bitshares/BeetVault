<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';

    import AccountSelect from "./account-select";
    import { Button } from '@/components/ui/ui/button';
    import { Input } from '@/components/ui/ui/input';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/ui/card';

    import store from '../store/index.js';
    import router from '../router/index.js';

    const { t } = useI18n({ useScope: 'global' });

    let walletpass = ref("");
    let passincorrect = ref("");

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

    async function deleteAccount() {
        if (!store.state.WalletStore.isUnlocked || router.currentRoute.value.path != "/settings") {
            return;
        }
        window.electron.resetTimer();

        store
            .dispatch("WalletStore/deleteAccountFromWallet", {
                accountName: selectedAccount.value.accountName,
                chain: selectedAccount.value.chain,
                wallet_pass: walletpass.value
            })
            .then(async () => {
                window.electron.notify(t('common.settings.deleted'));
                router.replace("/");
                passincorrect.value = "";
                walletpass.value = "";
            })
            .catch(() => {
                passincorrect.value = "border-red-500 ring-red-500";
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
        <div class="content px-4 py-3">
            <Card class="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>
                        <span class="underline font-semibold">{{ t('common.settings.label') }}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
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
                            <Button type="button" @click="deleteAccount">
                                {{ t('common.settings.button') }}
                            </Button>
                            <Button variant="outline" @click="router.replace('/dashboard')">
                                {{ t('common.settings.exit') }}
                            </Button>
                        </div>
                    </div>

                    <div v-else class="space-y-4">
                        <p class="text-sm text-justify">{{ t('common.settings.insufficient') }}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>