import { SigningRequest } from '@wharfkit/signing-request';
import { getContractKit } from './contractKit.js';

/**
 * Decode an ESR-encoded string into a SigningRequest object.
 *
 * @param {string} encoded - The base64url-encoded ESR binary string
 * @returns {SigningRequest} The decoded signing request
 * @throws {Error} If the string is not valid ESR
 */
export function decodeEsr(encoded) {
    return SigningRequest.from(encoded);
}

/**
 * Resolve an ESR signing request against the current chain state.
 * Fetches ABIs via ContractKit and fills fresh TAPOS from the chain head block.
 *
 * @param {SigningRequest} request - The decoded signing request
 * @param {string} chainIdentifier - Chain identifier (e.g. 'VAULTA')
 * @param {string} nodeUrl - RPC node URL
 * @param {object} blockchain - The blockchain API instance (must have .client)
 * @param {object|null} signerAccount - Optional signer account ({actor, permission}).
 *   When provided (e.g. for null-user ESR with placeholders), used as the signer identity.
 *   When null, extracted from the first raw action's authorization.
 * @returns {Promise<{resolvedActions: object[], resolvedTransaction: object, chainId: string}>}
 */
export async function resolveEsrRequest(request, chainIdentifier, nodeUrl, blockchain, signerAccount = null) {
    const kit = getContractKit(chainIdentifier, nodeUrl);

    const abiAccounts = request.getRequiredAbis();
    const abiPromises = abiAccounts.map(async (account) => {
        try {
            const contract = await kit.load(String(account));
            return { account: String(account), abi: contract.abi };
        } catch {
            return { account: String(account), abi: null };
        }
    });

    const abiResults = await Promise.all(abiPromises);
    const abis = new Map();
    for (const { account, abi } of abiResults) {
        if (abi) {
            abis.set(account, abi);
        }
    }

    if (!blockchain.client) {
        const { APIClient, FetchProvider } = await import('@wharfkit/antelope');
        blockchain.client = new APIClient({
            provider: new FetchProvider(nodeUrl, { fetch })
        });
    }

    const info = await blockchain.client.v1.chain.get_info();
    const header = info.getTransactionHeader(60);

    let signerPermission;
    if (signerAccount && signerAccount.actor && signerAccount.permission) {
        signerPermission = signerAccount;
    } else {
        signerPermission = request.getRawActions()[0]?.authorization?.[0] || {
            actor: '............1',
            permission: '............2'
        };
    }

    const resolved = request.resolve(abis, signerPermission, {
        expiration: header.expiration,
        ref_block_num: header.ref_block_num,
        ref_block_prefix: header.ref_block_prefix,
    });

    const resolvedActions = resolved.resolvedTransaction.actions.map((action) => ({
        account: String(action.account),
        name: String(action.name),
        authorization: action.authorization.map((auth) => ({
            actor: String(auth.actor),
            permission: String(auth.permission),
        })),
        data: action.data,
    }));

    return {
        resolvedActions,
        resolvedTransaction: resolved.resolvedTransaction,
        serializedTransaction: resolved.serializedTransaction,
        chainId: String(resolved.chainId),
        signingDigest: resolved.signingDigest,
    };
}

/**
 * Check if a string is an ESR-encoded signing request.
 * ESR binary starts with a version byte (0x00-0x83).
 * Handles both bare base64url and esr:// prefixed strings.
 *
 * @param {string} data - The string to check
 * @returns {boolean}
 */
export function isEsrEncoded(data) {
    if (!data || typeof data !== 'string') return false;
    try {
        let encoded = data;
        if (encoded.startsWith('esr:')) {
            encoded = encoded.slice(encoded.startsWith('esr://') ? 5 : 4);
        }
        const decoded = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
        const firstByte = decoded.charCodeAt(0);
        const version = firstByte & 0x7f;
        return version >= 2 && version <= 3;
    } catch {
        return false;
    }
}
