<script setup>
    import { computed} from "vue";
    import { Button } from '@/components/ui/ui/button';
    import { useI18n } from 'vue-i18n';
    import { Alert, AlertDescription } from '@/components/ui/ui/alert';
    import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/ui/tooltip';

    const { t } = useI18n({ useScope: 'global' });

    const props = defineProps({
        request: {
            type: Object,
            required: true,
            default() {
                return {}
            }
        },
        accounts: {
            type: Array,
            required: true,
            default() {
                return []
            }
        }
    });

    let requestText = computed(() => {
        if (!props.request || !props.accounts.length) {
            return '';
        }

        return t(
            'operations.relink.request',
            {
                appName: props.request.appName,
                origin: props.request.origin,
                chain: props.request.chain,
                accountId: props.accounts[0].accountID
                    ? props.accounts[0].accountID
                    : props.accounts[0].accountName
            }
        );
    });

    function _clickedAllow() {
        window.electron.clickedAllow({
            result: {
                identityhash: props.request.payload.identityhash,
                name: props.accounts[0].accountName,
                chain: props.accounts[0].chain,
                id: props.accounts[0].accountID
                    ? props.accounts[0].accountID
                    : props.accounts[0].accountName,
                success: true
            },
            request: {
                id: props.request.id
            }
        });
    }

    function _clickedDeny() {
        window.electron.clickedDeny({
            result: {canceled: true},
            request: {id: props.request.id}
        });
    }
</script>

<template>
    <div
        v-if="props.request && props.accounts"
        style="padding:5px"
    >
        <Tooltip>
            <TooltipTrigger as-child>
                <div>
                    {{ requestText }} &#10068;
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{{ t('operations.relink.request_tooltip') }}</p>
            </TooltipContent>
        </Tooltip>
        <br>
        <Button
            style="margin-right:5px"
            @click="_clickedAllow()"
        >
            {{ t('operations.link.accept_btn') }}
        </Button>
        <Button
            @click="_clickedDeny()"
        >
            {{ t('operations.link.reject_btn') }}
        </Button>
    </div>
    <div
        v-else
        style="padding:5px"
    >
        <Alert v-if="!chainOperations" variant="destructive">
            <AlertDescription>
                {{ t('operations.relink.error') }}
            </AlertDescription>
        </Alert>
        <br>
        <Button
            @click="_clickedDeny()"
        >
            {{ t('operations.link.reject_btn') }}
        </Button>
    </div>
</template>
