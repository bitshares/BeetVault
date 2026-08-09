# TOTP Deeplink

The TOTP Deeplink method generates time-limited authentication codes for secure dApp interactions. A dApp encrypts the transaction request using the code as a passphrase and sends it to BeetVault via the `beetvault://api/` protocol.

## How It Works

The TOTP flow uses a shared-secret approach based on time-limited codes:

1. BeetVault generates a 15-character code from a SHA-512 hash of a random UUID and the current timestamp
2. The code is displayed to the user and copied to the dApp
3. The dApp uses this code as an **encryption passphrase** to encrypt the transaction request
4. The encrypted output is base64-encoded, then base64-encoded again for transport, then URL-encoded
5. The dApp sends the result to BeetVault via the `beetvault://api/` protocol
6. BeetVault URL-decodes, base64-decodes, then decrypts the inner payload using the current code
7. If decryption succeeds, the operation is displayed for approval

Because the code changes with each request and expires after the configured time window, the encrypted payload cannot be decrypted after expiry.

## Encryption Method

TOTP deeplinks use **XChaCha20-Poly1305** authenticated encryption with a **SHA-256** derived key:

| Component | Algorithm | Notes |
|-----------|-----------|-------|
| Key derivation | SHA-256 | Single hash of the TOTP code → 32-byte key |
| Encryption | XChaCha20-Poly1305 | AEAD — confidentiality + integrity |
| Nonce | 24 bytes (192-bit) | Randomly generated per message |
| Auth tag | 16 bytes (Poly1305) | Detects any tampering |

This is **intentionally different** from the wallet's backup encryption, which uses memory-hard Argon2id. TOTP payloads are transient — the passcode expires within 60 seconds to 10 minutes — so a fast KDF is appropriate and avoids imposing seconds of compute on the dApp.

### Why XChaCha20-Poly1305?

- **Constant-time by design** — immune to cache-timing side-channel attacks
- **Fast in software** — no dependency on AES-NI hardware acceleration
- **192-bit nonce** — random nonces are collision-safe without counter management
- **Broadly available** — supported in Web Crypto API, libsodium, and most crypto libraries

## Wire Format

The encrypted payload uses the following binary structure before base64 encoding:

```
version(1) | nonce(24) | ciphertext_with_tag
```

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0 | 1 | Version | Format version byte (`0x01`) |
| 1 | 24 | Nonce | Random XChaCha20 nonce |
| 25 | varies | Ciphertext + Tag | AEAD output (plaintext length + 16-byte tag) |

Total overhead: 41 bytes before base64 encoding.

> **Note:** The leading version byte allows future cryptographic upgrades. Payloads using the wallet's older Argon2id format are rejected.

## Code Generation

The TOTP code is generated in the main process using:

```
SHA-512(random_uuid + current_timestamp) → first 15 hex characters
```

Each code is unique because it includes a fresh random UUID. The code is valid only for the configured time limit (60 seconds, 3 minutes, or 10 minutes).

> **Note:** The TOTP code is NOT derived from your private key. It serves as a shared-secret encryption passphrase between you and the dApp. Your private key is only used to sign the transaction after you approve it.

## Setup

1. Navigate to **TOTP Deeplink** in the main menu
2. Select the account to use for authentication
3. Configure which blockchain operations this account is permitted to authorize

## Permission Scopes

Before generating a code, you must configure what operations are allowed:

- **Yes - customize scope** — Manually select which operation types to allow (recommended)
- **No - allow all operations** — Permit any operation type (convenient but less secure)

## Generating a Passcode

1. Select a time limit for the code: **60 seconds**, **3 minutes**, or **10 minutes**
2. Click **Request passcode** to generate a new code
3. The code appears in the text field — click the copy button to copy it
4. A countdown timer shows the remaining time
5. Provide the code to the dApp requesting authentication

> **Warning:** Do not share your passcode with anyone. Anyone with the passcode can encrypt requests that BeetVault will decrypt and process (within your configured scope) until the code expires.

## Processing Incoming Deeplinks

When a dApp sends a `beetvault://api/` deeplink while BeetVault is on the TOTP page:

1. The wallet receives the URL-encoded request
2. It strips the scheme prefix and extracts the query string
3. The payload is URL-decoded and base64-decoded
4. BeetVault decrypts the result using the current passcode as the key material
5. The Poly1305 tag is verified — decryption fails if the data was tampered with
6. The decrypted JSON is parsed and validated against your permission scope
7. If valid, a prompt appears with the operation details
8. Review and approve or deny the request

> **Note:** The wallet must be unlocked and the TOTP Deeplink page must be active to process incoming deeplinks.

