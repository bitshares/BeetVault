# QR Code — BTS / Graphene

This page shows how to generate QR code contents for **Graphene chains** (BitShares).

## QR Data Format

The QR contains the output of `TransactionBuilder.toObject()` — an object with an `operations` array, where each operation is an `[opTypeId, opPayload]` pair:

```json
{
  "ref_block_num": 12345,
  "ref_block_prefix": 987654321,
  "expiration": "2026-01-01T00:00:00",
  "operations": [
    [0, {
      "fee": { "amount": 100, "asset_id": "1.3.0" },
      "from": "1.2.100",
      "to": "1.2.200",
      "amount": { "amount": 100000, "asset_id": "1.3.0" }
    }]
  ],
  "extensions": [],
  "signatures": []
}
```

The wallet checks authorization by reading the numeric operation type from each entry and matching it against your configured permission scope.

## Generating QR Contents

Note this **does not** call `finalize()` — unlike deeplink generation, the transaction is left unfinalized:

```js
import TransactionBuilder from "bitsharesjs/lib/chain/src/TransactionBuilder";

async function generateBtsQRContents(operations) {
  const tr = new TransactionBuilder();

  for (const op of operations) {
    const opData = { ...op.data };

    if (opData.memo && typeof opData.memo.message === "string") {
      opData.memo.message = Buffer.from(opData.memo.message, "utf-8");
    }

    tr.add_type_operation(op.name, opData);
  }

  await tr.set_required_fees();
  await tr.update_head_block();
  await tr.set_expire_seconds(4000);

  return tr.toObject();
}
```

Render it with any QR library — for example `react-qrcode-logo`:

```jsx
import { QRCode } from "react-qrcode-logo";

<QRCode
  value={JSON.stringify(qrContents)}
  ecLevel="M"
  size={250}
  quietZone={25}
  qrStyle="squares"
  bgColor="#ffffff"
  fgColor="#000000"
/>
```

## Key Details

- Do **not** call `finalize()` — the transaction is left unfinalized for the wallet to complete
- Operations are `[opTypeId, opPayload]` pairs, where `opTypeId` is numeric
- The wallet matches each operation's numeric type ID against the user's configured permission scope
- Memo messages must be converted to bytes with `Buffer.from(message, "utf-8")`

## See Also

- [QR Code Overview](./overview.md) — input methods, data capacity, practical guidance
- [TOTP Deeplink — BTS / Graphene](../totp/bts.md) — encrypted deeplink alternative
- [Raw Deeplink — BTS / Graphene](../raw/bts.md) — unencrypted deeplink alternative
