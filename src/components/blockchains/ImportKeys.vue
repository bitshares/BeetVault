<script setup>
    import {ref, watchEffect} from "vue";

    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/ui/button';
    import { Input } from '@/components/ui/ui/input';
    import store from '../../store/index.js';
    const { t } = useI18n({ useScope: 'global' });

    const props = defineProps({
        chain: {
            type: String,
            required: true,
            default: ''
        },
    });

    const emit = defineEmits(['back', 'continue', 'imported']);

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
    async function next() {
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
                authorities: authorities.privateKey
            });
        } catch (error) {
            console.log(error);
            console.log("Account verification error, check your key and try again");
            window.electron.notify(t("common.unverified_account_error"));
            return;
        }

        if (blockchainRequest && blockchainRequest.verifyAccount) {
            console.log("Account verified");
            privateKey.value = "";

            if (store.state.WalletStore.isUnlocked) {
                window.electron.resetTimer();
            }
            emit('continue');
            emit('imported', [{
                account: {
                    accountName: accountname.value,
                    accountID: blockchainRequest.verifyAccount.id,
                    chain: props.chain,
                    keys: authorities,
                    keyType: blockchainRequest.verifyAccount._keyType || null
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
                class="w-full"
                :placeholder="t(accessType == 'account' ? 'common.account_name' : 'common.address_name', { 'chain' : chain})"
                required
            />
        </div>

        <div>
            <p class="mb-1">{{ t('common.keys_cta') }}</p>
        </div>

        <template v-if="requiredFields && requiredFields.privateKey">
            <div>
                <p class="mb-1 font-semibold text-sm">
                    {{ t(accessType == 'account' ? 'common.active_authority' : 'common.public_authority') }}
                </p>
                <Input
                    id="inputActive"
                    v-model="privateKey"
                    type="password"
                    class="w-full"
                    :placeholder="t(accessType == 'account' ? 'common.active_authority_placeholder' : 'common.public_authority_placeholder')"
                    required
                />
            </div>
        </template>

        <div class="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" @click="emit('back')">
                {{ t('common.back_btn') }}
            </Button>

            <template v-if="requiredFields && requiredFields.privateKey">
                <Button v-if="accountname !== '' && privateKey !== ''" @click="next">
                    {{ t('common.next_btn') }}
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