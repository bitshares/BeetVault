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

/**
 * `injectedCall` is the transport method every request uses, not an operation
 * a user would scope, so it is excluded from the generated tables.
 */
const TRANSPORT_METHOD = 'injectedCall';

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
    const entries = Object.entries(read(src)).filter(
        ([key]) => key !== TRANSPORT_METHOD
    );

    const parts = [
        `# ${name} Operations`,
        '',
        `Third-party applications request transactions using a single method: \`injectedCall\`. The transaction it carries may contain one or more of the ${name} operations listed below.`,
        '',
        'When a request arrives, BeetVault checks each operation in the transaction against the scope you configured. If none are permitted, the request is rejected without prompting. Otherwise the transaction is shown for approval.',
        '',
        'The identifiers below are what appear in the scope selection list and in the approval prompt.',
        '',
    ];

    if (entries.length) {
        parts.push(
            '## Operations',
            '',
            `Operations broadcast to the ${name} network.`,
            '',
            table(entries),
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
        'Each input method asks you to choose which operations it may authorise before it will process anything. You can permit everything, or select individual operations.',
        '',
        'Your selection is remembered per chain, and applies to every transaction that input method receives.',
        '',
        '> **Not an exhaustive list.** The operations above are those with descriptions available. The complete set your chain accepts is shown when configuring scope in the wallet.',
        ''
    );

    return parts.join('\n');
}

const countFor = (chain) =>
    Object.entries(read(chain.src)).filter(
        ([k]) => k !== TRANSPORT_METHOD
    ).length + (chain.extra ? Object.keys(read(chain.extra)).length : 0);

let total = 0;
for (const chain of CHAINS) {
    const dir = path.join('docs/en/chains', chain.slug);
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, 'operations.md');
    fs.writeFileSync(out, buildPage(chain));
    const count = countFor(chain);
    total += count;
    console.log(`${out.padEnd(46)} ${count} operations`);
}
console.log(`\n${CHAINS.length} pages, ${total} operations documented`);
