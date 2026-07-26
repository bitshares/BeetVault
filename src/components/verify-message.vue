<script setup>
    import { ref } from "vue";
    import { useI18n } from "vue-i18n";
    import { Button } from "@/components/ui/ui/button";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "@/components/ui/ui/card";
    import { Textarea } from "@/components/ui/ui/textarea";
    import { Alert, AlertDescription } from "@/components/ui/ui/alert";
    import { Badge } from "@/components/ui/ui/badge";
    import { Loader2, ShieldCheck, ShieldX } from "lucide-vue-next";

    const { t } = useI18n({ useScope: "global" });

    let signedMessageInput = ref("");
    let isVerifying = ref(false);
    let verifyResult = ref(null);
    let verifyError = ref(null);
    let fieldError = ref(null);

    function validateFields(parsed) {
        let missing = [];
        if (!parsed.chain) missing.push("chain");
        if (!parsed.publickey) missing.push("publickey");
        if (!parsed.message) missing.push("message");
        if (!parsed.signature) missing.push("signature");
        return missing;
    }

    async function verifyMessage() {
        if (!signedMessageInput.value.trim()) {
            return;
        }

        isVerifying.value = true;
        verifyResult.value = null;
        verifyError.value = null;
        fieldError.value = null;

        let parsed;
        try {
            parsed = JSON.parse(signedMessageInput.value.trim());
        } catch (e) {
            verifyError.value = t("common.verifyMessage.parseError");
            isVerifying.value = false;
            return;
        }

        let missing = validateFields(parsed);
        if (missing.length > 0) {
            fieldError.value = t("common.verifyMessage.missingFields", { fields: missing.join(", ") });
            isVerifying.value = false;
            return;
        }

        try {
            let request = {
                payload: {
                    params: parsed,
                },
            };

            let response = await window.electron.blockchainRequest({
                methods: ["verifyMessage"],
                chain: parsed.chain,
                request: request,
            });

            if (response && response.verifyMessage) {
                verifyResult.value = response.verifyMessage;
            } else {
                verifyResult.value = { result: false };
            }
        } catch (error) {
            console.log(error);
            verifyError.value = String(error);
            verifyResult.value = null;
        } finally {
            isVerifying.value = false;
        }
    }

    function clearAll() {
        signedMessageInput.value = "";
        verifyResult.value = null;
        verifyError.value = null;
        fieldError.value = null;
    }
</script>

<template>
    <div class="bottom p-0">
        <div class="px-4 py-3 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{{ t("common.verifyMessage.title") }}</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                <p class="text-sm text-muted-foreground">
                    {{ t("common.verifyMessage.desc") }}
                </p>

                <div class="space-y-2">
                    <label class="text-sm font-medium">
                        {{ t("common.verifyMessage.inputLabel") }}
                    </label>
                    <Textarea
                        v-model="signedMessageInput"
                        :placeholder="t('common.verifyMessage.placeholder')"
                        rows="10"
                        :disabled="isVerifying"
                        class="font-mono text-xs"
                    />
                </div>

                <Alert v-if="fieldError" variant="destructive">
                    <AlertDescription>{{ fieldError }}</AlertDescription>
                </Alert>

                <Alert v-if="verifyError" variant="destructive">
                    <AlertDescription>{{ verifyError }}</AlertDescription>
                </Alert>

                <div
                    v-if="verifyResult"
                    class="space-y-3 p-4 rounded-lg border"
                    :class="
                        verifyResult.result
                            ? 'border-green-500 bg-green-50 dark:bg-green-950'
                            : 'border-red-500 bg-red-50 dark:bg-red-950'
                    "
                >
                    <div class="flex items-center gap-2">
                        <ShieldCheck
                            v-if="verifyResult.result"
                            class="h-5 w-5 text-green-600"
                        />
                        <ShieldX
                            v-else
                            class="h-5 w-5 text-red-600"
                        />
                        <span class="font-medium">
                            {{
                                verifyResult.result
                                    ? t("common.verifyMessage.valid")
                                    : t("common.verifyMessage.invalid")
                            }}
                        </span>
                        <Badge
                            :variant="
                                verifyResult.result ? 'default' : 'destructive'
                            "
                        >
                            {{
                                verifyResult.result
                                    ? t("common.verifyMessage.verified")
                                    : t("common.verifyMessage.failed")
                            }}
                        </Badge>
                    </div>
                </div>

                <div class="flex flex-wrap gap-2">
                    <Button
                        @click="verifyMessage"
                        :disabled="
                            isVerifying || !signedMessageInput.trim()
                        "
                    >
                        <Loader2
                            v-if="isVerifying"
                            class="h-4 w-4 mr-2 animate-spin"
                        />
                        {{ t("common.verifyMessage.verifyBtn") }}
                    </Button>
                    <Button
                        variant="outline"
                        @click="clearAll"
                        :disabled="isVerifying"
                    >
                        {{ t("common.verifyMessage.clearBtn") }}
                    </Button>
                </div>
            </CardContent>
        </Card>
        </div>
    </div>
</template>
