<script setup>
    import { ref, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';
    
    import store from '../store/index.js';
    import router from '../router/index.js';
    import { Button } from '@/components/ui/ui/button';

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
                let accounts = JSON.stringify(store.getters['AccountStore/getAccountList'].slice());

                window.electron.downloadBackup({
                    walletName: walletName,
                    accounts: accounts,
                    seed: walletpass.value
                });
                
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
            <u>{{ t('common.backup_lbl') }}</u>
        </p>
        <div class="grid grid-cols-12 row px-4">
            <div
                class="col-span-12 largeHeader"
            >
                <p class="small text-justify">
                    {{ t('common.backup_txt') }}
                </p>
            </div>
            <div class="col-span-3" />
            <div class="col-span-6">
                <input
                    id="inputPassword"
                    v-model="walletpass"
                    style="width:97%; margin-top: 5px;"
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
                    @click="downloadBackup"
                >
                    {{ t('common.backup_btn') }}
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
                        Exit settings menu
                    </Button>
                </router-link>
            </div>
            <div class="col-span-3" />
        </div>
    </div>
</template>
