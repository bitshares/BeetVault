<script setup>
    import { ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { QrcodeCapture } from 'vue-qrcode-reader'
    import { Button } from '@/components/ui/ui/button'
    import { Card, CardContent } from '@/components/ui/ui/card'

    const emit = defineEmits(['detection']);
    const { t } = useI18n({ useScope: 'global' });
    let selected = ref();
    let qrContent = ref();

    function onDecode (result) {
        if (result && result.length) {
            qrContent.value = true;
            emit('detection', result[0].rawValue);
        }
    }

    function uploadAnother () {
        qrContent.value = null;
        selected.value = null;
    }
</script>

<template>
    <div class="space-y-4">
        <div v-if="qrContent" class="text-center">
            <p>{{ t('common.qr.scan.scanned') }}</p>
            <Button variant="outline" @click="uploadAnother" class="mt-2">
                {{ t('common.qr.scan.another') }}
            </Button>
        </div>

        <div v-else class="space-y-3">
            <p>{{ t('common.qr.upload.title') }}</p>
            <Card class="w-52 mx-auto shadow-md border">
                <CardContent class="p-2">
                    <qrcode-capture
                        :capture="selected"
                        @detect="onDecode"
                    />
                </CardContent>
            </Card>
        </div>
    </div>
</template>