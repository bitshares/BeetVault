const fs = require('fs');
const p = require('path');
const d = p.join('app', 'lib');
if (!fs.existsSync(d)) {
  fs.mkdirSync(d, { recursive: true });
}
fs.copyFileSync(p.join('src', 'lib', 'argon-worker.mjs'), p.join(d, 'argon-worker.mjs'));
