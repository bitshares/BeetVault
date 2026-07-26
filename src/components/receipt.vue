<script setup>
import { ref, watchEffect, watch } from "vue";
import queryString from "query-string";
import { useI18n } from "vue-i18n";
import { Button } from '@/components/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/ui/card';
import { Textarea } from '@/components/ui/ui/textarea';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/ui/pagination';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-vue-next';

import langSelect from "./lang-select.vue";

const { t } = useI18n({ useScope: "global" });

function handleProp(target) {
    let search = window.electron.getLocationSearch();
    if (!search) {
        return "";
    }

    let qs;
    try {
        qs = queryString.parse(search);
    } catch (error) {
        console.log(error);
        return;
    }

    if (!qs[target]) {
        return;
    }

    let qsTarget = qs[target];
    let decoded = decodeURIComponent(qsTarget);
    return decoded;
}

const visualizedParams = ref();
const request = ref();
const moreRequest = ref();
const result = ref();
const chain = ref();
const moreResult = ref();
const notifyTXT = ref();

let openOPReq = ref(false);
let openOPRes = ref(false);
let openOpDetails = ref(false);
let page = ref(1);

const payload = ref();
const accounts = ref();

let jsonData = ref("");
let resultData = ref("");
let resultID = ref("");
let resultBlockNum = ref(1);
let resultTrxNum = ref(1);
let resultExpiration = ref("");
let resultSignatures = ref("");

watchEffect(() => {
    const id = handleProp("id");

    window.electron.getReceipt(id);
    window.electron.onReceipt(id, (data) => {
        if (data.receipt) {
            visualizedParams.value = JSON.parse(data.receipt.visualizedParams);
        }
        console.log({
            vp: JSON.parse(data.receipt.visualizedParams),
            result: data.result,
        });
        if (data.request) {
            request.value = data.request;
            chain.value = data.request.payload.chain;
            moreRequest.value = JSON.stringify(data.request, undefined, 4);
        }
        if (data.result) {
            moreResult.value = JSON.stringify(data.result, undefined, 4);

            result.value = data.result;

            if (["EOS", "TLOS", "TLOSTEST", "BEOS", "WAX", "WAXTEST", "EOSTEST", "FIO", "FIOTEST", "LIBRE", "LIBRETEST", "XPR", "XPRTEST"].includes(data.request.payload.chain)) {
                resultID.value = data.result.transaction_id;
                resultBlockNum.value = data.result.processed.block_num;
                resultTrxNum.value = 0;
            } else {
                resultID.value = data.result[0].id;
                resultBlockNum.value = data.result[0].block_num;
                resultTrxNum.value = data.result[0].trx_num;
                resultExpiration.value = data.result[0].trx.expiration;
                resultSignatures.value = data.result[0].trx.signatures;
            }
        }
        if (data.payload) {
            payload.value = JSON.parse(data.payload);
        }
        if (data.accounts && data.request) {
            const parsedAccounts = JSON.parse(data.accounts);
            const parsedRequest = JSON.parse(data.request);
            const filteredAccounts = parsedAccounts.filter(
                (account) => parsedRequest.payload.chain === account.chain
            );
            accounts.value = filteredAccounts;
        }
        if (data.notifyTXT) {
            notifyTXT.value = data.notifyTXT;
        }
    });
});

const hexToString = (hex) => {
    const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    return new TextDecoder().decode(bytes);
};

