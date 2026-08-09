<script setup>
    import { ref, computed, onMounted, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import AccountSelect from "./account-select";
    import { Button } from '@/components/ui/ui/button';
    import { Card, CardContent } from '@/components/ui/ui/card';
    import { ScrollArea } from '@/components/ui/ui/scroll-area';
    import { Check } from 'lucide-vue-next';
    import { useWalletStore } from '@/stores/walletStore.js';
    import { useAccountStore } from '@/stores/accountStore.js';
    import { useSettingsStore } from '@/stores/settingsStore.js';
    import { blockchains } from '@/config/config.js';
    import router from '../router/index.js';

    const { t } = useI18n({ useScope: 'global' });
    const walletStore = useWalletStore();
    const accountStore = useAccountStore();
    const settingsStore = useSettingsStore();

    function getCoreSymbol(chain) {
        if (!chain) return chain;
        const blockchain = Object.values(blockchains).find(b => b.identifier === chain);
        return blockchain ? blockchain.coreSymbol : chain;
    }

    let selectedAccount = computed(() => {
        if (!walletStore.isUnlocked) {
            return;
        }
        return accountStore.getCurrentSafeAccount()
    })

    let rawNodes = ref([]);
    let selectedNodeIndex = ref(0);

    watch(selectedAccount, (newVal) => {
        if (newVal && newVal.chain) {
            rawNodes.value = settingsStore.getNodes(newVal.chain);
            const coreSymbol = getCoreSymbol(newVal.chain);
            selectedNodeIndex.value = settingsStore.getNode[coreSymbol] || 0;
        }
    }, { immediate: true });

    let displayNodes = computed(() => {
        if (!rawNodes.value.length) return [];
        const selected = rawNodes.value[selectedNodeIndex.value];
        if (!selected) return [...rawNodes.value];
        const rest = rawNodes.value.filter((_, i) => i !== selectedNodeIndex.value);
        return [selected, ...rest];
    });

    function handleClick(originalIndex) {
        settingsStore.setNode({
            chain: selectedAccount.value.chain,
            node: originalIndex
        }).then(() => {
            const coreSymbol = getCoreSymbol(selectedAccount.value.chain);
            selectedNodeIndex.value = settingsStore.getNode[coreSymbol] || 0;
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
            <Card class="w-full max-w-lg mx-auto">
                <CardContent class="space-y-4 p-4">
                    <AccountSelect />

                    <div class="space-y-2">
                        <p class="text-sm text-justify">{{ t('common.nodes.prompt') }}</p>

                        <ScrollArea class="h-48 w-full rounded-md border">
                            <div class="p-2 space-y-1">
                                <div
                                    v-for="(node, index) in displayNodes"
                                    :key="node.url"
                                    class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer transition-colors"
                                    role="button"
                                    tabindex="0"
                                    @click="handleClick(rawNodes.indexOf(node))"
                                    @keydown.enter="handleClick(rawNodes.indexOf(node))"
                                    @keydown.space.prevent="handleClick(rawNodes.indexOf(node))"
                                >
                                    <Check v-if="index === 0" class="h-4 w-4 text-green-500" />
                                    <span class="text-sm font-medium">{{ node.url }}</span>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>

                    <div class="flex justify-end gap-2 pt-2">
                        <Button variant="outline" @click="router.replace('/dashboard')">
                            {{ t('common.nodes.exit') }}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>