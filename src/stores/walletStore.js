import { defineStore } from 'pinia';
import BeetDB from '../lib/BeetDB.js';
import { hashPassword } from '../lib/utils.js';
import { useAccountStore } from './accountStore.js';
import { usePopupStore } from './popupStore.js';

export const useWalletStore = defineStore('wallet', {
    state: () => ({
        wallet: {},
        hasWallet: false,
        walletlist: [],
        unlocked: {},
        isUnlocked: false,
        selectedWalletIndex: null,
    }),

    getters: {
        getWallet: (state) => state.wallet,
        getCurrentID: (state) => {
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
        getWalletName: (state) => state.wallet.name,
        getWalletTier: (state) => state.wallet.tier || "medium",
        getHasWallet: (state) => state.hasWallet,
        getWalletList: (state) => state.walletlist,
    },

    actions: {
        setSelectedWalletIndex(index) {
            this.selectedWalletIndex = index;
        },
        async loadWallet(payload) {
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

            const public_wallets = this.walletlist.filter((x) => {
                return x.id === payload.wallet_id;
            });

            this.wallet = public_wallets[0];
            useAccountStore().loadAccounts(
                Array.isArray(parsedWallet)
                    ? parsedWallet
                    : [parsedWallet]
            ).catch(error => {
                console.error('Error loading accounts:', error);
            });
        },
        confirmUnlock() {
            console.log('Unlocked wallet!');
            this.unlocked.resolve();
            this.isUnlocked = true;
        },
        async restoreWallet(payload) {
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
            this.unlocked = {
                promise: unlocked,
                resolve: unlock
            };
            this.hasWallet = true;
            this.walletlist = wallets;

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

            this.wallet = newwallet;
            useAccountStore().loadAccounts(accounts);
        },
        async saveWallet(payload) {
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
            this.unlocked = {
                promise: unlocked,
                resolve: unlock
            };
            this.hasWallet = true;
            this.walletlist = wallets;

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

            this.wallet = newwallet;
            useAccountStore().loadAccounts([payload.walletdata]);
        },
        async saveAccountToWallet(payload) {
            const accountStore = useAccountStore();
            const walletdata = accountStore.accountlist.slice();
            const newwalletdata = walletdata;
            newwalletdata.push(payload.account);

            const tier = this.wallet.tier || "medium";

            const wallet = await BeetDB.wallets_encrypted.get({
                id: this.wallet.id
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

            const updatedWallet = JSON.parse(JSON.stringify(this.wallet));
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
                this.wallet = updatedWallet;
                return 'Account saved';
            } catch (error) {
                console.log(error);
                throw 'update_failed';
            }
        },
        async deleteAccountFromWallet(payload) {
            const accountStore = useAccountStore();
            const tier = this.wallet.tier || "medium";

            const wallet = await BeetDB.wallets_encrypted.get({
                id: this.wallet.id
            });

            // Verify we can decrypt (authorization check)
            try {
                await window.electron.decryptWallet({data: wallet.data});
            } catch (error) {
                console.log({ error });
                throw 'decrypt_failure';
            }

            const walletdata = accountStore.accountlist.slice();

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

            const updatedWallet = JSON.parse(JSON.stringify(this.wallet));
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
                this.wallet = updatedWallet;
                return 'Account deleted';
            } catch (error) {
                console.log(error);
                throw 'update_failed';
            }
        },
        async loadWallets() {
            const wallets = await BeetDB.wallets_public.toArray();
            if (wallets && wallets.length > 0) {
                let unlock;
                const unlocked = new Promise(function (resolve) {
                    unlock = resolve;
                });
                this.unlocked = {
                    promise: unlocked,
                    resolve: unlock
                };
                this.hasWallet = true;
                this.walletlist = wallets;
                return 'Wallets Found';
            } else {
                return 'Wallets not found';
            }
        },
        notifyUser(payload) {
            if (payload.notify === 'request') {
                window.electron.notify(payload.message);
            } else {
                throw new Error('Invalid notify type');
            }
        },
        logout() {
            this.wallet = {};
            this.hasWallet = false;
            this.walletlist = [];
            this.unlocked = {};
            this.isUnlocked = false;
            this.selectedWalletIndex = null;
            useAccountStore().logout();
            usePopupStore().reset();
            window.electron.clearSeed();
        },
    },
});
