import { getChainHandler } from "./chainFamilies/index.js";

export function useKeyManager() {

    function getSigningKey(store, chain, request) {
        const handler = getChainHandler(chain);
        if (!handler || !handler.getSigningKey) {
            throw new Error(`No key retrieval handler for chain: ${chain}`);
        }
        return handler.getSigningKey(store, request);
    }

    async function decryptKey(encryptedKey) {
        return new Promise(async (resolve, reject) => {
            let signature = await window.electron.getSignature("decrypt");
            if (!signature) {
                console.log("Signature failure");
                return reject("signature failure");
            }

            let isValid;
            try {
                isValid = await window.electron.verifyCrypto({
                    signedMessage: signature.signedMessage,
                    msgHash: signature.msgHash,
                    pubk: signature.pubk,
                });
            } catch (error) {
                console.log(error);
            }

            if (!isValid) {
                console.log("invalid signature");
                return reject("invalid signature");
            }

            console.log("Was valid, proceeding to decrypt");
            let decryptedKey;
            try {
                decryptedKey = await window.electron.decrypt({
                    data: encryptedKey,
                    inject: true,
                });
            } catch (error) {
                console.log(error);
                return reject("decrypt failure");
            }

            if (!decryptedKey) {
                console.log("Decryption failure");
                return reject("decryption failure");
            }

            return resolve(decryptedKey);
        });
    }

    return { getSigningKey, decryptKey };
}
