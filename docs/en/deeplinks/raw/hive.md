# Raw Deeplink — Hive

This page shows how to generate a raw deeplink for **Hive**. The envelope is universal — only the transaction construction differs per chain family.

## Building the Transaction

Construct a complete, signable transaction using `hive-tx` v7. The resulting object is one step away from broadcast — if the dApp had the private key, it could sign and broadcast this directly:

```js
import { Transaction } from "hive-tx";

async function buildHiveTransaction(operations) {
  const tx = new Transaction();

  for (const [name, data] of operations) {
    await tx.addOperation(name, data);
  }

  return tx.transaction;
}
```

> **Why this matters:** `addOperation()` internally calls `createTransaction()`, which fetches blockchain properties and sets TAPOS automatically. You do not set TAPOS manually.

## Generating the Raw Deeplink

```js
import { v4 as uuidv4 } from "uuid";

async function buildHiveRawDeeplink(operations) {
  const transaction = await buildHiveTransaction(operations);

  const request = {
    type: "api",
    id: uuidv4(),
    payload: {
      method: "injectedCall",
      params: ["signAndBroadcast", JSON.stringify(transaction), []],
      appName: "My dApp",
      chain: "HIVE",
      browser: "web browser",
      origin: "app.example",
    },
  };

  const encoded = encodeURIComponent(JSON.stringify(request));
  return `rawbeetvault://api/?chain=HIVE&request=${encoded}`;
}
```

Render the result as a normal link — the OS hands it to BeetVault:

```html
<a href="rawbeetvault://api/?chain=HIVE&request=...">Broadcast with BeetVault</a>
```

## Key Details

- Set `payload.chain` to `"HIVE"`
- Hive has no testnet in BeetVault — all transactions involve real value
- `tx.transaction` is `{expiration, extensions, operations, ref_block_num, ref_block_prefix, signatures}` — a complete transaction object
- `operations` is an array of `[opName, opData]` tuples, e.g. `[["transfer", {from, to, amount, memo}]]`
- `expiration` format is `YYYY-MM-DDTHH:mm:ss` (ISO 8601 without milliseconds/Z)
- The wallet matches each operation name against the user's configured permission scope
- Hive uses a four-tier key hierarchy: posting, active, owner, and memo — ensure the user's imported key has sufficient authority for the requested operations

## See Also

- [Raw Deeplink Overview](./overview.md) — envelope, protocols, capacity limits, security
- [TOTP Deeplink — Hive](../totp/hive.md) — encrypted alternative
