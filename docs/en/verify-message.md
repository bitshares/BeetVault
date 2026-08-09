# Verify Messages

The Verify Message page lets you verify that a message was signed by a specific account. This is the counterpart to the Sign Message feature — you can confirm the authenticity of a signed message without trusting the sender's claims.

## How It Works

You provide a signed message in JSON format, and BeetVault verifies the cryptographic signature against the claimed account's public key. The result confirms whether the message is authentic.

## Verifying a Message

1. Navigate to **Verify Message** in the main menu
2. Paste the signed message JSON into the text area
3. Click **Verify Message**
4. The result indicates whether the signature is valid or invalid

## Input Format

The signed message must be a JSON object with the following fields:

```json
{
  "chain": "HIVE",
  "publickey": "STM5...",
  "message": "Hello world",
  "signature": "20abc123..."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `chain` | Yes | The blockchain identifier (e.g., `HIVE`, `BTS`, `WAX`) |
| `publickey` | Yes | The signer's public key |
| `message` | Yes | The original message that was signed |
| `signature` | Yes | The cryptographic signature |

## Results

- **Valid** — The signature matches the message and public key. The message is authentic.
- **Invalid** — The signature does not match. The message may have been tampered with, or the signer is not the claimed account.

## Error Messages

- **Parse error** — The input is not valid JSON. Check the syntax and try again.
- **Missing fields** — One or more required fields are missing from the JSON. The error indicates which fields are absent.
- **Verification error** — The blockchain could not verify the signature (e.g., unsupported chain, malformed key).

## Chain Compatibility

Message verification relies on the blockchain's native signature verification algorithm. The chain identifier in the request determines which blockchain's verification method is used. If the chain does not support message verification, an error will be returned.

## Use Cases

- **Verify claims** — Confirm someone actually controls an account they claim to own
- **Audit signatures** — Check that a signed document has not been altered since signing
- **Trustless validation** — Verify message authenticity without trusting the intermediary
