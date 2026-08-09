<script setup>
    import { ref, onMounted } from 'vue';
    import { Button } from '@/components/ui/ui/button';
    import { Card, CardContent } from '@/components/ui/ui/card';
    import { useI18n } from 'vue-i18n';
    import { Loader2 } from 'lucide-vue-next';
    import { QrcodeStream } from 'vue-qrcode-reader'

    const { t } = useI18n({ useScope: 'global' });
    const emit = defineEmits(['detection']);

    let camera = ref('auto');
    let paused = ref(false);

    let cameraInitializing = ref(false);
    let cameraError = ref();
    let videoDevices = ref();

    function onCameraOn () {
        cameraInitializing.value = true;
    }

    function onCameraOff () {
        cameraInitializing.value = false;
    }

    function onError (error) {
        console.log(error)
        paused.value = true;
        cameraError.value = true;
        cameraInitializing.value = false;
    }

    let QRresult = ref();
    async function onDetect (detectedBarcodes) {
        if (!QRresult.value && detectedBarcodes.length > 0) {
            await timeout(1000);
            QRresult.value = detectedBarcodes[0].rawValue;
            paused.value = true;
            emit('detection', detectedBarcodes[0].rawValue);
        }
    }

    async function switchCamera () {
        if (camera.value === 'off') {
            console.log('turning on camera')
            camera.value = 'auto'
            cameraInitializing.value = false;
            cameraError.value = undefined;
            QRresult.value = undefined;
        } else if (camera.value === 'auto') {
            console.log('setting to front')
            camera.value = 'front'
        } else if (camera.value === 'front') {
            console.log('setting to rear')
            camera.value = 'rear'
        } else {
            camera.value = 'front'
        }
    }

    function paintQR (detectedCodes, ctx) {
        for (const detectedCode of detectedCodes) {
            const [ firstPoint, ...otherPoints ] = detectedCode.cornerPoints

            ctx.textAlign = "center"
            var img = document.getElementById("beetScan");
            ctx.drawImage(img, firstPoint.x + 25, firstPoint.y + 10);
        }

        for (const detectedCode of detectedCodes) {
            const [ firstPoint, ...otherPoints ] = detectedCode.cornerPoints

            ctx.strokeStyle = "#C7088E";

            ctx.beginPath();
            ctx.moveTo(firstPoint.x, firstPoint.y);
            for (const { x, y } of otherPoints) {
                ctx.lineTo(x, y);
            }
            ctx.lineTo(firstPoint.x, firstPoint.y);
            ctx.closePath();
            ctx.stroke();
        }
    }

    function timeout (ms) {
        return new Promise(resolve => {
            window.setTimeout(resolve, ms)
        })
    }

    onMounted(async () => {
        let enumeratedDevices = await navigator.mediaDevices.enumerateDevices();
        videoDevices.value = enumeratedDevices.filter(device => device.kind === 'videoinput');
    });
</script>

<template>
    <div class="space-y-4">
        <div v-if="!QRresult && camera !== 'off' && !cameraError" class="flex flex-col items-center gap-3">
            <p>{{ t('common.qr.scan.title') }}</p>
            <Card class="w-72 h-72 shadow-md border overflow-hidden">
                <CardContent class="p-0 relative">
                    <qrcode-stream
                        :camera="camera"
                        :track="paintQR"
                        class="qrcode-stream-wrapper w-full h-full"
                        @camera-on="onCameraOn"
                        @camera-off="onCameraOff"
                        @error="onError"
                        @detect="onDetect"
                    >
                        <span v-if="cameraInitializing" class="absolute inset-0 flex items-center justify-center bg-background/50">
                            <Loader2 class="h-6 w-6 animate-spin" />
                        </span>

                        <div class="hidden">
                            <img
                                id="beetScan"
                                src="img/beetSmall.png"
                                alt="Beet logo"
                            >
                        </div>

                        <video
                            class="qrcode-stream-camera w-full h-full object-cover"
                            autoplay
                            playsinline
                        />
                    </qrcode-stream>
                </CardContent>
            </Card>
            <Button v-if="videoDevices && videoDevices.length > 1" variant="outline" @click="switchCamera">
                {{ t('common.qr.scan.switch') }}
            </Button>
        </div>

        <div v-else class="space-y-3 text-center">
            <div v-if="cameraError" class="space-y-3">
                <p>{{ t('common.qr.scan.initFail') }}</p>
                <Button @click="switchCamera">
                    {{ t('common.qr.scan.again') }}
                </Button>
            </div>
            <div v-else class="space-y-3">
                <p>{{ t('common.qr.scan.scanned') }}</p>
                <Button variant="outline" @click="switchCamera">
                    {{ t('common.qr.scan.another') }}
                </Button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.qrcode-stream-wrapper {
    max-width: 100%;
    max-height: 100%;
    overflow: hidden;
}

.qrcode-stream-camera {
    width: 100%;
    height: 100%;
}
</style>