# QR Code Deeplink

The QR Code method lets you interact with dApps by scanning, dragging, or uploading QR codes containing transaction payloads. This is useful for air-gapped workflows or dApps that present transaction requests as QR codes.

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

> **Important:** QR codes do **not** use the `{type, id, payload}` request envelope that deeplinks and JSON files use. A QR code contains a **bare transaction object** or **ESR-encoded signing request**. The wallet builds the envelope itself after scanning.

The exact shape depends on the chain family:

- **Graphene chains** — an object with an `operations` array of `[opTypeId, opPayload]` pairs
- **Antelope and Hive chains** — an object with an `actions` array where each action has a `name`

See the chain-specific pages below for concrete examples.

## Generating QR Contents

Produce the bare transaction object for your chain family (without calling `finalize()`), then encode it as a QR code:

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

If your transaction cannot fit — for example, a batch containing hundreds or thousands of operations — use the [JSON File](../json-file/overview.md) method instead. File uploads have no size restriction.

## Chain Compatibility

QR code processing is supported on **all chains**, including Hive.

## Code Examples by Chain Family

For complete, chain-specific code examples showing how to generate QR contents for each chain family:

- [BTS / Graphene](./bts.md) — BitShares and other Graphene-based chains
- [Antelope](./antelope.md) — Vaulta, WAX, Telos, FIO, Libre, XPR Network, BEOS
- [Hive](./hive.md) — Hive mainnet
