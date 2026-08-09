<script setup>
    import { ref } from 'vue';
    import { Button } from '@/components/ui/ui/button';
    import { Card, CardContent } from '@/components/ui/ui/card';
    import { Alert, AlertDescription } from '@/components/ui/ui/alert';
    import { useI18n } from 'vue-i18n';
    import { QrcodeDropZone } from 'vue-qrcode-reader'
    import { X } from 'lucide-vue-next';

    const { t } = useI18n({ useScope: 'global' });
    let result = ref();
    let error = ref();
    let dragover = ref(false);

    const emit = defineEmits(['detection']);

    async function onDetect (detectedCodes) {     
        if (detectedCodes && detectedCodes.length) {
            error.value = null;
            result.value = true;
            emit('detection', detectedCodes[0].rawValue);
        }
    }

    function onDragOver (isDraggingOver) {
        dragover.value = isDraggingOver;
    }

    function tryAgain() {
        result.value = null;
        error.value = null;
    }

    function onError(error) {
        if (error.name === 'DropImageFetchError') {
            error.value = t('common.qr.drag.error1')
        } else if (error.name === 'DropImageDecodeError') {
            error.value = t('common.qr.drag.error2')
        } else {
            error.value = t('common.qr.drag.error3')
        }
    }

</script>

<template>
    <div class="space-y-4">
        <div v-if="result && !error" class="text-center">
            <p>{{ t('common.qr.drag.successPrompt') }}</p>
            <Button @click="tryAgain" class="mt-2">
                {{ t('common.qr.drag.successBtn') }}
            </Button>
        </div>

        <div v-else-if="!result && error" class="space-y-3">
            <Alert variant="secondary" class="border-yellow-500 bg-yellow-50">
                <AlertDescription class="flex items-center justify-between">
                    {{ error }}
                    <Button variant="ghost" size="icon" class="h-5 w-5" @click="tryAgain" :aria-label="t('common.close')">
                        <X class="h-4 w-4" />
                    </Button>
                </AlertDescription>
            </Alert>
            <Button @click="tryAgain">
                {{ t('common.qr.drag.successBtn') }}
            </Button>
        </div>

        <div v-else class="space-y-3">
            <p>{{ t('common.qr.drag.title') }}</p>

            <Card class="w-52 mx-auto shadow-md border">
                <CardContent class="p-0">
                    <qrcode-drop-zone
                        @detect="onDetect"
                        @dragover="onDragOver"
                        @error="onError"
                    >
                        <div
                            class="drop-area h-24 flex items-center justify-center"
                            :class="{ 'dragover': dragover }"
                        >
                            {{ t('common.qr.drag.prompt') }}
                        </div>
                    </qrcode-drop-zone>
                </CardContent>
            </Card>
        </div>
    </div>
</template>