import BlockchainAPI from "./BlockchainAPI.js";

import {
    APIClient,
    FetchProvider,
    PrivateKey,
    Transaction,
    SignedTransaction,
    Signature,
    PublicKey,
    Bytes
} from '@wharfkit/antelope';
import { SigningRequest } from '@wharfkit/signing-request';

import * as Actions from "../Actions.js";
import { getContractKit } from './Antelope/contractKit.js';
import { resolveEsrRequest } from './Antelope/esrHelper.js';

export const BASE_EOSIO_OPERATIONS = [
    "activate", "setparams", "setpriv", "rmvproducer", "updtrevision",
    "regproducer", "regproducer2", "unregprod", "voteproducer", "regproxy",
    "claimrewards", "delegatebw", "undelegatebw", "refund",
    "buyram", "buyrambytes", "sellram", "setram", "setramrate",
    "bidname", "bidrefund",
    // full REX set
    "setrex", "deposit", "withdraw", "buyrex", "unstaketorex", "sellrex",
    "cnclrexorder", "rentcpu", "rentnet", "fundcpuloan", "fundnetloan",
    "defcpuloan", "defnetloan", "updaterex", "rexexec", "consolidate",
    "mvtosavings", "mvfrsavings", "closerex",
    // token
    "create", "issue", "retire", "transfer", "open", "close",
    // msig
    "propose", "approve", "unapprove", "cancel", "exec",
    // native
    "newaccount", "updateauth", "deleteauth", "linkauth", "unlinkauth",
    "canceldelay", "onerror", "setabi", "setcode",
];

export const ATOMIC_ASSETS_OPERATIONS = [
    "init", "setversion", "addconftoken", "setmarketfee",
    "createcol", "setcoldata", "addcolauth", "remcolauth",
    "addnotifyacc", "remnotifyacc", "forbidnotify", "admincoledit",
    "createschema", "extendschema",
    "createtempl", "locktemplate",
    "mintasset", "burnasset", "setassetdata", "transfer", "backasset", "announcedepo",
    "createoffer", "acceptoffer", "canceloffer", "declineoffer", "payofferram",
    "withdraw",
];

export const ATOMIC_MARKET_OPERATIONS = [
    "init", "setversion", "regmarket", "setmarketfee", "setminbidinc",
    "addconftoken", "adddelphi", "addafeectr", "addbonusfee", "delbonusfee",
    "stopbonusfee", "convcounters",
    "setdefmktcr", "migratebal",
    "announcesale", "cancelsale", "purchasesale", "assertsale", "paysaleram", "withdraw",
    "announceauct", "cancelauct", "auctionbid", "auctclaimbuy", "auctclaimsel",
    "assertauct", "payauctram",
    "createbuyo", "cancelbuyo", "acceptbuyo", "declinebuyo", "paybuyoram",
    "createtbuyo", "canceltbuyo", "fulfilltbuyo",
    "setroyalconf", "delroyalconf", "settemplroy", "deltemplroy",
    "setattrroy", "delattrroy",
    "lognewsale", "logsalestart", "lognewauct", "logauctstart",
    "lognewbuyo", "lognewtbuyo",
    "logroyfound", "logroytempl", "logroyattr", "logroydust",
];

function prepareActionsForWharfkit(actions) {
    return actions.map((action) => {
        if (action.data && typeof action.data === 'string') {
            try {
                return { ...action, data: Bytes.from(action.data, 'hex') };
            } catch (e) {
                return action;
            }
        }
        return action;
    });
}

export default class Antelope extends BlockchainAPI {
    get operations() {
        return [
            Actions.INJECTED_CALL,
            ...BASE_EOSIO_OPERATIONS,
            ...ATOMIC_ASSETS_OPERATIONS,
            ...ATOMIC_MARKET_OPERATIONS,
        ];
    }

    getTokenContract() {
        return this._config.tokenContract || "eosio.token";
    }

    get beautifyModule() {
        throw new Error("Subclass must implement beautifyModule");
    }

    /*
     * Establish a connection
     * @param {String} nodeToConnect
     * @returns {String}
     */
    async _establishConnection(nodeToConnect) {
        if (
            (!nodeToConnect || !nodeToConnect.length) &&
            !this.getNodes()[0].url
        ) {
            throw this._connectionFailed("", "No node url");
        }

        const chosenURL =
            nodeToConnect && nodeToConnect.length
                ? nodeToConnect
                : this.getNodes()[0].url;

        let client;
        try {
            client = new APIClient({
                provider: new FetchProvider(chosenURL, { fetch })
            });
        } catch (error) {
            console.log({ error });
            throw this._connectionFailed(chosenURL, error.message);
        }

        this.client = client;
        return this._connectionEstablished(chosenURL);
    }

