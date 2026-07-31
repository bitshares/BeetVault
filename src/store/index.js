import { createStore } from 'vuex';
import WalletStore from './modules/WalletStore.js';
import WhitelistStore from './modules/WhitelistStore.js';
import SettingsStore from './modules/SettingsStore.js';
import AccountStore from './modules/AccountStore.js';
import PopupStore from './modules/PopupStore.js';

export default createStore({
    modules: {
        WalletStore,
        WhitelistStore,
        SettingsStore,
        AccountStore,
        PopupStore
    }
});
