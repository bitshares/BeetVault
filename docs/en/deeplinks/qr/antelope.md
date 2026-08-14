# QR Code — Antelope

This page shows how to generate QR code contents for **Antelope chains** (Vaulta, WAX, Telos, FIO, Libre, XPR Network, BEOS). QR codes support both JSON transaction objects and ESR-encoded signing requests.

## QR Data Formats

QR codes can contain either a JSON transaction object or an ESR binary string. The wallet auto-detects the format.

### JSON (full transaction)

A complete, signable transaction object with TAPOS and ABI-encoded data:

```json
{
  "expiration": "2026-01-01T00:00:00",
  "ref_block_num": 12345,
  "ref_block_prefix": 987654321,
  "max_net_usage_words": 0,
  "max_cpu_usage_ms": 0,
  "delay_sec": 0,
  "context_free_actions": [],
  "actions": [
    {
      "account": "eosio.token",
      "name": "transfer",
      "authorization": [{ "actor": "alice", "permission": "active" }],
      "data": "hex_encoded_abi_data..."
    }
  ],
  "transaction_extensions": []
}
```

### JSON (null values — wallet fills TAPOS/ABIs/account)

A transaction with placeholder authorization and plain-object data:

```json
{
  "actions": [
    {
      "account": "eosio.token",
      "name": "transfer",
      "authorization": [{ "actor": "............1", "permission": "............2" }],
      "data": {
        "from": "............1",
        "to": "bar",
        "quantity": "42.0000 EOS",
        "memo": "Example memo"
      }
    }
  ]
}
```

### ESR (recommended)

An ESR-encoded signing request as a base64url string, optionally with `esr://` prefix:

```
esr://gmNgZGRkAIFXBqEFopc6760yugsVYWBggtKCMIEFRnclpF9eTWUACgAA
```

or bare base64url:

```
gmNgZGRkAIFXBqEFopc6760yugsVYWBggtKCMIEFRnclpF9eTWUACgAA
```

## Generating QR Contents

### JSON (full transaction)

```js
import { Transaction } from "@wharfkit/antelope";

async function generateAntelopeQRContents(client, actions) {
  const info = await client.v1.chain.get_info();
  const header = info.getTransactionHeader(30);

  const contractNames = [...new Set(actions.map((a) => a.account))];
  const abiResponses = await Promise.all(
    contractNames.map((contract) => client.v1.chain.get_abi(contract))
  );
  const abis = contractNames
    .map((contract, index) => ({
      contract,
      abi: abiResponses[index]?.abi,
    }))
    .filter((item) => item.abi);

  const tx = Transaction.from({ ...header, actions }, abis);
  return tx;
}

// QR content: JSON.stringify(tx)
```

### JSON (null values)

```js
async function generateAntelopeNullJsonQRContents(actions) {
  return { actions };
}

// QR content: JSON.stringify({ actions })
```

### ESR (recommended)

```js
import { SigningRequest } from "@wharfkit/signing-request";

async function generateAntelopeEsrQRContents(actions, client) {
  const request = await SigningRequest.create(
    { actions },
    {
      abiProvider: {
        getAbi: async (account) =>
          (await client.v1.chain.get_abi(account)).abi,
      },
    }
  );

  return request.encode();  // "esr://gmNg..."
}
```

## Rendering

Render the QR content with any QR library — for example `react-qrcode-logo`:

```jsx
import { QRCode } from "react-qrcode-logo";

// For JSON:
<QRCode value={JSON.stringify(qrContents)} ecLevel="M" size={250} />

// For ESR:
<QRCode value={esrString} ecLevel="M" size={250} />
```

## Key Details

- The wallet auto-detects ESR vs JSON by checking the `esr://` prefix or base64url version byte
- For JSON (full): TAPOS is set, action data is ABI-encoded to hex
- For JSON (null): the wallet fills TAPOS, fetches ABIs, encodes data, and supplies the account
- For ESR: the wallet resolves placeholders, fills TAPOS, and encodes data at signing time
- Lower `ecLevel` values fit more data; higher values scan more reliably. See [Data Capacity](../qr/overview.md#data-capacity) for the tradeoff

## See Also

- [QR Code Overview](./overview.md) — input methods, data capacity, practical guidance
- [TOTP Deeplink — Antelope](../totp/antelope.md) — encrypted deeplink alternative
- [Raw Deeplink — Antelope](../raw/antelope.md) — unencrypted deeplink alternative
