<script setup>
    import { ref, onMounted, watch, computed } from "vue";
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/ui/button';
    import { Input } from '@/components/ui/ui/input';
    import { Alert, AlertDescription } from '@/components/ui/ui/alert';
    import { Checkbox } from '@/components/ui/ui/checkbox';
    import { Label } from '@/components/ui/ui/label';
    import { Spinner } from '@/components/ui/ui/spinner';
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

    let accountname = ref("");
    let cloud_pass = ref("");
    let legacy = ref(false);

    let inProgress = ref();
    let errorOcurred = ref();
    let accountError = ref(false);
    let passError = ref(false);

    watch(inProgress, (val) => emit('processing', val));

    watch(accountname, () => {
        if (accountError.value) accountError.value = false;
        if (errorOcurred.value) errorOcurred.value = false;
    });

    watch(cloud_pass, () => {
        if (passError.value) passError.value = false;
        if (errorOcurred.value) errorOcurred.value = false;
    });

    let accountInputClass = computed(() => {
        return "w-full " + (accountError.value ? "border-red-500 focus-visible:ring-red-500" : "");
    });

    let passInputClass = computed(() => {
        return "w-full " + (passError.value ? "border-red-500 focus-visible:ring-red-500" : "");
    });

    async function next() {
        // Duplicate check: skip if account already exists in wallet
        if (store.state.WalletStore.isUnlocked) {
            let chain = props.chain;
            let accountName = accountname.value;
            let duplicate = store.state.AccountStore.accountlist.find(
                x => x.chain === chain &&
                (x.accountID === accountName || x.accountName === accountName)
            );
            if (duplicate) {
                accountError.value = true;
                window.electron.notify(t("common.account_already_added"));
                return;
            }
        }

        inProgress.value = true;
        errorOcurred.value = false;

        let blockchainResponse;
        try {
            blockchainResponse = await window.electron.blockchainRequest({
                methods: ["verifyCloudAccount"],
                accountname: accountname.value,
                pass: cloud_pass.value,
                legacy: legacy.value,
                chain: props.chain
            });
        } catch (error) {
            console.log(error);
            console.log("Account verification error, check your cloud account password and try again");
            errorOcurred.value = true;
            inProgress.value = false;
            return;
        }

        if (blockchainResponse && blockchainResponse.verifyCloudAccountError) {
            const errorKey = blockchainResponse.verifyCloudAccountError.key;
            if (errorKey === "account_not_found") {
                accountError.value = true;
            } else {
                passError.value = true;
            }
            errorOcurred.value = true;
            inProgress.value = false;
            return;
        }

        if (!blockchainResponse || !blockchainResponse.verifyCloudAccount) {
            console.log("Account verification error, check your cloud account password and try again");
            errorOcurred.value = true;
            inProgress.value = false;
            return;
        }

        console.log("Account verified");

        cloud_pass.value = "";
        inProgress.value = false;
        emit('continue');
        emit('imported', [{
            account: {
                accountName: accountname.value,
                accountID: blockchainResponse.verifyCloudAccount.account.id,
                chain: props.chain,
                keys: { _vaultToken: blockchainResponse.verifyCloudAccount.token }
            }
        }]);
    }
</script>

<template>
    <div id="step2" class="space-y-3">
        <div>
            <p class="mb-1 font-semibold text-sm">
                {{ t('common.account_name', { 'chain' : chain}) }}
            </p>
            <Input
                id="inputAccount"
                v-model="accountname"
                type="text"
                :class="accountInputClass"
                :placeholder="t('common.account_name',{ 'chain' : chain})"
                :disabled="inProgress"
                required
            />
        </div>

        <div>
            <p class="mb-1">{{ t('common.btspass_cta') }}</p>
            <Input
                id="inputActive"
                v-model="cloud_pass"
                type="password"
                :class="passInputClass"
                :placeholder="t('common.btspass_placeholder')"
                :disabled="inProgress"
                required
            />
        </div>

        <div class="flex items-center gap-2">
            <Checkbox id="legacy" :checked="legacy" @update:checked="legacy = $event" :disabled="inProgress" />
            <Label for="legacy">{{ t('common.legacy_key_mode') }}</Label>
        </div>

        <div class="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" @click="emit('back')" :disabled="inProgress">
                {{ t('common.back_btn') }}
            </Button>
            <Button
                v-if="accountname !== '' && cloud_pass !== '' && !inProgress && !errorOcurred"
                @click="next"
            >
                {{ t('common.next_btn') }}
            </Button>
            <div v-if="accountname !== '' && cloud_pass !== '' && errorOcurred" class="space-y-2">
                <Button @click="next">
                    {{ t('common.next2_btn') }}
                </Button>
                <Alert variant="secondary" class="border-yellow-500 bg-yellow-50">
                    <AlertDescription>
                        {{ t('common.error_text') }}
                    </AlertDescription>
                </Alert>
            </div>
            <Button v-if="inProgress" disabled>
                <Spinner class="mr-2" />
                {{ t('common.processing') }}
            </Button>
            <Button v-if="accountname === '' || cloud_pass === ''" disabled>
                {{ t('common.next_btn') }}
            </Button>
        </div>
    </div>
</template>
