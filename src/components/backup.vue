<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';
    
    import { useWalletStore } from '@/stores/walletStore.js';
    import { useAccountStore } from '@/stores/accountStore.js';
    import router from '../router/index.js';
    import { Button } from '@/components/ui/ui/button';
    import { Spinner } from '@/components/ui/ui/spinner';
    import { Input } from '@/components/ui/ui/input';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/ui/card';
    import { useProcessing } from '../composables/useProcessing.js';

    const { t } = useI18n({ useScope: 'global' });
    const { isProcessing, startProcessing, stopProcessing } = useProcessing();
    const walletStore = useWalletStore();
    const accountStore = useAccountStore();

    let walletpass = ref("");
    let passincorrect = ref("");
    let isDownloading = ref(false);

    const canSubmit = computed(() => walletpass.value.length > 0 && !isDownloading.value);

    async function downloadBackup() {
        if (!canSubmit.value || !walletStore.isUnlocked || router.currentRoute.value.path != "/backup") {
            return;
        }
        window.electron.resetTimer();
        startProcessing();
        isDownloading.value = true;

        const _id = walletStore.getCurrentID;

        walletStore.loadWallet({
                wallet_id: _id,
                wallet_pass: walletpass.value
            })
            .then(async () => {
                 let walletName = walletStore.getWalletName;
                 let walletTier = walletStore.getWalletTier;
                 let accounts = JSON.stringify(accountStore.getAccountList.slice());

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
                walletpass.value = "";
                window.electron.notify(t('common.start.invalid_password'));
            })
            .finally(() => {
                isDownloading.value = false;
                stopProcessing();
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
                        <Button type="button" :disabled="isProcessing" @click="downloadBackup">
                            <Spinner v-if="isDownloading" class="h-4 w-4 mr-1" />
                            {{ isDownloading ? t('common.processing') : t('common.backup_btn') }}
                        </Button>
                        <Button variant="outline" :disabled="isProcessing" @click="router.replace('/dashboard')">
                            {{ t('common.settings.exit') }}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>