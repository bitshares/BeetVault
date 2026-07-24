<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';

    import AccountSelect from "./account-select";
    import { Button } from '@/components/ui/ui/button';

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
                passincorrect.value = "is-invalid";
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
    <div
        class="dapp-list mt-2"
        style="text-align: center; margin-top: auto; margin-bottom: auto;"
    >
        <p>
            <u>{{ t('common.settings.label') }}</u>
        </p>
        <AccountSelect />
        <div
            v-if="accountQuantity && accountQuantity > 1"
            class="grid grid-cols-12 row px-4"
        >
            <div
                class="col-span-12 largeHeader"
            >
                <p class="small text-justify">
                    {{ t('common.settings.prompt') }}
                </p>
            </div>
            <div class="col-span-3" />
            <div class="col-span-6">
                <input
                    id="inputPassword"
                    v-model="walletpass"
                    style="width:97%;"
                    type="password"
                    class="form-control mb-4 px-3"
                    :placeholder=" t('common.password_placeholder')"
                    required
                    :class="passincorrect"
                    @focus="passincorrect=''"
                >
                <br>
                <Button
                    class="step_btn"
                    type="button"
                    @click="deleteAccount"
                >
                    {{ t('common.settings.button') }}
                </Button><br>
                <router-link
                    :to="'/dashboard'"
                    style="text-decoration: none;"
                    replace
                >
                    <Button
                        variant="outline"
                        class="step_btn"
                    >
                        {{ t('common.settings.exit') }}
                    </Button>
                </router-link>
            </div>
            <div class="col-span-3" />
        </div>
        <div
            v-else
            class="grid grid-cols-12 row px-4"
        >
            <div
                class="col-span-12 largeHeader"
            >
                <p class="small text-justify">
                    {{ t('common.settings.insufficient') }}
                </p>
            </div>
        </div>
    </div>
</template>
