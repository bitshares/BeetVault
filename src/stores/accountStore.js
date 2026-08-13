import { defineStore } from 'pinia';
import { hashPassword } from '../lib/utils.js';
import { useWalletStore } from './walletStore.js';
import { clearContractKitCache } from '../lib/blockchains/Antelope/contractKit.js';

export const useAccountStore = defineStore('account', {
    state: () => ({
        selectedIndex: null,
        accountlist: [],
    }),

    getters: {
        getCurrentSafeAccount: (state) => () => {
            let selected = state.selectedIndex;
            let currentAccount = state.accountlist[selected ?? 0];
            return {
                accountID: currentAccount.accountID,
                accountName: currentAccount.accountName,
                chain: currentAccount.chain
            };
        },
        getCurrentIndex: (state) => state.selectedIndex ?? -1,
        getChain: (state) => state.accountlist[state.selectedIndex].chain,
        getAccountList: (state) => state.accountlist,
        getAccountQuantity: (state) => state.accountlist.length,
        getSafeAccountList: (state) => () => {
            const _mappedAccounts = state.accountlist.map(account => {
                return {
                    accountID: account.accountID,
                    accountName: account.accountName,
                    chain: account.chain
                };
            });
            return _mappedAccounts;
        },
        getSafeAccount: (state) => (request) => {
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
        getVaultaKey: (state) => () => {
            let currentAccount = state.accountlist[state.selectedIndex];
            return currentAccount.keys.privateKey;
        },
        getVaultaAccount: (state) => () => {
            let currentAccount = state.accountlist[state.selectedIndex];
            return currentAccount.accountName;
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
        },
    },

    actions: {
        async addAccount(payload) {
            const existingAccount = this.accountlist.find(
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
            const tier = useWalletStore().wallet.tier || "medium";

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

            await useWalletStore().saveAccountToWallet({
                account: payload.account,
                password: payload.password,
            });
            this.accountlist.push(payload.account);
            this.selectedIndex = this.accountlist.length - 1;
            return 'Account added';
        },
        async deleteAccount(payload) {
            const existingAccount = this.accountlist.find(
                x => x.chain === payload.account.chain &&
                (x.accountID === payload.account.accountName || x.accountName === payload.account.accountName)
            );

            if (!existingAccount) {
                throw 'Account not found';
            }

            await useWalletStore().deleteAccountFromWallet({
                account: payload.account,
                chain: payload.chain,
                accountName: payload.accountName,
                wallet_pass: payload.wallet_pass,
            });
            const index = this.accountlist.findIndex(account => account.accountName === payload.accountName);
            if (index !== -1) {
                this.accountlist.splice(index, 1);
                if (this.selectedIndex === index) {
                    this.selectedIndex = null;
                } else if (this.selectedIndex > index) {
                    this.selectedIndex--;
                }
            }
            return 'Account deleted';
        },
        async loadAccounts(accounts) {
            if (!accounts || accounts.length === 0) {
                throw 'Empty Account list';
            }
            this.accountlist = accounts;
            this.selectedIndex = 0;
            return 'Accounts Loaded';
        },
        async logout() {
            this.accountlist = [];
            this.selectedIndex = null;
        },
        async selectAccount(payload) {
            let index = -1;
            for (let i = 0; i < this.accountlist.length; i++) {
                if (
                    (payload.chain === this.accountlist[i].chain) &&
                    (
                        payload.accountID === this.accountlist[i].accountID ||
                        payload.accountID === this.accountlist[i].accountName ||
                        payload.accountName === this.accountlist[i].accountName
                    )
                ) {
                    index = i;
                    break;
                }
            }

            if (index !== -1) {
                this.selectedIndex = index;
                clearContractKitCache();
                return 'Account found';
            }
        },
    },
});
