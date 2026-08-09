import { defineStore } from 'pinia';

export const usePopupStore = defineStore('popup', {
    state: () => ({
        activePopupCount: 0,
    }),

    getters: {
        hasActivePopup: (state) => state.activePopupCount > 0,
        activePopupCount: (state) => state.activePopupCount,
    },

    actions: {
        popupOpened() {
            this.activePopupCount++;
        },
        popupClosed() {
            if (this.activePopupCount > 0) {
                this.activePopupCount--;
            }
        },
        reset() {
            this.activePopupCount = 0;
        },
    },
});
