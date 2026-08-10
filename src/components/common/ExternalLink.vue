<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/ui/alert-dialog';

import { Button } from '@/components/ui/ui/button';

const props = defineProps({
    hyperlink: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        default: '',
    },
    variant: {
        type: String,
        default: 'outline',
    },
    size: {
        type: String,
        default: 'sm',
    },
});

const { t } = useI18n({ useScope: 'global' });

const open = ref(false);

function handleOpen() {
    window.electron.openURL(props.hyperlink);
    open.value = false;
}
</script>

<template>
    <AlertDialog v-model:open="open">
        <AlertDialogTrigger as-child>
            <Button
                v-if="hyperlink"
                :variant="variant"
                :size="size"
            >
                {{ text }}
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent @pointer-down-outside="open = false">
            <AlertDialogHeader>
                <AlertDialogTitle>
                    {{ t('common.externalLink.leaveApp') }}
                </AlertDialogTitle>
                <AlertDialogDescription>
                    {{ t('common.externalLink.navigateToExternal') }}
                </AlertDialogDescription>
            </AlertDialogHeader>

            <h3 class="scroll-m-20 text-base font-semibold tracking-tight mb-3 mt-1">
                {{ t('common.externalLink.proceedToURL') }}
            </h3>
            <code class="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold break-all">
                {{ hyperlink }}
            </code>
            <h3 class="scroll-m-20 text-base font-semibold tracking-tight mb-3 mt-1">
                {{ t('common.externalLink.checkingLeave') }}
            </h3>

            <AlertDialogFooter>
                <AlertDialogCancel>
                    {{ t('common.cancel_btn') }}
                </AlertDialogCancel>
                <AlertDialogAction @click="handleOpen">
                    {{ t('common.externalLink.openLink') }}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
