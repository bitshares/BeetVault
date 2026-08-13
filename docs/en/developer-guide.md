# Developer Guide

This page consolidates everything needed to integrate a dApp with BeetVault. It assumes you have a transaction ready to sign and want the user to approve it in their wallet.

## Choosing an Input Method

BeetVault accepts transaction requests through four channels. Pick based on transaction size and user workflow:

| Method | Capacity | Best for |
|--------|----------|----------|
| [Raw Deeplink](./deeplinks/raw/overview.md) | ~5–6 simple operations | One-click browser handoff |
| [TOTP Deeplink](./deeplinks/totp/overview.md) | ~5–6 simple operations | Same, with encryption in transit |
| [QR Code](./deeplinks/qr/overview.md) | ~1,000 bytes recommended | Air-gapped or cross-device signing |
| [JSON File](./deeplinks/json-file/overview.md) | Unlimited | Large batches, offline workflows |

Offering more than one gives users a fallback when a transaction outgrows a URL.

## The Request Envelope

Raw deeplinks, TOTP deeplinks, and JSON files all wrap the transaction in the same envelope:

```json
{
  "type": "api",
  "id": "3f9a2b1c-4d5e-6f70-8a9b-0c1d2e3f4a5b",
  "payload": {
    "method": "injectedCall",
    "params": ["signAndBroadcast", "<stringified transaction>", []],
    "appName": "My dApp",
    "chain": "BTS",
    "browser": "web browser",
    "origin": "app.example"
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `type` | Yes | Always `"api"` |
| `id` | Yes | UUID v4 recommended |
| `payload.method` | Yes | Usually `"injectedCall"` |
| `payload.params` | Yes | `[action, stringifiedTx, []]` |
| `payload.chain` | Yes | Must match the wallet's active chain |
| `payload.appName` | No | Shown in the approval prompt |
| `payload.browser` | No | Shown in the approval prompt |
| `payload.origin` | No | Shown in the approval prompt |

**QR codes are the exception** — they carry a bare transaction object with no envelope. The wallet constructs the envelope itself after scanning. See [QR Code](./deeplinks/qr/overview.md) for the per-chain shapes.

## Encoding Pipelines

Each method encodes the same envelope differently:

| Method | Pipeline |
|--------|----------|
| Raw Deeplink | `JSON.stringify` → `encodeURIComponent` |
| TOTP Deeplink | `JSON.stringify` → encrypt → base64 → base64 → `encodeURIComponent` |
| JSON File | `JSON.stringify` |
| QR Code | `JSON.stringify` of the bare transaction object (or ESR string) |

For **Antelope chains**, three encoding options are available for `params[1]`:

| Encoding | `params[1]` content | `payload.encoding` | Benefits |
|----------|---------------------|-------------------|----------|
| ESR | Base64url ESR binary (`esr://...`) | `"esr"` | Fresh TAPOS, placeholders, smaller payload |
| JSON (full) | Stringified transaction with TAPOS + hex data | omitted | Full dApp control |
| JSON (null) | Stringified `{actions}` with placeholder auth | omitted | No chain access needed, signer-agnostic |

See the [Antelope Raw Deeplink](./deeplinks/raw/antelope.md) page for encoding examples.

## Worked Example

The same BitShares transfer, delivered four ways.

### 1. Build the transaction

```js
import { v4 as uuidv4 } from "uuid";
import TransactionBuilder from "./bts/chain/TransactionBuilder";

async function buildTransaction(opTypes, operations) {
  const tr = new TransactionBuilder();

  for (let i = 0; i < operations.length; i++) {
    const op = { ...operations[i] };

    // Memo messages must be bytes, not strings
    if (op.memo && typeof op.memo.message === "string") {
      op.memo.message = Buffer.from(op.memo.message, "utf-8");
    }

    tr.add_type_operation(opTypes[i], op);
  }

  await tr.update_head_block();
  await tr.set_required_fees();
  tr.set_expire_seconds(7200);
  tr.finalize();

  return tr;
}
```

### 2. Wrap it in the envelope

