<script setup>
    import { ref, onMounted, computed } from 'vue';
    import { Button } from '@/components/ui/ui/button';
    import { Spinner } from '@/components/ui/ui/spinner';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ui/select';
    import { Separator } from '@/components/ui/ui/separator';

    import { useI18n } from 'vue-i18n';
    const { t } = useI18n({ useScope: 'global' });

    import store from '../store/index.js';
    import router from '../router/index.js';
    import { useProcessing } from '../composables/useProcessing.js';

    const { startProcessing, stopProcessing } = useProcessing();

    let hasWallet = computed(() => {
        return store.getters['WalletStore/getHasWallet'];
    })

    let walletlist = computed(() => {
        return store.getters['WalletStore/getWalletList'];
    })

    let walletOptions = computed(() => {
        let wallets = store.getters['WalletStore/getWalletList'];

        return wallets.map((wallet, i) => {
            return {label: wallet.name, value: i}
        });
    })

    let walletpass = ref("");
    let selectedWallet = ref(0);
    let passincorrect = ref("");
    let storageBackend = ref(null);
    let unlocking = ref(false);

    onMounted(async () => {
        store.dispatch("WalletStore/loadWallets", {}).catch((error) => {
            console.log({error});
        });
        try {
            storageBackend.value = await window.electron.getSafeStorageBackend();
        } catch (error) {
            console.log({error});
        }
    });

    function unlockWallet() {
        if (unlocking.value) return;
        unlocking.value = true;
        startProcessing();

        store
            .dispatch("WalletStore/getWallet", {
                wallet_id: walletlist.value[selectedWallet.value].id,
                wallet_pass: walletpass.value
            })
            .then(async () => {
                try {
                    await store.dispatch("WalletStore/confirmUnlock");
                } catch (error) {
                    console.log(error);
                    unlocking.value = false;
                    stopProcessing();
                    return;
                }
                stopProcessing();
                store.dispatch("WalletStore/setSelectedWalletIndex", selectedWallet.value);
                walletpass.value = "";
                router.replace("/dashboard");
            })
            .catch(() => {
                passincorrect.value = "is-invalid";
                unlocking.value = false;
                stopProcessing();
                window.electron.notify(t('common.start.invalid_password'));
            });
    }
</script>

<template>
    <div class="bottom">
        <div class="content">
            <p
                v-if="!hasWallet"
                class="mt-3 mb-3 font-weight-normal"
            >
                <em>{{ t('common.no_wallet') }}</em>
            </p>

            <router-link
                v-if="!hasWallet && !unlocking"
                to="/create"
                replace
            >
                <Button>
                    {{ t('common.start_cta') }}
                </Button>
            </router-link>
            <Button v-else-if="!hasWallet" disabled>
                {{ t('common.start_cta') }}
            </Button>

            <p
                v-if="!hasWallet"
                class="my-2 font-weight-normal"
            >
                <em>{{ t('common.restore_lbl') }}</em>
            </p>

            <router-link
                v-if="!hasWallet && !unlocking"
                to="/restore"
                replace
            >
                <Button>
                    {{ t('common.restore_cta') }}
                </Button>
            </router-link>
            <Button v-else-if="!hasWallet" disabled>
                {{ t('common.restore_cta') }}
            </Button>

            <div v-if="hasWallet" class="w-full px-2 mt-2">
                <Select v-model="selectedWallet" @update:model-value="passincorrect=''" :disabled="unlocking">
                    <SelectTrigger class="w-full" :disabled="unlocking">
                        <SelectValue :placeholder="t('common.start.wallet_name')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="option in walletOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div v-if="hasWallet" class="w-full px-2 mt-3">
                <input
                    id="inputPassword"
                    v-model="walletpass"
                    class="w-full px-3 py-2 border rounded-md text-sm"
                    type="password"
                    :placeholder="t('common.password_placeholder')"
                    :disabled="unlocking"
                    required
                    :class="passincorrect"
                    @keypress.enter="unlockWallet"
                    @focus="passincorrect=''"
                >
            </div>
            <div v-if="hasWallet" class="mt-4">
                <Button
                    type="submit"
                    :disabled="unlocking"
                    @click="unlockWallet"
                >
                    <Spinner v-if="unlocking" class="mr-2" />
                    <template v-if="unlocking">{{ t('common.unlocking_wallet') }}</template>
                    <template v-else>{{ t('common.unlock_cta') }}</template>
                </Button>
            </div>
            <div
                v-if="storageBackend && storageBackend.backend === 'basic_text'"
                class="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 text-xs"
            >
                <strong>Warning:</strong> Your system does not have a secure keyring (backend: basic_text). 
                Encryption keys are stored in memory only. For better security, install a keyring 
                (e.g., GNOME Keyring, KDE Wallet, or libsecret).
            </div>
        </div>
            <div v-if="hasWallet" class="mb-2">
            <Separator class="my-3" />
            <div class="flex justify-center gap-2 mb-3">
                <router-link v-if="!unlocking" to="/create" replace>
                    <Button class="step_btn">
                        {{ t('common.create_cta') }}
                    </Button>
                </router-link>
                <Button v-else class="step_btn" disabled>
                    {{ t('common.create_cta') }}
                </Button>
                <router-link v-if="!unlocking" to="/restore" replace>
                    <Button class="step_btn">
                        {{ t('common.restore_cta') }}
                    </Button>
                </router-link>
                <Button v-else class="step_btn" disabled>
                    {{ t('common.restore_cta') }}
                </Button>
            </div>
        </div>
        <p class="mt-2 mb-2 small">
            &copy; 2019-2026 BitShares
        </p>
    </div>
</template>
