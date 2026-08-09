<script setup>
    import { watchEffect, ref, computed } from "vue";
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/ui/button';
    import { Card } from '@/components/ui/ui/card';
    import { Skeleton } from '@/components/ui/ui/skeleton';

    const { t } = useI18n({ useScope: 'global' });

    const props = defineProps({
        account: {
            type: Object,
            required: true,
            default() {
                return {}
            }
        },
        balances: {
            type: Array,
            required: false,
            default() {
                return []
            }
        },
        chain: {
            type: String,
            required: true,
            default: ""
        },
        isConnected: {
            type: Boolean,
            required: false,
            default: false
        },
        isConnecting: {
            type: Boolean,
            required: false,
            default: false
        }
    });

    const emit = defineEmits(['refresh']);

    let balances = computed(() => {
        return props.balances;
    });

    let selectedChain = computed(() => {
        return props.account.chain;
    });

    let accountName = computed(() => {
        return props.account.accountName;
    });


    let tableData = ref();
    async function loadBalances() {
        if (
            selectedChain.value !== '' &&
            accountName.value !== '' &&
            props.chain === selectedChain.value
        ) {
            tableData.value = null;
            emit('refresh', true);
            window.electron.resetTimer();
        } else {
            console.log("Unable to reload balances, please try again later.")
        }
    }

    watchEffect(() => {
        if (balances.value && balances.value.length) {
            tableData.value = {
                data: balances.value.map(balance => {
                    return {
                        balance: balance.balance.toLocaleString(
                            undefined,
                            { minimumFractionDigits: balance.precision }
                        ),
                        asset_name: balance.asset_name
                    }
                }),
            };
        } else {
            tableData.value = null;
        }
    });
</script>

<template>
    <div class="px-2 py-3">
        <div class="flex items-center justify-between mb-2">
            <span class="font-medium">
                {{ t('common.balances_lbl') }}
            </span>
            <Button
                v-if="isConnected || (balances && balances.length)"
                @click="loadBalances()"
            >
                {{ t('common.balances.refresh') }}
            </Button>
            <Button
                v-else-if="!isConnected && !isConnecting"
                @click="loadBalances()"
            >
                {{ t('common.balances.reconnect') }}
            </Button>
        </div>

        <div v-if="isConnecting" class="border rounded-md p-4">
            <Skeleton class="h-4 w-[250px]" />
        </div>

        <Card
            v-else-if="tableData && tableData.data && tableData.data.length"
            class="shadow-sm border overflow-hidden"
        >
            <div class="flex items-center px-3 py-2 border-b bg-muted/50">
                <div class="flex-1 text-sm font-medium text-left">
                    {{ t('common.balances.asset_name') }}
                </div>
                <div class="w-32 text-sm font-medium text-left">
                    {{ t('common.balances.balance') }}
                </div>
            </div>
            <div class="overflow-y-auto" style="max-height: 180px;">
                <div
                    v-for="(row, idx) in tableData.data"
                    :key="idx"
                    class="flex items-center px-3 py-2 border-b last:border-b-0"
                >
                    <div class="flex-1 text-sm text-left">
                        {{ row.asset_name }}
                    </div>
                    <div class="w-32 text-sm text-left">
                        {{ row.balance }}
                    </div>
                </div>
            </div>
        </Card>

        <Card
            v-else-if="balances && !balances.length && isConnected"
            class="shadow-sm border p-3 text-sm text-muted-foreground"
        >
            {{ t('common.balances.empty') }}
        </Card>

        <Card
            v-else-if="!isConnected && !isConnecting"
            class="shadow-sm border p-3 text-sm text-muted-foreground"
        >
            {{ t('common.balances.error') }}
        </Card>
    </div>
</template>
