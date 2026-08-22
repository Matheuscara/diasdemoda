// Renderiza capas e stories dos Destaques (HTML -> PNG 1080x1920).
import { chromium } from '/home/matt/diasdemoda/.tools/print/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { readdirSync, statSync, mkdirSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = join(HERE, 'destaques');

function collectHtml(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...collectHtml(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

const files = collectHtml(BASE);

const run = async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  for (const file of files) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
    await page.goto('file://' + file, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const png = file.replace(/\.html$/, '.png');
    await page.screenshot({ path: png });
    await page.close();
    console.log(`✓ ${relative(BASE, png)}`);
  }
  await browser.close();
  console.log('Destaques renderizados.');
};

run().catch((e) => { console.error(e); process.exit(1); });
