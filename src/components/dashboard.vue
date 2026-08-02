<script setup>
    import { computed, watchEffect, ref, onMounted } from "vue";

    import Balances from "./balances";
    import AccountDetails from "./account-details";
    import AccountSelect from "./account-select";

    import { useWalletStore } from '@/stores/walletStore.js';
    import { useAccountStore } from '@/stores/accountStore.js';
    import router from '../router/index.js';
    import { blockchainRequest } from '@/lib/blockchainRequestHelper.js';
    const walletStore = useWalletStore();
    const accountStore = useAccountStore();

    let selectedAccount = computed(() => {
        if (!walletStore.isUnlocked) {
            return;
        }
        return accountStore.getCurrentSafeAccount()
    })
    
    let isConnected = ref();
    let isConnecting = ref();
    let lastBlockchain = ref(null);
    let fetchQty = ref(1);

    let _explorer = ref("");
    let _accessType = ref("");
    let _balances = ref([]);
    let _chain = ref("");

    watchEffect(async () => {
        async function lookupBlockchain() {
            isConnecting.value = true;
            isConnected.value = false;
            _balances.value = [];
            let selectedDifferentChain = !lastBlockchain.value || (lastBlockchain.value && lastBlockchain.value !== selectedAccount.value.chain);
            if (selectedDifferentChain) {
                lastBlockchain.value = selectedAccount.value.chain;
            }

            _chain.value = selectedAccount.value.chain;

            let blockchainResponse;
            try { 
                blockchainResponse = await blockchainRequest({
                    methods: selectedDifferentChain
                        ? ['getExplorer', 'getAccessType', 'getBalances']
                        : ['getExplorer', 'getBalances'],
                    account: selectedAccount.value,
                    chain: selectedAccount.value.chain,
                })
            } catch (error) {
                console.log({error});
            }

            if (!blockchainResponse) {
                console.log("No blockchain request");
                isConnecting.value = false;
                isConnected.value = false;
                return;
            }

            if (blockchainResponse.getExplorer) {
                _explorer.value = blockchainResponse.getExplorer;
            }
            if (blockchainResponse.getAccessType) {
                _accessType.value = blockchainResponse.getAccessType;
            }
            if (blockchainResponse.getBalances) {
                _balances.value = JSON.parse(blockchainResponse.getBalances);
            }

            isConnecting.value = false;
            isConnected.value = true;
        }

        if (selectedAccount.value && fetchQty.value) {
            console.log(`Fetching blockchain data #${fetchQty.value}`);
            lookupBlockchain();
        }
    });

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
    <div
        class="container px-2 py-2"
        style="min-height:700px;"
    >
        <AccountSelect />
        <div v-if="selectedAccount">
            <AccountDetails
                :account="selectedAccount"
                :explorer="_explorer"
                :type="_accessType"
            />
            <Balances
                :account="selectedAccount"
                :balances="_balances"
                :chain="_chain"
                :is-connected="isConnected"
                :is-connecting="isConnecting"
                @refresh="() => fetchQty += 1"
            />
        </div>
    </div>
</template>
