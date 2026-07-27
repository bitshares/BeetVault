import beautify from "./Hive/beautify.js";
import BlockchainAPI from "./BlockchainAPI.js";
import { Transaction, PrivateKey, Signature, callRPC } from "hive-tx";

class Hive extends BlockchainAPI {
  constructor() {
    super();
    this.type = "HIVE";
    this.name = "Hive";
    this.icon = require("../assets/Hive.png");
    this.networks = this.config.networks;
    this.chainID = this.config.chainID;
    this.nodes = this.config.nodes;
    this.defaultNode = this.config.nodes[0];
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
}

export default Hive;