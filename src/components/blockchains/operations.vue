<script setup>
    import { onMounted, watchEffect, ref } from 'vue';
    import { Button } from '@/components/ui/ui/button';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/ui/table';
    import { Checkbox } from '@/components/ui/ui/checkbox';
    import { ScrollArea } from '@/components/ui/ui/scroll-area';
    import { useI18n } from 'vue-i18n';
    import store from '../../store/index.js';

    const { t } = useI18n({ useScope: 'global' });
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
    onMounted(() => {
        let rememberedRows = store.getters['SettingsStore/getChainPermissions'](props.chain);
        if (!rememberedRows || !rememberedRows.length) {
            selected.value = [];
            return;
        }

        selected.value = rememberedRows;
    })

    function saveRows() {
        window.electron.resetTimer();
        store.dispatch(
            "SettingsStore/setChainPermissions",
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
                    <TableRow v-for="(item, idx) in props.ops" :key="item.id">
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