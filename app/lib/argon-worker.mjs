import { parentPort, workerData } from "worker_threads";
import { argon2id } from "@noble/hashes/argon2.js";
import { utf8ToBytes } from "@noble/ciphers/utils.js";

const { password, salt, params } = workerData;

const passwordBytes = typeof password === "string"
    ? utf8ToBytes(password)
    : new Uint8Array(password);

const saltBytes = new Uint8Array(salt);

const key = argon2id(passwordBytes, saltBytes, params);

parentPort.postMessage(Array.from(key));

passwordBytes.fill(0);
key.fill(0);
process.exit(0);
