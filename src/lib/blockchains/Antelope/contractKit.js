import { ContractKit } from '@wharfkit/contract';
import { APIClient, FetchProvider } from '@wharfkit/antelope';

const kits = {};

export function getContractKit(chainIdentifier, url) {
    const key = `${chainIdentifier}:${url}`;
    if (!kits[key]) {
        const client = new APIClient({
            provider: new FetchProvider(url, { fetch })
        });
        kits[key] = new ContractKit({ client });
    }
    return kits[key];
}

export function clearContractKitCache() {
    Object.keys(kits).forEach(key => delete kits[key]);
}
