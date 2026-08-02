import { createStore } from 'vuex';
import WalletStore from './modules/WalletStore.js';
import SettingsStore from './modules/SettingsStore.js';
import AccountStore from './modules/AccountStore.js';
import PopupStore from './modules/PopupStore.js';

export default createStore({
    modules: {
        WalletStore,
        SettingsStore,
        AccountStore,
        PopupStore
    }
});
