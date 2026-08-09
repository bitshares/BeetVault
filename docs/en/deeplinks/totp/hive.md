# TOTP Deeplink — Hive

This page shows how to generate a TOTP deeplink for **Hive**. The encryption and envelope are universal — only the transaction construction differs per chain family.

## Prerequisites

- A TOTP passcode from the BeetVault wallet (generated on the TOTP Deeplink page)
- The dApp has the user's account name and the operations to perform
- The `hive-tx` library (v7+) for transaction building

## Building the Transaction

Construct a complete, signable transaction using `hive-tx` v7. The resulting object is one step away from broadcast — if the dApp had the private key, it could sign and broadcast this directly:

```js
import { Transaction } from "hive-tx";

async function buildHiveTransaction(operations) {
  const tx = new Transaction();

  // Add each operation — the library fetches TAPOS automatically
  for (const [name, data] of operations) {
    await tx.addOperation(name, data);
  }

  // tx.transaction is a complete TransactionType ready for signing
  return tx.transaction;
}
```

> **Why this matters:** `addOperation()` internally calls `createTransaction()`, which fetches `get_dynamic_global_properties` and sets `ref_block_num`, `ref_block_prefix`, and `expiration`. You do not set TAPOS manually. The `Transaction` constructor in v7 expects `{transaction, expiration}` — but using `new Transaction()` with no args and adding operations handles this correctly.

## Generating the TOTP Deeplink

Encrypt the envelope with the passcode and emit the URL:

```js
import { v4 as uuidv4 } from "uuid";
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { randomBytes, utf8ToBytes } from "@noble/ciphers/utils.js";
import { sha256 } from "@noble/hashes/sha2.js";

const VERSION_BYTE = 0x01;
const NONCE_LENGTH = 24;

function encryptForBeetVault(plaintext, totpCode) {
  const key = sha256(utf8ToBytes(totpCode));
  const nonce = randomBytes(NONCE_LENGTH);
  const ciphertext = xchacha20poly1305(key, nonce).encrypt(
    utf8ToBytes(plaintext)
  );
  const packed = new Uint8Array(1 + NONCE_LENGTH + ciphertext.length);
  packed[0] = VERSION_BYTE;
  packed.set(nonce, 1);
  packed.set(ciphertext, 1 + NONCE_LENGTH);
  key.fill(0);
  return Buffer.from(packed).toString("base64");
}

async function buildHiveTotpDeeplink(totpCode, operations) {
  const transaction = await buildHiveTransaction(operations);

  const request = {
    type: "api",
    id: uuidv4(),
    payload: {
      method: "injectedCall",
      params: ["signAndBroadcast", JSON.stringify(transaction), []],
      appName: "My dApp",
      chain: "HIVE",
      browser: "web browser",
      origin: "app.example",
    },
  };

  const encrypted = encryptForBeetVault(JSON.stringify(request), totpCode);
  const wire = Buffer.from(encrypted, "utf-8").toString("base64");

  return `beetvault://api/?chain=HIVE&request=${encodeURIComponent(wire)}`;
}
```

Render the result as a normal link — the OS hands it to BeetVault:

```html
<a href="beetvault://api/?chain=HIVE&request=...">Broadcast with BeetVault</a>
```

## Key Details

- Set `payload.chain` to `"HIVE"`
- Hive has no testnet in BeetVault — all transactions involve real value
- `tx.transaction` is `{expiration, extensions, operations, ref_block_num, ref_block_prefix, signatures}` — a complete transaction object
- `operations` is an array of `[opName, opData]` tuples, e.g. `[["transfer", {from, to, amount, memo}]]`
- `expiration` format is `YYYY-MM-DDTHH:mm:ss` (ISO 8601 without milliseconds/Z)
- `ref_block_num` = `head_block_number & 0xffff`
- `ref_block_prefix` = bytes 4-8 of `head_block_id` as UInt32LE
- The wallet matches each operation name against the user's configured permission scope
- Hive uses a four-tier key hierarchy: posting, active, owner, and memo — ensure the user's imported key has sufficient authority for the requested operations

## See Also

- [TOTP Deeplink Overview](./overview.md) — encryption, wire format, protocols, capacity limits
- [Raw Deeplink — Hive](../raw/hive.md) — unencrypted alternative