```js
function buildEnvelope(chain, tr) {
  return {
    type: "api",
    id: uuidv4(),
    payload: {
      method: "injectedCall",
      params: ["signAndBroadcast", JSON.stringify(tr.toObject()), []],
      appName: "My dApp",
      chain: chain,
      browser: "web browser",
      origin: "app.example",
    },
  };
}
```

### 3. Emit each format

```js
const tr = await buildTransaction(["transfer"], [transferOp]);
const envelope = buildEnvelope("BTS", tr);
const json = JSON.stringify(envelope);

// Raw deeplink
const rawUrl =
  `rawbeetvault://api/?chain=BTS&request=${encodeURIComponent(json)}`;

// JSON file (data URI for browser download)
const fileHref = `data:text/json;charset=utf-8,${encodeURIComponent(json)}`;

// TOTP deeplink (requires the passcode from the wallet)
const encrypted = encryptForBeetVault(json, totpCode);
const wire = Buffer.from(encrypted, "utf-8").toString("base64");
const totpUrl =
  `beetvault://api/?chain=BTS&request=${encodeURIComponent(wire)}`;

// QR code — bare transaction object, no envelope
const qrValue = JSON.stringify(tr.toObject());
```

See [TOTP Deeplink](./deeplinks/totp/overview.md) for the `encryptForBeetVault` implementation.

## Chain Differences

### Graphene (BitShares)

- Transactions are built with `TransactionBuilder` and serialized via `toObject()`
- Operations are `[opTypeId, opPayload]` pairs, where `opTypeId` is numeric
- QR codes carry the full transaction object including `operations`
- Authorization is matched against the numeric operation type

### Antelope (Vaulta, WAX, Telos, FIO, Libre, XPR) and Hive

- Transactions are built with chain-specific tooling such as `@wharfkit/antelope`
- Operations are actions carrying a string `name`
- QR codes carry an object with an `actions` array
- Authorization is matched against each action's `name`
- Antelope supports optional ESR encoding (`payload.encoding: "esr"`) for smaller payloads, fresh TAPOS, and null-user flows

The request envelope is identical across all chains — only transaction construction and the QR payload shape differ.

## Common Pitfalls

**Chain mismatch.** If `payload.chain` does not match the chain the wallet currently has selected, the request is rejected before the user sees anything. Neither side surfaces an obvious error.

**Wrong page open.** Deeplinks only register while the matching page is active — TOTP links need the TOTP Deeplink page, raw links need the Raw Deeplink page. The wallet must also be unlocked.

**Operation outside permission scope.** Users configure which operation types a page may authorize. Operations outside that scope are silently dropped. If nothing happens, have the user re-check their scope selection.

**Memo message as string.** Graphene memo messages must be converted to bytes with `Buffer.from(message, "utf-8")` before being added to the transaction. Passing a raw string produces a malformed transaction.

**URL too long.** Chromium-based browsers silently discard URLs beyond roughly 2,048 characters. The link simply does nothing. Measure before shipping and fall back to file download.

**Expired TOTP passcode.** The code is valid only for its configured window. If the user takes too long, decryption fails. Have them generate a fresh code and retry.

## Graceful Degradation

Measure the encoded payload and hide any method that cannot carry it:

```js
const json = JSON.stringify(envelope);
const rawUrlLength =
  `rawbeetvault://api/?chain=${chain}&request=`.length +
  encodeURIComponent(json).length;

const qrLength = JSON.stringify(tr.toObject()).length;

const canUseDeeplink = rawUrlLength < 2048;
const canUseQR = qrLength < 1200;
```

Then render conditionally, keeping the file download always available:

```jsx
{canUseDeeplink && <DeeplinkButton href={rawUrl} />}
{canUseQR && <QRCodeTab value={qrValue} />}
<DownloadButton href={fileHref} />   {/* always available */}
```

This mirrors how BeetVault's own reference UI handles oversized transactions — it disables the QR and deeplink tabs rather than presenting options that will fail.

## Testing Checklist

- Transaction broadcasts successfully through each method you offer
- Chain identifier matches what the wallet expects for your target network
- Longest realistic transaction still fits within URL and QR limits
- Oversized transactions degrade to file download rather than failing silently
- Memo-carrying operations encode correctly
- Expired TOTP codes surface a clear retry path to the user
