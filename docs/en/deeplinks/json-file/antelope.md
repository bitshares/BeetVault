# JSON File — Antelope

This page shows how to generate JSON files for **Antelope chains** (Vaulta, WAX, Telos, FIO, Libre, XPR Network, BEOS). The envelope is universal — only the transaction construction differs per chain family.

## Building the Transaction

Construct a complete, signable transaction using `@wharfkit/antelope`. The resulting object is one step away from broadcast — if the dApp had the private key, it could sign and broadcast this directly:

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
```

> **Why this matters:** `Transaction.from()` requires TAPOS fields inside the first argument — setting them after construction throws. ABIs are required to encode `data` fields; without them, plain-object `data` throws.

## Generating the File

```js
import { v4 as uuidv4 } from "uuid";

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
