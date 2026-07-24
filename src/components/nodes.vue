<script setup>
    import { ref, computed, onMounted, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import AccountSelect from "./account-select";
    import { Button } from '@/components/ui/ui/button';

    import store from '../store/index.js';
    import router from '../router/index.js';

    const { t } = useI18n({ useScope: 'global' });

    let selectedAccount = computed(() => {
        if (!store.state.WalletStore.isUnlocked) {
            return;
        }
        return store.getters["AccountStore/getCurrentSafeAccount"]()
    })

    let storedNodes = ref([]);

    watch(selectedAccount, (newVal) => {
        if (newVal && newVal.chain) {
            storedNodes.value = store.getters["SettingsStore/getNodes"](newVal.chain);
        }
    }, { immediate: true });

    function handleClick(node) {
        store.dispatch("SettingsStore/setNode", {
            chain: selectedAccount.value.chain,
            node: node
        }).then(() => {
            storedNodes.value = [...store.getters["SettingsStore/getNodes"](selectedAccount.value.chain)];
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
        <AccountSelect />
        <div class="grid grid-cols-12 row px-4">
            <div
                class="col-span-12 largeHeader"
            >
                <p class="small text-justify">
                    {{ t('common.nodes.prompt') }}
                </p>
            </div>
            <div class="col-span-6">
                <div style="max-height: 200px; overflow-y: auto;">
                    <div class="flex flex-col">
                        <div v-for="(node, index) in storedNodes" :key="index" class="flex items-center p-2 hover:bg-accent rounded-md cursor-pointer" @click="handleClick(index)">
                            <div class="flex-1">{{ index === 0 ? "✔️" : "" }} {{ storedNodes[index].url }}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-span-6">
                <router-link
                    :to="'/dashboard'"
                    style="text-decoration: none;"
                    replace
                >
                    <Button
                        variant="outline"
                        class="step_btn"
                    >
                        {{ t('common.nodes.exit') }}
                    </Button>
                </router-link>
            </div>
            <div class="col-span-3" />
        </div>
    </div>
</template>
