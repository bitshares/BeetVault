import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { hexToBytes, bytesToHex } from "@noble/hashes/utils.js";
import { hmac } from "@noble/hashes/hmac.js";

secp.hashes.sha256 = sha256;
secp.hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg);

/**
 * Prover class for generating secp256k1 signatures.
 *
 * Used for secure remote signing operations. Generates a random key pair
 * on instantiation and provides methods for signing arbitrary data.
 */
class proover {
    constructor() {
        this.regen();
    }

    /**
     * Generates a new random secp256k1 key pair.
     */
    regen() {
        this.key = secp.utils.randomSecretKey();
        this.pubk = secp.getPublicKey(this.key);
    }

    /**
     * Signs arbitrary data using secp256k1 with SHA-256 hashing.
     *
     * @param {string} data - The data to sign.
     * @returns {{ signedMessage: string, msgHash: string, pubk: Uint8Array } | undefined} The signature, message hash, and public key, or undefined on error.
     */
    sign(data) {
        let msgHash;
        try {
          msgHash = bytesToHex(sha256(new TextEncoder().encode(data)));
        } catch (error) {
          console.log(error);
          return;
        }

        let signedMessage;
        try {
          signedMessage = bytesToHex(secp.sign(
            hexToBytes(msgHash),
            this.key,
            {extraEntropy: true, prehash: false}
          ));
        } catch (error) {
          console.log(error);
          return;
        }

        return {
          signedMessage: signedMessage,
          msgHash: msgHash,
          pubk: this.pubk
        };
    }
}

const proof = new proover();

/**
 * Generates a secp256k1 signature for the given data.
 *
 * @param {string} data - The data to sign.
 * @returns {Promise<{ signedMessage: string, msgHash: string, pubk: Uint8Array } | undefined>} A promise resolving to the signature object, or undefined on error.
 */
export const getSignature = async (data) => {
  let signature;
  try {
    signature = proof.sign(data);
  } catch (error) {
    console.log(error);
    return;
  }

  return signature;
}