watch(
    [page, visualizedParams, result],
    ([newPage, newVisualizedParams, newResult]) => {
        const currentPageValue = newPage > 0 ? newPage - 1 : 0;

        if (newVisualizedParams && newVisualizedParams.length) {
            let currentOp = newVisualizedParams[currentPageValue].op;
            if (currentOp.memo && currentOp.memo.message) {
                try {
                    currentOp.memo.message = hexToString(currentOp.memo.message);
                } catch (e) {
                    console.error("Failed to decode memo message:", e);
                }
            }

            jsonData.value = JSON.stringify(
                currentOp,
                undefined,
                4
            );
        }
        if (["EOS", "TLOS", "TLOSTEST", "BEOS", "WAX", "WAXTEST", "EOSTEST", "FIO", "FIOTEST", "LIBRE", "LIBRETEST", "XPR", "XPRTEST"].includes(chain.value)) {
            if (newResult) {
                resultData.value = JSON.stringify(
                    newResult.processed,
                    undefined,
                    4
                );
            }
        } else {
            if (newResult && newResult.length) {
                resultData.value = JSON.stringify(
                    newResult[0].trx.operation_results[currentPageValue],
                    undefined,
                    4
                );
            }
        }
    },
    { immediate: true }
);

let openMoreRequest = ref(false);
let openResult = ref(false);

async function copyToClipboard(_data) {
    try {
        await navigator.clipboard.writeText(_data);
    } catch (err) {
        console.error("Failed to copy: ", err);
    }
}
</script>

