import BeetDB from '../../lib/BeetDB.js';
import { hashPassword } from '../../lib/utils.js';

const GET_WALLET = 'GET_WALLET';
const CREATE_WALLET = 'CREATE_WALLET';
const CONFIRM_UNLOCK = 'CONFIRM_UNLOCK';
const SET_WALLET_STATUS = 'SET_WALLET_STATUS';
const SET_WALLET_UNLOCKED = 'SET_WALLET_UNLOCKED';
const SET_WALLETLIST = 'SET_WALLETLIST';
const REQ_NOTIFY = 'REQ_NOTIFY';
const CLOSE_WALLET = 'CLOSE_WALLET';
const SET_SELECTED_WALLET_INDEX = 'SET_SELECTED_WALLET_INDEX';

const wallet = {};

const mutations = {
    [GET_WALLET](state, wallet) {
        state.wallet = wallet;
    },
    [CONFIRM_UNLOCK](state) {
        state.unlocked.resolve();
        state.isUnlocked = true;
    },
    [CLOSE_WALLET](state) {
        state.wallet = {};
        state.hasWallet = false;
        state.walletlist = [];
        state.unlocked = {};
        state.isUnlocked = false;
    },
    [SET_WALLET_STATUS](state, status) {
        state.hasWallet = status;
    },
    [SET_WALLET_UNLOCKED](state, unlocked) {
        state.unlocked = unlocked;
    },
    [SET_WALLETLIST](state, walletlist) {
        state.walletlist = walletlist;
    },
    [REQ_NOTIFY](state, notify) {
        // Intentionally empty — side effect moved to action.
    },
    [CREATE_WALLET](state, wallet) {
        state.wallet = wallet;
    },
    [SET_SELECTED_WALLET_INDEX](state, index) {
        state.selectedWalletIndex = index;
    },
};

