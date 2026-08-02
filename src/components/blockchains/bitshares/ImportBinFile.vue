<script setup>
import {ref, onMounted, watch} from "vue";
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/ui/button';
import { Input } from '@/components/ui/ui/input';
import { Spinner } from '@/components/ui/ui/spinner';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/ui/table';
    import { ScrollArea } from '@/components/ui/ui/scroll-area';
    import { X } from 'lucide-vue-next';
    import store from '../../../store/index.js';

    const { t } = useI18n({ useScope: 'global' });

    const props = defineProps({
        chain: {
            type: String,
            required: true,
            default: ''
        }
    });

    const emit = defineEmits(['back', 'continue', 'imported', 'processing']);

    onMounted(() => {
        if (!["BTS", "BTS_TEST"].includes(props.chain)) {
            throw "Unsupported chain!";
        }
    })

    let inProgress = ref(false);
    let substep1 = ref(true);
    let substep2 = ref(false);
    let wallet_file = ref(null);
    let bin_file_password = ref(null);
    let accounts = ref([]);

    watch(inProgress, (val) => emit('processing', val));

    function removeAccount(id) {
        accounts.value = accounts.value.filter(x => x.id !== id);
    }

    function handleWalletSelect(e) {
        wallet_file.value = e.target.files[0];
    }

    function _getPickedAccounts() {
        let pickedAccounts = [];
        let skipped = 0;

        for (let i in accounts.value) {
            let account = accounts.value[i];

            // Duplicate check: skip if account already exists in wallet
            if (store.state.WalletStore.isUnlocked) {
                let chain = props.chain;
                let accountName = account.name;
                let duplicate = store.state.AccountStore.accountlist.find(
                    x => x.chain === chain &&
                    (x.accountID === accountName || x.accountName === accountName)
                );
                if (duplicate) {
                    skipped++;
                    continue;
                }
            }

            pickedAccounts.push({
                account: {
                    accountName: account.name,
                    accountID: account.id,
                    chain: props.chain,
                    keys: { _vaultToken: account._vaultToken }
                }
            });
        }

        if (skipped > 0) {
            window.electron.notify(t("common.account_already_added"));
        }
        
        if (pickedAccounts && pickedAccounts.length) {
            console.log('importing accounts');
            emit('imported', pickedAccounts);
            emit('continue');
        }
    }

    async function next() {
        if (substep1.value) {
            let blockchainResponse;
            try {
                inProgress.value = true;
                blockchainResponse = await window.electron.blockchainRequest({
                    methods: ["decryptBackup"],
                    location: 'importBinFile',
                    chain: props.chain,
                    filePath: wallet_file.value.path,
                    pass: bin_file_password.value
                });
            } catch (error) {
                console.log({error});
                inProgress.value = false;
                bin_file_password.value = "";
                window.electron.notify(t("common.error_text"));
                return;
            }

            if (blockchainResponse && blockchainResponse.decryptBackup) {
                accounts.value = blockchainResponse.decryptBackup;
                substep1.value = false;
                substep2.value = true;
            }

            bin_file_password.value = "";
            inProgress.value = false;
        } else {
            _getPickedAccounts();
        }
    }
</script>

<template>
    <div id="step2" class="space-y-3">
        <template v-if="substep1 && inProgress">
            <Button disabled class="w-full">
                <Spinner class="mr-2" />
                {{ t('common.processing') }}
            </Button>
        </template>
        <template v-else-if="substep1" class="space-y-3">
            <div>
                <p class="mb-1 font-semibold text-sm">{{ t('common.import_bin_file') }}</p>
                <Input
                    type="file"
                    class="w-full"
                    @change="handleWalletSelect"
                />
            </div>

            <div>
                <p class="mb-1 font-semibold text-sm">{{ t('common.import_bin_pass') }}</p>
                <Input
                    v-model="bin_file_password"
                    type="password"
                    class="w-full"
                />
            </div>

            <div class="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" @click="emit('back')">
                    {{ t('common.back_btn') }}
                </Button>
                <Button v-if="wallet_file && bin_file_password" @click="next">
                    {{ t('common.next_btn') }}
                </Button>
            </div>
        </template>

        <template v-if="substep2" class="space-y-3">
            <ScrollArea class="max-h-56 w-full rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>{{ t('common.table.name') }}</TableHead>
                        <TableHead>{{ t('common.table.active') }}</TableHead>
                        <TableHead>{{ t('common.table.owner') }}</TableHead>
                        <TableHead>{{ t('common.table.memoKey') }}</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow
                            v-for="account in accounts"
                            :key="account.id"
                        >
                            <TableCell class="text-sm">{{ account.name }}</TableCell>
                            <TableCell class="text-sm">{{ account.active.canTransact ? t('common.yes') : t('common.no') }}</TableCell>
                            <TableCell class="text-sm">{{ account.owner.canTransact ? t('common.yes') : t('common.no') }}</TableCell>
                            <TableCell class="text-sm">{{ account.memo.canSend ? t('common.yes') : t('common.no') }}</TableCell>
                            <TableCell>
                                <Button
                                    v-if="account.importable"
                                    variant="ghost"
                                    size="icon"
                                    class="h-8 w-8"
                                    @click="removeAccount(account.id)"
                                >
                                    <X class="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </ScrollArea>

            <div class="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" @click="emit('back')">
                    {{ t('common.back_btn') }}
                </Button>
                <Button
                    v-if="substep1 && (!wallet_file || !bin_file_password)"
                    disabled
                >
                    {{ t('common.next_btn') }}
                </Button>
                <Button
                    v-if="accounts && accounts.length || (substep1 && wallet_file && bin_file_password)"
                    @click="next"
                >
                    {{ t('common.next_btn') }}
                </Button>
                <Button
                    v-if="substep2 && (!accounts || !accounts.length)"
                    disabled
                >
                    {{ t('common.next_btn') }}
                </Button>
            </div>
        </template>
    </div>
</template>