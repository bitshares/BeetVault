<script setup>
    import { computed, ref, watchEffect, onMounted } from "vue";
    import { useI18n } from 'vue-i18n';
    import {formatChain} from "../../lib/formatter.js";
    import { Button } from '@/components/ui/ui/button';
    import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/ui/card';
    import { Textarea } from '@/components/ui/ui/textarea';
    import { Alert, AlertDescription } from '@/components/ui/ui/alert';
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
        },
        warning: {
            type: String,
            required: false,
            default() {
                return ''
            }
        }
    });

    let parsedParameters = ref([]);
    onMounted(() => {
        if (props.visualizedParams) {
            const _parsedparsedParameters = JSON.parse(props.visualizedParams);
            parsedParameters.value = _parsedparsedParameters;
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

    let warning = computed(() => {
        if (!props.warning || !props.warning.length) {
            return;
        }
        return props.warning;
    });

    function _clickedAllow() {
        window.electron.clickedAllow({
            result: {
                success: true,
                receipt: receipt.value
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
    <div class="space-y-4">
        <p class="text-sm">{{ tableTooltip }}</p>
        <p class="text-sm">
            {{ 
                parsedParameters && parsedParameters.length > 1
                    ? t('operations.rawsig.summary', {numOps: parsedParameters.length})
                    : t('operations.rawsig.summary_single')
            }}
        </p>

        <div v-if="!!parsedParameters" class="space-y-3">
            <Card>
                <CardHeader>
                    <CardTitle class="text-lg">
                        <span v-if="parsedParameters.length > 1">
                            {{ t(parsedParameters[page - 1].title) }} ({{ page }}/{{ parsedParameters.length }})
                        </span>
                        <span v-else>
                            {{ t(parsedParameters[page - 1].title) }}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent class="space-y-2">
                    <p class="text-sm text-muted-foreground">
                        {{ t(`operations.injected.${props.request.payload.chain === "BTS_TEST" ? "BTS" : props.request.payload.chain}.${parsedParameters[page - 1].method}.headers.request`) }}
                    </p>
                    <p
                        v-for="row in parsedParameters[page - 1].rows"
                        :key="row.key"
                        class="text-sm font-medium text-muted-foreground"
                    >
                        {{ t(`operations.injected.${props.request.payload.chain === "BTS_TEST" ? "BTS" : props.request.payload.chain}.${parsedParameters[page - 1].method}.rows.${row.key}`, row.params) }}
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" @click="open = true">
                        {{ t('common.popup.request') }}
                    </Button>
                </CardFooter>
            </Card>

            <Pagination
                v-model:page="page"
                :total="parsedParameters.length"
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

            <h4 class="text-lg font-bold">{{ t('operations.rawsig.receipt.title') }}</h4>
            <div class="flex items-center gap-2">
                <Switch
                    :checked="receipt"
                    @update:checked="receipt = $event"
                    id="enable-receipt"
                />
                <label for="enable-receipt" class="text-sm">
                    {{ t(`operations.rawsig.receipt.${receipt ? "yes" : "no"}`) }}
                </label>
            </div>

            <h4 class="text-lg font-bold">{{ t('operations.rawsig.request_cta') }}</h4>

            <Alert v-if="warning" class="border-yellow-500 bg-yellow-50">
                <AlertDescription>
                    {{
                        warning && warning === "serverError"
                            ? t("operations.transfer.server_error")
                            : null
                    }}
                    {{
                        warning && warning !== "serverError"
                            ? t("operations.transfer.detected_scammer")
                            : null
                    }}
                </AlertDescription>
            </Alert>

            <div v-if="!!parsedParameters" class="flex flex-wrap gap-2">
                <Button @click="_clickedAllow()">
                    {{ buttonText }}
                </Button>
                <Button variant="outline" @click="_clickedDeny()">
                    {{ t('operations.rawsig.reject_btn') }}
                </Button>
            </div>
            <div v-else class="flex flex-wrap gap-2">
                <Button disabled>
                    {{ buttonText }}
                </Button>
                <Button variant="outline" @click="_clickedDeny()">
                    {{ t('operations.rawsig.reject_btn') }}
                </Button>
            </div>
        </div>

        <div v-else class="text-left">
            <pre>{{ t('operations.rawsig.loading') }}</pre>
        </div>

        <Dialog v-model:open="open">
            <DialogContent>
                <DialogTitle v-if="parsedParameters.length > 1">
                    {{ t(parsedParameters[page - 1].title) }} ({{ page }}/{{ parsedParameters.length }})
                </DialogTitle>
                <DialogTitle v-else>
                    {{ t(parsedParameters[page - 1].title) }}
                </DialogTitle>
                <Textarea
                    v-model="jsonData"
                    disabled
                    class="w-full"
                    rows="8"
                />
            </DialogContent>
        </Dialog>
    </div>
</template>