<template>
    <div class="w-full max-w-3xl mx-auto overflow-y-auto">
        <Collapsible default-open>
            <CollapsibleTrigger class="flex items-center gap-2 w-full p-3 hover:bg-accent rounded-md text-left">
                <ChevronDown class="h-4 w-4" />
                <span>{{ t("common.popup.evaluate") }}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div class="pr-2 pl-1 pb-4">
                    <div>{{ notifyTXT }}</div>

                    <div
                        v-if="!!visualizedParams"
                        class="text-left"
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle class="text-lg">
                                    <span class="font-bold">{{
                                        t(
                                            visualizedParams[
                                                page > 0 ? page - 1 : 0
                                            ].title
                                        )
                                    }}</span>
                                    <span v-if="visualizedParams.length > 1">
                                        ({{ page }}/{{ visualizedParams.length }})
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent class="space-y-2">
                                <p class="text-sm text-muted-foreground">
                                    {{
                                        t(
                                            `operations.injected.${
                                                chain === "BTS_TEST"
                                                    ? "BTS"
                                                    : chain
                                            }.${
                                                visualizedParams[
                                                    page > 0 ? page - 1 : 0
                                                ].method
                                            }.headers.result`
                                        )
                                    }}
                                </p>
                                <p
                                    v-for="row in visualizedParams[
                                        page > 0 ? page - 1 : 0
                                    ].rows"
                                    :key="row.key"
                                    class="text-sm font-medium text-muted-foreground"
                                >
                                    {{
                                        t(
                                            `operations.injected.${
                                                chain === "BTS_TEST"
                                                    ? "BTS"
                                                    : chain
                                            }.${
                                                visualizedParams[
                                                    page > 0 ? page - 1 : 0
                                                ].method
                                            }.rows.${row.key}`,
                                            row.params
                                        )
                                    }}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <div class="flex flex-wrap gap-2">
                                    <Button variant="outline" @click="openOPReq = true">
                                        {{ t("common.popup.request") }}
                                    </Button>
                                    <Button variant="outline" @click="openOPRes = true">
                                        {{ t("common.popup.result") }}
                                    </Button>
                                    <Button variant="outline" @click="openOpDetails = true">
                                        {{ t("common.popup.details") }}
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>

                        <Pagination
                            v-if="visualizedParams.length > 1"
                            v-model:page="page"
                            :total="visualizedParams.length"
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
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>

        <Collapsible v-if="result">
            <CollapsibleTrigger class="flex items-center gap-2 w-full p-3 hover:bg-accent rounded-md text-left">
                <ChevronRight class="h-4 w-4" />
                <span>{{ t("common.popup.result") }}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div class="px-1 pb-2">
                    <Button variant="outline" @click="openResult = true">
                        {{ t("common.popup.result") }}
                    </Button>
                </div>
            </CollapsibleContent>
        </Collapsible>

        <Collapsible v-if="moreRequest">
            <CollapsibleTrigger class="flex items-center gap-2 w-full p-3 hover:bg-accent rounded-md text-left">
                <ChevronRight class="h-4 w-4" />
                <span>{{ t("common.popup.request") }}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div class="px-1 pb-2">
                    <Button variant="outline" @click="openMoreRequest = true">
                        {{ t("common.popup.request") }}
                    </Button>
                </div>
            </CollapsibleContent>
        </Collapsible>

        <Collapsible>
            <CollapsibleTrigger class="flex items-center gap-2 w-full p-3 hover:bg-accent rounded-md text-left">
                <ChevronRight class="h-4 w-4" />
                <span>{{ t("common.abSettings") }}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div class="px-1 pb-2">
                    <langSelect location="prompt" />
                </div>
            </CollapsibleContent>
        </Collapsible>
    </div>

    <Dialog v-model:open="openOPReq">
        <DialogContent class="max-w-full h-full">
            <DialogTitle v-if="visualizedParams && visualizedParams.length > 1">
                {{ t("common.popup.keywords.request") }} ({{ page }}/{{
                    visualizedParams.length
                }})
            </DialogTitle>
            <DialogTitle v-else>
                {{ t("common.popup.keywords.request") }}
            </DialogTitle>
            <div class="space-y-3">
                <Textarea
                    v-model="jsonData"
                    disabled
                    class="w-full"
                    rows="8"
                />
                <Button @click="copyToClipboard(jsonData)">
                    {{ t("common.popup.copy") }}
                </Button>
            </div>
        </DialogContent>
    </Dialog>

    <Dialog v-model:open="openOPRes">
        <DialogContent class="max-w-full h-full">
            <DialogTitle v-if="visualizedParams && visualizedParams.length > 1">
                {{ t("common.popup.keywords.result") }} ({{ page }}/{{
                    visualizedParams.length
                }})
            </DialogTitle>
            <DialogTitle v-else>
                {{ t("common.popup.keywords.result") }}
            </DialogTitle>
            <div class="space-y-3">
                <Textarea
                    v-model="resultData"
                    disabled
                    class="w-full"
                    rows="8"
                />
                <Button @click="copyToClipboard(resultData)">
                    {{ t("common.popup.copy") }}
                </Button>
            </div>
        </DialogContent>
    </Dialog>

    <Dialog v-model:open="openOpDetails">
        <DialogContent class="max-w-full h-full">
            <DialogTitle>
                {{ t("common.popup.details") }}
            </DialogTitle>
            <div class="space-y-2">
                <p>{{ t("operations.receipt.id", { resultID }) }}</p>
                <p>{{ t("operations.receipt.block", { resultBlockNum }) }}</p>
                <p v-if="resultTrxNum">{{ t("operations.receipt.trxNum", { resultTrxNum }) }}</p>
                <p v-if="resultExpiration">{{ t("operations.receipt.expiration", { resultExpiration }) }}</p>
                <p v-if="resultSignatures">{{ t("operations.receipt.signatures", { resultSignatures }) }}</p>
            </div>
        </DialogContent>
    </Dialog>

    <Dialog v-model:open="openResult">
        <DialogContent class="max-w-full h-full">
            <DialogTitle>
                {{ t("common.popup.result") }}
            </DialogTitle>
            <div class="space-y-3">
                <Textarea
                    v-model="moreResult"
                    disabled
                    class="w-full"
                    rows="8"
                />
                <Button @click="copyToClipboard(moreResult)">
                    {{ t("common.popup.copy") }}
                </Button>
            </div>
        </DialogContent>
    </Dialog>

    <Dialog v-model:open="openMoreRequest">
        <DialogContent class="max-w-full h-full">
            <DialogTitle>
                {{ t("common.popup.request") }}
            </DialogTitle>
            <div class="space-y-3">
                <Textarea
                    v-model="moreRequest"
                    disabled
                    class="w-full"
                    rows="8"
                />
                <Button @click="copyToClipboard(moreRequest)">
                    {{ t("common.popup.copy") }}
                </Button>
            </div>
        </DialogContent>
    </Dialog>
</template>