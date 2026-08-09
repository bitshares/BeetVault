/*
    This script is used to detect and fix any variables which have been broken during translations.
    It uses the english locale files as the truthful references, and scans deeply nested keys for variables to fix.
    
    Updated to work with per-blockchain translation files:
    src/translations/operations/<locale>.json          (shared keys)
    src/translations/operations/<BLOCKCHAIN>/<locale>.json  (chain-specific keys)
*/

const fs = require('fs');
const path = require('path');

const LOCALES = ['da', 'de', 'es', 'et', 'fr', 'it', 'ja', 'ko', 'pt', 'th'];
const CHAINS = ['VAULTA', 'BTS', 'WAX', 'TLOS', 'FIO', 'LIBRE', 'XPR', 'HIVE'];
const OPS_DIR = path.join(__dirname, 'operations');

function getAllKeys(obj, prefix = '') {
    return Object.entries(obj).reduce((result, [key, value]) => {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        return result.concat([
            newPrefix,
            ...(typeof value === 'object' && value !== null
                ? getAllKeys(value, newPrefix)
                : []),
        ]);
    }, []);
}

function getNestedValue(obj, path) {
    if (!path) return;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function setNestedValue(obj, lookupKey, newValue) {
    const parts = lookupKey.split('.');
    const lastPart = parts.pop();
    const parent = parts.reduce((acc, part) => {
        if (typeof acc[part] !== 'object' || acc[part] === null) {
            acc[part] = {};
        }
        return acc[part];
    }, obj);
    parent[lastPart] = newValue;
}

const variable_regex = /{(.+?)}/g;

function fixVariables(enData, targetData, label) {
    const enKeys = getAllKeys(enData);
    let fixes = 0;

    enKeys.forEach((key) => {
        const enValue = getNestedValue(enData, key);
        if (typeof enValue !== 'string') return;

        const enMatches = enValue.match(variable_regex);
        if (!enMatches || !enMatches.length) return;

        let targetValue = getNestedValue(targetData, key);
        if (typeof targetValue !== 'string') return;

        const original = targetValue;
        const targetMatches = targetValue.match(variable_regex);

        if (!targetMatches || !targetMatches.length) {
            const partialRegex = /(?<=\s|^)[^{\s]+(?=\})/g;
            const partialMatches = targetValue.match(partialRegex);
            if (!partialMatches || !partialMatches.length) return;
            partialMatches.forEach((match, i) => {
                if (enMatches[i]) {
                    targetValue = targetValue.replace(match + '}', enMatches[i]);
                }
            });
        } else {
            targetMatches.forEach((match, i) => {
                if (enMatches[i] && match !== enMatches[i]) {
                    targetValue = targetValue.replace(match, enMatches[i]);
                }
            });
        }

        if (targetValue !== original) {
            console.log(`  [${label}] replacing "${original}" with "${targetValue}"`);
            setNestedValue(targetData, key, targetValue);
            fixes++;
        }
    });

    return fixes;
}

// Fix shared operations files
console.log('Fixing shared operations files...');
LOCALES.forEach((locale) => {
    const enFile = path.join(OPS_DIR, 'en.json');
    const targetFile = path.join(OPS_DIR, `${locale}.json`);

    const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
    const targetData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));

    const fixes = fixVariables(enData, targetData, locale);
    if (fixes > 0) {
        fs.writeFileSync(targetFile, JSON.stringify(targetData, null, 2) + '\n');
        console.log(`  ${locale}.json: ${fixes} fixes`);
    }
});

// Fix per-chain files
console.log('Fixing per-chain operation files...');
CHAINS.forEach((chain) => {
    const chainDir = path.join(OPS_DIR, chain);
    if (!fs.existsSync(chainDir)) return;

    const enFile = path.join(chainDir, 'en.json');
    if (!fs.existsSync(enFile)) return;

    const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));

    LOCALES.forEach((locale) => {
        const targetFile = path.join(chainDir, `${locale}.json`);
        if (!fs.existsSync(targetFile)) return;

        const targetData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
        const fixes = fixVariables(enData, targetData, `${chain}/${locale}`);
        if (fixes > 0) {
            fs.writeFileSync(targetFile, JSON.stringify(targetData, null, 2) + '\n');
            console.log(`  ${chain}/${locale}.json: ${fixes} fixes`);
        }
    });
});

console.log('Done.');
