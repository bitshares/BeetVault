<script setup>
    import { computed, ref, watchEffect, onMounted } from "vue";
    import { useI18n } from 'vue-i18n';
    import { formatChain } from "../../lib/formatter.js";
    import { Button } from '@/components/ui/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/ui/card';
import { Textarea } from '@/components/ui/ui/textarea';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/ui/pagination';
import { Switch } from '@/components/ui/ui/switch';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/ui/dialog';

    const { t } = useI18n({ useScope: 'global' });

    const props = defineProps({
        request: {
            type: Object,
            required: true,
            default() {
                return {}
            }
        },
        result: {
            type: Object,
            required: true,
            default() {
                return {}
            }
        },
        visualizedAccount: {
            type: String,
            required: true,
            default() {
                return ''
            }
        },
        visualizedParams: {
            type: String,
            required: true,
            default() {
                return ''
            }
        }
    });

    let total = ref(0);
    let parsedParameters = ref({});

    onMounted(() => {
        if (props.visualizedParams) {
            const _parsedparsedParameters = JSON.parse(props.visualizedParams);
            parsedParameters.value = _parsedparsedParameters;
            total.value = _parsedparsedParameters.length;
        }
    });

    let open = ref(false);
    let page = ref(1);
    let receipt = ref(false);

    let tableTooltip = computed(() => {
        if (!props.request) {
            return '';
        }

        return t(
            'operations.rawsig.request',
            {
                appName: props.request.payload.appName,
                origin: props.request.payload.origin,
                chain: formatChain(props.request.payload.chain),
                accountName: props.visualizedAccount ? props.visualizedAccount : props.request.payload.account_id
            }
        );
    });

    let buttonText = computed(() => {
        if (!props.request) {
            return '';
        }

        return props.request.payload.params &&
            props.request.payload.params.length > 0 &&
            props.request.payload.params[0] == "sign"
            ? t('operations.rawsig.sign_btn')
            : t('operations.rawsig.sign_and_broadcast_btn')
    })

    const hexToString = (hex) => {
        const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        return new TextDecoder().decode(bytes);
    };

    let jsonData = ref("");
    watchEffect(() => {
        let currentOp = parsedParameters.value[page.value - 1].op;
        if (currentOp.memo && currentOp.memo.message) {
            try {
                currentOp.memo.message = hexToString(currentOp.memo.message);
            } catch (e) {
                console.error("Failed to decode memo message:", e);
            }
        }
        jsonData.value = JSON.stringify(currentOp, undefined, 4);
    });
</script>
<template>
    <div style="padding-bottom:5px;">
        {{ tableTooltip }}
    </div>
    <div>
        {{ 
            parsedParameters && parsedParameters.length > 1
                ? t('operations.rawsig.summary', {numOps: parsedParameters.length})
                : t('operations.rawsig.summary_single')
        }}
    </div>
    <div
        v-if="!!parsedParameters"
        class="text-left custom-content"
        style="margin-top: 10px;"
    >
        <Card>
            <CardContent>
                    <div
                        v-if="total > 1"
                        class="text-lg font-semibold"
                    >
                        <b>{{ t(parsedParameters[page - 1].title) }}</b> ({{ page }}/{{ total }})
                    </div>
                    <div
                        v-else
                        class="text-lg font-semibold"
                    >
                        <b>{{ t(parsedParameters[page - 1].title) }}</b>
                    </div>
                    <div>
                        {{ t(`operations.injected.${props.request.payload.chain === "BTS_TEST" ? "BTS" : props.request.payload.chain}.${parsedParameters[page - 1].method}.headers.result`) }}
                    </div>
                    <div
                        v-for="row in parsedParameters[page - 1].rows"
                        :key="row.key"
                        class="text-sm font-medium text-muted-foreground"
                    >
                        {{ t(`operations.injected.${props.request.payload.chain === "BTS_TEST" ? "BTS" : props.request.payload.chain}.${parsedParameters[page - 1].method}.rows.${row.key}`, row.params) }}
                    </div>
            </CardContent>
            <CardFooter>
                <div class="flex gap-2">
                    <Button
                        variant="outline"
                        @click="open = true"
                    >
                        {{ t('common.popup.request') }}
                    </Button>
                </div>
            </CardFooter>
        </Card>
        <Pagination
            v-model:page="page"
            :total="total"
            :items-per-page="1"
            :sibling-count="0"
            show-edges
        >
            <PaginationContent v-slot="{ items }">
                <PaginationPrevious />
                <template v-for="(item, index) in items" :key="index">
                    <PaginationItem :value="item.value" :is-active="item.value === page" @click="page = item.value">
                        {{ item.value }}
                    </PaginationItem>
                </template>
                <PaginationNext />
            </PaginationContent>
        </Pagination>

        <h4 class="h4 beet-typo-small">
            {{ t('operations.rawsig.receipt.title') }}
        </h4>
        <Switch
            :checked="receipt"
            @update:checked="receipt = $event"
            id="enable-receipt"
            style="margin-bottom: 5px;"
        />
        <label
            :for="'enable-receipt'"
            style="margin-left: 15px;"
        >
            {{ t(`operations.rawsig.receipt.${receipt ? "yes" : "no"}`) }}
        </label>

        <h4 class="h4 beet-typo-small">
            {{ t('operations.rawsig.request_cta') }}
        </h4>
        <div
            v-if="!!parsedParameters"
            style="padding-bottom: 25px;"
        >
            <Button
                style="margin-right:5px"
                @click="_clickedAllow()"
            >
                {{ buttonText }}
            </Button>
            <Button
                @click="_clickedDeny()"
            >
                {{ t('operations.rawsig.reject_btn') }}
            </Button>
        </div>
        <div
            v-else
            style="padding-bottom: 25px;"
        >
            <Button
                style="margin-right:5px"
                disabled
            >
                {{ buttonText }}
            </Button>
            <Button
                @click="_clickedDeny()"
            >
                {{ t('operations.rawsig.reject_btn') }}
            </Button>
        </div>
    </div>
    <div
        v-else
        class="text-left custom-content"
    >
        <pre>
            {{ t('operations.rawsig.loading') }}
        </pre>
    </div>

    <Dialog v-model:open="open">
        <DialogTitle v-if="total > 1">
            {{ t(parsedParameters[page - 1].title) }} ({{ page }}/{{ total }})
        </DialogTitle>
        <DialogTitle v-else>
            {{ t(parsedParameters[page - 1].title) }}
        </DialogTitle>
        <DialogContent>
            <Textarea
                v-model="jsonData"
                disabled
                class="w-full"
                rows="8"
            />
        </DialogContent>
    </Dialog>
</template>
