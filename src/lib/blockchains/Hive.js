import beautify from "./Hive/beautify.js";
import BlockchainAPI from "./BlockchainAPI.js";
import { Transaction, PrivateKey, Signature, callRPC } from "hive-tx";

// Key type requirements for each operation
const operationKeyRequirements = {
  // Posting, Active, or Owner
  vote: ["posting", "active", "owner"],
  vote2: ["posting", "active", "owner"],
  comment: ["posting", "active", "owner"],
  delete_comment: ["posting", "active", "owner"],
  custom_json: ["posting", "active", "owner"],
  comment_options: ["posting", "active", "owner"],
  claim_reward_balance: ["posting", "active", "owner"],
  delegate_vesting_shares: ["posting", "active", "owner"],
  set_withdraw_vesting_route: ["posting", "active", "owner"],
  create_proposal: ["posting", "active", "owner"],
  update_proposal_votes: ["posting", "active", "owner"],
  remove_proposal: ["posting", "active", "owner"],
  update_proposal: ["posting", "active", "owner"],

  // Active or Owner only
  transfer: ["active", "owner"],
  transfer_to_vesting: ["active", "owner"],
  withdraw_vesting: ["active", "owner"],
  limit_order_create: ["active", "owner"],
  limit_order_create2: ["active", "owner"],
  limit_order_cancel: ["active", "owner"],
  feed_publish: ["active", "owner"],
  convert: ["active", "owner"],
  collateralized_convert: ["active", "owner"],
  account_update: ["active", "owner"],
  account_update2: ["active", "owner"],
  witness_update: ["active", "owner"],
  witness_set_properties: ["active", "owner"],
  account_witness_vote: ["active", "owner"],
  account_witness_proxy: ["active", "owner"],
  transfer_to_savings: ["active", "owner"],
  transfer_from_savings: ["active", "owner"],
  cancel_transfer_from_savings: ["active", "owner"],
  claim_account: ["active", "owner"],
  escrow_transfer: ["active", "owner"],
  escrow_dispute: ["active", "owner"],
  escrow_release: ["active", "owner"],
  escrow_approve: ["active", "owner"],
  recurrent_transfer: ["active", "owner"],
  prove_authority: ["active", "owner"],

  // Owner only
  account_create: ["owner"],
  create_claimed_account: ["owner"],
  request_account_recovery: ["owner"],
  recover_account: ["owner"],
  change_recovery_account: ["owner"],
  decline_voting_rights: ["owner"],
};

class Hive extends BlockchainAPI {
  constructor(config, node) {
    super(config, node);
    this.type = "HIVE";
    this.name = "Hive";
  }

  _connect = async (node, account) => {
    const url = `https://${node}/`;
    this.chainNode = url;
    return url;
  };

  getAccount = async (account) => {
    try {
      const response = await callRPC("condenser_api", "get_accounts", [
        [account]
      ]);
      if (response.result && response.result.length > 0) {
        return response.result[0];
      }
      return undefined;
    } catch (e) {
      console.log({ error: e, location: "getAccount" });
      throw e;
    }
  };

  getBalances = async (account) => {
    try {
      const response = await callRPC("condenser_api", "get_accounts", [
        [account]
      ]);
      if (response.result && response.result.length > 0) {
        const accountData = response.result[0];
        const balances = [];

        if (accountData.balance) {
          balances.push({
            asset_type: "HIVE",
            balance: accountData.balance,
            owner: account
          });
        }

        if (accountData.sbd_balance) {
          balances.push({
            asset_type: "HBD",
            balance: accountData.sbd_balance,
            owner: account
          });
        }

        if (accountData.vesting_shares) {
          balances.push({
            asset_type: "VESTS",
            balance: accountData.vesting_shares,
            owner: account
          });
        }

        return balances;
      }
      return [];
    } catch (e) {
      console.log({ error: e, location: "getBalances" });
      throw e;
    }
  };