    /**
     * Release the APIClient reference so GC can reclaim it.
     * EOS-family uses stateless HTTP fetch — no persistent connection to tear down.
     */
    async disconnect() {
        this.client = null;
    }

    /**
     * Returning the list of injectable operations
     * @returns {Array}
     */
    getOperationTypes() {
        // No virtual operations included
        const _ops = this.operations.map((op) => {
            return {
                id: op,
                method: op,
            };
        });
        _ops.push({
            id: 'customOperations',
            method: 'customOperations',
        });
        return _ops;
    }

    /*
     * Connect to the Bitshares blockchain. (placeholder replacement)
     * @param {String||null} nodeToConnect
     * @returns {String}
     */
    async _connect(nodeToConnect = null) {
        if (nodeToConnect) {
            return this._establishConnection(nodeToConnect);
        }

        if (
            this._isConnected &&
            this._isConnectedToNode &&
            !nodeToConnect
        ) {
            return this._connectionEstablished(this._isConnectedToNode);
        }

        if (this._node) {
            return this._establishConnection(this._node);
        }

        throw this._connectionFailed("", "No node available");
    }

    /**
     * Test a wss url for successful connection.
     * @param {String} url
     * @returns {Object}
     */
    _testConnection(url) {
        const { promise, resolve } = Promise.withResolvers();
        let timeoutId = setTimeout(() => {
            resolve(null);
        }, 2000);

        let beforeTS = Date.now();
        let socket = new Socket(url);
        socket.on("connect", () => {
            let lag = Date.now() - beforeTS;
            clearTimeout(timeoutId);
            socket.destroy();
            resolve({ url: url, lag: lag });
        });

        socket.on("error", (error) => {
            clearTimeout(timeoutId);
            socket.destroy();
            resolve(null);
        });

        return promise;
    }

    /**
     * Test the wss nodes, return latencies and fastest url.
     * @returns {Promise}
     */
    async _testNodes() {
        let urls = this.getNodes().map((node) => node.url);

        let filteredURLS = urls.filter((url) => {
            if (!this._tempBanned || !this._tempBanned.includes(url)) {
                return true;
            }
        });

        let validNodes = await Promise.all(
            filteredURLS.map((url) => this._testConnection(url))
        );

        let filteredNodes = validNodes.filter((x) => x);
        if (filteredNodes.length) {
            let sortedNodes = filteredNodes.sort(
                (a, b) => a.lag - b.lag
            );
            return {
                node: sortedNodes[0].url,
                latencies: sortedNodes,
                timestamp: Date.now(),
            };
        } else {
            console.error(
                "No valid BTS WSS connections established; Please check your internet connection."
            );
            throw new Error("No valid BTS WSS connections");
        }
    }

    /*
     * Check if the connection needs reestablished (placeholder replacement)
     * @returns {Boolean}
     */
    async _needsNewConnection() {
        if (
            !this._isConnected ||
            !this._isConnectedToNode ||
            !this._nodeLatencies
        ) {
            return true;
        }

        let testConnection = await this._testConnection(this._isConnectedToNode);
        return testConnection && testConnection.url ? false : true;
    }

    /**
     * Verify the private key for an EOS blockchain L1 account
     * @param {string} accountName
     * @param {string} privateKey
     * @param {string} chain // EOS, TLOS, BEOS (note: chain parameter is not needed by wharfkit, left here for compatibility)
     */
    async verifyAccount(accountName, credentials, chain = "VAULTA") {
        let fetchedAccount;
        try {
            fetchedAccount = await this.getAccount(accountName);
            // Keys must resolve to one of these types of permissions
        } catch (err) {
            console.log(err);
            throw { key: "account_not_found" };
        }

        if (!fetchedAccount) {
            throw { key: "account_not_found" };
        }

        const privateKey = typeof credentials === 'string'
            ? credentials
            : credentials.privateKey;

        let publicKey;
        try {
            // Derive the public key from the private key provided
            const privKey = PrivateKey.from(privateKey);
            publicKey = privKey.toPublic().toString();
        } catch (err) {
            // key is likely invalid, an exception was thrown
            console.log(err);
            throw { key: "invalid_key_error" };
        }

        if (!publicKey) {
            throw { key: "invalid_key_error" };
        }

        const validPermissions = fetchedAccount.permissions.filter((perm) => {
            // Get the threshold a key needs to perform operations
            const { threshold } = perm.required_auth;
            // finally determine if any keys match
            const matches = perm.required_auth.keys.filter(
                (auth) => auth.key === publicKey && auth.weight >= threshold
            );
            // this is a valid permission should any of the keys and thresholds match
            return matches.length > 0;
        });

        if (validPermissions.length > 0) {
            console.log("Key is valid");
            return {
                fetchedAccount,
                publicKey,
            };
        }

        throw { key: "unverified_account_error" };
    }

