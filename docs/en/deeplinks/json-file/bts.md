# JSON File — BTS / Graphene

This page shows how to generate JSON files for **Graphene chains** (BitShares). The envelope is universal — only the transaction construction differs per chain family.

## Building the Transaction

Graphene chains use `TransactionBuilder` from `bitsharesjs`:

```js
import TransactionBuilder from "bitsharesjs/lib/chain/src/TransactionBuilder";

async function buildBtsTransaction(operations) {
  const tr = new TransactionBuilder();

  for (const op of operations) {
    const opData = { ...op.data };

    if (opData.memo && typeof opData.memo.message === "string") {
      opData.memo.message = Buffer.from(opData.memo.message, "utf-8");
    }

    tr.add_type_operation(op.name, opData);
  }

  await tr.update_head_block();
  await tr.set_required_fees();
  tr.set_expire_seconds(7200);
  tr.finalize();

  return tr.toObject();
}
```

## Generating the File

```js
import { v4 as uuidv4 } from "uuid";

async function buildBtsJsonFile(operations) {
  const transaction = await buildBtsTransaction(operations);

  return {
    type: "api",
    id: uuidv4(),
    payload: {
      method: "injectedCall",
      params: ["signAndBroadcast", JSON.stringify(transaction), []],
      appName: "My dApp",
      chain: "BTS",
      browser: "web browser",
      origin: "app.example",
    },
  };
}
```

In a browser, offer it as a download:

```jsx
const file = await buildBtsJsonFile(operations);
const encoded = encodeURIComponent(JSON.stringify(file));

<a href={`data:text/json;charset=utf-8,${encoded}`}
   download="transaction.json">
  Download transaction file
</a>
```

From a script or CLI tool, write the JSON directly:

```js
import { writeFileSync } from "fs";

const file = await buildBtsJsonFile(operations);
writeFileSync("transaction.json", JSON.stringify(file, null, 2));
```

## Key Details

- Set `payload.chain` to `"BTS"` (or `"BTS_TEST"` for testnet)
- The transaction object is the output of `TransactionBuilder.toObject()` — an `operations` array of `[opTypeId, opPayload]` pairs
- The wallet matches each operation's numeric type ID against the user's configured permission scope
- Memo messages must be converted to bytes with `Buffer.from(message, "utf-8")`

## See Also

- [JSON File Overview](./overview.md) — format, when to use, cross-method comparison
- [Raw Deeplink — BTS / Graphene](../raw/bts.md) — URL-based alternative
- [TOTP Deeplink — BTS / Graphene](../totp/bts.md) — encrypted alternative
