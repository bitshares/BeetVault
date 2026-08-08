# Raw Deeplink

The Raw Deeplink page processes incoming `rawbeetvault://api/` protocol requests from dApps. Unlike TOTP deeplinks, raw deeplinks send unencrypted transaction payloads directly to the wallet for signing.

## How It Works

A dApp constructs a transaction and sends it to BeetVault via the `rawbeetvault://api/` protocol. The payload is URL-encoded JSON — no encryption or passcode is required. BeetVault receives the payload, parses it, validates it against your permission scope, and prompts you to approve or deny the operation.

## Setup

1. Navigate to **Raw Deeplink** in the main menu
2. Select the account that will sign incoming requests
3. Configure which blockchain operations are permitted

## Permission Scopes

Before the wallet can process raw deeplinks, you must set the allowed operations:

- **Yes - customize scope** — Select specific operation types to permit (recommended)
- **No - allow all operations** — Allow any operation type (less restrictive)

## Processing a Raw Deeplink

When a dApp sends a `rawbeetvault://api/` request:

1. The wallet receives the URL-encoded JSON payload
2. It strips the scheme prefix and extracts the query string
3. The payload is URL-decoded and parsed as JSON
4. The wallet validates the request against your permission scope
5. If permitted, a prompt appears showing the operation details
6. Review and approve or deny the transaction

> **Note:** The wallet must be unlocked and the Raw Deeplink page must be active to receive incoming raw deeplinks.

## Deeplink URL Format

A raw deeplink has the following structure:

```
rawbeetvault://api/?chain=<CHAIN>&request=<url_encoded_json>
```

| Query parameter | Description |
|-----------------|-------------|
| `chain` | Chain identifier (e.g. `BTS`, `A`, `HIVE`) |
| `request` | URL-encoded JSON request envelope |

## Request Envelope

The `request` parameter contains a URL-encoded JSON object with this structure:

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

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | Always `"api"` |
| `id` | Yes | Unique request identifier (UUID v4 recommended) |
| `payload.method` | Yes | Request method — typically `"injectedCall"` |
| `payload.params` | Yes | For `injectedCall`: `[action, stringifiedTx, []]` |
| `payload.chain` | Yes | **Must match the wallet's currently selected chain** |
| `payload.appName` | No | Display name shown in the approval prompt |
| `payload.browser` | No | Origin browser, shown in the prompt |
| `payload.origin` | No | Requesting domain, shown in the prompt |

> **Chain must match.** If `payload.chain` differs from the chain the wallet currently has selected, the request is rejected before the user sees a prompt.

## Generating a Raw Deeplink

The example below builds a BitShares transaction and produces a launchable deeplink:

```js
import { v4 as uuidv4 } from "uuid";
import TransactionBuilder from "./bts/chain/TransactionBuilder";

async function buildRawDeeplink(chain, opTypes, operations) {
  const tr = new TransactionBuilder();

  for (let i = 0; i < operations.length; i++) {
    const op = { ...operations[i] };

    // Memo messages must be encoded to bytes before being added
    if (op.memo && typeof op.memo.message === "string") {
      op.memo.message = Buffer.from(op.memo.message, "utf-8");
    }

    tr.add_type_operation(opTypes[i], op);
  }

  await tr.update_head_block();
  await tr.set_required_fees();
  tr.set_expire_seconds(7200);
  tr.finalize();

  const request = {
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

  const encoded = encodeURIComponent(JSON.stringify(request));
  return `rawbeetvault://api/?chain=${chain}&request=${encoded}`;
}
```

Render the result as a normal link — the OS hands it to BeetVault:

```html
<a href="rawbeetvault://api/?chain=BTS&request=...">Broadcast with BeetVault</a>
```

### Antelope and Hive chains

The envelope is identical; only the transaction construction differs. Build the transaction using your chain's own tooling (for example `@wharfkit/antelope` for Vaulta/WAX/Telos), then stringify it into `payload.params` exactly as above and set `payload.chain` to the matching identifier.

## URL Length Limit

> **For dApp developers:** Keep the complete deeplink URL under **2,048 characters**.

Chromium-based browsers (Chrome, Edge, Brave, Opera) enforce a practical URL length ceiling around 2,048 characters. Safari and Firefox permit longer URLs, but assume 2,048 is the hard limit for cross-browser reliability — links exceeding it will silently fail to launch the wallet.

This limit applies to the **entire URL**, including the `rawbeetvault://api/?chain=...&request=` prefix and all URL encoding overhead.

URL encoding roughly doubles the JSON payload size, because the stringified transaction nested inside `params` contains many quotes and braces that each expand to three characters.

### Measured capacity

Simple BitShares transfer operations, measured end to end:

| Operations | JSON payload | Final URL | Fits? |
|-----------:|-------------:|----------:|:------|
| 1 | 377 | 701 | Yes |
| 3 | 673 | 1,281 | Yes |
| 5 | 969 | 1,861 | Yes |
| 8 | 1,413 | 2,731 | No |

Roughly **5–6 simple operations** is the practical ceiling. Operations carrying memos or long strings consume the budget faster — always measure your own longest expected transaction.

### Exceeding the limit

If your transaction cannot fit — for example, a batch containing hundreds or thousands of operations — use the [JSON File](./json-file-deeplink.md) method instead. File uploads have no size restriction.

## Supported Protocols

BeetVault accepts the following protocol URIs for all deeplink types:

| Protocol | Type | Status |
|----------|------|--------|
| `beetvault://api/` | Standard (TOTP-encrypted) | **Current** — recommended |
| `beeteos://api/` | Standard (TOTP-encrypted) | Legacy — still supported |
| `rawbeetvault://api/` | Raw (unencrypted) | **Current** — recommended |
| `rawbeeteos://api/` | Raw (unencrypted) | Legacy — still supported |

All four schemes are functionally identical within their type. The `beetvault` variants are recommended for new dApp integrations.

## Raw vs. Standard Deeplinks

| Feature | Standard Deeplink | Raw Deeplink |
|---------|-------------------|--------------|
| Encryption | XChaCha20-Poly1305 (TOTP) | None (plaintext) |
| Protocol | `beetvault://api/` | `rawbeetvault://api/` |
| Authentication | Passcode-based | Direct payload |
| Use case | Time-sensitive operations | Direct transaction signing |
| Setup complexity | Requires TOTP page active | Requires Raw page active |

## Security Considerations

- Raw deeplinks send unencrypted transaction data — only use with trusted dApps
- Configure the operation scope to limit what can be authorized
- Always review the full transaction details in the prompt before approving
- The payload is URL-encoded — ensure your dApp properly encodes all special characters

## Chain Compatibility

Raw deeplinks are supported on all chains **except Hive**. If a Hive account is selected, this page displays an unsupported-chain message.

See the [Hive](./chains/hive/overview.md) page for details.
