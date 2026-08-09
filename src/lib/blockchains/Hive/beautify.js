const allowedOperations = [
    "vote",
    "vote2",
    "comment",
    "transfer",
    "transfer_to_vesting",
    "withdraw_vesting",
    "limit_order_create",
    "limit_order_create2",
    "limit_order_cancel",
    "feed_publish",
    "convert",
    "collateralized_convert",
    "account_create",
    "create_claimed_account",
    "account_update",
    "account_update2",
    "witness_update",
    "witness_set_properties",
    "account_witness_vote",
    "account_witness_proxy",
    "delete_comment",
    "custom_json",
    "comment_options",
    "set_withdraw_vesting_route",
    "claim_reward_balance",
    "delegate_vesting_shares",
    "recover_account",
    "request_account_recovery",
    "change_recovery_account",
    "transfer_to_savings",
    "transfer_from_savings",
    "cancel_transfer_from_savings",
    "decline_voting_rights",
    "claim_account",
    "escrow_transfer",
    "escrow_dispute",
    "escrow_release",
    "escrow_approve",
    "create_proposal",
    "update_proposal_votes",
    "remove_proposal",
    "update_proposal",
    "recurrent_transfer",
    "custom_binary",
    "custom",
    "prove_authority",
];

export default async function beautify(operation) {
    if (!operation || !operation.name) {
        return;
    }

    const opType = operation.name;

    if (!allowedOperations.includes(opType)) {
        return;
    }

    const currentOperation = {
        title: `operations.injected.HIVE.${opType}.title`,
        opType: opType,
        method: opType,
        op: operation,
        operation: operation,
    };

    if (opType === "vote") {
        const voter = operation.data.voter;
        const author = operation.data.author;
        const permlink = operation.data.permlink;
        const weight = operation.data.weight;
        currentOperation["rows"] = [
            { key: "voter", params: { voter: voter } },
            { key: "author", params: { author: author } },
            { key: "permlink", params: { permlink: permlink } },
            { key: "weight", params: { weight: weight } },
        ];
    } else if (opType === "vote2") {
        const voter = operation.data.voter;
        const author = operation.data.author;
        const permlink = operation.data.permlink;
        const rshares = operation.data.rshares;
        const extensions = operation.data.extensions;
        currentOperation["rows"] = [
            { key: "voter", params: { voter: voter } },
            { key: "author", params: { author: author } },
            { key: "permlink", params: { permlink: permlink } },
            { key: "rshares", params: { rshares: rshares } },
            { key: "extensions", params: { extensions: extensions } },
        ];
    } else if (opType === "comment") {
        const parent_author = operation.data.parent_author;
        const parent_permlink = operation.data.parent_permlink;
        const author = operation.data.author;
        const permlink = operation.data.permlink;
        const title = operation.data.title;
        const body = operation.data.body;
        const json_metadata = operation.data.json_metadata;
        currentOperation["rows"] = [
            { key: "parent_author", params: { parent_author: parent_author } },
            { key: "parent_permlink", params: { parent_permlink: parent_permlink } },
            { key: "author", params: { author: author } },
            { key: "permlink", params: { permlink: permlink } },
            { key: "title", params: { title: title } },
            { key: "body", params: { body: body } },
            { key: "json_metadata", params: { json_metadata: json_metadata } },
        ];
    } else if (opType === "transfer") {
        const from = operation.data.from;
        const to = operation.data.to;
        const amount = operation.data.amount;
        const memo = operation.data.memo;
        currentOperation["rows"] = [
            { key: "from", params: { from: from } },
            { key: "to", params: { to: to } },
            { key: "amount", params: { amount: amount } },
            { key: "memo", params: { memo: memo ?? "" } },
        ];
    } else if (opType === "transfer_to_vesting") {
        const from = operation.data.from;
        const to = operation.data.to;
        const amount = operation.data.amount;
        currentOperation["rows"] = [
            { key: "from", params: { from: from } },
            { key: "to", params: { to: to } },
            { key: "amount", params: { amount: amount } },
        ];
    } else if (opType === "withdraw_vesting") {
        const account = operation.data.account;
        const vesting_shares = operation.data.vesting_shares;
        currentOperation["rows"] = [
            { key: "account", params: { account: account } },
            { key: "vesting_shares", params: { vesting_shares: vesting_shares } },
        ];
    } else if (opType === "limit_order_create") {
        const owner = operation.data.owner;
        const orderid = operation.data.orderid;
        const amount_to_sell = operation.data.amount_to_sell;
        const min_to_receive = operation.data.min_to_receive;
        const fill_or_kill = operation.data.fill_or_kill;
        const expiration = operation.data.expiration;
        currentOperation["rows"] = [
            { key: "owner", params: { owner: owner } },
            { key: "orderid", params: { orderid: orderid } },
            { key: "amount_to_sell", params: { amount_to_sell: amount_to_sell } },
            { key: "min_to_receive", params: { min_to_receive: min_to_receive } },
            { key: "fill_or_kill", params: { fill_or_kill: fill_or_kill } },
            { key: "expiration", params: { expiration: expiration } },
        ];
    } else if (opType === "limit_order_create2") {
        const owner = operation.data.owner;
        const orderid = operation.data.orderid;
        const amount_to_sell = operation.data.amount_to_sell;
        const exchange_rate = operation.data.exchange_rate;
        const fill_or_kill = operation.data.fill_or_kill;
        const expiration = operation.data.expiration;
        currentOperation["rows"] = [
            { key: "owner", params: { owner: owner } },
            { key: "orderid", params: { orderid: orderid } },
            { key: "amount_to_sell", params: { amount_to_sell: amount_to_sell } },
            { key: "exchange_rate", params: { exchange_rate: exchange_rate } },
            { key: "fill_or_kill", params: { fill_or_kill: fill_or_kill } },
            { key: "expiration", params: { expiration: expiration } },
        ];
    } else if (opType === "limit_order_cancel") {
        const owner = operation.data.owner;
        const orderid = operation.data.orderid;
        currentOperation["rows"] = [
            { key: "owner", params: { owner: owner } },
            { key: "orderid", params: { orderid: orderid } },
        ];
    } else if (opType === "feed_publish") {
        const publisher = operation.data.publisher;
        const exchange_rate = operation.data.exchange_rate;
        currentOperation["rows"] = [
            { key: "publisher", params: { publisher: publisher } },
            { key: "exchange_rate", params: { exchange_rate: exchange_rate } },
        ];
    } else if (opType === "convert") {
        const owner = operation.data.owner;
        const requestid = operation.data.requestid;
        const amount = operation.data.amount;
        currentOperation["rows"] = [
            { key: "owner", params: { owner: owner } },
            { key: "requestid", params: { requestid: requestid } },
            { key: "amount", params: { amount: amount } },
        ];
    } else if (opType === "collateralized_convert") {
        const owner = operation.data.owner;
        const requestid = operation.data.requestid;
        const amount = operation.data.amount;
        currentOperation["rows"] = [
            { key: "owner", params: { owner: owner } },
            { key: "requestid", params: { requestid: requestid } },
            { key: "amount", params: { amount: amount } },
        ];
    } else if (opType === "account_create") {
        const fee = operation.data.fee;
        const creator = operation.data.creator;
        const new_account_name = operation.data.new_account_name;
        const owner = operation.data.owner;
        const active = operation.data.active;
        const posting = operation.data.posting;
        const memo_key = operation.data.memo_key;
        const json_metadata = operation.data.json_metadata;
        currentOperation["rows"] = [
            { key: "fee", params: { fee: fee } },
            { key: "creator", params: { creator: creator } },
            { key: "new_account_name", params: { new_account_name: new_account_name } },
            { key: "owner", params: { owner: owner } },
            { key: "active", params: { active: active } },
            { key: "posting", params: { posting: posting } },
            { key: "memo_key", params: { memo_key: memo_key } },
            { key: "json_metadata", params: { json_metadata: json_metadata } },
        ];
    } else if (opType === "create_claimed_account") {
        const creator = operation.data.creator;
        const new_account_name = operation.data.new_account_name;
        const owner = operation.data.owner;
        const active = operation.data.active;
        const posting = operation.data.posting;
        const memo_key = operation.data.memo_key;
        const json_metadata = operation.data.json_metadata;
        currentOperation["rows"] = [
            { key: "creator", params: { creator: creator } },
            { key: "new_account_name", params: { new_account_name: new_account_name } },
            { key: "owner", params: { owner: owner } },
            { key: "active", params: { active: active } },
            { key: "posting", params: { posting: posting } },
            { key: "memo_key", params: { memo_key: memo_key } },
            { key: "json_metadata", params: { json_metadata: json_metadata } },
        ];
    } else if (opType === "account_update") {
        const account = operation.data.account;
        const owner = operation.data.owner;
        const active = operation.data.active;
        const posting = operation.data.posting;
        const memo_key = operation.data.memo_key;
        const json_metadata = operation.data.json_metadata;
        currentOperation["rows"] = [
            { key: "account", params: { account: account } },
            { key: "owner", params: { owner: owner } },
            { key: "active", params: { active: active } },
            { key: "posting", params: { posting: posting } },
            { key: "memo_key", params: { memo_key: memo_key } },
            { key: "json_metadata", params: { json_metadata: json_metadata } },
        ];
    } else if (opType === "account_update2") {
        const account = operation.data.account;
        const owner = operation.data.owner;
        const active = operation.data.active;
        const posting = operation.data.posting;
        const memo_key = operation.data.memo_key;
        const json_metadata = operation.data.json_metadata;
        const posting_json_metadata = operation.data.posting_json_metadata;
        currentOperation["rows"] = [
            { key: "account", params: { account: account } },
            { key: "owner", params: { owner: owner } },
            { key: "active", params: { active: active } },
            { key: "posting", params: { posting: posting } },
            { key: "memo_key", params: { memo_key: memo_key } },
            { key: "json_metadata", params: { json_metadata: json_metadata } },
            { key: "posting_json_metadata", params: { posting_json_metadata: posting_json_metadata } },
        ];
    } else if (opType === "witness_update") {
        const owner = operation.data.owner;
        const url = operation.data.url;
        const block_signing_key = operation.data.block_signing_key;
        const props = operation.data.props;
        const fee = operation.data.fee;
        currentOperation["rows"] = [
            { key: "owner", params: { owner: owner } },
            { key: "url", params: { url: url } },
            { key: "block_signing_key", params: { block_signing_key: block_signing_key } },
            { key: "props", params: { props: props } },
            { key: "fee", params: { fee: fee } },
        ];
    } else if (opType === "witness_set_properties") {
        const owner = operation.data.owner;
        const props = operation.data.props;
        const extensions = operation.data.extensions;
        currentOperation["rows"] = [
            { key: "owner", params: { owner: owner } },
            { key: "props", params: { props: props } },
            { key: "extensions", params: { extensions: extensions } },
        ];
    } else if (opType === "account_witness_vote") {
        const account = operation.data.account;
        const witness = operation.data.witness;
        const approve = operation.data.approve;
        currentOperation["rows"] = [
            { key: "account", params: { account: account } },
            { key: "witness", params: { witness: witness } },
            { key: "approve", params: { approve: approve } },
        ];
    } else if (opType === "account_witness_proxy") {
        const account = operation.data.account;
        const proxy = operation.data.proxy;
        currentOperation["rows"] = [
            { key: "account", params: { account: account } },
            { key: "proxy", params: { proxy: proxy } },
        ];
    } else if (opType === "delete_comment") {
        const author = operation.data.author;
        const permlink = operation.data.permlink;
        currentOperation["rows"] = [
            { key: "author", params: { author: author } },
            { key: "permlink", params: { permlink: permlink } },
        ];
    } else if (opType === "custom_json") {
        const required_auths = operation.data.required_auths;
        const required_posting_auths = operation.data.required_posting_auths;
        const id = operation.data.id;
        const json = operation.data.json;
        currentOperation["rows"] = [
            { key: "required_auths", params: { required_auths: required_auths } },
            { key: "required_posting_auths", params: { required_posting_auths: required_posting_auths } },
            { key: "id", params: { id: id } },
            { key: "json", params: { json: json } },
        ];
    } else if (opType === "comment_options") {
        const author = operation.data.author;
        const permlink = operation.data.permlink;
        const max_accepted_payout = operation.data.max_accepted_payout;
        const percent_hbd = operation.data.percent_hbd;
        const allow_votes = operation.data.allow_votes;
        const allow_curation_rewards = operation.data.allow_curation_rewards;
        const extensions = operation.data.extensions;
        currentOperation["rows"] = [
            { key: "author", params: { author: author } },
            { key: "permlink", params: { permlink: permlink } },
            { key: "max_accepted_payout", params: { max_accepted_payout: max_accepted_payout } },
            { key: "percent_hbd", params: { percent_hbd: percent_hbd } },
            { key: "allow_votes", params: { allow_votes: allow_votes } },
            { key: "allow_curation_rewards", params: { allow_curation_rewards: allow_curation_rewards } },
            { key: "extensions", params: { extensions: extensions } },
        ];
    } else if (opType === "set_withdraw_vesting_route") {
        const from_account = operation.data.from_account;
        const to_account = operation.data.to_account;
        const percent = operation.data.percent;
        const auto_vest = operation.data.auto_vest;
        currentOperation["rows"] = [
            { key: "from_account", params: { from_account: from_account } },
            { key: "to_account", params: { to_account: to_account } },
            { key: "percent", params: { percent: percent } },
            { key: "auto_vest", params: { auto_vest: auto_vest } },
        ];
    } else if (opType === "claim_reward_balance") {
        const account = operation.data.account;
        const reward_hive = operation.data.reward_hive;
        const reward_hbd = operation.data.reward_hbd;
        const reward_vests = operation.data.reward_vests;
        currentOperation["rows"] = [
            { key: "account", params: { account: account } },
            { key: "reward_hive", params: { reward_hive: reward_hive } },
            { key: "reward_hbd", params: { reward_hbd: reward_hbd } },
            { key: "reward_vests", params: { reward_vests: reward_vests } },
        ];
    } else if (opType === "delegate_vesting_shares") {
        const delegator = operation.data.delegator;
        const delegatee = operation.data.delegatee;
        const vesting_shares = operation.data.vesting_shares;
        currentOperation["rows"] = [
            { key: "delegator", params: { delegator: delegator } },
            { key: "delegatee", params: { delegatee: delegatee } },
            { key: "vesting_shares", params: { vesting_shares: vesting_shares } },
        ];
    } else if (opType === "recover_account") {
        const account_to_recover = operation.data.account_to_recover;
        const new_owner_authority = operation.data.new_owner_authority;
        const recent_owner_authority = operation.data.recent_owner_authority;
        const extensions = operation.data.extensions;
        currentOperation["rows"] = [
            { key: "account_to_recover", params: { account_to_recover: account_to_recover } },
            { key: "new_owner_authority", params: { new_owner_authority: new_owner_authority } },
            { key: "recent_owner_authority", params: { recent_owner_authority: recent_owner_authority } },
            { key: "extensions", params: { extensions: extensions } },
        ];
    } else if (opType === "request_account_recovery") {
        const recovery_account = operation.data.recovery_account;
        const account_to_recover = operation.data.account_to_recover;
        const new_owner_authority = operation.data.new_owner_authority;
        const extensions = operation.data.extensions;
        currentOperation["rows"] = [
            { key: "recovery_account", params: { recovery_account: recovery_account } },
            { key: "account_to_recover", params: { account_to_recover: account_to_recover } },
            { key: "new_owner_authority", params: { new_owner_authority: new_owner_authority } },
            { key: "extensions", params: { extensions: extensions } },
        ];
    } else if (opType === "change_recovery_account") {
        const account_to_recover = operation.data.account_to_recover;
        const new_recovery_account = operation.data.new_recovery_account;
        const extensions = operation.data.extensions;
        currentOperation["rows"] = [
            { key: "account_to_recover", params: { account_to_recover: account_to_recover } },
            { key: "new_recovery_account", params: { new_recovery_account: new_recovery_account } },
            { key: "extensions", params: { extensions: extensions } },
        ];
    } else if (opType === "transfer_to_savings") {
        const from = operation.data.from;
        const to = operation.data.to;
        const amount = operation.data.amount;
        const memo = operation.data.memo;
        currentOperation["rows"] = [
            { key: "from", params: { from: from } },
            { key: "to", params: { to: to } },
            { key: "amount", params: { amount: amount } },
            { key: "memo", params: { memo: memo } },
        ];
    } else if (opType === "transfer_from_savings") {
        const from = operation.data.from;
        const request_id = operation.data.request_id;
        const to = operation.data.to;
        const amount = operation.data.amount;
        const memo = operation.data.memo;
        currentOperation["rows"] = [
            { key: "from", params: { from: from } },
            { key: "request_id", params: { request_id: request_id } },
            { key: "to", params: { to: to } },
            { key: "amount", params: { amount: amount } },
            { key: "memo", params: { memo: memo } },
        ];
    } else if (opType === "cancel_transfer_from_savings") {
        const from = operation.data.from;
        const request_id = operation.data.request_id;
        currentOperation["rows"] = [
            { key: "from", params: { from: from } },
            { key: "request_id", params: { request_id: request_id } },
        ];
    } else if (opType === "decline_voting_rights") {
        const account = operation.data.account;
        const decline = operation.data.decline;
        currentOperation["rows"] = [
            { key: "account", params: { account: account } },
            { key: "decline", params: { decline: decline } },
        ];
    } else if (opType === "claim_account") {
        const fee = operation.data.fee;
        const creator = operation.data.creator;
        const extensions = operation.data.extensions;
        currentOperation["rows"] = [
            { key: "fee", params: { fee: fee } },
            { key: "creator", params: { creator: creator } },
            { key: "extensions", params: { extensions: extensions } },
        ];
    } else if (opType === "escrow_transfer") {
        const from = operation.data.from;
        const to = operation.data.to;
        const agent = operation.data.agent;
        const escrow_id = operation.data.escrow_id;
        const hbd_amount = operation.data.hbd_amount;
        const hive_amount = operation.data.hive_amount;
        const fee = operation.data.fee;
        const ratification_deadline = operation.data.ratification_deadline;
        const escrow_expiration = operation.data.escrow_expiration;
        const json_meta = operation.data.json_meta;
        currentOperation["rows"] = [
            { key: "from", params: { from: from } },
            { key: "to", params: { to: to } },
            { key: "agent", params: { agent: agent } },
            { key: "escrow_id", params: { escrow_id: escrow_id } },
            { key: "hbd_amount", params: { hbd_amount: hbd_amount } },
            { key: "hive_amount", params: { hive_amount: hive_amount } },
            { key: "fee", params: { fee: fee } },
            { key: "ratification_deadline", params: { ratification_deadline: ratification_deadline } },
            { key: "escrow_expiration", params: { escrow_expiration: escrow_expiration } },
            { key: "json_meta", params: { json_meta: json_meta } },
        ];
    } else if (opType === "escrow_dispute") {
        const from = operation.data.from;
        const to = operation.data.to;
        const agent = operation.data.agent;
        const who = operation.data.who;
        const escrow_id = operation.data.escrow_id;
        currentOperation["rows"] = [
            { key: "from", params: { from: from } },
            { key: "to", params: { to: to } },
            { key: "agent", params: { agent: agent } },
            { key: "who", params: { who: who } },
            { key: "escrow_id", params: { escrow_id: escrow_id } },
        ];
    } else if (opType === "escrow_release") {
        const from = operation.data.from;
        const to = operation.data.to;
        const agent = operation.data.agent;
        const who = operation.data.who;
        const receiver = operation.data.receiver;
        const escrow_id = operation.data.escrow_id;
        const hbd_amount = operation.data.hbd_amount;
        const hive_amount = operation.data.hive_amount;
        currentOperation["rows"] = [
            { key: "from", params: { from: from } },
            { key: "to", params: { to: to } },
            { key: "agent", params: { agent: agent } },
            { key: "who", params: { who: who } },
            { key: "receiver", params: { receiver: receiver } },
            { key: "escrow_id", params: { escrow_id: escrow_id } },
            { key: "hbd_amount", params: { hbd_amount: hbd_amount } },
            { key: "hive_amount", params: { hive_amount: hive_amount } },
        ];
    } else if (opType === "escrow_approve") {
        const from = operation.data.from;
        const to = operation.data.to;
        const agent = operation.data.agent;
        const who = operation.data.who;
        const escrow_id = operation.data.escrow_id;
        const approve = operation.data.approve;
        currentOperation["rows"] = [
            { key: "from", params: { from: from } },
            { key: "to", params: { to: to } },
            { key: "agent", params: { agent: agent } },
            { key: "who", params: { who: who } },
            { key: "escrow_id", params: { escrow_id: escrow_id } },
            { key: "approve", params: { approve: approve } },
        ];
    } else if (opType === "create_proposal") {
        const creator = operation.data.creator;
        const receiver = operation.data.receiver;
        const start_date = operation.data.start_date;
        const end_date = operation.data.end_date;
        const daily_pay = operation.data.daily_pay;
        const subject = operation.data.subject;
        const permlink = operation.data.permlink;
        currentOperation["rows"] = [
            { key: "creator", params: { creator: creator } },
            { key: "receiver", params: { receiver: receiver } },
            { key: "start_date", params: { start_date: start_date } },
            { key: "end_date", params: { end_date: end_date } },
            { key: "daily_pay", params: { daily_pay: daily_pay } },
            { key: "subject", params: { subject: subject } },
            { key: "permlink", params: { permlink: permlink } },
        ];
    } else if (opType === "update_proposal_votes") {
        const voter = operation.data.voter;
        const proposal_ids = operation.data.proposal_ids;
        const approve = operation.data.approve;
        const extensions = operation.data.extensions;
        currentOperation["rows"] = [
            { key: "voter", params: { voter: voter } },
            { key: "proposal_ids", params: { proposal_ids: proposal_ids } },
            { key: "approve", params: { approve: approve } },
            { key: "extensions", params: { extensions: extensions } },
        ];
    } else if (opType === "remove_proposal") {
        const creator = operation.data.creator;
        const proposal_ids = operation.data.proposal_ids;
        currentOperation["rows"] = [
            { key: "creator", params: { creator: creator } },
            { key: "proposal_ids", params: { proposal_ids: proposal_ids } },
        ];
    } else if (opType === "update_proposal") {
        const proposal_id = operation.data.proposal_id;
        const creator = operation.data.creator;
        const daily_pay = operation.data.daily_pay;
        const subject = operation.data.subject;
        const permlink = operation.data.permlink;
        currentOperation["rows"] = [
            { key: "proposal_id", params: { proposal_id: proposal_id } },
            { key: "creator", params: { creator: creator } },
            { key: "daily_pay", params: { daily_pay: daily_pay } },
            { key: "subject", params: { subject: subject } },
            { key: "permlink", params: { permlink: permlink } },
        ];
    } else if (opType === "recurrent_transfer") {
        const from = operation.data.from;
        const to = operation.data.to;
        const amount = operation.data.amount;
        const memo = operation.data.memo;
        const recurrence = operation.data.recurrence;
        const executions = operation.data.executions;
        const extensions = operation.data.extensions;
        currentOperation["rows"] = [
            { key: "from", params: { from: from } },
            { key: "to", params: { to: to } },
            { key: "amount", params: { amount: amount } },
            { key: "memo", params: { memo: memo } },
            { key: "recurrence", params: { recurrence: recurrence } },
            { key: "executions", params: { executions: executions } },
            { key: "extensions", params: { extensions: extensions } },
        ];
    } else if (opType === "custom_binary") {
        const id = operation.data.id;
        const data = operation.data.data;
        currentOperation["rows"] = [
            { key: "id", params: { id: id } },
            { key: "data", params: { data: data } },
        ];
    } else if (opType === "custom") {
        const required_auths = operation.data.required_auths;
        const id = operation.data.id;
        const data = operation.data.data;
        currentOperation["rows"] = [
            { key: "required_auths", params: { required_auths: required_auths } },
            { key: "id", params: { id: id } },
            { key: "data", params: { data: data } },
        ];
    } else if (opType === "prove_authority") {
        const challenged = operation.data.challenged;
        const require_owner = operation.data.require_owner;
        currentOperation["rows"] = [
            { key: "challenged", params: { challenged: challenged } },
            { key: "require_owner", params: { require_owner: require_owner } },
        ];
    }

    return currentOperation;
}