## Deeplink URL Format

A standard TOTP deeplink has the following structure:

```
beetvault://api/?chain=<CHAIN>&request=<url_encoded_double_base64_payload>
```

| Query parameter | Description |
|-----------------|-------------|
| `chain` | Chain identifier (e.g. `BTS`, `A`, `HIVE`) |
| `request` | URL-encoded, double-base64-encoded encrypted payload |

Once decrypted, the payload must be the same request envelope used by raw deeplinks:

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

See [Raw Deeplink](../raw/overview.md) for a full description of each envelope field.

## Generating a TOTP Deeplink

Build the same envelope as a raw deeplink, then encrypt it with the passcode the user copied from the wallet:

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

  // version(1) | nonce(24) | ciphertext+tag
  const packed = new Uint8Array(1 + NONCE_LENGTH + ciphertext.length);
  packed[0] = VERSION_BYTE;
  packed.set(nonce, 1);
  packed.set(ciphertext, 1 + NONCE_LENGTH);

  key.fill(0);
  return Buffer.from(packed).toString("base64");
}

function buildTotpDeeplink(chain, transactionObject, totpCode) {
  const request = {
    type: "api",
    id: uuidv4(),
    payload: {
      method: "injectedCall",
      params: ["signAndBroadcast", JSON.stringify(transactionObject), []],
      appName: "My dApp",
      chain: chain,
      browser: "web browser",
      origin: "app.example",
    },
  };

  const encrypted = encryptForBeetVault(JSON.stringify(request), totpCode);

  // The wallet base64-decodes once before decrypting, so encode again here
  const wire = Buffer.from(encrypted, "utf-8").toString("base64");

  return `beetvault://api/?chain=${chain}&request=${encodeURIComponent(wire)}`;
}
```

> **Why base64 twice?** The encryption step already returns base64. The wallet performs `decodeURIComponent` → `base64 decode` → decrypt, so the transport layer needs its own base64 pass to survive that decode.

## URL Length Limit

> **For dApp developers:** Keep the complete deeplink URL under **2,048 characters**.

Chromium-based browsers (Chrome, Edge, Brave, Opera) enforce a practical URL length ceiling around 2,048 characters. Safari and Firefox permit longer URLs, but assume 2,048 is the hard limit for cross-browser reliability — links exceeding it will silently fail to launch the wallet.

This limit applies to the **entire URL**, including the `beetvault://api/?chain=...&request=` prefix and all encoding overhead.

### Budgeting for encryption overhead

Each stage of the pipeline expands the payload:

| Stage | Size impact |
|-------|-------------|
| Original JSON payload | baseline |
| XChaCha20-Poly1305 encryption | +41 bytes (version + nonce + tag) |
| Base64 encoding | ×1.33 |
| Second base64 encoding (transport) | ×1.33 |
| URL encoding | ×1.0 (base64 output is URL-safe apart from `+/=`) |

Combined, expect roughly **×1.8** growth from JSON to final URL.

### Measured capacity

Simple BitShares transfer operations, measured end to end:

| Operations | JSON payload | Final URL | Fits? |
|-----------:|-------------:|----------:|:------|
| 1 | 377 | 785 | Yes |
| 3 | 673 | 1,311 | Yes |
| 5 | 969 | 1,839 | Yes |
| 8 | 1,413 | 2,625 | No |

Roughly **5–6 simple operations** is the practical ceiling — comparable to raw deeplinks. Although encryption adds overhead, base64 output encodes more compactly through URL encoding than raw JSON does, so the two methods end up with similar capacity.

### Exceeding the limit

If your transaction cannot fit — for example, a batch containing hundreds or thousands of operations — use the [JSON File](../json-file/overview.md) method instead. File uploads have no size restriction.

## Supported Protocols

BeetVault accepts the following protocol URIs for standard (TOTP-encrypted) deeplinks:

| Protocol | Status |
|----------|--------|
| `beetvault://api/` | **Current** — recommended for new integrations |
| `beeteos://api/` | Legacy — still supported for existing dApps |

Both formats are functionally identical. The `beetvault://api/` scheme is recommended for new dApp integrations.

## Chain Compatibility

TOTP deeplinks are supported on **all chains**, including Hive.

## Code Examples by Chain Family

For complete, chain-specific code examples showing how to build transactions and generate TOTP deeplinks:

- [BTS / Graphene](./bts.md) — BitShares and other Graphene-based chains
- [Antelope](./antelope.md) — Vaulta, WAX, Telos, FIO, Libre, XPR Network, BEOS
- [Hive](./hive.md) — Hive mainnet
