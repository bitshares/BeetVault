# JSON File — Antelope

This page shows how to generate JSON files for **Antelope chains** (Vaulta, WAX, Telos, FIO, Libre, XPR Network, BEOS). The envelope is universal — only the transaction construction differs per chain family.

## Building Actions

Before encoding, you need to construct the actions. There are two approaches depending on your library choice.

### With `@wharfkit/contract` (recommended)

ContractKit handles ABI fetching and encoding automatically:

```js
import { ContractKit } from "@wharfkit/contract";
import { APIClient, FetchProvider } from "@wharfkit/antelope";

const client = new APIClient({
  provider: new FetchProvider("https://vaulta.greymass.com", { fetch }),
});
const kit = new ContractKit({ client });

const contract = await kit.load("eosio.token");
const action = contract.action("transfer", {
  from: "alice",
  to: "bar",
  quantity: "42.0000 EOS",
  memo: "Don't panic",
});
```

### With `@wharfkit/antelope`

Build actions manually with ABI encoding:

```js
import { Action } from "@wharfkit/antelope";

const abi = (await client.v1.chain.get_abi("eosio.token")).abi;
const action = Action.from(
  {
    account: "eosio.token",
    name: "transfer",
    authorization: [{ actor: "alice", permission: "active" }],
    data: { from: "alice", to: "bar", quantity: "42.0000 EOS", memo: "Hi" },
  },
  abi
);
```

## Encoding for the Deeplink

### ESR (recommended)

Use `@wharfkit/signing-request` to encode actions as an ESR binary. The wallet detects ESR via `payload.encoding: "esr"` or auto-detects the binary format.

**Benefits over JSON:**
- **Fresh TAPOS**: The wallet fills TAPOS at signing time — no staleness
- **Placeholders**: Use `............1` for account, `............2` for permission
- **Null user**: Omit the account to let the user choose at approval time
- **Smaller payload**: ~200-400 bytes vs ~1-5KB for JSON

```js
import { SigningRequest } from "@wharfkit/signing-request";

async function buildAntelopeEsrJsonFile(chain, actions, client) {
  const request = await SigningRequest.create(
    { actions },
    {
      abiProvider: {
        getAbi: async (account) =>
          (await client.v1.chain.get_abi(account)).abi,
      },
    }
  );

  return {
    type: "api",
    id: uuidv4(),
    payload: {
      method: "injectedCall",
      params: ["signAndBroadcast", request.encode(), []],
      encoding: "esr",
      appName: "My dApp",
      chain: chain,
      browser: "web browser",
      origin: "app.example",
    },
  };
}
```

### JSON (full transaction)

Build a complete transaction with TAPOS and ABI-encoded data, then stringify it:

```js
import { Transaction } from "@wharfkit/antelope";

async function buildAntelopeTransaction(client, actions) {
  const info = await client.v1.chain.get_info();
  const header = info.getTransactionHeader(30);

  const contractNames = [...new Set(actions.map((a) => a.account))];
  const abiResponses = await Promise.all(
    contractNames.map((contract) => client.v1.chain.get_abi(contract))
  );
  const abis = contractNames
    .map((contract, index) => ({
      contract,
      abi: abiResponses[index]?.abi,
    }))
    .filter((item) => item.abi);

  const tx = Transaction.from({ ...header, actions }, abis);
  return tx;
}

async function buildAntelopeJsonFile(chain, actions, client) {
  const tx = await buildAntelopeTransaction(client, actions);

  return {
    type: "api",
    id: uuidv4(),
    payload: {
      method: "injectedCall",
      params: ["signAndBroadcast", JSON.stringify(tx), []],
      appName: "My dApp",
      chain: chain,
      browser: "web browser",
      origin: "app.example",
    },
  };
}
```

### JSON (null values — wallet fills TAPOS/ABIs/account)

Provide actions with placeholder authorization and plain-object data. The wallet fills TAPOS, fetches ABIs, encodes data, and supplies the account at broadcast time.

**Benefits:**
- **No chain access needed**: The dApp doesn't need to call `get_info()` or `get_abi()`
- **Signer-agnostic**: Use `............1` placeholders to let the user choose their account
- **Simpler code**: No TAPOS or ABI encoding logic in the dApp

```js
async function buildAntelopeNullJsonFile(chain, actions) {
  return {
    type: "api",
    id: uuidv4(),
    payload: {
      method: "injectedCall",
      params: ["signAndBroadcast", JSON.stringify({ actions }), []],
      appName: "My dApp",
      chain: chain,
      browser: "web browser",
      origin: "app.example",
    },
  };
}
```

**Example action with placeholders:**

```js
const actions = [
  {
    account: "eosio.token",
    name: "transfer",
    authorization: [{ actor: "............1", permission: "............2" }],
    data: {
      from: "............1",  // resolves to signer's account
      to: "bar",
      quantity: "42.0000 EOS",
      memo: "Don't panic",
    },
  },
];
```

The wallet detects `............1` / `............2` placeholders in authorization, shows the user's currently selected account, and fills them at signing time.

In a browser, offer it as a download:

```jsx
const file = await buildAntelopeJsonFile("VAULTA", actions, client);
const encoded = encodeURIComponent(JSON.stringify(file));

<a href={`data:text/json;charset=utf-8,${encoded}`}
   download="transaction.json">
  Download transaction file
</a>
```

From a script or CLI tool, write the JSON directly:

```js
import { writeFileSync } from "fs";

const file = await buildAntelopeJsonFile("VAULTA", actions, client);
writeFileSync("transaction.json", JSON.stringify(file, null, 2));
```

## Key Details

- Set `payload.chain` to the correct identifier: `"VAULTA"`, `"WAX"`, `"TLOS"`, `"FIO"`, `"LIBRE"`, `"XPR"`, or `"BEOS"` (use `*TEST` variants for testnets)
- `getTransactionHeader(seconds)` derives TAPOS from the latest irreversible block
- `JSON.stringify(tx)` serializes the full transaction: `{expiration, ref_block_num, ref_block_prefix, max_net_usage_words, max_cpu_usage_ms, delay_sec, context_free_actions, actions, transaction_extensions}`
- Each action's `data` is ABI-encoded to hex by `Transaction.from()` — this is the proper on-chain format
- The wallet matches each action's `name` field against the user's configured permission scope

## See Also

- [JSON File Overview](./overview.md) — format, when to use, cross-method comparison
- [Raw Deeplink — Antelope](../raw/antelope.md) — URL-based alternative
- [TOTP Deeplink — Antelope](../totp/antelope.md) — encrypted alternative
