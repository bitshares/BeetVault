<script setup>
    import { ref, computed, onMounted } from "vue";
    import { Button } from '@/components/ui/ui/button';
    import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/ui/tooltip';
    import {formatChain, formatAccount} from "../../lib/formatter.js";

    import { useI18n } from 'vue-i18n';
    const { t } = useI18n({ useScope: 'global' });

    let chosenAccount = ref(-1);

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
        },
        existingLinks: {
            type: Array,
            required: false,
            default() {
                return []
            }
        }
    });

    let requestText = computed(() => {
        if (!props.request) {
            return '';
        }
        return t(
            'operations.link.request',
            {
                appName: props.request.appName,
                origin: props.request.origin,
                chain: props.request.chain
            }
        );
    });

    let secondText = computed(() => {
        return t('operations.link.request_fresh', {chain: props.request.chain });
    });

    /*
     * Creating the select items
     */
    let accountOptions = computed(() => {
        if (!props.accounts || !props.accounts.length) {
            return [];
        }

        return props.accounts.map((account, i) => {
            return {
                label: !account.accountID && account.trackId == 0
                    ? `account ${i}` // TODO: Replace placeholder!
                    : `${formatChain(account.chain)}: ${formatAccount(account)}`,
                value: i
            };
        });
    });

    function _clickedAllow() {
        let approvedAccount = props.accounts[chosenAccount.value];

        window.electron.clickedAllow({
            result: {
                name: approvedAccount.accountName,
                chain: approvedAccount.chain,
                id: approvedAccount.accountID
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
                    {{ requestText }}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{{ t('operations.link.request_tooltip') }}</p>
            </TooltipContent>
        </Tooltip>
        <br>
        <div v-if="existingLinks && existingLinks.length > 0">
            {{ secondText }}
        </div>
        <br>
        <div v-if="accountOptions && accountOptions.length > 0">
            <select
                id="account_select"
                v-model="chosenAccount"
                class="form-control mb-3"
                required
            >
                <option
                    selected
                    disabled
                    value=""
                >
                    {{ t('operations.link.account_select') }}
                </option>
                <option
                    v-for="account in accountOptions"
                    :key="account.value"
                    :value="account.value"
                >
                    {{ account.label }}
                </option>
            </select>
        </div>
        <div v-else>
            {{ t('operations.link.account_missing') }}
        </div>
        <br>
        <div v-if="chosenAccount == -1">
            <Button
                disabled
                style="margin-right:5px"
            >
                {{ t('operations.link.accept_btn') }}
            </Button>
            <Button
                @click="_clickedDeny()"
            >
                {{ t('operations.link.reject_btn') }}
            </Button>
        </div>
        <div v-else>
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
    </div>
</template>
