<script setup>
    import { ref, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';
    
    import store from '../store/index.js';
    import router from '../router/index.js';
    import { Button } from '@/components/ui/ui/button';
    import { Input } from '@/components/ui/ui/input';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/ui/card';

    const { t } = useI18n({ useScope: 'global' });

    let walletpass = ref("");
    let passincorrect = ref("");

    async function downloadBackup() {
        if (!store.state.WalletStore.isUnlocked || router.currentRoute.value.path != "/backup") {
            return;
        }
        window.electron.resetTimer();

        const _id = store.getters['WalletStore/getCurrentID'];

        store
            .dispatch("WalletStore/getWallet", {
                wallet_id: _id,
                wallet_pass: walletpass.value
            })
            .then(async () => {
                let walletName = store.getters['WalletStore/getWalletName'];
                let walletTier = store.getters['WalletStore/getWalletTier'];
                let accounts = JSON.stringify(store.getters['AccountStore/getAccountList'].slice());

                window.electron.downloadBackup({
                    walletName: walletName,
                    walletTier: walletTier,
                    accounts: accounts
                });
                
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
                    <CardTitle class="text-center">
                        <span class="underline font-semibold">{{ t('common.backup_lbl') }}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                    <p class="text-sm text-justify">{{ t('common.backup_txt') }}</p>

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
                        <Button type="button" @click="downloadBackup">
                            {{ t('common.backup_btn') }}
                        </Button>
                        <Button variant="outline" @click="router.replace('/dashboard')">
                            {{ t('common.settings.exit') }}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>