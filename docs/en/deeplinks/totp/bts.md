# TOTP Deeplink — BTS / Graphene

This page shows how to generate a TOTP deeplink for **Graphene chains** (BitShares). The encryption and envelope are universal — only the transaction construction differs per chain family.

## Prerequisites

- A TOTP passcode from the BeetVault wallet (generated on the TOTP Deeplink page)
- The dApp has the user's account name and the operations to perform

## Building the Transaction

Graphene chains use `TransactionBuilder` from `bitsharesjs`:

```js
import TransactionBuilder from "bitsharesjs/lib/chain/src/TransactionBuilder";

async function buildBtsTransaction(operations) {
  const tr = new TransactionBuilder();

  for (const op of operations) {
    const opData = { ...op.data };

    // Memo messages must be encoded to bytes before being added
    if (opData.memo && typeof opData.memo.message === "string") {
      opData.memo.message = Buffer.from(opData.memo.message, "utf-8");
    }

    tr.add_type_operation(op.name, opData);
  }

  await tr.update_head_block();
  await tr.set_required_fees();
  tr.set_expire_seconds(7200);
  tr.finalize();

  return tr.toObject();
}
```

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

async function buildBtsTotpDeeplink(totpCode, operations) {
  const transaction = await buildBtsTransaction(operations);

  const request = {
    type: "api",
    id: uuidv4(),
    payload: {
      method: "injectedCall",
      params: ["signAndBroadcast", JSON.stringify(transaction), []],
      appName: "My dApp",
      chain: "BTS",
      browser: "web browser",
      origin: "app.example",
    },
  };

  const encrypted = encryptForBeetVault(JSON.stringify(request), totpCode);
  const wire = Buffer.from(encrypted, "utf-8").toString("base64");

  return `beetvault://api/?chain=BTS&request=${encodeURIComponent(wire)}`;
}
```

Render the result as a normal link — the OS hands it to BeetVault:

```html
<a href="beetvault://api/?chain=BTS&request=...">Broadcast with BeetVault</a>
```

## Key Details

- Set `payload.chain` to `"BTS"` (or `"BTS_TEST"` for testnet)
- The transaction object is the output of `TransactionBuilder.toObject()` — an `operations` array of `[opTypeId, opPayload]` pairs
- The wallet matches each operation's numeric type ID against the user's configured permission scope
- Memo messages must be converted to bytes with `Buffer.from(message, "utf-8")` before being added to the transaction

## See Also

- [TOTP Deeplink Overview](./overview.md) — encryption, wire format, protocols, capacity limits
- [Raw Deeplink — BTS / Graphene](../raw/bts.md) — unencrypted alternative
