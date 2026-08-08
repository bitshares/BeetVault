const fs = require('fs');
const path = require('path');

const srcDir = path.join('docs');
const destDir = path.join('app', 'docs');

if (!fs.existsSync(srcDir)) {
    console.log('[copy-docs] Source docs/ directory not found, skipping.');
    process.exit(0);
}

fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(destDir, { recursive: true });

function copyRecursive(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

copyRecursive(srcDir, destDir);
console.log('[copy-docs] Copied docs/ to app/docs/');
