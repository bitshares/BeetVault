<script setup>
    import {ref, computed, watchEffect, watch} from "vue";

    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/ui/button';
    import { Input } from '@/components/ui/ui/input';
    import { Spinner } from '@/components/ui/ui/spinner';
    import store from '../../store/index.js';
    const { t } = useI18n({ useScope: 'global' });

    const props = defineProps({
        chain: {
            type: String,
            required: true,
            default: ''
        },
    });

    const emit = defineEmits(['back', 'continue', 'imported', 'processing']);

    let accessType = ref();
    let requiredFields = ref();
    watchEffect(() => {
        async function initialize() {
            let blockchainRequest;
            try {
                blockchainRequest = await window.electron.blockchainRequest({
                    methods: ["getAccessType", "getSignUpInput"],
                    chain: props.chain
                });
            } catch (error) {
                console.log(error);
                return;
            }
            
            if (blockchainRequest && blockchainRequest.getAccessType) {
                accessType.value = blockchainRequest.getAccessType;
            }

            if (blockchainRequest && blockchainRequest.getSignUpInput) {
                requiredFields.value = blockchainRequest.getSignUpInput;
            }

        }
        if (props.chain) {
            initialize();
        }
    });

    let accountname = ref("");
    let privateKey = ref("");
    let detectedKeyType = ref(null);
    let accountError = ref(false);
    let keyError = ref(false);
    let inProgress = ref(false);

    watch(inProgress, (val) => emit('processing', val));

    watch(accountname, () => {
        if (accountError.value) accountError.value = false;
    });

    watch(privateKey, () => {
        if (keyError.value) keyError.value = false;
    });

    let keyTypeLabel = computed(() => {
        if (!detectedKeyType.value) return null;
        return t(`common.key_type_${detectedKeyType.value}`);
    });

    let accountInputClass = computed(() => {
        return "w-full " + (accountError.value ? "border-red-500 focus-visible:ring-red-500" : "");
    });

    let keyInputClass = computed(() => {
        return "w-full " + (keyError.value ? "border-red-500 focus-visible:ring-red-500" : "");
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

        let authorities = {};
        if (requiredFields.value && requiredFields.value.privateKey) {
            authorities.privateKey = privateKey.value;
        }

        console.log("Verifying account");

        let blockchainRequest;
        try {
            blockchainRequest = await window.electron.blockchainRequest({
                methods: ["verifyAccount"],
                accountname: accountname.value,
                chain: props.chain,
                authorities: authorities
            });
        } catch (error) {
            console.log(error);
            console.log("Account verification error, check your key and try again");
            detectedKeyType.value = null;
            inProgress.value = false;
            window.electron.notify(t("common.unverified_account_error"));
            return;
        }

        if (blockchainRequest && blockchainRequest.verifyAccountError) {
            const errorKey = blockchainRequest.verifyAccountError.key;
            if (errorKey === "account_not_found") {
                accountError.value = true;
                window.electron.notify(t("common.account_not_found"));
            } else if (errorKey === "invalid_key_error") {
                keyError.value = true;
                window.electron.notify(t("common.invalid_key_error"));
            } else {
                keyError.value = true;
                window.electron.notify(t("common.unverified_account_error"));
            }
            detectedKeyType.value = null;
            inProgress.value = false;
            return;
        }

        if (blockchainRequest && blockchainRequest.verifyAccount) {
            console.log("Account verified");
            detectedKeyType.value = blockchainRequest.verifyAccount._keyType || null;

            // Clear plaintext key from memory
            authorities.privateKey = null;

            inProgress.value = false;

            if (store.state.WalletStore.isUnlocked) {
                window.electron.resetTimer();
            }

            emit('continue');
            emit('imported', [{
                account: {
                    accountName: accountname.value,
                    accountID: blockchainRequest.verifyAccount.id,
                    chain: props.chain,
                    keys: { _vaultToken: blockchainRequest.verifyAccount.token },
                    keyType: detectedKeyType.value
                }
            }]);
        }

    }
</script>

<template>
    <div id="step2" class="space-y-3">
        <div>
            <p class="mb-1 font-semibold text-sm">
                {{ t(accessType == 'account' ? 'common.account_name' : 'common.address_name', { 'chain' : chain}) }}
            </p>
            <Input
                id="inputAccount"
                v-model="accountname"
                type="text"
                :class="accountInputClass"
                :placeholder="t(accessType == 'account' ? 'common.account_name' : 'common.address_name', { 'chain' : chain})"
                :disabled="inProgress"
                required
            />
        </div>

        <template v-if="requiredFields && requiredFields.privateKey">
            <div>
                <p class="mb-1 font-semibold text-sm">
                    {{ t('common.private_key') }}
                </p>
                <Input
                    id="inputPrivateKey"
                    v-model="privateKey"
                    type="password"
                    :class="keyInputClass"
                    :placeholder="t('common.private_key_placeholder')"
                    :disabled="inProgress"
                    required
                />
            </div>

            <div v-if="detectedKeyType" class="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                <span class="font-medium text-foreground">{{ keyTypeLabel }}</span>
                <span>&mdash;</span>
                <span>{{ t('common.key_detected') }}</span>
            </div>
        </template>

        <div class="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" @click="emit('back')" :disabled="inProgress">
                {{ t('common.back_btn') }}
            </Button>

            <template v-if="requiredFields && requiredFields.privateKey">
                <Button v-if="accountname !== '' && privateKey !== '' && !inProgress" @click="next">
                    {{ t('common.next_btn') }}
                </Button>
                <Button v-else-if="inProgress" disabled>
                    <Spinner class="mr-2" />
                    {{ t('common.processing') }}
                </Button>
                <Button v-else disabled>
                    {{ t('common.next_btn') }}
                </Button>
            </template>
            <template v-else>
                <Button disabled>
                    {{ t('common.next_btn') }}
                </Button>
            </template>
        </div>
    </div>
</template>
