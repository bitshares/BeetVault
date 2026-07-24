<script setup>
    import { ref, computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    const { t } = useI18n({ useScope: 'global' });

    import store from '../store/index.js';
    import router from '../router/index.js';
    import { Button } from '@/components/ui/ui/button';
    import { Input } from '@/components/ui/ui/input';
    import { Alert, AlertDescription } from '@/components/ui/ui/alert';
    import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/ui/tooltip';
    import { Separator } from '@/components/ui/ui/separator';
    import { Info } from 'lucide-vue-next';

    let backupPass = ref("");
    let fileError = ref(false);
    let passError = ref(false);

    let walletlist = computed(() => {
        return store.getters['WalletStore/getWalletList'];
    })

    async function restore() {
        fileError.value = false;
        passError.value = false;

        if (!document.getElementById('restoreWallet').files[0]) {
            fileError.value = true;
            return;
        }

        if (backupPass.value === "") {
            passError.value = true;
            return;
        }

        let _hash;
        try {
            _hash = window.electron.sha512({data: backupPass.value});
        } catch (error) {
            console.log(error);
            fileError.value = false;
            passError.value = true;
            store.dispatch(
                "WalletStore/notifyUser",
                {notify: "request", message: t('common.apiUtils.restore.decryptError')}
            );
            return;
        }

        backupPass.value = "";

        let file = document.getElementById('restoreWallet').files[0].path;
        let parsedData;
        try {
            parsedData = window.electron.restore({file: file, seed: _hash});
        } catch (error) {
            console.log(error);
            fileError.value = true;
            passError.value = true;
            store.dispatch(
                "WalletStore/notifyUser",
                {notify: "request", message: t('common.apiUtils.restore.decryptError')}
            );
            return;
        }

        let existingWalletNames = walletlist.value.slice().map(wallet => wallet.name);
        if (existingWalletNames.includes(parsedData.wallet)) {
            fileError.value = true;
            passError.value = true;
            console.log("A wallet with the same name already exists, aborting wallet restoration");
            store.dispatch(
                "WalletStore/notifyUser",
                {notify: "request", message: t('common.apiUtils.restore.duplicate')}
            );
            return;
        }

        try {
            await store.dispatch(
                'WalletStore/restoreWallet',
                {
                    backup: parsedData,
                    password: backupPass.value
                }
            );
            router.replace("/");
        } catch (error) {
            console.log(error);
            return;
        }
    }
</script>

<template>
    <div class="bottom p-0">
        <div class="content px-4 py-3">
            <h4 class="text-lg font-bold mt-2 mb-4">
                {{ t('common.restore_lbl') }}
            </h4>

            <Separator class="my-3" />

            <div class="mb-4">
                <Tooltip>
                    <TooltipTrigger as-child>
                        <p class="mb-2 font-semibold text-sm">
                            {{ t('common.backupfile_cta') }} <Info class="inline h-3 w-3" />
                        </p>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{{ t('common.tooltip_backupfile_cta') }}</p>
                    </TooltipContent>
                </Tooltip>

                <div class="flex items-center gap-2">
                    <Input
                        id="restoreWallet"
                        type="file"
                        class="w-full"
                        required
                    />
                </div>

                <Alert v-if="fileError" variant="destructive" class="mt-2">
                    <AlertDescription>
                        {{ t('common.invalidFile') }}
                    </AlertDescription>
                </Alert>
            </div>

            <Separator class="my-3" />

            <div class="mb-4">
                <Tooltip>
                    <TooltipTrigger as-child>
                        <p class="mb-2 font-semibold text-sm">
                            {{ t('common.backuppass_cta') }} <Info class="inline h-3 w-3" />
                        </p>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{{ t('common.tooltip_backuppass_cta') }}</p>
                    </TooltipContent>
                </Tooltip>

                <Input
                    id="backupPass"
                    v-model="backupPass"
                    type="password"
                    class="mb-3"
                    :placeholder="t('common.password_placeholder')"
                    required
                    @focus="passError = false"
                />

                <Alert v-if="passError" variant="destructive" class="mt-2">
                    <AlertDescription>
                        {{ t('common.invalidPass') }}
                    </AlertDescription>
                </Alert>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <Button variant="outline" @click="router.replace('/')">
                    {{ t('common.cancel_btn') }}
                </Button>
                <Button type="submit" @click="restore">
                    {{ t('common.restore_go_cta') }}
                </Button>
            </div>
        </div>
    </div>
</template>