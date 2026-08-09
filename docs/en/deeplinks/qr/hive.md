# QR Code — Hive

This page shows how to generate QR code contents for **Hive**.

## QR Data Format

The QR contains a complete, signable transaction object produced by `hive-tx` v7. The same object you would put in a deeplink — just encoded as a QR instead of a URL:

```json
{
  "expiration": "2026-01-01T00:00:00",
  "extensions": [],
  "operations": [
    ["transfer", {
      "from": "alice",
      "to": "bob",
      "quantity": "1.000 HIVE",
      "memo": ""
    }]
  ],
  "ref_block_num": 12345,
  "ref_block_prefix": 987654321,
  "signatures": []
}
```

The wallet checks authorization by reading each operation's name and matching it against your configured permission scope.

## Generating QR Contents

```js
import { Transaction } from "hive-tx";

async function generateHiveQRContents(operations) {
  const tx = new Transaction();

  for (const [name, data] of operations) {
    await tx.addOperation(name, data);
  }

  return tx.transaction;
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

- The QR payload is the same complete transaction object used in deeplinks — TAPOS is set automatically by `addOperation()`
- `operations` is an array of `[opName, opData]` tuples
- `expiration` format is `YYYY-MM-DDTHH:mm:ss` (ISO 8601 without milliseconds/Z)
- Hive uses a four-tier key hierarchy: posting, active, owner, and memo — ensure the user's imported key has sufficient authority for the requested operations
- Lower `ecLevel` values fit more data; higher values scan more reliably. See [Data Capacity](../qr/overview.md#data-capacity) for the tradeoff

## See Also

- [QR Code Overview](./overview.md) — input methods, data capacity, practical guidance
- [TOTP Deeplink — Hive](../totp/hive.md) — encrypted deeplink alternative
- [Raw Deeplink — Hive](../raw/hive.md) — unencrypted deeplink alternative
