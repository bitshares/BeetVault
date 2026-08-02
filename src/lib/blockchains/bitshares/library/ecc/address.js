import assert from "assert";
import pkg from "bs58";
const { encode, decode } = pkg;
import deepEqual from "deep-equal";


import ChainConfig from "../ws/ChainConfig.ts";
import { sha256, sha512, ripemd160 } from "./hash.js";

/** Addresses are shortened non-reversable hashes of a public key.  The full PublicKey is preferred.
 */
class Address {
  constructor(addy) {
    this.addy = addy;
  }

  static fromBuffer(buffer) {
    const _hash = sha512(buffer);
    const addy = ripemd160(_hash);
    return new Address(addy);
  }

  static fromString(string, address_prefix = ChainConfig.address_prefix) {
    const prefix = string.slice(0, address_prefix.length);
    assert.equal(
      address_prefix,
      prefix,
      `Expecting key to begin with ${address_prefix}, instead got ${prefix}`
    );
    let addy = string.slice(address_prefix.length);
    addy = Buffer.from(decode(addy), "binary");
    const checksum = addy.slice(-4);
    addy = addy.slice(0, -4);
    let new_checksum = ripemd160(addy);
    new_checksum = new_checksum.slice(0, 4);
    const isEqual = deepEqual(checksum, new_checksum); //, 'Invalid checksum'
    if (!isEqual) {
      throw new Error("Checksum did not match");
    }
    return new Address(addy);
  }

  /** @return Address - Compressed PTS format (by default) */
  static fromPublic(public_key, compressed = true, version = 56) {
    const sha2 = sha256(public_key.toBuffer(compressed));
    const rep = ripemd160(sha2);
    const versionBuffer = Buffer.alloc(1);
    versionBuffer.writeUInt8(0xff & version, 0);
    const addr = Buffer.concat([versionBuffer, rep]);
    let check = sha256(addr);
    check = sha256(check);
    const buffer = Buffer.concat([addr, check.slice(0, 4)]);
    return new Address(ripemd160(buffer));
  }

  toBuffer() {
    return this.addy;
  }

  toString(address_prefix = ChainConfig.address_prefix) {
    const checksum = ripemd160(this.addy);
    const addy = Buffer.concat([this.addy, checksum.slice(0, 4)]);
    return address_prefix + encode(addy);
  }
}

export default Address;
