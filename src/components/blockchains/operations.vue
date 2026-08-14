<script setup>
    import { onMounted, watchEffect, ref, computed } from 'vue';
    import { Button } from '@/components/ui/ui/button';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/ui/table';
    import { Checkbox } from '@/components/ui/ui/checkbox';
    import { ScrollArea } from '@/components/ui/ui/scroll-area';
    import { useI18n } from 'vue-i18n';
    import { useSettingsStore } from '@/stores/settingsStore.js';
    import { INJECTED_CALL } from '@/lib/Actions.js';
    import { VAULTA_FAMILY } from '@/lib/blockchains/chainFamilies.js';

    const { t } = useI18n({ useScope: 'global' });
    const settingsStore = useSettingsStore();
    const props = defineProps({
        ops: {
            type: Array,
            required: true,
            default() {
                return []
            }
        },
        chain: {
            type: String,
            required: true,
            default() {
                return ''
            }
        }
    });
    const emit = defineEmits(['selected', 'exit']);

    let selected = ref([]);

    const CUSTOM_OPS_ID = 'customOperations';

    const filteredOps = computed(() => {
        return props.ops.filter(op => op.id !== INJECTED_CALL && op.id !== CUSTOM_OPS_ID);
    });

    const hasCustomOps = computed(() => {
        return VAULTA_FAMILY.includes(props.chain) &&
            props.ops.some(op => op.id === CUSTOM_OPS_ID);
    });

    onMounted(() => {
        let rememberedRows = settingsStore.getChainPermissions(props.chain);
        if (!rememberedRows || !rememberedRows.length) {
            selected.value = [];
            return;
        }

        selected.value = rememberedRows.filter(row => row !== INJECTED_CALL);
    })

    function saveRows() {
        window.electron.resetTimer();
        settingsStore.setChainPermissions(
            {
                chain: props.chain,
                rows: selected.value
            }
        );
        emit('selected', selected.value);
    }

    function goBack() {
        window.electron.resetTimer();
        emit('exit', true);
    }

    function toggleRow(id) {
        const idx = selected.value.indexOf(id);
        if (idx > -1) {
            selected.value.splice(idx, 1);
        } else {
            selected.value.push(id);
        }
    }
</script>

<template>
    <div class="space-y-3 p-2">
        <p class="mb-0">{{ t('common.totp.prompt') }}</p>
        <p v-if="!props.ops || !props.ops.length" class="mt-2">
            {{ t('common.totp.unsupported') }}
        </p>
        <ScrollArea v-else class="h-60 w-full rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead class="w-10"></TableHead>
                        <TableHead>{{ t('common.operations.id') }}</TableHead>
                        <TableHead>{{ t('common.operations.method') }}</TableHead>
                        <TableHead>{{ t('common.operations.info') }}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow v-for="(item, idx) in filteredOps" :key="item.id">
                        <TableCell>
                            <Checkbox
                                :checked="selected.includes(item.id)"
                                @update:checked="toggleRow(item.id)"
                            />
                        </TableCell>
                        <TableCell>{{ item.id }}</TableCell>
                        <TableCell>{{ t(`operations.injected.${props.chain === 'BTS_TEST' ? 'BTS' : props.chain}.${item.method}.method`) }}</TableCell>
                        <TableCell>{{ t(`operations.injected.${props.chain === 'BTS_TEST' ? 'BTS' : props.chain}.${item.method}.tooltip`) }}</TableCell>
                    </TableRow>
                    <template v-if="hasCustomOps">
                        <TableRow>
                            <TableCell colspan="4" class="p-0">
                                <div class="border-t border-border my-1 mx-2"></div>
                            </TableCell>
                        </TableRow>
                        <TableRow class="bg-muted/30">
                            <TableCell>
                                <Checkbox
                                    :checked="selected.includes('customOperations')"
                                    @update:checked="toggleRow('customOperations')"
                                />
                            </TableCell>
                            <TableCell class="font-medium">{{ t('common.operations.customOps.id') }}</TableCell>
                            <TableCell>{{ t('common.operations.customOps.method') }}</TableCell>
                            <TableCell>{{ t('common.operations.customOps.tooltip') }}</TableCell>
                        </TableRow>
                    </template>
                </TableBody>
            </Table>
        </ScrollArea>
        <div class="flex flex-wrap gap-2">
            <Button variant="outline" @click="goBack">
                {{ t('common.qr.back') }}
            </Button>
            <Button @click="saveRows">
                {{ t('common.totp.save') }}
            </Button>
        </div>
    </div>
</template>