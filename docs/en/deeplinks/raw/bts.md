# Raw Deeplink — BTS / Graphene

This page shows how to generate a raw deeplink for **Graphene chains** (BitShares). The envelope is universal — only the transaction construction differs per chain family.

## Building the Transaction

Graphene chains use `TransactionBuilder` from `bitsharesjs`:

```js
import TransactionBuilder from "bitsharesjs/lib/chain/src/TransactionBuilder";

async function buildBtsTransaction(operations) {
  const tr = new TransactionBuilder();

  for (const op of operations) {
    const opData = { ...op.data };

    // Memo messages must be encoded to bytes before being added
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

## Generating the Raw Deeplink

```js
import { v4 as uuidv4 } from "uuid";

async function buildBtsRawDeeplink(operations) {
  const transaction = await buildBtsTransaction(operations);

  const request = {
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

  const encoded = encodeURIComponent(JSON.stringify(request));
  return `rawbeetvault://api/?chain=BTS&request=${encoded}`;
}
```

Render the result as a normal link — the OS hands it to BeetVault:

```html
<a href="rawbeetvault://api/?chain=BTS&request=...">Broadcast with BeetVault</a>
```

## Key Details

- Set `payload.chain` to `"BTS"` (or `"BTS_TEST"` for testnet)
- The transaction object is the output of `TransactionBuilder.toObject()` — an `operations` array of `[opTypeId, opPayload]` pairs
- The wallet matches each operation's numeric type ID against the user's configured permission scope
- Memo messages must be converted to bytes with `Buffer.from(message, "utf-8")` before being added to the transaction

## See Also

- [Raw Deeplink Overview](./overview.md) — envelope, protocols, capacity limits, security
- [TOTP Deeplink — BTS / Graphene](../totp/bts.md) — encrypted alternative
