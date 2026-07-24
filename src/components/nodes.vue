<script setup>
    import { ref, computed, onMounted, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import AccountSelect from "./account-select";
    import { Button } from '@/components/ui/ui/button';
    import { Card, CardContent } from '@/components/ui/ui/card';
    import { ScrollArea } from '@/components/ui/ui/scroll-area';
    import { Check } from 'lucide-vue-next';
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
                                    v-for="(node, index) in storedNodes"
                                    :key="index"
                                    class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer transition-colors"
                                    role="button"
                                    tabindex="0"
                                    @click="handleClick(index)"
                                    @keydown.enter="handleClick(index)"
                                    @keydown.space.prevent="handleClick(index)"
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