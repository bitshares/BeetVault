import { hashPassword } from '../../lib/utils.js';

const LOAD_ACCOUNTS = 'LOAD_ACCOUNTS';
const CHOOSE_ACCOUNT = 'CHOOSE_ACCOUNT';
const ADD_ACCOUNT = 'ADD_ACCOUNT';
const CLEAR_ACCOUNTS = 'CLEAR_ACCOUNTS';
const DELETE_ACCOUNT = 'DELETE_ACCOUNT';

const mutations = {
    [LOAD_ACCOUNTS](state, accounts) {
        state.accountlist = accounts;
        state.selectedIndex = 0;
    },
    [CHOOSE_ACCOUNT](state, accountIndex) {
        state.selectedIndex = accountIndex;
    },
    [ADD_ACCOUNT](state, account) {
        state.accountlist.push(account);
        state.selectedIndex = state.accountlist.length - 1;
    },
    [CLEAR_ACCOUNTS](state) {
        state.selectedIndex = null;
        state.accountlist = [];
    },
    [DELETE_ACCOUNT](state, accountName) {
        const index = state.accountlist.findIndex(account => account.accountName === accountName);
        if (index !== -1) {
            state.accountlist.splice(index, 1);
            if (state.selectedIndex === index) {
                state.selectedIndex = null;
            } else if (state.selectedIndex > index) {
                state.selectedIndex--;
            }
        }
    }
};

const actions = {
    async addAccount({
        dispatch,
        commit,
        state,
        rootState
    }, payload) {
        const existingAccount = state.accountlist.find(
            x => x.chain === payload.account.chain &&
            (
                x.accountID && x.accountID === payload.account.accountName ||
                x.accountName && x.accountName === payload.account.accountName
            )
        );

        if (existingAccount) {
            throw 'Account already exists';
        }

        const keys = payload.account.keys;
        const tier = rootState.WalletStore.wallet.tier || "medium";

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
            payload.account.keys = encryptedKeys;
        } else {
            // Non-vaulted keys: encrypt individually
            const keyTypes = Object.keys(keys);
            for (let i = 0; i < keyTypes.length; i++) {
                const keytype = keyTypes[i];
                let _aesResult;
                try {
                    _aesResult = await window.electron.encryptAndStore({
                        data: keys[keytype],
                        password: hashPassword(payload.password),
                        tier: tier
                    });
                } catch (error) {
                    console.log({error});
                    throw 'Encryption failure';
                }

                if (_aesResult) {
                    payload.account.keys[keytype] = _aesResult;
                }
            }
        }

        await dispatch('WalletStore/saveAccountToWallet', payload, {root: true});
        commit(ADD_ACCOUNT, payload.account);
        return 'Account added';
    },
    async deleteAccount({ commit, dispatch, state }, payload) {
        const existingAccount = state.accountlist.find(
            x => x.chain === payload.account.chain &&
            (x.accountID === payload.account.accountName || x.accountName === payload.account.accountName)
        );

        if (!existingAccount) {
            throw 'Account not found';
        }

        await dispatch('deleteAccountFromWallet', payload);
        commit(DELETE_ACCOUNT, payload.accountName);
        return 'Account deleted';
    },
    async loadAccounts({ commit }, payload) {
        if (!payload || payload.length === 0) {
            throw 'Empty Account list';
        }
        commit(LOAD_ACCOUNTS, payload);
        return 'Accounts Loaded';
    },
    async logout({ commit }) {
        commit(CLEAR_ACCOUNTS);
    },
    async selectAccount({ commit, state }, payload) {
        let index = -1;
        for (let i = 0; i < state.accountlist.length; i++) {
            if (
                (payload.chain === state.accountlist[i].chain) &&
                (
                    payload.accountID === state.accountlist[i].accountID ||
                    payload.accountID === state.accountlist[i].accountName ||
                    payload.accountName === state.accountlist[i].accountName
                )
            ) {
                index = i;
                break;
            }
        }

        if (index !== -1) {
            commit(CHOOSE_ACCOUNT, index);
            return 'Account found';
        }
    }
}

const getters = {
    getCurrentSafeAccount: state => () => {
        let selected = state.selectedIndex;
        let currentAccount = state.accountlist[selected ?? 0];
        return {
            accountID: currentAccount.accountID,
            accountName: currentAccount.accountName,
            chain: currentAccount.chain
        }
    },
    getCurrentIndex: state => state.selectedIndex ?? -1,
    getChain: state => state.accountlist[state.selectedIndex].chain,
    getAccountList: state => state.accountlist,
    getAccountQuantity: state => state.accountlist.length,
    getSafeAccountList: state => () => {
        const _mappedAccounts = state.accountlist.map(account => {
            return {
                accountID: account.accountID,
                accountName: account.accountName,
                chain: account.chain
            };
        });
        return _mappedAccounts;
    },
    getSafeAccount: state => (request) => {
        let safeAccounts = state.accountlist.map(account => {
          return {
            accountID: account.accountID,
            accountName: account.accountName,
            chain: account.chain,
            memoKey: account.keys.memo
          };
        });

        let requestedAccounts = safeAccounts.filter(account => {
            return account.accountID == request.account_id && account.chain == request.chain
                    ? true
                    : false;
        });

        if (!requestedAccounts || !requestedAccounts.length) {
            console.log("Couldn't retrieve account safely.");
            return;
        }

        return requestedAccounts[0];
    },
    getCurrentActiveKey: (state) => () => {
        let currentAccount = state.accountlist[state.selectedIndex];
        return currentAccount.keys.active;
    },
    getEOSKey: (state) => () => {
        let currentAccount = state.accountlist[state.selectedIndex];
        return currentAccount.keys.privateKey;
    },
    getActiveKey: (state) => (request) => {
      let signing = state.accountlist.filter(account => {
          return (
              account.accountID == request.payload.account_id &&
              account.chain == request.payload.chain
          );
      });

      if (!signing || !signing.length) {
          return;
      }

      return signing.slice()[0].keys.active;
    },
    getSigningKey: (state) => (request) => {
        let signing = state.accountlist.filter(account => {
            return (
                account.accountID == request.payload.account_id &&
                account.chain == request.payload.chain
            );
        });

        if (!signing || !signing.length) {
            return;
        }

        let keys = signing.slice()[0].keys;

        return keys.memo
                ? keys.memo
                : keys.active;
    },
    getPrivateMemoKey: (state) => (accountId, chain) => {
        try {
            const account = state.accountlist.find(account => account.accountID === accountId && account.chain === chain);
            if (account && account.keys.memo) {
                return account.keys.memo;
            }
        } catch (error) {
            console.error("Failed to get private memo key:", error);
        }
        return null;
    },
    getHiveKey: (state) => (request) => {
        let signing = state.accountlist.filter(account => {
            return (
                account.accountID == request.payload.account_id &&
                account.chain == request.payload.chain
            );
        });

        if (!signing || !signing.length) {
            return;
        }

        let account = signing.slice()[0];
        let keys = account.keys;
        return {
            privateKey: keys.privateKey || keys.active,
            keyType: account.keyType || null
        };
    }
};

const initialState = {
    selectedIndex: null,
    accountlist: []
};

export default {
    namespaced: true,
    state: initialState,
    actions,
    mutations,
    getters,
};
