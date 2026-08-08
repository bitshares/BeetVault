# QR Code Deeplink

The QR Code page lets you interact with dApps by scanning, dragging, or uploading QR codes containing transaction payloads. This is useful for air-gapped workflows or dApps that present transaction requests as QR codes.

## How It Works

A dApp generates a QR code containing a transaction payload as a JSON string. You scan or upload the QR code into BeetVault, which parses the payload, validates it against your permission scope, and prompts you to approve or deny the operation.

## Setup

1. Navigate to **QR Codes** in the main menu
2. Select the account that will sign the transactions
3. Configure which blockchain operations are permitted

## Permission Scopes

Before scanning QR codes, configure what operations are allowed:

- **Yes - customize scope** — Select specific operation types to permit (recommended)
- **No - allow all operations** — Allow any operation type (less restrictive)

## Input Methods

BeetVault supports three ways to read QR codes:

### Scan
Use your device's camera to scan a QR code displayed on another screen or printed medium.

### Drag
Drag an image file containing a QR code from your file manager into the wallet window.

### Upload
Select an image file containing a QR code from your filesystem.

## Processing a QR Code

After selecting your input method:

1. Provide the QR code (scan, drag, or upload)
2. BeetVault decodes the QR and extracts the data as a JSON string
3. The JSON is parsed and validated against your permission scope
4. If permitted, a prompt appears with the operation details
5. Review and approve or deny the transaction

> **Tip:** You can go back to change the input method by clicking the back button.

## QR Code Data Format

> **Important:** QR codes do **not** use the `{type, id, payload}` request envelope that deeplinks and JSON files use. A QR code contains a **bare transaction object**. The wallet builds the envelope itself after scanning.

The exact shape depends on the chain family.

### Graphene chains (BitShares)

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

### Antelope and Hive chains

The QR contains an object with an `actions` array, where each action carries a `name`:

```json
{
  "actions": [
    {
      "account": "eosio.token",
      "name": "transfer",
      "authorization": [{ "actor": "alice", "permission": "active" }],
      "data": {
        "from": "alice",
        "to": "bob",
        "quantity": "1.0000 EOS",
        "memo": ""
      }
    }
  ]
}
```

Here the wallet matches each action's `name` field against your permission scope.

## Generating QR Contents

The Graphene example below produces an object ready to encode. Note it **does not** call `finalize()` — unlike deeplink generation, the transaction is left unfinalized:

```js
import TransactionBuilder from "./bts/chain/TransactionBuilder";

async function generateQRContents(opTypes, operations) {
  const tr = new TransactionBuilder();

  for (let i = 0; i < operations.length; i++) {
    const op = { ...operations[i] };

    if (op.memo && typeof op.memo.message === "string") {
      op.memo.message = Buffer.from(op.memo.message, "utf-8");
    }

    tr.add_type_operation(opTypes[i], op);
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

Lower `ecLevel` values fit more data; higher values scan more reliably. See [Data Capacity](#data-capacity) below for the tradeoff.

## Data Capacity

QR codes are images, not URLs — so the ~2,048 character browser limit that constrains deeplinks does not apply here. Instead, the limit comes from how much data can be encoded into the image itself while remaining scannable.

### How QR capacity works

A QR code's capacity depends on two factors:

- **Version (1–40)** — the grid size, from 21×21 up to 177×177 modules. Higher versions hold more data but produce visually denser codes.
- **Error correction level (L, M, Q, H)** — redundancy that allows a damaged or partially obscured code to still be read. Higher correction means less room for actual data.

| Error correction | Recovery capacity | Max bytes (version 40) |
|------------------|-------------------|------------------------|
| L (Low) | ~7% | 2,953 |
| M (Medium) | ~15% | 2,331 |
| Q (Quartile) | ~25% | 1,663 |
| H (High) | ~30% | 1,273 |

Those maximums assume a version 40 code — a 177×177 grid. In practice such codes are extremely dense and unreliable to scan from a screen.

### Practical guidance

> **For dApp developers:** Target payloads under **1,000 bytes**. Treat ~1,200 bytes as a practical ceiling.

Real-world scanning is limited less by theoretical capacity than by physical conditions:

- **Camera quality** — webcams and older phone cameras struggle to resolve fine module patterns
- **Display size and resolution** — a dense code shown small on screen may be unresolvable
- **Distance and focus** — higher-version codes require closer, steadier positioning
- **Lighting and glare** — screen reflections degrade scan success on dense codes

Lower-version codes with medium error correction scan quickly and reliably across a wide range of devices. Pushing toward maximum capacity tends to produce codes that technically encode the data but fail to scan in practice.

> **Note:** BeetVault's drag and upload methods read the QR from an image file rather than a camera, which avoids optical scanning limitations. Denser codes may work through those paths even when camera scanning fails.

### Exceeding the limit

If your transaction cannot fit — for example, a batch containing hundreds or thousands of operations — use the [JSON File](./json-file-deeplink.md) method instead. File uploads have no size restriction.

## Chain Compatibility

QR code processing is supported on all chains **except Hive**. If a Hive account is selected, this page displays an unsupported-chain message.

See the [Hive](./chains/hive/overview.md) page for details.
