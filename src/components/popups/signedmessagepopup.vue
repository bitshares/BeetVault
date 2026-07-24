<script setup>
    import { computed } from "vue";
    import { Button } from '@/components/ui/ui/button';
    import { Textarea } from '@/components/ui/ui/textarea';
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

    let textFieldContents = computed(() => {
        return JSON.stringify(JSON.parse(props.request.payload.params), undefined, 4)
    });

    let requestText = computed(() => {
        if (!props.request || !props.accounts) {
            return '';
        }
        return t("operations.message.request", {
            appName: props.request.payload.appName,
            origin: props.request.payload.origin,
            chain: props.accounts[0].chain,
            accountName: props.accounts[0].accountName
        });
    });

    function _clickedAllow() {
        window.electron.clickedAllow({
            result: {
                success: true
            },
            request: {
                id: props.request.id
            }
        });
    }

    function _clickedDeny() {
        window.electron.clickedDeny({
            result: {
                canceled: true
            },
            request: {
                id: props.request.id
            }
        });
    }
</script>

<template>
    <div class="space-y-3 p-1">
        <p class="text-sm">{{ requestText }}</p>
        <Textarea
            v-model="textFieldContents"
            disabled
            class="w-full"
            rows="5"
        />
        <div class="flex flex-wrap gap-2">
            <Button @click="_clickedAllow()">
                {{ t("operations.message.accept_btn") }}
            </Button>
            <Button variant="outline" @click="_clickedDeny()">
                {{ t("operations.message.reject_btn") }}
            </Button>
        </div>
    </div>
</template>