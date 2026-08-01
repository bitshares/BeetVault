import Dexie from 'dexie';
const BeetDB = new Dexie('BeetVaultDB'); // Change name if you fork the wallet to avoid wiping data from the original wallet

BeetDB.version(1).stores({
    settings: `++id, setting, value`,
    wallets_public: `&id, name, accounts`,
    wallets_encrypted: `&id, data`,
    whitelistable: `++id,method`,
    whitelist: `++id,identityhash,method`
});

export default BeetDB;
