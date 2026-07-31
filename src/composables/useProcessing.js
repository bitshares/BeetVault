import { ref } from 'vue';

const isProcessing = ref(false);

export function useProcessing() {
    function startProcessing() {
        isProcessing.value = true;
    }

    function stopProcessing() {
        isProcessing.value = false;
    }

    return {
        isProcessing,
        startProcessing,
        stopProcessing
    };
}