  getPublicKey = async (privateKey) => {
    const pk = new PrivateKey(privateKey);
    return pk.createPublic().toString();
  };

  getOperationTypes = async () => {
    return [
      "vote",
      "transfer",
      "comment",
      "delete_comment",
      "transfer_to_vesting",
      "withdraw_vesting",
      "limit_order_create",
      "limit_order_cancel",
      "feed_publish",
      "convert",
      "account_create",
      "account_update",
      "witness_update",
      "account_witness_vote",
      "account_witness_proxy",
      "comment_options",
      "set_withdraw_vesting_route",
      "claim_reward_balance",
      "delegate_vesting_shares",
      "custom_json",
      "recover_account",
      "change_recovery_account"
    ];
  };

  getOperation = async (operationType, data) => {
    const opMapping = {
      vote: () => {
        return {
          vote: {
            author: data.author,
            permlink: data.permlink,
            voter: data.voter,
            weight: parseInt(data.weight) * 100
          }
        };
      },
      transfer: () => {
        const amount = `${parseFloat(data.amount).toFixed(3)} HIVE`;
        return {
          transfer: {
            from: data.from,
            to: data.to,
            amount: amount,
            memo: data.memo || ""
          }
        };
      },
      comment: () => {
        return {
          comment: {
            parent_author: data.parent_author || "",
            parent_permlink: data.parent_permlink || "",
            author: data.author,
            permlink: data.permlink,
            title: data.title || "",
            body: data.body,
            json_metadata: data.json_metadata || ""
          }
        };
      },
      transfer_to_vesting: () => {
        const amount = `${parseFloat(data.amount).toFixed(3)} HIVE`;
        return {
          transfer_to_vesting: {
            from: data.from,
            to: data.to,
            amount: amount
          }
        };
      },
      withdraw_vesting: () => {
        const amount = `${parseFloat(data.vesting_shares).toFixed(6)} VESTS`;
        return {
          withdraw_vesting: {
            account: data.account,
            vesting_shares: amount
          }
        };
      },
      limit_order_create: () => {
        return {
          limit_order_create: {
            owner: data.owner,
            orderid: parseInt(data.orderid),
            amount_to_sell: data.amount_to_sell,
            min_to_receive: data.min_to_receive,
            fill_or_kill: data.fill_or_kill || false,
            expiration: data.expiration || ""
          }
        };
      },
      limit_order_cancel: () => {
        return {
          limit_order_cancel: {
            owner: data.owner,
            orderid: parseInt(data.orderid)
          }
        };
      },
      feed_publish: () => {
        return {
          feed_publish: {
            publisher: data.publisher,
            exchange_rate: {
              base: data.base,
              quote: data.quote
            }
          }
        };
      },
      convert: () => {
        return {
          convert: {
            owner: data.owner,
            amount: data.amount
          }
        };
      },
      account_create: () => {
        return {
          account_create: {
            fee: data.fee || "0.000 HIVE",
            creator: data.creator,
            new_account_name: data.new_account_name,
            owner: data.owner,
            active: data.active,
            posting: data.posting,
            memo_key: data.memo_key,
            json_metadata: data.json_metadata || ""
          }
        };
      },
      account_update: () => {
        return {
          account_update: {
            account: data.account,
            owner: data.owner || undefined,
            active: data.active || undefined,
            posting: data.posting || undefined,
            memo_key: data.memo_key || undefined,
            json_metadata: data.json_metadata || ""
          }
        };
      },
      witness_update: () => {
        return {
          witness_update: {
            owner: data.owner,
            url: data.url,
            block_signing_key: data.block_signing_key,
            props: data.props,
            fee: data.fee || "0.000 HIVE"
          }
        };
      },
      account_witness_vote: () => {
        return {
          account_witness_vote: {
            account: data.account,
            witness: data.witness,
            approve: data.approve !== false
          }
        };
      },
      account_witness_proxy: () => {
        return {
          account_witness_proxy: {
            account: data.account,
            proxy: data.proxy || ""
          }
        };
      },
      comment_options: () => {
        return {
          comment_options: {
            author: data.author,
            permlink: data.permlink,
            max_accepted_payout: data.max_accepted_payout,
            percent_hbd: parseInt(data.percent_hbd) * 100,
            allow_votes: data.allow_votes !== false,
            allow_curation_rewards: data.allow_curation_rewards !== false,
            extensions: data.extensions || []
          }
        };
      },
      set_withdraw_vesting_route: () => {
        return {
          set_withdraw_vesting_route: {
            from_account: data.from_account,
            to_account: data.to_account,
            percent: parseInt(data.percent) * 100,
            auto_vest: data.auto_vest || false
          }
        };
      },
      claim_reward_balance: () => {
        return {
          claim_reward_balance: {
            account: data.account,
            reward_hive: data.reward_hive || "0.000 HIVE",
            reward_hbd: data.reward_hbd || "0.000 HBD",
            reward_vests: data.reward_vests || "0.000000 VESTS"
          }
        };
      },
      delegate_vesting_shares: () => {
        const amount = `${parseFloat(data.vesting_shares).toFixed(6)} VESTS`;
        return {
          delegate_vesting_shares: {
            delegator: data.delegator,
            delegatee: data.delegatee,
            vesting_shares: amount
          }
        };
      },
      custom_json: () => {
        return {
          custom_json: {
            required_auths: data.required_auths || [],
            required_posting_auths: data.required_posting_auths || [],
            id: data.id,
            json: typeof data.json === "string" ? data.json : JSON.stringify(data.json)
          }
        };
      },
      recover_account: () => {
        return {
          recover_account: {
            account_to_recover: data.account_to_recover,
            recovery_owner: data.recovery_owner,
            new_owner_authority: data.new_owner_authority,
            new_active_authority: data.new_active_authority
          }
        };
      },
      change_recovery_account: () => {
        return {
          change_recovery_account: {
            account_to_recover: data.account_to_recover,
            recovery_account: data.recovery_account,
            extensions: data.extensions || []
          }
        };
      }
    };

    const operation = opMapping[operationType];
    if (!operation) {
      throw new Error(`Unknown operation type: ${operationType}`);
    }
    return operation();
  };