const actions = {
    setSelectedWalletIndex({ commit }, index) {
        commit(SET_SELECTED_WALLET_INDEX, index);
    },
    async getWallet({
        dispatch,
        commit,
        state
    }, payload) {
        let wallet;
        try {
            wallet = await BeetDB.wallets_encrypted.get({
                id: payload.wallet_id
            });
        } catch (error) {
            console.log({error});
            throw 'db_failure';
        }

        if (!wallet || !wallet.data) {
            throw 'wallet_not_found';
        }

        let decryptedWallet;
        try {
            decryptedWallet = await window.electron.unlockWallet({
                encryptedData: wallet.data,
                password: hashPassword(payload.wallet_pass)
            });
        } catch (error) {
            console.log({error});
            throw error;
        }

        if (!decryptedWallet) {
            throw 'decryption_failure';
        }

        let parsedWallet;
        try {
            parsedWallet = JSON.parse(decryptedWallet);
        } catch (error) {
            console.log({error});
            throw 'parse_failure';
        }

        const public_wallets = state.walletlist.filter((x) => {
            return x.id === payload.wallet_id;
        });

        commit(GET_WALLET, public_wallets[0]);
        dispatch(
            'AccountStore/loadAccounts',
            Array.isArray(parsedWallet)
                ? parsedWallet
                : [parsedWallet],
            {root: true}
        ).catch(error => {
            console.error('Error loading accounts:', error);
        });
    },
    confirmUnlock({
        commit
    }) {
        console.log('Unlocked wallet!');
        commit(CONFIRM_UNLOCK);
    },
    async restoreWallet({
        commit,
        dispatch
    }, payload) {
        let walletid;
        try {
            walletid = await window.electron.id();
        } catch (error) {
            console.log({error});
            throw 'uuid_failure';
        }

        const tier = payload.backup.tier || "medium";
        const accounts = payload.backup.accounts || [];

        const newwallet = {
            id: walletid,
            name: payload.backup.wallet,
            tier: tier,
            chain: '',
            accounts: accounts.map(x => x.accountID)
        };

        await BeetDB.wallets_public.put(newwallet);
        const wallets = await BeetDB.wallets_public.toArray();

        let unlock;
        const unlocked = new Promise(function (resolve) {
            unlock = resolve;
        });
        commit(SET_WALLET_UNLOCKED, {
            promise: unlocked,
            resolve: unlock
        });
        commit(SET_WALLET_STATUS, true);
        commit(SET_WALLETLIST, wallets);

        let _encrypted;
        try {
            _encrypted = await window.electron.encryptAndStore({
                data: JSON.stringify(accounts),
                password: hashPassword(payload.password),
                tier: tier
            });
        } catch (error) {
            console.log({error});
            throw 'encrypt_failure';
        }

        await BeetDB.wallets_encrypted.put({
            id: walletid,
            data: _encrypted
        });

        // Set the seed for this wallet
        try {
            await window.electron.setSeedFromPassword({password: hashPassword(payload.password)});
        } catch (error) {
            console.log({error});
        }

        commit(GET_WALLET, newwallet);
        dispatch('AccountStore/loadAccounts', accounts, {
            root: true
        });
    },
    /**
     * Creates a new wallet and persists it to IndexedDB.
     *
     * Generates a UUID, saves the public wallet record (name, account list)
     * to `wallets_public`, encrypts the private keys (via vault token or
     * individually) and the entire wallet data blob, then stores the encrypted
     * blob in `wallets_encrypted`.
     *
     * The `tier` parameter controls the Argon2id memory/time cost for
     * encryption. Higher tiers produce stronger key derivation but take
     * longer during wallet creation and unlock.
     *
     * @param {object} context - Vuex action context.
     * @param {object} payload
     * @param {string} payload.walletname - Display name for the wallet.
     * @param {string} payload.password - Plaintext password (hashed before IPC).
     * @param {object} payload.walletdata - Account data including keys.
     * @param {string} [payload.tier="medium"] - Security tier ("low", "medium", "high")
     *   or raw `{ t, m, p }` Argon2id parameters.
     * @returns {Promise<void>} Resolves when the wallet is saved.
     * @throws {string} Error code on failure ('uuid_failure', 'Encryption failure').
     */
    async saveWallet({
        commit,
        dispatch
    }, payload) {
        let walletid;
        try {
            walletid = await window.electron.id();
        } catch (error) {
            console.log({error});
            throw 'uuid_failure';
        }

        const newwallet = {
            id: walletid,
            name: payload.walletname,
            tier: payload.tier || "medium",
            accounts: [{
                accountID: payload.walletdata.accountID ? payload.walletdata.accountID : payload.walletdata.accountName,
                accountName: payload.walletdata.accountName,
                chain: payload.walletdata.chain
            }]
        };

        await BeetDB.wallets_public.put(newwallet);
        const wallets = await BeetDB.wallets_public.toArray();

        let unlock;
        const unlocked = new Promise(function (resolve) {
            unlock = resolve;
        });
        commit(SET_WALLET_UNLOCKED, {
            promise: unlocked,
            resolve: unlock
        });
        commit(SET_WALLET_STATUS, true);
        commit(SET_WALLETLIST, wallets);

        let keys = payload.walletdata.keys;
        const tier = payload.tier || "medium";

        // If keys contain a vault token, encrypt via main process
        if (keys._vaultToken) {
            let encryptedKeys;
            try {
                encryptedKeys = await window.electron.encryptPendingKeys({
                    token: keys._vaultToken,
                    password: hashPassword(payload.password),
                    tier: tier
                });
            } catch (error) {
                console.log({error});
                throw 'Encryption failure';
            }
            payload.walletdata.keys = encryptedKeys;
        } else {
            // Non-vaulted keys: encrypt individually
            const keyTypes = Object.keys(keys);
            for (let i = 0; i < keyTypes.length; i++) {
                const keytype = keyTypes[i];
                let _encrypted;
                try {
                    _encrypted = await window.electron.encryptAndStore({
                        data: payload.walletdata.keys[keytype],
                        password: hashPassword(payload.password),
                        tier: tier
                    });
                } catch (error) {
                    console.log({error});
                    throw 'Encryption failure';
                }

                payload.walletdata.keys[keytype] = _encrypted;
            }
        }

        // Encrypt the entire wallet data blob
        let _encryptedWalletData;
        try {
            _encryptedWalletData = await window.electron.encryptAndStore({
                data: JSON.stringify(payload.walletdata),
                password: hashPassword(payload.password),
                tier: tier
            });
        } catch (error) {
            console.log({error});
            throw 'Encryption failure';
        }

        await BeetDB.wallets_encrypted.put({
            id: walletid,
            data: _encryptedWalletData
        });

        commit(GET_WALLET, newwallet);
        dispatch('AccountStore/loadAccounts', [payload.walletdata], {
            root: true
        });
    },
    async saveAccountToWallet({
        commit,
        state,
        rootState
    }, payload) {
        const walletdata = rootState.AccountStore.accountlist.slice();
        const newwalletdata = walletdata;
        newwalletdata.push(payload.account);

        const tier = state.wallet.tier || "medium";

        const wallet = await BeetDB.wallets_encrypted.get({
            id: state.wallet.id
        });

        // Verify we can decrypt (authorization check)
        try {
            await window.electron.decryptWallet({data: wallet.data});
        } catch (error) {
            console.log({error});
            throw 'decrypt_failure';
        }

        let encwalletdata;
        try {
            encwalletdata = await window.electron.encryptAndStore({
                data: JSON.stringify(newwalletdata),
                password: hashPassword(payload.password),
                tier: tier
            });
        } catch (error) {
            console.log(error);
            throw 'encrypt_failure';
        }

        const updatedWallet = JSON.parse(JSON.stringify(state.wallet));
        updatedWallet.accounts.push({
            accountID: payload.account.accountID,
            chain: payload.account.chain
        });

        const docID = updatedWallet.id;
        const newAccounts = updatedWallet.accounts;

        try {
            await BeetDB.wallets_encrypted.update(docID, {
                "data": encwalletdata
            });
            await BeetDB.wallets_public.update(docID, {
                "accounts": newAccounts
            });
            commit(GET_WALLET, updatedWallet);
            return 'Account saved';
        } catch (error) {
            console.log(error);
            throw 'update_failed';
        }
    },
    async deleteAccountFromWallet({ commit, state, rootState }, payload) {
        const tier = state.wallet.tier || "medium";

        const wallet = await BeetDB.wallets_encrypted.get({
            id: state.wallet.id
        });

        // Verify we can decrypt (authorization check)
        try {
            await window.electron.decryptWallet({data: wallet.data});
        } catch (error) {
            console.log({ error });
            throw 'decrypt_failure';
        }

        const walletdata = rootState.AccountStore.accountlist.slice();

        const newwalletdata = walletdata.filter(account => {
            return account.chain !== payload.chain
                || account.accountName !== payload.accountName;
        });

        let encwalletdata;
        try {
            encwalletdata = await window.electron.encryptAndStore({
                data: JSON.stringify(newwalletdata),
                password: hashPassword(payload.wallet_pass),
                tier: tier
            });
        } catch (error) {
            console.log(error);
            throw 'encrypt_failure';
        }

        const updatedWallet = JSON.parse(JSON.stringify(state.wallet));
        updatedWallet.accounts = updatedWallet.accounts.filter(
            account => account.chain !== payload.chain ||
                       account.accountName !== payload.accountName
        );

        try {
            await BeetDB.wallets_encrypted.update(updatedWallet.id, {
                "data": encwalletdata
            });
            await BeetDB.wallets_public.update(updatedWallet.id, {
                "accounts": updatedWallet.accounts
            });
            commit(GET_WALLET, updatedWallet);
            return 'Account deleted';
        } catch (error) {
            console.log(error);
            throw 'update_failed';
        }
    },
    async loadWallets({ commit }) {
        const wallets = await BeetDB.wallets_public.toArray();
        if (wallets && wallets.length > 0) {
            let unlock;
            const unlocked = new Promise(function (resolve) {
                unlock = resolve;
            });
            commit(SET_WALLET_UNLOCKED, {
                promise: unlocked,
                resolve: unlock
            });
            commit(SET_WALLET_STATUS, true);
            commit(SET_WALLETLIST, wallets);
            return 'Wallets Found';
        } else {
            return 'Wallets not found';
        }
    },
    notifyUser({ commit }, payload) {
        if (payload.notify === 'request') {
            window.electron.notify(payload.message);
            commit(REQ_NOTIFY, payload.message);
        } else {
            throw new Error('Invalid notify type');
        }
    },
    logout({ commit, dispatch }) {
        commit(CLOSE_WALLET);
        dispatch('AccountStore/logout', {}, {
            root: true
        });
        dispatch('PopupStore/reset', {}, {
            root: true
        });
        window.electron.clearSeed();
    }
}


const getters = {
    getWallet: state => state.wallet,
    getCurrentID: state => {
        if (
            state.selectedWalletIndex !== null &&
            state.selectedWalletIndex >= 0 &&
            state.selectedWalletIndex < state.walletlist.length
        ) {
            return state.walletlist[state.selectedWalletIndex].id;
        } else {
            return null;
        }
    },
    getWalletName: state => state.wallet.name,
    getWalletTier: state => state.wallet.tier || "medium",
    getHasWallet: state => state.hasWallet,
    getWalletList: state => state.walletlist
};

const initialState = {
    wallet: wallet,
    hasWallet: false,
    walletlist: [],
    unlocked: {},
    isUnlocked: false,
    selectedWalletIndex: null,
};

export default {
    namespaced: true,
    state: initialState,
    actions,
    mutations,
    getters,
};
