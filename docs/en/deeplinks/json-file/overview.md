# JSON File Deeplink

The JSON Deeplink method lets you load transaction payloads from files and submit them to the wallet for processing. This is useful for workflows where dApps export transaction requests as files.

> **No size limit.** Unlike deeplinks and QR codes, file uploads are not constrained by URL or scanning limits. This is the recommended method for large transactions.

## How It Works

A dApp exports a transaction payload as a file. You upload the file to BeetVault, which reads the content, parses it as JSON, validates it against your permission scope, and prompts you to approve or deny the operation.

## Setup

1. Navigate to **JSON Deeplink** in the main menu
2. Select the account that will sign the transaction
3. Configure which blockchain operations are permitted

## Permission Scopes

Before uploading files, configure what operations are allowed:

- **Yes - customize scope** — Select specific operation types to permit (recommended)
- **No - allow all operations** — Allow any operation type (less restrictive)

## Uploading a File

1. Click the upload button and select a file from your filesystem
2. BeetVault reads the file contents as text
3. The content is parsed as JSON
4. The wallet verifies the operation type is within your configured scope
5. If permitted, a prompt appears with the operation details
6. Review and approve or deny the transaction

## File Format

The file contains the **same request envelope as a raw deeplink**, stored as plain JSON with no URL encoding:

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

See [Raw Deeplink](../raw/overview.md) for full field documentation.

## Generating a File

Because the file uses the same envelope as a raw deeplink, you can reuse the same builder and simply skip the URL-encoding step.

In a browser, offer it as a download via a data URI:

```jsx
const request = {
  type: "api",
  id: uuidv4(),
  payload: {
    method: "injectedCall",
    params: ["signAndBroadcast", JSON.stringify(tr.toObject()), []],
    appName: "My dApp",
    chain: "BTS",
    browser: "web browser",
    origin: "app.example",
  },
};

const encoded = encodeURIComponent(JSON.stringify(request));

<a href={`data:text/json;charset=utf-8,${encoded}`}
   download="transaction.json">
  Download transaction file
</a>
```

From a script or CLI tool, write the JSON directly:

```js
import { writeFileSync } from "fs";

writeFileSync("transaction.json", JSON.stringify(request, null, 2));
```

> **Tip:** If your app already generates raw deeplinks, offering a file download alongside them costs almost nothing — the payload is identical, and it gives users a fallback when a transaction is too large for a URL.

## When to Use This Method

File uploads are the right choice whenever a transaction is too large for the other input methods:

| Method | Practical size limit | Constraint |
|--------|---------------------|------------|
| TOTP Deeplink | ~500–700 byte payload | Browser URL limit (~2,048 chars) plus encryption and double-encoding overhead |
| Raw Deeplink | ~1,500 byte payload | Browser URL limit (~2,048 chars) plus URL encoding |
| QR Code | ~1,000 bytes recommended | QR image data capacity and scan reliability |
| **JSON File** | **No limit** | Bounded only by available memory |

Transactions containing hundreds or thousands of operations should always use file upload.

## Chain Compatibility

JSON file processing is supported on **all chains**, including Hive.

## Code Examples by Chain Family

For complete, chain-specific code examples showing how to build transactions and generate JSON files:

- [BTS / Graphene](./bts.md) — BitShares and other Graphene-based chains
- [Antelope](./antelope.md) — Vaulta, WAX, Telos, FIO, Libre, XPR Network, BEOS
- [Hive](./hive.md) — Hive mainnet
