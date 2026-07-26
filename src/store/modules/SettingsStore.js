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
    loadSettings({
        commit
    }) {
        return new Promise(async (resolve, reject) => {
            try {
                BeetDB.settings.get({id: 'settings'}).then((settings) => {
                    if (settings) {
                        let parsed = JSON.parse(settings.value);
                        // merge with initialState to pick up any new keys
                        let merged = Object.assign({}, initialState.settings, parsed);
                        commit(LOAD_SETTINGS, merged);
                    } else {
                        BeetDB.settings.put({id: 'settings', value: JSON.stringify(initialState.settings)}).then(() => {
                            commit(LOAD_SETTINGS, JSON.parse(JSON.stringify(initialState.settings)));
                        })
                    }
                });
                resolve();
            } catch (error) {
                console.log(error)
                reject();
            }
        });
    },
    setLogoutTimeout({
        commit
    }, payload) {
        return new Promise(async (resolve, reject) => {
            BeetDB.settings.get({id: 'settings'}).then((record) => {
                let settings = record ? JSON.parse(record.value) : Object.assign({}, initialState.settings);

                settings.logoutTimeout = payload.timeout;

                BeetDB.settings.put({id: 'settings', value: JSON.stringify(settings)}).then(() => {
                    commit(LOAD_SETTINGS, settings);
                    resolve();
                })
            }).catch((error) => {
                console.log(`setLogoutTimeout: ${error}`)
                reject(error);
            });
        });
    },
    setNode({
        commit
    }, payload) {
        return new Promise(async (resolve, reject) => {
            const coreSymbol = getCoreSymbol(payload.chain);

            BeetDB.settings.get({id: 'settings'}).then((record) => {
                let settings = record ? JSON.parse(record.value) : Object.assign({}, initialState.settings);
  
                // backwards compatibility
                if (typeof settings.selected_node === "string") {
                    settings.selected_node = {}
                }
  
                try {
                  settings.selected_node[coreSymbol] = payload.node;
                } catch (error) {
                  console.log(`setNode: ${error}`)
                }

                let chainNodeList = settings.chainNodes[coreSymbol];
                if (chainNodeList && chainNodeList.length > payload.node) {
                    let node = chainNodeList.splice(payload.node, 1)[0];
                    chainNodeList.unshift(node);
                }
                
                try {
                    settings.chainNodes[coreSymbol] = chainNodeList;
                } catch (error) {
                    console.log(`setNodeList: ${error}`)
                }

                BeetDB.settings.put({id: 'settings', value: JSON.stringify(settings)}).then(() => {
                    commit(LOAD_SETTINGS, settings);
                    resolve();
                })
            }).catch((error) => {
                console.log(`setNode: ${error}`)
                reject(error);
            });
        });
    },
    setLocale({
        commit
    }, payload) {
        return new Promise(async (resolve, reject) => {

            BeetDB.settings.get({id: 'settings'}).then((record) => {
                let settings = record ? JSON.parse(record.value) : Object.assign({}, initialState.settings);

                settings.locale = payload.locale;

                BeetDB.settings.put({id: 'settings', value: JSON.stringify(settings)}).then(() => {
                    commit(LOAD_SETTINGS, settings);
                    resolve();
                })
            }).catch((error) => {
                console.log(`setLocale: ${error}`)
                reject(error);
            });
        });
    },
    /**
     * 
     * @param {Object} payload
     */
    setChainPermissions({
        commit
    }, payload) {
        return new Promise(async (resolve, reject) => {
            const coreSymbol = getCoreSymbol(payload.chain);

            BeetDB.settings.get({id: 'settings'}).then((record) => {
                let settings = record ? JSON.parse(record.value) : Object.assign({}, initialState.settings);
    
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
                        XPRTEST: []
                    }
                }
                settings.chainPermissions[coreSymbol] = payload.rows;
                BeetDB.settings.put({id: 'settings', value: JSON.stringify(settings)}).then(() => {
                    commit(LOAD_SETTINGS, settings);
                    resolve();
                })
            }).catch((error) => {
                console.log(`setChainPermissions: ${error}`)
                reject(error);
            });
        });
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
            WAX: [],
            WAXTEST: [],
            EOSTEST: [],
            FIO: [],
            FIOTEST: [],
            LIBRE: [],
            LIBRETEST: [],
            XPR: [],
            XPRTEST: []
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
            XPRTEST: blockchains.XPRTEST.nodeList
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
