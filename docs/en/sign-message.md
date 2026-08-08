# Sign Messages

The Sign Message page lets you sign an arbitrary text message using one of your account's private keys. This proves ownership of an account without requiring a blockchain transaction.

## How It Works

You provide a text message, and BeetVault signs it with your account's memo key (or active key if no memo key is available). The resulting signature can be shared with third parties to prove you control the account.

## Signing a Message

1. Navigate to **Sign Message** in the main menu
2. Select the account whose key will sign the message
3. Enter the message text in the text area
4. Click **Sign Message**
5. If successful, the signature appears in the result area
6. Click the copy button to copy the signature to your clipboard

## Signing Key

BeetVault signs messages using your account's **memo key** if available. If no memo key exists for the account, it falls back to the **active key**. The signing is performed locally — the encrypted private key is decrypted in memory only for the signing operation and is never exposed.

## Signature Format

The signature is returned as a string in the chain's native format:

- **Graphene chains** (BitShares, Hive): A cryptographic signature verifiable against the account's public key (e.g., `STM5...`)
- **Antelope chains** (Vaulta, WAX, Telos, etc.): Uses the chain's native signing algorithm and key format

The signature is only valid for the exact message text and signing key combination.

## Use Cases

- **Account ownership proof** — Prove you control an account without revealing your private key
- **Off-chain authentication** — Sign a challenge string for login verification
- **Document attestation** — Sign a document hash to prove approval

## Security Notes

- Signing a message does not authorize any blockchain transaction
- The signature is only valid for the exact message text provided
- Your private key never leaves the wallet during signing
- Be cautious about signing messages from untrusted sources — while they cannot authorize transactions, they could be used for social engineering
