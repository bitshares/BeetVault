<script setup>
    import { ref, computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { hashPassword } from '../lib/utils.js';
    import { useWalletStore } from '@/stores/walletStore.js';
    import router from '../router/index.js';

    const { t } = useI18n({ useScope: 'global' });
    const walletStore = useWalletStore();
    import { Button } from '@/components/ui/ui/button';
    import { Input } from '@/components/ui/ui/input';
    import { Alert, AlertDescription } from '@/components/ui/ui/alert';
    import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/ui/tooltip';
    import { Separator } from '@/components/ui/ui/separator';
    import { Info } from 'lucide-vue-next';

    let backupPass = ref("");
    let fileError = ref(false);
    let passError = ref(false);
    let selectedFile = ref(null);

    let walletlist = computed(() => {
        return walletStore.getWalletList;
    })

    function onFileSelect(e) {
        const files = e.target?.files;
        if (files && files.length) {
            selectedFile.value = files[0];
            fileError.value = false;
        }
    }

    async function restore() {
        fileError.value = false;
        passError.value = false;

        if (!selectedFile.value) {
            fileError.value = true;
            return;
        }

        if (backupPass.value === "") {
            passError.value = true;
            return;
        }

        let _hash;
        try {
            _hash = hashPassword(backupPass.value);
        } catch (error) {
            console.log(error);
            fileError.value = false;
            passError.value = true;
            walletStore.notifyUser(
                {notify: "request", message: t('common.apiUtils.restore.decryptError')}
            );
            return;
        }

        let fileContent;
        try {
            fileContent = await selectedFile.value.text();
        } catch (error) {
            console.log(error);
            fileError.value = true;
            walletStore.notifyUser(
                {notify: "request", message: t('common.apiUtils.restore.decryptError')}
            );
            return;
        }

        let parsedData;
        try {
            parsedData = await window.electron.restore({fileData: fileContent, seed: _hash});
        } catch (error) {
            console.log(error);
            fileError.value = true;
            passError.value = true;
            walletStore.notifyUser(
                {notify: "request", message: t('common.apiUtils.restore.decryptError')}
            );
            return;
        }

        if (!parsedData || !parsedData.wallet || !Array.isArray(parsedData.accounts)) {
            fileError.value = true;
            walletStore.notifyUser(
                {notify: "request", message: t('common.apiUtils.restore.decryptError')}
            );
            return;
        }

        let existingWalletNames = walletlist.value.slice().map(wallet => wallet.name);
        if (existingWalletNames.includes(parsedData.wallet)) {
            fileError.value = true;
            passError.value = true;
            console.log("A wallet with the same name already exists, aborting wallet restoration");
            walletStore.notifyUser(
                {notify: "request", message: t('common.apiUtils.restore.duplicate')}
            );
            return;
        }

        try {
            await walletStore.restoreWallet(
                {
                    backup: parsedData,
                    password: backupPass.value
                }
            );
            backupPass.value = "";
            router.replace("/");
        } catch (error) {
            console.log(error);
            backupPass.value = "";
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
                    <input
                        id="restoreWallet"
                        type="file"
                        accept=".beet"
                        @change="onFileSelect($event)"
                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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