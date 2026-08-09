# QR Code — Antelope

This page shows how to generate QR code contents for **Antelope chains** (Vaulta, WAX, Telos, FIO, Libre, XPR Network, BEOS).

## QR Data Format

The QR contains a complete, signable transaction object produced by `@wharfkit/antelope`. The same object you would put in a deeplink — just encoded as a QR instead of a URL:

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

The wallet checks authorization by reading each action's `name` field and matching it against your configured permission scope.

## Generating QR Contents

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

- The QR payload is the same complete transaction object used in deeplinks — TAPOS is set, action data is ABI-encoded
- `getTransactionHeader(seconds)` derives TAPOS from the latest irreversible block
- Each action's `data` is ABI-encoded to hex — this is the proper on-chain format
- Lower `ecLevel` values fit more data; higher values scan more reliably. See [Data Capacity](../qr/overview.md#data-capacity) for the tradeoff

## See Also

- [QR Code Overview](./overview.md) — input methods, data capacity, practical guidance
- [TOTP Deeplink — Antelope](../totp/antelope.md) — encrypted deeplink alternative
- [Raw Deeplink — Antelope](../raw/antelope.md) — unencrypted deeplink alternative
