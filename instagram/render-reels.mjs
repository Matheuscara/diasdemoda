// Renderiza os frames dos Reels (HTML -> PNG 1080x1920).
import { chromium } from '/home/matt/diasdemoda/.tools/print/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdirSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REELS_DIR = join(HERE, 'reels');

// Todos os arquivos r*.html viram PNG com o mesmo nome
const frames = readdirSync(REELS_DIR)
  .filter((f) => /^r\d+-\d+\.html$/.test(f))
  .sort()
  .map((f) => ({ html: f, png: f.replace(/\.html$/, '.png') }));

const run = async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  for (const frame of frames) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    await page.goto('file://' + join(REELS_DIR, frame.html), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(REELS_DIR, frame.png) });
    await page.close();
    console.log(`✓ ${frame.png}`);
  }
  await browser.close();
  console.log('Frames de reels renderizados.');
};

run().catch((e) => { console.error(e); process.exit(1); });
