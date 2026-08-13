# Raw Deeplink — Antelope

This page shows how to generate a raw deeplink for **Antelope chains** (Vaulta, WAX, Telos, FIO, Libre, XPR Network, BEOS). The envelope is universal — only the transaction construction differs per chain family.

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
// action.data is ABI-encoded to hex automatically
// action.authorization defaults to [{actor: "............1", permission: "............2"}]
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

**Benefits:**
- **Fresh TAPOS**: The wallet fills TAPOS at signing time — no staleness
- **Placeholders**: Use `............1` for account, `............2` for permission
- **Null user**: Omit the account to let the user choose at approval time
- **Smaller payload**: ~200-400 bytes vs ~1-5KB for JSON

```js
import { SigningRequest } from "@wharfkit/signing-request";

async function buildAntelopeEsrDeeplink(chain, actions, client) {
  const request = await SigningRequest.create(
    { actions },
    {
      abiProvider: {
        getAbi: async (account) =>
          (await client.v1.chain.get_abi(account)).abi,
      },
    }
  );

  const envelope = {
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

  const encoded = encodeURIComponent(JSON.stringify(envelope));
  return `rawbeetvault://api/?chain=${chain}&request=${encoded}`;
}
```

### JSON (full transaction)

Build a complete transaction with TAPOS and ABI-encoded data, then stringify it. The dApp handles all chain interaction:

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

async function buildAntelopeRawDeeplink(chain, actions, client) {
  const tx = await buildAntelopeTransaction(client, actions);

  const request = {
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

  const encoded = encodeURIComponent(JSON.stringify(request));
  return `rawbeetvault://api/?chain=${chain}&request=${encoded}`;
}
```

### JSON (null values — wallet fills TAPOS/ABIs/account)

Provide actions with placeholder authorization and plain-object data. The wallet fills TAPOS, fetches ABIs, encodes data, and supplies the account at broadcast time.

**Benefits:**
- **No chain access needed**: The dApp doesn't need to call `get_info()` or `get_abi()`
- **Signer-agnostic**: Use `............1` placeholders to let the user choose their account
- **Simpler code**: No TAPOS or ABI encoding logic in the dApp

```js
async function buildAntelopeNullJsonDeeplink(chain, actions) {
  const request = {
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

  const encoded = encodeURIComponent(JSON.stringify(request));
  return `rawbeetvault://api/?chain=${chain}&request=${encoded}`;
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

## Key Details

- Set `payload.chain` to the correct identifier: `"VAULTA"`, `"WAX"`, `"TLOS"`, `"FIO"`, `"LIBRE"`, `"XPR"`, or `"BEOS"` (use `*TEST` variants for testnets)
- The wallet matches each action's `name` field against the user's configured permission scope
- For ESR: set `payload.encoding: "esr"` to signal ESR encoding to the wallet
- For JSON (full): the wallet re-does TAPOS and ABI encoding at broadcast time anyway, so the dApp's work is technically redundant but ensures compatibility
- For JSON (null): the wallet fills TAPOS, ABIs, and account from the user's selected account

## See Also

- [Raw Deeplink Overview](./overview.md) — envelope, protocols, capacity limits, security
- [TOTP Deeplink — Antelope](../totp/antelope.md) — encrypted alternative
