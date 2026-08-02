<script setup>
    import {ref, watchEffect, watch, computed} from "vue";
    import { Button } from '@/components/ui/ui/button';
    import { Spinner } from '@/components/ui/ui/spinner';
    import { useI18n } from 'vue-i18n';
    import { useWalletStore } from '@/stores/walletStore.js';
    import { useAccountStore } from '@/stores/accountStore.js';
    import { blockchainRequest } from '@/lib/blockchainRequestHelper.js';
    const { t } = useI18n({ useScope: 'global' });
    const walletStore = useWalletStore();
    const accountStore = useAccountStore();

    const props = defineProps({
        chain: {
            type: String,
            required: true,
            default: ''
        }
    });

    const emit = defineEmits(['back', 'continue', 'imported', 'processing']);

    let accountname = ref("");
    let memopk = ref("");
    let accountError = ref(false);
    let keyError = ref(false);
    let inProgress = ref(false);

    watch(inProgress, (val) => emit('processing', val));

    watch(accountname, () => {
        if (accountError.value) accountError.value = false;
    });

    watch(memopk, () => {
        if (keyError.value) keyError.value = false;
    });

    let accountInputClass = computed(() => {
        return "form-control mb-3 " + (accountError.value ? "border-red-500" : "");
    });

    let memoInputClass = computed(() => {
        return "form-control mb-3 small " + (keyError.value ? "border-red-500" : "");
    });

    let accessType = ref();
    let requiredFields = ref();
    watchEffect(() => {
        async function initialize() {
            let blockchainResponse;
            try {
                blockchainResponse = await blockchainRequest({
                    methods: ["getAccessType", "getSignUpInput"],
                    chain: props.chain
                });
            } catch (error) {
                console.log(error);
                return;
            }

            if (blockchainResponse && blockchainResponse.getAccessType) {
                accessType.value = blockchainResponse.getAccessType;
            }

            if (blockchainResponse && blockchainResponse.getSignUpInput) {
                requiredFields.value = blockchainResponse.getSignUpInput;
            }
        }

        if (props.chain) {
            initialize();
        }
    });

    async function next() {
        // Duplicate check: skip if account already exists in wallet
        if (walletStore.isUnlocked) {
            let chain = props.chain;
            let accountName = accountname.value;
            let duplicate = accountStore.accountlist.find(
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
        if (requiredFields.value.memo != null) {
            authorities.memo = memopk.value;
        }

        let blockchainResponse;
        try {
            blockchainResponse = await blockchainRequest({
                methods: ["verifyAccount"],
                accountname: accountname.value,
                chain: props.chain,
                authorities: authorities
            });
        } catch (error) {
            console.log(error);
            console.log("Account verification error, check your memo key and try again");
            inProgress.value = false;
            window.electron.notify(t("common.unverified_account_error"));
            return;
        }

        if (blockchainResponse && blockchainResponse.verifyAccountError) {
            const errorKey = blockchainResponse.verifyAccountError.key;
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
            inProgress.value = false;
            return;
        }

        if (!blockchainResponse || !blockchainResponse.verifyAccount) {
            console.log("Account verification error, check your memo key and try again");
            inProgress.value = false;
            window.electron.notify(t("common.unverified_account_error"));
            return;
        }

        inProgress.value = false;
        emit('continue');
        emit('imported', [{
            account: {
                accountName: accountname.value,
                accountID: blockchainResponse.verifyAccount.account.id,
                chain: props.chain,
                keys: { _vaultToken: blockchainResponse.verifyAccount.token }
            }
        }]);
    }
</script>

<template>
    <div id="step2">
        <p class="mb-2 font-weight-bold">
            {{ t('common.account_name', { 'chain' : chain}) }}
        </p>
        <input
            id="inputAccount"
            v-model="accountname"
            type="text"
            :class="accountInputClass"
            :placeholder="t('common.account_name', { 'chain' : chain})"
            :disabled="inProgress"
            required
        >
        <p class="my-3 font-weight-normal">
            {{ t('common.keys_cta') }}
        </p>
        <template v-if="requiredFields.memo !== null">
            <p class="mb-2 font-weight-bold">
                {{ t('common.memo_authority') }}
            </p>
            <input
                id="inputMemo"
                v-model="memopk"
                type="password"
                :class="memoInputClass"
                :placeholder="t('common.memo_authority_placeholder')"
                :disabled="inProgress"
                required
            >
        </template>
        <p class="my-3 font-weight-normal">
            {{ t('common.use_only_for_messages_and_proof') }}
        </p>

        <div class="grid grid-cols-12">
            <div class="col-span-12">
                <Button
                    variant="outline"
                    class="step_btn"
                    :disabled="inProgress"
                    @click="emit('back')"
                >
                    {{ t('common.back_btn') }}
                </Button>

                <template v-if="!inProgress">
                    <Button
                        v-if="accountname !== ''"
                        class="step_btn"
                        type="submit"
                        @click="next"
                    >
                        {{ t('common.next_btn') }}
                    </Button>
                    <Button
                        v-else
                        disabled
                        class="step_btn"
                        type="submit"
                    >
                        {{ t('common.next_btn') }}
                    </Button>
                </template>
                <Button v-else disabled class="step_btn">
                    <Spinner class="mr-2" />
                    {{ t('common.processing') }}
                </Button>
            </div>
        </div>
    </div>
</template>
