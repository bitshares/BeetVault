import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { hexToBytes, bytesToHex } from "@noble/hashes/utils.js";
import { hmac } from "@noble/hashes/hmac.js";
import sha256js from "crypto-js/sha256.js";

secp.hashes.sha256 = sha256;
secp.hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg);

class proover {
    constructor() {
        this.regen();
    }

    regen() {
        this.key = secp.utils.randomSecretKey();
        this.pubk = secp.getPublicKey(this.key);
    }

    sign(data) {
        let msgHash;
        try {
          msgHash = sha256js(data).toString();
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
