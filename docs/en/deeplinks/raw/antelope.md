# Raw Deeplink — Antelope

This page shows how to generate a raw deeplink for **Antelope chains** (Vaulta, WAX, Telos, FIO, Libre, XPR Network, BEOS). The envelope is universal — only the transaction construction differs per chain family.

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

## Generating the Raw Deeplink

```js
import { v4 as uuidv4 } from "uuid";

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

Render the result as a normal link — the OS hands it to BeetVault:

```html
<a href="rawbeetvault://api/?chain=A&request=...">Broadcast with BeetVault</a>
```

## Key Details

- Set `payload.chain` to the correct identifier: `"VAULTA"`, `"WAX"`, `"TLOS"`, `"FIO"`, `"LIBRE"`, `"XPR"`, or `"BEOS"` (use `*TEST` variants for testnets)
- `getTransactionHeader(seconds)` derives TAPOS from the latest irreversible block
- `JSON.stringify(tx)` serializes the full transaction: `{expiration, ref_block_num, ref_block_prefix, max_net_usage_words, max_cpu_usage_ms, delay_sec, context_free_actions, actions, transaction_extensions}`
- Each action's `data` is ABI-encoded to hex by `Transaction.from()` — this is the proper on-chain format
- The wallet matches each action's `name` field against the user's configured permission scope

## See Also

- [Raw Deeplink Overview](./overview.md) — envelope, protocols, capacity limits, security
- [TOTP Deeplink — Antelope](../totp/antelope.md) — encrypted alternative
