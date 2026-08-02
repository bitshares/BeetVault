<script setup>
    import { computed } from 'vue';
    import { useRouter } from 'vue-router';
    import MainMenu from "./main-menu.vue";
    import langSelect from "./lang-select.vue";
    import { useProcessing } from '../composables/useProcessing.js';
    import { usePopupStore } from '@/stores/popupStore.js';

    const router = useRouter();
    const { isProcessing } = useProcessing();
    const popupStore = usePopupStore();

    let hasActivePopup = computed(() => popupStore.hasActivePopup);
</script>

<template>
    <div class="top">
        <div class="relative flex items-center justify-center px-3 py-2">
            <div class="absolute left-3 top-2">
                <MainMenu />
            </div>
            <div class="absolute right-3 top-2">
                <langSelect location="small" />
            </div>
            <div
                class="flex flex-col items-center"
                :class="(isProcessing || hasActivePopup) ? '' : 'cursor-pointer'"
                @click="!(isProcessing || hasActivePopup) && router.push('/dashboard')"
            >
                <h4 class="h4 beet-typo-small font-extrabold">
                    BeetVault
                </h4>
            </div>
        </div>
    </div>
</template>
