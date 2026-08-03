import { toRaw } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { blockchains } from '@/config/config.js';

function getCoreSymbol(chain) {
    if (!chain) return chain;
    const blockchain = Object.values(blockchains).find(b => b.identifier === chain);
    return blockchain ? blockchain.coreSymbol : chain;
}

export async function blockchainRequest(args) {
    const settingsStore = useSettingsStore();
    const coreSymbol = getCoreSymbol(args.chain);
    const nodes = settingsStore.getNodes(coreSymbol);
    const selectedNodeIndex = settingsStore.getNode[coreSymbol] || 0;
    const rawNode = (nodes && nodes.length) ? toRaw(nodes[selectedNodeIndex]) : null;
    const node = rawNode ? rawNode.url || rawNode : null;
    return window.electron.blockchainRequest({ ...args, node });
}
