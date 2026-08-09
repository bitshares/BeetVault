<script setup>
    import { computed } from 'vue';
    import {formatChain} from "../lib/formatter.js";
    import { useI18n } from 'vue-i18n';
    import { Card } from '@/components/ui/ui/card';
    import ExternalLink from '@/components/common/ExternalLink.vue';
    const { t } = useI18n({ useScope: 'global' });

    const props = defineProps({
        account: {
            type: Object,
            required: true,
            default() {
                return {}
            }
        },
        explorer: {
            type: String,
            required: true,
            default: ""
        },
        type: {
            type: String,
            required: true,
            default: ""
        }
    });

    let chainLabel = computed(() => {
        return formatChain(props.account.chain);
    });

    let accessType = computed(() => {
        if (!props.type) {
            return;
        }
        return props.type == "account"
            ? t('common.account_details_name_lbl')
            : t('common.account_details_address_lbl');
    });

</script>

<template>
    <div class="px-2 py-3">
        <div class="flex items-center justify-between mb-2">
            <span class="font-medium">
                {{ t('common.account_details_lbl') }}
            </span>
            <ExternalLink
                v-if="explorer"
                :hyperlink="explorer"
                :text="t('common.account_details_explorer_lbl')"
                variant="outline"
                size="sm"
            />
        </div>
        <Card
            class="shadow-sm border"
        >
            <div v-if="account" class="flex flex-col gap-2 p-2">
                <div :key="chainLabel" class="flex items-center justify-between">
                    <div class="text-sm text-left">
                        {{ t('common.account_details_chaim_lbl') }}
                    </div>
                    <div class="ml-4 text-sm font-medium text-right">
                        {{ chainLabel }}
                    </div>
                </div>
                <div :key="account.accountName" class="flex items-center justify-between">
                    <div class="text-sm text-left">
                        {{ accessType }}
                    </div>
                    <div class="ml-4 text-sm font-medium text-right">
                        {{ account.accountName }}
                    </div>
                </div>
            </div>
        </Card>
    </div>
</template>
