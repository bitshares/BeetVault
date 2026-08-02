import { defaultLocale } from '../../config/i18n.js'
import {blockchains} from '../../config/config.js';
import BeetDB from '../../lib/BeetDB.js';

const LOAD_SETTINGS = 'LOAD_SETTINGS';

function getCoreSymbol(chain) {
    if (!chain) return chain;
    const blockchain = Object.values(blockchains).find(b => b.identifier === chain);
    return blockchain ? blockchain.coreSymbol : chain;
}

function decodeMessage(bytes) {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(new Uint8Array(bytes));
}

const mutations = {
    [LOAD_SETTINGS] (state, settings) {
        state.settings = settings;
    }
};

const actions = {
    async loadSettings({ commit }) {
        try {
            const settings = await BeetDB.settings.get({ id: 'settings' });
            if (settings) {
                const parsed = JSON.parse(settings.value);
                const merged = { ...initialState.settings, ...parsed };
                commit(LOAD_SETTINGS, merged);
            } else {
                await BeetDB.settings.put({ id: 'settings', value: JSON.stringify(initialState.settings) });
                commit(LOAD_SETTINGS, JSON.parse(JSON.stringify(initialState.settings)));
            }
        } catch (error) {
            console.log(error);
        }
    },
    async setLogoutTimeout({ commit }, payload) {
        try {
            const record = await BeetDB.settings.get({ id: 'settings' });
            const settings = record
                ? { ...initialState.settings, ...JSON.parse(record.value) }
                : { ...initialState.settings };

            settings.logoutTimeout = payload.timeout;

            await BeetDB.settings.put({ id: 'settings', value: JSON.stringify(settings) });
            commit(LOAD_SETTINGS, settings);
        } catch (error) {
            console.log(`setLogoutTimeout: ${error}`);
            throw error;
        }
    },
    async setNode({ commit }, payload) {
        const coreSymbol = getCoreSymbol(payload.chain);

        try {
            const record = await BeetDB.settings.get({ id: 'settings' });
            const settings = record
                ? { ...initialState.settings, ...JSON.parse(record.value) }
                : { ...initialState.settings };

            // backwards compatibility
            if (typeof settings.selected_node === "string") {
                settings.selected_node = {};
            }

            try {
                settings.selected_node[coreSymbol] = payload.node;
            } catch (error) {
                console.log(`setNode: ${error}`);
            }

            const chainNodeList = settings.chainNodes[coreSymbol];
            if (chainNodeList && chainNodeList.length > payload.node) {
                const node = chainNodeList.splice(payload.node, 1)[0];
                chainNodeList.unshift(node);
            }

            try {
                settings.chainNodes[coreSymbol] = chainNodeList;
            } catch (error) {
                console.log(`setNodeList: ${error}`);
            }

            await BeetDB.settings.put({ id: 'settings', value: JSON.stringify(settings) });
            commit(LOAD_SETTINGS, settings);
        } catch (error) {
            console.log(`setNode: ${error}`);
            throw error;
        }
    },
    async setLocale({ commit }, payload) {
        try {
            const record = await BeetDB.settings.get({ id: 'settings' });
            const settings = record
                ? { ...initialState.settings, ...JSON.parse(record.value) }
                : { ...initialState.settings };

            settings.locale = payload.locale;

            await BeetDB.settings.put({ id: 'settings', value: JSON.stringify(settings) });
            commit(LOAD_SETTINGS, settings);
        } catch (error) {
            console.log(`setLocale: ${error}`);
            throw error;
        }
    },
    /**
     *
     * @param {Object} payload
     */
    async setChainPermissions({ commit }, payload) {
        const coreSymbol = getCoreSymbol(payload.chain);

        try {
            const record = await BeetDB.settings.get({ id: 'settings' });
            const settings = record
                ? { ...initialState.settings, ...JSON.parse(record.value) }
                : { ...initialState.settings };

            if (!Object.prototype.hasOwnProperty.call(settings, 'chainPermissions')) {
                settings['chainPermissions'] = {
                    BTS: [],
                    TEST: [],
                    EOS: [],
                    BEOS: [],
                    TLOS: [],
                    TLOSTEST: [],
                    WAX: [],
                    WAXTEST: [],
                    EOSTEST: [],
                    FIO: [],
                    FIOTEST: [],
                    LIBRE: [],
                    LIBRETEST: [],
                    XPR: [],
                    XPRTEST: [],
                    HIVE: []
                };
            }
            settings.chainPermissions[coreSymbol] = payload.rows;
            await BeetDB.settings.put({ id: 'settings', value: JSON.stringify(settings) });
            commit(LOAD_SETTINGS, settings);
        } catch (error) {
            console.log(`setChainPermissions: ${error}`);
            throw error;
        }
    },
    visualizeMemo({
        commit
    }, data) {
        const decodedMessage = decodeMessage(data.request.memo.message);
        console.log('Decoded Memo Message:', decodedMessage);
    }
}

const getters = {
    getNode: (state) => state.settings.selected_node,
    getLocale: (state) => state.settings.locale,
    getLogoutTimeout: (state) => state.settings.logoutTimeout || 5,
    getChainPermissions: (state) => (chain) => {
        const coreSymbol = getCoreSymbol(chain);
        if (!Object.prototype.hasOwnProperty.call(state.settings, 'chainPermissions')) {
            return [];
        }
        return state.settings.chainPermissions[coreSymbol];
    },
    getNodes: (state) => (chain) => {
        const coreSymbol = getCoreSymbol(chain);
        if (!Object.prototype.hasOwnProperty.call(state.settings, 'chainNodes')) {
            return initialState.settings.chainNodes[coreSymbol];
        }
        return state.settings.chainNodes[coreSymbol];
    }
};

const initialState = {
    settings: {
        locale: defaultLocale,
        logoutTimeout: 5,
        selected_node: {},
        chainPermissions: {
            BTS: [],
            TEST: [],
            EOS: [],
            BEOS: [],
            TLOS: [],
            TLOSTEST: [],
            WAX: [],
            WAXTEST: [],
            EOSTEST: [],
            FIO: [],
            FIOTEST: [],
            LIBRE: [],
            LIBRETEST: [],
            XPR: [],
            XPRTEST: [],
            HIVE: []
        },
        chainNodes: {
            BTS: blockchains.BTS.nodeList,
            TEST: blockchains.BTS_TEST.nodeList,
            EOS: blockchains.EOS.nodeList,
            BEOS: blockchains.BEOS.nodeList,
            TLOS: blockchains.TLOS.nodeList,
            TLOSTEST: blockchains.TLOSTEST.nodeList,
            WAX: blockchains.WAX.nodeList,
            WAXTEST: blockchains.WAXTEST.nodeList,
            EOSTEST: blockchains.EOSTEST.nodeList,
            FIO: blockchains.FIO.nodeList,
            FIOTEST: blockchains.FIOTEST.nodeList,
            LIBRE: blockchains.LIBRE.nodeList,
            LIBRETEST: blockchains.LIBRETEST.nodeList,
            XPR: blockchains.XPR.nodeList,
            XPRTEST: blockchains.XPRTEST.nodeList,
            HIVE: blockchains.HIVE.nodeList
        }
    }
};

export default {
    namespaced: true,
    state: initialState,
    actions,
    mutations,
    getters,
};
