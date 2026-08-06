import { createBeautify } from "../Antelope/beautify.js";
import { createAtomicBeautify } from "../Antelope/atomic-beautify.js";

const baseBeautify = createBeautify("VAULTA");
const atomicHandlers = createAtomicBeautify("VAULTA");

export default async function beautify(operation) {
    if (!operation || !operation.name) return;

    const qualifiedKey = `${operation.account}::${operation.name}`;

    if (atomicHandlers[qualifiedKey]) return atomicHandlers[qualifiedKey](operation);
    if (atomicHandlers[operation.name]) return atomicHandlers[operation.name](operation);

    return baseBeautify(operation);
}