  sign = async (privateKey, transaction, fakeSign = false) => {
    try {
      if (fakeSign) {
        const pk = new PrivateKey(privateKey);
        const pkStr = pk.toString();
        const pub = pk.createPublic().toString();
        return {
          signature: `fake_sig`,
          publicKey: pub,
          private: pkStr,
          wif: pkStr
        };
      }

      const pk = new PrivateKey(privateKey);
      const tx = new Transaction(transaction);
      const signResult = await tx.sign(pk);
      const pub = pk.createPublic().toString();

      return {
        signature: signResult.signature,
        publicKey: pub
      };
    } catch (e) {
      console.log({ error: e, location: "sign" });
      throw e;
    }
  };

  broadcast = async (signedTransaction) => {
    try {
      if (!signedTransaction) {
        throw new Error("No transaction to broadcast");
      }

      const tx = new Transaction(signedTransaction);
      const result = await tx.broadcast();
      return result;
    } catch (e) {
      console.log({ error: e, location: "broadcast" });
      throw e;
    }
  };

  getExplorer = (chain) => {
    return {
      tx: (id) => `https://hiveblocks.com/tx/${id}`,
      account: (name) => `https://hiveblocks.com/@${name}`,
      block: (id) => `https://hiveblocks.com/b/${id}`
    };
  };

