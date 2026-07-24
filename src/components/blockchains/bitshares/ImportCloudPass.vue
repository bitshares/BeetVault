<script setup>
    import { ref, onMounted } from "vue";
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/ui/button';
    import { Alert, AlertDescription } from '@/components/ui/ui/alert';
    import { Checkbox } from '@/components/ui/ui/checkbox';
    import { Label } from '@/components/ui/ui/label';
    import { Progress } from '@/components/ui/ui/progress';

    const { t } = useI18n({ useScope: 'global' });

    const props = defineProps({
        chain: {
            type: String,
            required: true,
            default: ''
        }
    });

    const emit = defineEmits(['back', 'continue', 'imported']);

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

    async function next() {
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
                keys: blockchainResponse.verifyCloudAccount.authorities
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
            class="form-control mb-3"
            :placeholder="t('common.account_name',{ 'chain' : chain})"
            required
        >
        <p class="my-3 font-weight-normal">
            {{ t('common.btspass_cta') }}
        </p>
        <input
            id="inputActive"
            v-model="cloud_pass"
            type="password"
            class="form-control mb-3 small"
            :placeholder="t('common.btspass_placeholder')"
            required
        >
        <br>
        <br>
        <div class="flex items-center gap-2">
            <Checkbox id="legacy" :checked="legacy" @update:checked="legacy = $event" />
            <Label for="legacy">Legacy key mode</Label>
        </div>
        <div class="grid grid-cols-12">
            <div class="col-span-12">
                <Button
                    variant="outline"
                    class="step_btn"
                    @click="emit('back')"
                >
                    {{ t('common.back_btn') }}
                </Button>
                <Button
                    v-if="accountname !== '' && cloud_pass !== '' && !inProgress && !errorOcurred"
                    class="step_btn"
                    type="submit"
                    @click="next"
                >
                    {{ t('common.next_btn') }}
                </Button>
                <span v-if="accountname !== '' && cloud_pass !== '' && errorOcurred">
                    <Button
                        class="step_btn"
                        type="submit"
                        @click="next"
                    >
                        {{ t('common.next2_btn') }}
                    </Button>
                    <br>
                    <Alert class="border-yellow-500 bg-yellow-50">
                        <AlertDescription>
                            {{ t('common.error_text') }}
                        </AlertDescription>
                    </Alert>
                </span>
                <figure v-if="accountname !== '' && cloud_pass !== '' && inProgress">
                    <Progress :model-value="0" class="animate-pulse" />
                    <br>
                    <figcaption>Connecting to blockchain</figcaption>
                </figure>
                <Button
                    v-if="accountname === '' || cloud_pass === ''"
                    disabled
                    class="step_btn"
                    type="submit"
                >
                    {{ t('common.next_btn') }}
                </Button>
            </div>
        </div>
    </div>
</template>
