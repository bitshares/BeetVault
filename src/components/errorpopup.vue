<script setup>
    import { ref, watchEffect } from "vue";
    import queryString from "query-string";
    import { useI18n } from "vue-i18n";
    import { Button } from '@/components/ui/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/ui/card';
    import { Textarea } from '@/components/ui/ui/textarea';
    import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/ui/collapsible';
    import { Alert, AlertDescription, AlertTitle } from '@/components/ui/ui/alert';
    import { ChevronDown, ChevronRight, AlertTriangle, Copy } from 'lucide-vue-next';

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

    const title = ref("");
    const errorMessage = ref("");
    const terminalError = ref("");
    const consoleLogs = ref([]);
    const timestamp = ref("");
    const context = ref("");

    let openTerminalError = ref(false);
    let openConsoleLogs = ref(false);

    let terminalErrorJSON = ref("");
    let consoleLogsJSON = ref("");

    watchEffect(() => {
        const id = handleProp("id");

        window.electron.getError(id);
        window.electron.onError(id, (data) => {
            if (data.title) {
                title.value = data.title;
            }
            if (data.errorMessage) {
                errorMessage.value = data.errorMessage;
            }
            if (data.terminalError) {
                terminalError.value = data.terminalError;
                terminalErrorJSON.value = typeof data.terminalError === 'string'
                    ? data.terminalError
                    : JSON.stringify(data.terminalError, undefined, 4);
            }
            if (data.consoleLogs && data.consoleLogs.length) {
                consoleLogs.value = data.consoleLogs;
                consoleLogsJSON.value = JSON.stringify(data.consoleLogs, undefined, 4);
            }
            if (data.timestamp) {
                timestamp.value = data.timestamp;
            }
            if (data.context) {
                context.value = data.context;
            }
        });
    });

    async function copyToClipboard(_data) {
        try {
            await navigator.clipboard.writeText(_data);
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    }

    function closeWindow() {
        window.close();
    }
</script>

<template>
    <div class="w-full max-w-3xl mx-auto overflow-y-auto p-4 space-y-4">
        <Alert variant="destructive">
            <AlertTriangle class="h-4 w-4" />
            <AlertTitle>{{ title || t('common.popup.error.title') }}</AlertTitle>
            <AlertDescription>
                {{ errorMessage || t('common.popup.error.defaultMessage') }}
            </AlertDescription>
        </Alert>

        <Card v-if="context">
            <CardHeader>
                <CardTitle>{{ t('common.popup.error.context') }}</CardTitle>
            </CardHeader>
            <CardContent>
                <p class="text-sm text-muted-foreground">{{ context }}</p>
                <p
                    v-if="timestamp"
                    class="text-xs text-muted-foreground mt-1"
                >{{ timestamp }}</p>
            </CardContent>
        </Card>

        <Card v-if="terminalErrorJSON">
            <CardHeader>
                <Collapsible v-model:open="openTerminalError">
                    <CollapsibleTrigger class="flex items-center gap-2 w-full text-left">
                        <ChevronDown v-if="openTerminalError" class="h-4 w-4" />
                        <ChevronRight v-else class="h-4 w-4" />
                        <span>{{ t('common.popup.error.terminalError') }}</span>
                    </CollapsibleTrigger>
                </Collapsible>
            </CardHeader>
            <CardContent>
                <div class="space-y-3">
                    <Textarea
                        :model-value="terminalErrorJSON"
                        disabled
                        class="w-full font-mono text-xs"
                        rows="10"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        @click="copyToClipboard(terminalErrorJSON)"
                    >
                        <Copy class="h-3 w-3 mr-1" />
                        {{ t("common.popup.copy") }}
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card v-if="consoleLogsJSON">
            <CardHeader>
                <Collapsible v-model:open="openConsoleLogs">
                    <CollapsibleTrigger class="flex items-center gap-2 w-full text-left">
                        <ChevronDown v-if="openConsoleLogs" class="h-4 w-4" />
                        <ChevronRight v-else class="h-4 w-4" />
                        <span>{{ t('common.popup.error.consoleLogs') }}</span>
                    </CollapsibleTrigger>
                </Collapsible>
            </CardHeader>
            <CardContent>
                <div class="space-y-3">
                    <Textarea
                        :model-value="consoleLogsJSON"
                        disabled
                        class="w-full font-mono text-xs"
                        rows="10"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        @click="copyToClipboard(consoleLogsJSON)"
                    >
                        <Copy class="h-3 w-3 mr-1" />
                        {{ t("common.popup.copy") }}
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>{{ t("common.abSettings") }}</CardTitle>
            </CardHeader>
            <CardContent>
                <langSelect location="prompt" />
            </CardContent>
        </Card>

        <div class="flex justify-end">
            <Button @click="closeWindow()">
                {{ t('common.popup.error.close') }}
            </Button>
        </div>
    </div>
</template>
