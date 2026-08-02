<script setup>
    import { ref, computed, watch } from "vue";
    import { useI18n } from "vue-i18n";
    import { useClipboard } from "@vueuse/core";
    import { Button } from "@/components/ui/ui/button";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "@/components/ui/ui/card";
    import { Textarea } from "@/components/ui/ui/textarea";
    import { Alert, AlertDescription } from "@/components/ui/ui/alert";
    import { Loader2, Copy, Check } from "lucide-vue-next";

    import AccountSelect from "./account-select";
    import { useWalletStore } from "@/stores/walletStore.js";
    import { useAccountStore } from "@/stores/accountStore.js";

    const { t } = useI18n({ useScope: "global" });
    const { copy } = useClipboard();
    const walletStore = useWalletStore();
    const accountStore = useAccountStore();

    let chain = computed(() => {
        return accountStore.getChain;
    });

    let selectedAccount = computed(() => {
        if (!walletStore.isUnlocked) {
            return;
        }
        return accountStore.getCurrentSafeAccount();
    });

    let messageText = ref("");
    let isSigning = ref(false);
    let signResult = ref(null);
    let signError = ref(null);
    let copied = ref(false);

    async function signMessage() {
        if (!selectedAccount.value || !messageText.value.trim()) {
            return;
        }

        isSigning.value = true;
        signResult.value = null;
        signError.value = null;

        try {
            let memoKey;
            try {
                memoKey = accountStore.getPrivateMemoKey(selectedAccount.value.accountID, chain.value)
                    || accountStore.getCurrentActiveKey();
            } catch (error) {
                console.log(error);
                signError.value = "Unable to retrieve signing key.";
                return;
            }

            let response;
            try {
                response = await window.electron.decryptAndSignMessage({
                    encryptedKey: memoKey,
                    chain: chain.value,
                    accountName: selectedAccount.value.accountName || selectedAccount.value.accountID,
                    messageText: messageText.value.trim(),
                });
            } catch (error) {
                console.log(error);
                signError.value = String(error);
                return;
            }

            if (response) {
                signResult.value = response;
            } else {
                signError.value = "No result returned from signing.";
            }
        } catch (error) {
            console.log(error);
            signError.value = String(error);
        } finally {
            isSigning.value = false;
        }
    }

    function copyResult() {
        if (!signResult.value) return;
        copy(JSON.stringify(signResult.value, null, 4));
        copied.value = true;
        setTimeout(() => {
            copied.value = false;
        }, 2000);
    }

    function clearResult() {
        signResult.value = null;
        signError.value = null;
        messageText.value = "";
    }

    watch(selectedAccount, () => {
        signResult.value = null;
        signError.value = null;
    });
</script>

<template>
    <div class="bottom p-0">
        <div class="px-4 py-3 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{{ t("common.signMessage.title") }}</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                <p class="text-sm text-muted-foreground">
                    {{ t("common.signMessage.desc") }}
                </p>

                <AccountSelect />

                <template v-if="!signResult">
                    <div class="space-y-2">
                        <label class="text-sm font-medium">
                            {{ t("common.signMessage.messageLabel") }}
                        </label>
                        <Textarea
                            v-model="messageText"
                            :placeholder="t('common.signMessage.placeholder')"
                            rows="6"
                            :disabled="isSigning"
                        />
                    </div>

                    <Alert v-if="signError" variant="destructive">
                        <AlertDescription>{{ signError }}</AlertDescription>
                    </Alert>

                    <div class="flex flex-wrap gap-2">
                        <Button
                            @click="signMessage"
                            :disabled="
                                isSigning ||
                                !selectedAccount ||
                                !messageText.trim()
                            "
                        >
                            <Loader2
                                v-if="isSigning"
                                class="h-4 w-4 mr-2 animate-spin"
                            />
                            {{ t("common.signMessage.signBtn") }}
                        </Button>
                    </div>
                </template>

                <template v-else>
                    <Alert v-if="signError" variant="destructive">
                        <AlertDescription>{{ signError }}</AlertDescription>
                    </Alert>

                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <label class="text-sm font-medium">
                                {{ t("common.signMessage.resultLabel") }}
                            </label>
                            <Button
                                variant="ghost"
                                size="sm"
                                @click="copyResult"
                            >
                                <Check
                                    v-if="copied"
                                    class="h-4 w-4 mr-1 text-green-500"
                                />
                                <Copy v-else class="h-4 w-4 mr-1" />
                                {{ copied ? t("common.copied") : t("common.copy") }}
                            </Button>
                        </div>
                        <Textarea
                            :model-value="
                                JSON.stringify(signResult, null, 4)
                            "
                            disabled
                            rows="12"
                            class="font-mono text-xs"
                        />
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            @click="clearResult"
                        >
                            {{ t("common.signMessage.clearBtn") }}
                        </Button>
                    </div>
                </template>

            </CardContent>
        </Card>
        </div>
    </div>
</template>
