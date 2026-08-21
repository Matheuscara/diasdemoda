// Renderiza os posts do Instagram (HTML -> PNG 1080x1080) usando Playwright.
// Uso: node render.mjs  (a partir de /home/matt/diasdemoda/instagram)
import { chromium } from '/home/matt/diasdemoda/.tools/print/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(HERE, 'posts');
const OUT_DIR = join(HERE, 'posts');

const POSTS = [
  { html: '01-quem-somos.html', png: '01-quem-somos.png' },
  { html: '02-como-funciona.html', png: '02-como-funciona.png' },
  { html: '03-o-que-fazemos.html', png: '03-o-que-fazemos.png' },
  { html: '04-uniforme-empresarial.html', png: '04-uniforme-empresarial.png' },
  { html: '05-uniformes-equipes.html', png: '05-uniformes-equipes.png' },
  { html: '06-personalizacao.html', png: '06-personalizacao.png' },
  { html: '07-qualidade.html', png: '07-qualidade.png' },
  { html: '08-bastidores.html', png: '08-bastidores.png' },
  { html: '09-entrega-goias.html', png: '09-entrega-goias.png' },
  { html: '10-depoimento.html', png: '10-depoimento.png' },
];

const run = async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });

  for (const post of POSTS) {
    const page = await browser.newPage({
      viewport: { width: 1080, height: 1080 },
      deviceScaleFactor: 1,
    });
    await page.goto('file://' + join(POSTS_DIR, post.html), { waitUntil: 'networkidle' });
    // Garante que as fontes (Cormorant Garamond / Karla) terminaram de carregar
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(OUT_DIR, post.png) });
    await page.close();
    console.log(`✓ ${post.png}`);
  }

  await browser.close();
  console.log('Posts renderizados.');
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
