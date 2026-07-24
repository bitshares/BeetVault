<script setup>
    import { ref, onMounted } from "vue";
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/ui/button';
    import { Input } from '@/components/ui/ui/input';
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
    <div id="step2" class="space-y-3">
        <div>
            <p class="mb-1 font-semibold text-sm">
                {{ t('common.account_name', { 'chain' : chain}) }}
            </p>
            <Input
                id="inputAccount"
                v-model="accountname"
                type="text"
                class="w-full"
                :placeholder="t('common.account_name',{ 'chain' : chain})"
                required
            />
        </div>

        <div>
            <p class="mb-1">{{ t('common.btspass_cta') }}</p>
            <Input
                id="inputActive"
                v-model="cloud_pass"
                type="password"
                class="w-full"
                :placeholder="t('common.btspass_placeholder')"
                required
            />
        </div>

        <div class="flex items-center gap-2">
            <Checkbox id="legacy" :checked="legacy" @update:checked="legacy = $event" />
            <Label for="legacy">{{ t('common.legacy_key_mode') }}</Label>
        </div>

        <div class="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" @click="emit('back')">
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
            <div v-if="accountname !== '' && cloud_pass !== '' && inProgress" class="flex flex-col items-center gap-2">
                <Progress :model-value="0" class="w-full" />
                <p class="text-sm text-muted-foreground">{{ t('common.connecting') }}</p>
            </div>
            <Button v-if="accountname === '' || cloud_pass === ''" disabled>
                {{ t('common.next_btn') }}
            </Button>
        </div>
    </div>
</template>