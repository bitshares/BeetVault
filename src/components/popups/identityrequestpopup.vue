<script setup>
    import { computed } from "vue";
    import { Button } from '@/components/ui/ui/button';
    import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/ui/tooltip';
    import { useI18n } from 'vue-i18n';

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

    let account_id = computed(() => {
        if (!props.accounts || !props.accounts.length) {
            return '';
        }
        return props.accounts[0].accountID
            ? props.accounts[0].accountID
            : props.accounts[0].accountName;
    });

    let accountName = computed(() => {
        if (!props.accounts || !props.accounts.length) {
            return '';
        }
        return props.accounts[0].accountName;
    });

    let chain = computed(() => {
        if (!props.accounts || !props.accounts.length) {
            return '';
        }

        return props.accounts[0].chain;
    });

    let requestText = computed(() => {
        if (!props.request) {
            return '';
        }

        return t(
            'operations.account_id.request',
            {
                appName: props.request.payload.appName,
                origin: props.request.payload.origin,
                chain: chain.value,
                accountId: account_id.value,
                accountName: accountName.value
            }
        );
    });

    function _clickedAllow() {
        window.electron.clickedAllow({
            result: {
                name: accountName.value,
                chain: chain.value,
                id: account_id.value
            },
            request: {id: props.request.id}
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
    <div style="padding:5px">
        <Tooltip>
            <TooltipTrigger as-child>
                <div>
                    {{ requestText }} &#10068;
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{{ t('operations.identity.request_tooltip') }}</p>
            </TooltipContent>
        </Tooltip>
        <Button
            style="margin-right:5px"
            @click="_clickedAllow()"
        >
            {{ t('operations.account_id.accept_btn') }}
        </Button>
        <Button
            @click="_clickedDeny()"
        >
            {{ t('operations.account_id.reject_btn') }}
        </Button>
    </div>
</template>
