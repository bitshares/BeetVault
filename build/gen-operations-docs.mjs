/**
 * One-off generator for per-chain operations documentation.
 *
 * Reads the operation translation files (the same source the approval
 * prompts use) and emits a markdown page per chain. Run manually when
 * operation definitions change:
 *
 *   node build/gen-operations-docs.mjs
 */

import fs from 'fs';
import path from 'path';

const CORE = ['getAccount', 'requestSignature', 'injectedCall', 'signMessage', 'verifyMessage', 'voteFor', 'signNFT'];

const CHAINS = [
    { slug: 'bitshares',   src: 'BTS',    name: 'BitShares' },
    { slug: 'vaulta',      src: 'VAULTA', name: 'Vaulta' },
    { slug: 'wax',         src: 'WAX',    name: 'WAX', extra: 'ATOMIC' },
    { slug: 'telos',       src: 'TLOS',   name: 'Telos' },
    { slug: 'fio',         src: 'FIO',    name: 'FIO' },
    { slug: 'libre',       src: 'LIBRE',  name: 'Libre' },
    { slug: 'xpr-network', src: 'XPR',    name: 'XPR Network' },
    { slug: 'hive',        src: 'HIVE',   name: 'Hive' },
];

const read = (c) =>
    JSON.parse(fs.readFileSync(path.join('src/translations/operations', c, 'en.json'), 'utf-8'));

/** Escapes pipe characters so table cells don't break. */
const cell = (s) => String(s || '').replace(/\|/g, '\\|').trim();

function table(entries) {
    const rows = entries
        .map(([key, v]) => `| \`${key}\` | ${cell(v.title)} | ${cell(v.tooltip)} |`)
        .join('\n');
    return `| Action | Name | Description |\n|--------|------|-------------|\n${rows}`;
}

function buildPage({ slug, src, name, extra }) {
    const ops = read(src);
    const entries = Object.entries(ops);

    const core = entries.filter(([k]) => CORE.includes(k));
    const chainSpecific = entries.filter(([k]) => !CORE.includes(k));

    const parts = [
        `# ${name} Operations`,
        '',
        `This page lists the operations BeetVault can process for ${name}. Each corresponds to an action a third-party application may request, and every request must be approved before it is broadcast.`,
        '',
        `Operation names shown here are the identifiers that appear in permission scope selection and in the approval prompt.`,
        '',
    ];

    if (core.length) {
        parts.push(
            '## Wallet Requests',
            '',
            'Requests handled by the wallet itself rather than broadcast to the chain.',
            '',
            table(core),
            ''
        );
    }

    if (chainSpecific.length) {
        parts.push(
            '## Chain Operations',
            '',
            `Operations broadcast to the ${name} network.`,
            '',
            table(chainSpecific),
            ''
        );
    }

    if (extra) {
        const extraOps = Object.entries(read(extra));
        parts.push(
            '## NFT Operations',
            '',
            'WAX supports the AtomicAssets and AtomicMarket standards for NFTs and NFT trading. These operations are available in addition to the chain operations above.',
            '',
            table(extraOps),
            ''
        );
    }

    parts.push(
        '## Permission Scope',
        '',
        'Before an input method can authorise anything, you choose which of these operations it may request. Anything outside that selection is rejected without prompting.',
        '',
        'Scope is configured per input method on its respective page, and is remembered per chain.',
        ''
    );

    return parts.join('\n');
}

let total = 0;
for (const chain of CHAINS) {
    const dir = path.join('docs/en/chains', chain.slug);
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, 'operations.md');
    fs.writeFileSync(out, buildPage(chain));
    const count = Object.keys(read(chain.src)).length +
        (chain.extra ? Object.keys(read(chain.extra)).length : 0);
    total += count;
    console.log(`${out.padEnd(46)} ${count} operations`);
}
console.log(`\n${CHAINS.length} pages, ${total} operations documented`);