    async getAccount(accountname) {
        try {
            await this._establishConnection();
            const account = await this.client.v1.chain.get_account(accountname);

            account.active = {};
            account.owner = {};
            account.active.public_keys = account.permissions
                .find((res) => {
                    return res.perm_name.equals("active");
                })
                .required_auth.keys.map((item) => [
                    item.key.toString(),
                    item.weight.toNumber(),
                ]);
            account.owner.public_keys = account.permissions
                .find((res) => {
                    return res.perm_name.equals("owner");
                })
                .required_auth.keys.map((item) => [
                    item.key.toString(),
                    item.weight.toNumber(),
                ]);
            account.memo = {
                public_key: account.active.public_keys[0][0],
            };
            account.id = account.account_name.toString();
            return account;
        } catch (error) {
            console.error({ error, location: "getAccount", accountname });
            throw error;
        }
    }

    getPublicKey(privateKey) {
        // convertLegacyPublicKey
        return PrivateKey.from(privateKey).toPublic().toString();
    }

    async getTableRows(
        contract = "eosio.token",
        accountname,
        table = "accounts",
        limit = 100
    ) {
        try {
            const result = await this.client.v1.chain.get_table_rows({
                json: true,
                code: contract,
                scope: accountname,
                table: table,
                limit: limit,
            });
            if (result && result.rows) {
                return result.rows;
            }
            throw new Error("No rows found");
        } catch (error) {
            console.error({ error, location: "getTableRows", contract, accountname });
            throw error;
        }
    }

    async getBalances(accountName) {
        let balances = [];
        try {
            const account = await this.getAccount(accountName);

            balances.push({
                asset_type: "Core",
                asset_name: this._getCoreSymbol(),
                balance: parseFloat(account.core_liquid_balance.toString()),
                owner: "-",
                prefix: "",
            });
            balances.push({
                asset_type: "UIA",
                asset_name: "CPU Stake",
                balance: parseFloat(account.cpu_weight.toString()),
                owner: "-",
                prefix: "",
            });
            balances.push({
                asset_type: "UIA",
                asset_name: "Bandwith Stake",
                balance: parseFloat(account.net_weight.toString()),
                owner: "-",
                prefix: "",
            });
            balances.push({
                asset_type: "UIA",
                asset_name: `RAM Stake (-${account.ram_usage.toString()} bytes)`,
                balance: parseFloat(account.ram_quota.toString()),
                owner: "-",
                prefix: "",
            });
        } catch (error) {
            console.log({ error, location: "getBalances.getAccount", user: accountName });
            return balances;
        }

        try {
            const tableRows = await this.getTableRows(
                this.getTokenContract(),
                accountName,
                "accounts",
                100
            );
            tableRows.forEach((row) => {
                if (
                    !balances.some(
                        (balance) =>
                            balance.asset_name ===
                            row.balance.split(" ")[1]
                    )
                ) {
                    balances.push({
                        asset_type: "UIA",
                        asset_name: row.balance.split(" ")[1],
                        balance: parseFloat(
                            row.balance.split(" ")[0]
                        ),
                        owner: "-",
                        prefix: "",
                    });
                }
            });
        } catch (error) {
            console.log({ error });
        }

        return balances;
    }

    /**
     * Placeholder for blockchain TOTP implementation
     * @returns Boolean
     */
    supportsTOTP() {
        return true;
    }

    /**
     * Placeholder for blockchain QR implementation
     * @returns Boolean
     */
    supportsQR() {
        return true;
    }

    /**
     * Placeholder for blockchain Web implementation
     * @returns Boolean
     */
    supportsWeb() {
        return true;
    }

    /**
     * Placeholder for local file processing
     * @returns Boolean
     */
    supportsLocal() {
        return true;
    }

    sign(transaction, key) {
        transaction.privateKey = PrivateKey.from(key);
        return transaction;
    }

