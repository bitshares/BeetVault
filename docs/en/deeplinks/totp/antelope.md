# TOTP Deeplink — Antelope

This page shows how to generate a TOTP deeplink for **Antelope chains** (Vaulta, WAX, Telos, FIO, Libre, XPR Network, BEOS). The encryption and envelope are universal — only the transaction construction differs per chain family.

## Prerequisites

- A TOTP passcode from the BeetVault wallet (generated on the TOTP Deeplink page)
- The dApp has the user's account name and the actions to perform
- The `@wharfkit/antelope` library for transaction building
- An API client connected to an Antelope node

## Building the Transaction

Construct a complete, signable transaction using `@wharfkit/antelope`. The resulting object is one step away from broadcast — if the dApp had the private key, it could sign and broadcast this directly:

```js
import { Transaction } from "@wharfkit/antelope";

async function buildAntelopeTransaction(client, actions) {
  // 1. Fetch TAPOS (transaction as proof of signing) from the blockchain
  const info = await client.v1.chain.get_info();
  const header = info.getTransactionHeader(30); // expires 30s ahead

  // 2. Fetch ABIs for each unique contract so action data encodes correctly
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

  // 3. Build the transaction — TAPOS + actions + ABIs in a single call
  const tx = Transaction.from({ ...header, actions }, abis);

  return tx;
}
```

> **Why this matters:** `Transaction.from()` requires TAPOS fields (`expiration`, `ref_block_num`, `ref_block_prefix`) inside the first argument — setting them after construction throws. ABIs are required to encode `data` fields; without them, plain-object `data` throws.

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

async function buildAntelopeTotpDeeplink(chain, totpCode, actions, client) {
  const tx = await buildAntelopeTransaction(client, actions);

  const request = {
    type: "api",
    id: uuidv4(),
    payload: {
      method: "injectedCall",
      params: ["signAndBroadcast", JSON.stringify(tx), []],
      appName: "My dApp",
      chain: chain,
      browser: "web browser",
      origin: "app.example",
    },
  };

  const encrypted = encryptForBeetVault(JSON.stringify(request), totpCode);
  const wire = Buffer.from(encrypted, "utf-8").toString("base64");

  return `beetvault://api/?chain=${chain}&request=${encodeURIComponent(wire)}`;
}
```

Render the result as a normal link — the OS hands it to BeetVault:

```html
<a href="beetvault://api/?chain=A&request=...">Broadcast with BeetVault</a>
```

## Key Details

- Set `payload.chain` to the correct identifier: `"VAULTA"`, `"WAX"`, `"TLOS"`, `"FIO"`, `"LIBRE"`, `"XPR"`, or `"BEOS"` (use `*TEST` variants for testnets)
- `getTransactionHeader(seconds)` derives TAPOS from the latest irreversible block — `ref_block_num` from the block number, `ref_block_prefix` from bytes 8-12 of the block ID
- `JSON.stringify(tx)` serializes the full transaction: `{expiration, ref_block_num, ref_block_prefix, max_net_usage_words, max_cpu_usage_ms, delay_sec, context_free_actions, actions, transaction_extensions}`
- Each action's `data` is ABI-encoded to hex by `Transaction.from()` — this is the proper on-chain format
- The wallet matches each action's `name` field against the user's configured permission scope

## See Also

- [TOTP Deeplink Overview](./overview.md) — encryption, wire format, protocols, capacity limits
- [Raw Deeplink — Antelope](../raw/antelope.md) — unencrypted alternative
