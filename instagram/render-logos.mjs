// Renderiza as logos (HTML -> PNG transparente) usando Playwright.
import { chromium } from '/home/matt/diasdemoda/.tools/print/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const LOGO_DIR = join(HERE, 'logo');

const LOGOS = [
  { html: 'wordmark.html', png: 'logo-wordmark.png', w: 1200, h: 1200, transparent: true },
  { html: 'perfil.html', png: 'logo-perfil.png', w: 1200, h: 1200, transparent: false },
  { html: 'perfil-rosa.html', png: 'logo-perfil-rosa.png', w: 1200, h: 1200, transparent: false },
];

const run = async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  for (const logo of LOGOS) {
    const page = await browser.newPage({ viewport: { width: logo.w, height: logo.h }, deviceScaleFactor: 2 });
    await page.goto('file://' + join(LOGO_DIR, logo.html), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(LOGO_DIR, logo.png), omitBackground: logo.transparent });
    await page.close();
    console.log(`✓ ${logo.png}`);
  }
  await browser.close();
  console.log('Logos renderizadas.');
};

run().catch((e) => { console.error(e); process.exit(1); });