    async broadcast(transaction) {
        if (!transaction.actions || !transaction.actions.length) {
            throw new Error("Transaction has no actions");
        }

        if (!transaction.privateKey) {
            throw new Error("Transaction is not signed (missing privateKey)");
        }

        if (!this.client) {
            this.client = new APIClient({
                provider: new FetchProvider(this.getNodes()[0].url, { fetch })
            });
        }

        try {
            const info = await this.client.v1.chain.get_info();
            let signedTransaction;

            if (transaction._esrSerializedTx) {
                const signature = transaction.privateKey.signDigest(
                    transaction._esrSigningDigest
                );
                signedTransaction = SignedTransaction.from({
                    signatures: [signature],
                    serializedTransaction: transaction._esrSerializedTx,
                });
            } else {
                const header = info.getTransactionHeader(30);

                const contractNames = [...new Set(transaction.actions.map(action => action.account))];
                const kit = getContractKit(this._config.identifier, this.getNodes()[0].url);

                const contracts = await Promise.all(
                    contractNames.map(async (name) => {
                        try {
                            return { contract: name, abi: (await kit.load(name)).abi };
                        } catch {
                            return { contract: name, abi: null };
                        }
                    })
                );

                const abis = contracts.filter((c) => c.abi);

                const preparedActions = prepareActionsForWharfkit(transaction.actions);

                const tx = Transaction.from({
                    ...header,
                    actions: preparedActions
                }, abis);

                const signature = transaction.privateKey.signDigest(
                    tx.signingDigest(info.chain_id)
                );

                signedTransaction = SignedTransaction.from({
                    ...tx,
                    signatures: [signature]
                });
            }

            return await this.client.v1.chain.push_transaction(signedTransaction);
        } catch (error) {
            console.log({ error, location: "broadcast" });
            throw error;
        }
    }

    getOperation(data, account) {
        // FIXME this file no longer uses eosjs, and a query to WharfKit's DeepWiki produces
        // "The block producer voting API is accessed through the get_producer_schedule() method in the Chain API"
        // So implementing this does now seem possible, perhaps?

        // https://eosio.stackexchange.com/questions/212/where-is-the-api-for-block-producer-voting-in-eosjs
        throw "Not supported";
    }

    mapOperationData(incoming) {
        throw "Not supported";
    }

    _signString(key, string) {
        const privateKey = PrivateKey.from(key);
        const message = Bytes.from(string, 'utf8');
        const signature = privateKey.signMessage(message);
        return signature.toString();
    }

    _verifyString(signature, publicKey, string) {
        const sig = Signature.from(signature);
        const pubKey = PublicKey.from(publicKey);
        const message = Bytes.from(string, 'utf8');
        return sig.verifyMessage(message, pubKey);
    }

    getExplorer(object, chain) {
        if (object.accountName) {
            return "https://eosauthority.com/account/" + object.accountName;
        } else if (object.txid) {
            // 4e0d513db2b03e7a5cdee0c4b5b8096af33fba08fcf2b7c4b05ab8980ae4ffc6
            return "https://eosauthority.com/transaction/" + object.txid;
        } else {
            return false;
        }
    }

    /*
     * Returns an array of default import options. (placeholder replacement)
     * @returns {Array}
     */
    getImportOptions() {
        return [
            {
                type: "ImportKeys",
                translate_key: "import_keys",
            },
        ];
    }

    /**
     * Processing and localizing operations in the transaction
     * @param {Object[]} trx
     * @param {string[]} allowedOperations - user-authorized operation types
     * @returns
     */
    async visualize(trx, allowedOperations) {
        const txData = trx[1];
        let _trx;

        if (typeof txData === 'string') {
            try {
                const decoded = SigningRequest.from(txData);
                const resolved = await resolveEsrRequest(
                    decoded, this._config.identifier, this.getNodes()[0].url, this
                );
                _trx = { actions: resolved.resolvedActions };
            } catch (e) {
                _trx = JSON.parse(txData);
            }
        } else {
            _trx = txData;
        }

        if (!this.client) {
            this.client = new APIClient({
                provider: new FetchProvider(this.getNodes()[0].url, { fetch })
            });
        }

        const contractNames = [...new Set(_trx.actions.map((a) => a.account))];
        const kit = getContractKit(this._config.identifier, this.getNodes()[0].url);

        const contracts = await Promise.all(
            contractNames.map(async (name) => {
                try {
                    return { contract: name, kit: await kit.load(name) };
                } catch {
                    return { contract: name, kit: null };
                }
            })
        );

        const decodedActions = _trx.actions.map((action) => {
            const contract = contracts.find((c) => c.contract === action.account);
            if (contract?.kit && action.data) {
                try {
                    const abi = contract.kit.abi;
                    const decoded = Transaction.from(
                        { actions: [action] },
                        [{ contract: action.account, abi }]
                    ).actions[0].decoded;
                    return { ...action, data: decoded.data, abi };
                } catch (e) {
                    // If decoding fails, pass through raw data
                }
            }
            return action;
        });

        let beautifiedOpPromises = [];
        for (let i = 0; i < decodedActions.length; i++) {
            let operation = decodedActions[i];
            beautifiedOpPromises.push(this.beautifyModule(operation, allowedOperations));
        }

        return Promise.all(beautifiedOpPromises)
            .then((operations) => {
                if (
                    operations.some(
                        (op) =>
                            !Object.prototype.hasOwnProperty.call(op, "rows")
                    )
                ) {
                    throw new Error(
                        "There's an issue with the format of an operation!"
                    );
                }
                return operations;
            })
            .catch((error) => {
                console.log(error);
            });
    }
}
