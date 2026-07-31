const INCREMENT_POPUP_COUNT = 'INCREMENT_POPUP_COUNT';
const DECREMENT_POPUP_COUNT = 'DECREMENT_POPUP_COUNT';
const RESET_POPUP_COUNT = 'RESET_POPUP_COUNT';

const mutations = {
    [INCREMENT_POPUP_COUNT](state) {
        state.activePopupCount++;
    },
    [DECREMENT_POPUP_COUNT](state) {
        if (state.activePopupCount > 0) {
            state.activePopupCount--;
        }
    },
    [RESET_POPUP_COUNT](state) {
        state.activePopupCount = 0;
    },
};

const actions = {
    popupOpened({ commit }) {
        commit(INCREMENT_POPUP_COUNT);
    },
    popupClosed({ commit }) {
        commit(DECREMENT_POPUP_COUNT);
    },
    reset({ commit }) {
        commit(RESET_POPUP_COUNT);
    },
};

const getters = {
    hasActivePopup: (state) => state.activePopupCount > 0,
    activePopupCount: (state) => state.activePopupCount,
};

const initialState = {
    activePopupCount: 0,
};

export default {
    namespaced: true,
    state: initialState,
    actions,
    mutations,
    getters,
};