  visualize = async (trx) => {
    const _trx = typeof trx[1] === "string" ? JSON.parse(trx[1]) : trx[1];
    let beautifiedOpPromises = [];
    for (let i = 0; i < _trx.actions.length; i++) {
        let operation = _trx.actions[i];
        beautifiedOpPromises.push(beautify(operation));
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
  };

  verifyAccount = async (account) => {
    try {
      const response = await callRPC("condenser_api", "get_accounts", [
        [account]
      ]);
      if (response.result && response.result.length > 0) {
        return true;
      }
      return false;
    } catch (e) {
      console.log({ error: e, location: "verifyAccount" });
      return false;
    }
  };

  _signString = async (str, privateKey) => {
    try {
      const pk = new PrivateKey(privateKey);
      const sig = pk.sign(str);
      return sig.toString();
    } catch (e) {
      console.log({ error: e, location: "_signString" });
      throw e;
    }
  };

  _verifyString = async (str, signature, publicKey) => {
    try {
      const sig = new Signature(signature);
      return sig.verify(str, publicKey);
    } catch (e) {
      console.log({ error: e, location: "_verifyString" });
      return false;
    }
  };

  getImportOptions() {
    return [
      {
        type: "ImportKeys",
        translate_key: "import_keys",
      },
    ];
  }

  getSignUpInput() {
    return {
      privateKey: true,
    };
  }

  getAccessType() {
    return "account";
  }

  /**
   * Get the required key types for an operation
   * @param {String} operationName - The operation name
   * @returns {Array|null} Array of allowed key types, or null if operation not found
   */
  getOperationKeyRequirements(operationName) {
    return operationKeyRequirements[operationName] || null;
  }

  /**
   * Check if a key type can perform an operation
   * @param {String} keyType - The key type (owner, active, posting, memo)
   * @param {String} operationName - The operation name
   * @returns {Boolean} True if the key type can perform the operation
   */
  canKeyPerformOperation(keyType, operationName) {
    const required = operationKeyRequirements[operationName];
    if (!required) {
      // Unknown operation, deny by default
      return false;
    }
    return required.includes(keyType);
  }

  /**
   * Detect the key type by checking it against the account's keys
   * @param {Object} account - The account object from blockchain
   * @param {String} privateKey - The private key to check
   * @returns {String|null} The key type (owner, active, posting, memo) or null if not found
   */
  detectKeyType(account, privateKey) {
    let publicKey;
    try {
      publicKey = this.getPublicKey(privateKey);
    } catch (e) {
      return null;
    }

    // Check owner key
    if (account.owner && account.owner.key_auths) {
      for (const keyAuth of account.owner.key_auths) {
        if (this._compareKeys(keyAuth[0], publicKey)) {
          return "owner";
        }
      }
    }

    // Check active key
    if (account.active && account.active.key_auths) {
      for (const keyAuth of account.active.key_auths) {
        if (this._compareKeys(keyAuth[0], publicKey)) {
          return "active";
        }
      }
    }

    // Check posting key
    if (account.posting && account.posting.key_auths) {
      for (const keyAuth of account.posting.key_auths) {
        if (this._compareKeys(keyAuth[0], publicKey)) {
          return "posting";
        }
      }
    }

    // Check memo key
    if (account.memo_key) {
      if (this._compareKeys(account.memo_key, publicKey)) {
        return "memo";
      }
    }

    return null;
  }

  async verifyAccount(accountName, credentials) {
    let account;
    try {
      account = await this.getAccount(accountName);
    } catch (error) {
      console.log(`getAccount: ${error}`);
      return;
    }

    if (!account) {
      throw { key: "unverified_account_error" };
    }

    let detectedKeyType = null;

    if (credentials && credentials.privateKey) {
      detectedKeyType = this.detectKeyType(account, credentials.privateKey);
      
      if (!detectedKeyType) {
        throw { key: "unverified_account_error" };
      }
    }

    // Attach detected key type to account for later use
    if (detectedKeyType) {
      account._keyType = detectedKeyType;
    }

    return account;
  }
}

export default Hive;