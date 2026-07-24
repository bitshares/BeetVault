<script setup>
    import { computed, watchEffect, ref } from "vue";
    import queryString from "query-string";
    import { useI18n } from "vue-i18n";
    import { Textarea } from '@/components/ui/ui/textarea';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/ui/card';

    import * as Actions from "../lib/Actions";

    import IdentityRequestPopup from "./popups/identityrequestpopup";
    import SignMessageRequestPopup from "./popups/signedmessagepopup";
    import TransactionRequestPopup from "./popups/transactionrequestpopup";
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

    let chainOperations = ref([]);
    let types = ref();
    let type = ref();
    let toSend = ref();
    let chain = ref();
    let accountName = ref();
    let target = ref();
    let warning = ref();
    let visualizedAccount = ref();
    let visualizedParams = ref();
    let request = ref();
    let moreRequest = ref();
    let payload = ref();

    watchEffect(() => {
        const id = handleProp("id");

        window.electron.getPrompt(id);
        window.electron.onPrompt(id, async (data) => {
            window.electron.resetTimer();

            if (data.type) {
                type.value = data.type;
            }
            if (data.toSend) {
                toSend.value = data.toSend;
            }
            if (data.chain) {
                chain.value = data.chain;
            }
            if (data.accountName) {
                accountName.value = data.accountName;
            }
            if (data.target) {
                target.value = data.target;
            }
            if (data.warning) {
                warning.value = data.warning;
            }
            if (data.visualizedAccount) {
                visualizedAccount.value = data.visualizedAccount;
            }
            if (data.visualizedParams) {
                visualizedParams.value = data.visualizedParams;
            }
            if (data.request) {
                request.value = data.request;
            }
            if (data.payload) {
                payload.value = JSON.parse(data.payload);
            }
        });
    });
</script>

<template>
    <div
        v-if="type && type !== '' && request"
        class="w-full max-w-3xl mx-auto overflow-y-auto"
    >
        <Card v-show="true" class="mb-4">
            <CardHeader>
                <CardTitle>{{ t("common.popup.preview") }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
                <IdentityRequestPopup
                    v-if="type === Actions.GET_ACCOUNT && request"
                    :request="request"
                />
                <SignMessageRequestPopup
                    v-else-if="
                        (type === Actions.SIGN_MESSAGE ||
                            type === Actions.SIGN_NFT) &&
                            request
                    "
                    :request="request"
                />
                <div v-else-if="
                        (type === Actions.REQUEST_SIGNATURE ||
                            type === Actions.INJECTED_CALL) &&
                            request &&
                            visualizedParams &&
                            visualizedAccount
                    "
                >
                    <TransactionRequestPopup
                        :request="request"
                        :visualized-params="visualizedParams"
                        :visualized-account="visualizedAccount"
                        :warning="warning"
                    />
                </div>
            </CardContent>
        </Card>

        <Card v-if="moreRequest" class="mb-4">
            <CardHeader>
                <CardTitle>{{ t("common.popup.request") }}</CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea
                    v-model="moreRequest"
                    disabled
                    class="w-full"
                    rows="8"
                />
            </CardContent>
        </Card>

        <Card v-if="payload" class="mb-4">
            <CardHeader>
                <CardTitle>{{ t("common.popup.payload") }}</CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea
                    v-model="payload"
                    disabled
                    class="w-full"
                    rows="8"
                />
            </CardContent>
        </Card>

        <Card class="mb-4">
            <CardHeader>
                <CardTitle>{{ t("common.abSettings") }}</CardTitle>
            </CardHeader>
            <CardContent>
                <langSelect location="prompt" />
            </CardContent>
        </Card>
    </div>

    <div v-else class="p-4 text-center">
        {{ t('common.popup.loadError') }}
    </div>
</template>