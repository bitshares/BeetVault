import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';

const BASE_URL = 'https://shadcn-vue.com/r/styles/new-york';
const UI_DIR = join(process.cwd(), 'src', 'components', 'ui');
const CSS_FILE = join(process.cwd(), 'src', 'styles', 'globals.css');

const ALL_COMPONENTS = [
  'accordion', 'alert', 'alert-dialog', 'aspect-ratio', 'attachment',
  'avatar', 'badge', 'breadcrumb', 'bubble', 'button', 'button-group',
  'calendar', 'card', 'carousel', 'chart', 'checkbox', 'collapsible',
  'combobox', 'command', 'context-menu', 'data-table', 'date-picker',
  'dialog', 'drawer', 'dropdown-menu', 'empty', 'field', 'form',
  'hover-card', 'input', 'input-group', 'input-otp', 'item', 'kbd',
  'label', 'marker', 'menubar', 'message', 'message-scroller',
  'native-select', 'navigation-menu', 'number-field', 'pagination',
  'pin-input', 'popover', 'progress', 'radio-group', 'range-calendar',
  'resizable', 'scroll-area', 'select', 'separator', 'sheet', 'sidebar',
  'skeleton', 'slider', 'sonner', 'spinner', 'stepper', 'switch', 'table',
  'tabs', 'tags-input', 'textarea', 'toggle', 'toggle-group', 'tooltip',
  'typography'
];

const installedComponents = new Set();
const allNpmDeps = new Set();
const allTailwindConfig = { keyframes: {}, animation: {} };
const allCss = {};

async function fetchRegistry(name) {
  const url = `${BASE_URL}/${name}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.status}`);
  return res.json();
}

function writeFileIfContent(filePath, content) {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
  if (content && content.trim()) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`  Written: ${filePath}`);
  }
}

async function installComponent(name) {
  if (installedComponents.has(name)) return;
  installedComponents.add(name);

  let data;
  try {
    data = await fetchRegistry(name);
  } catch (e) {
    console.log(`  SKIP (fetch error): ${name} - ${e.message}`);
    return;
  }

  // Recursively install registry dependencies
  for (const regDep of (data.registryDependencies || [])) {
    if (!regDep.startsWith('http') && !regDep.startsWith('.')) {
      await installComponent(regDep);
    }
  }

  // Collect npm dependencies
  for (const dep of (data.dependencies || [])) {
    allNpmDeps.add(dep);
  }

  // Collect tailwind config extensions
  const tw = data.tailwind?.config?.theme?.extend;
  if (tw) {
    if (tw.keyframes) {
      Object.assign(allTailwindConfig.keyframes, tw.keyframes);
    }
    if (tw.animation) {
      Object.assign(allTailwindConfig.animation, tw.animation);
    }
  }

  // Collect CSS additions
  if (data.css) {
    for (const [layer, rules] of Object.entries(data.css)) {
      if (!allCss[layer]) allCss[layer] = {};
      Object.assign(allCss[layer], rules);
    }
  }

  // Write files
  for (const file of data.files) {
    const targetPath = join(UI_DIR, file.path);
    writeFileIfContent(targetPath, file.content);
  }

  console.log(`OK: ${name} (${data.files.length} files)`);
}

console.log('Fetching and installing components...\n');

for (const comp of ALL_COMPONENTS) {
  await installComponent(comp);
}

// Install npm dependencies
if (allNpmDeps.size > 0) {
  const deps = [...allNpmDeps].filter(d => !d.includes('catalog:'));
  if (deps.length > 0) {
    console.log(`\nInstalling npm dependencies: ${deps.join(', ')}`);
    try {
      execSync(`npm install ${deps.join(' ')}`, { stdio: 'inherit', cwd: process.cwd() });
    } catch (e) {
      console.error('npm install failed:', e.message);
    }
  }
}

// Add tailwind keyframes/animations to globals.css
if (Object.keys(allTailwindConfig.keyframes).length > 0) {
  console.log('\nAdding tailwind keyframes/animations to globals.css...');
  let css = readFileSync(CSS_FILE, 'utf-8');

  let additions = '';
  if (Object.keys(allTailwindConfig.keyframes).length > 0) {
    additions += '\n  --animate-accordion-down: accordion-down 0.2s ease-out;\n';
    additions += '  --animate-accordion-up: accordion-up 0.2s ease-out;\n';
  }

  // Add keyframes after @theme inline block
  const keyframeCSS = Object.entries(allTailwindConfig.keyframes)
    .map(([name, frames]) => {
      const from = Object.entries(frames.from || {}).map(([k, v]) => `${k}: ${v};`).join(' ');
      const to = Object.entries(frames.to || {}).map(([k, v]) => `${k}: ${v};`).join(' ');
      return `@keyframes ${name} {\n  from { ${from} }\n  to { ${to} }\n}`;
    }).join('\n\n');

  // Insert animations into @theme inline and keyframes before @layer base
  const themeClose = css.indexOf('}', css.indexOf('@theme inline'));
  if (themeClose !== -1) {
    // Add animation vars before the closing brace of @theme inline
    css = css.slice(0, themeClose) + additions + css.slice(themeClose);
  }

  // Add keyframes before @layer base
  const layerBaseIdx = css.indexOf('@layer base');
  if (layerBaseIdx !== -1) {
    css = css.slice(0, layerBaseIdx) + keyframeCSS + '\n\n' + css.slice(layerBaseIdx);
  }

  writeFileSync(CSS_FILE, css, 'utf-8');
  console.log('  Updated globals.css with keyframes and animations');
}

console.log(`\nDone! Installed ${installedComponents.size} components.`);
console.log(`NPM dependencies to install: ${[...allNpmDeps].join(', ')}`);
