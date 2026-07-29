<script setup>
    import {ref, computed, watchEffect} from "vue";

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
    let detectedKeyType = ref(null);

    let keyTypeLabel = computed(() => {
        if (!detectedKeyType.value) return null;
        return t(`common.key_type_${detectedKeyType.value}`);
    });

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
                authorities: authorities
            });
        } catch (error) {
            console.log(error);
            console.log("Account verification error, check your key and try again");
            detectedKeyType.value = null;
            window.electron.notify(t("common.unverified_account_error"));
            return;
        }

        if (blockchainRequest && blockchainRequest.verifyAccount) {
            console.log("Account verified");
            detectedKeyType.value = blockchainRequest.verifyAccount._keyType || null;

            // Clear plaintext key from memory
            authorities.privateKey = null;

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
                class="w-full"
                :placeholder="t(accessType == 'account' ? 'common.account_name' : 'common.address_name', { 'chain' : chain})"
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
                    class="w-full"
                    :placeholder="t('common.private_key_placeholder')"
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