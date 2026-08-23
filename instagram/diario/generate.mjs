// Gera o "post do dia" a partir do banco de conteúdo (conteudo.js).
// Escolhe o item de forma determinística pela data (dia do ano), renderiza a
// arte 1080x1080 e escreve a legenda. Portável: usa o Playwright local do
// projeto ou, em CI (GitHub Actions), o `playwright` instalado no ambiente.
import { CONTEUDO } from './conteudo.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'saida');

async function getChromium() {
  try {
    const pw = await import('/home/matt/diasdemoda/.tools/print/node_modules/playwright/index.mjs');
    return pw.chromium;
  } catch {
    const pw = await import('playwright');
    return pw.chromium;
  }
}

// dia do ano (1–365) para escolher o item de forma estável por dia
function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

function tema(categoria) {
  switch (categoria) {
    case 'FRASE':
      return { bg: '#2B1A22', texto: '#FBF6F4', sub: '#C9B8C0', label: '#E1ADB1', orb: 'rgb(174 86 124 / 0.34)', ctaBg: '#AE567C' };
    case 'LEMBRETE':
      return { bg: '#AE567C', texto: '#FFFFFF', sub: '#F6E6EA', label: '#FFFFFF', orb: 'rgb(255 255 255 / 0.16)', ctaBg: '#FFFFFF', ctaTexto: '#8C3F63' };
    default: // DICA, VOCÊ SABIA, PERGUNTA
      return { bg: '#FBF6F4', texto: '#2B1A22', sub: '#5C4450', label: '#AE567C', orb: 'rgb(225 173 177 / 0.5)', ctaBg: '#AE567C', ctaTexto: '#FFFFFF' };
  }
}

function fontSize(titulo) {
  const n = titulo.length;
  if (n <= 24) return 92;
  if (n <= 44) return 74;
  return 60;
}

function renderHtml(item) {
  const t = tema(item.categoria);
  const fs = fontSize(item.titulo);
  const ctaTexto = t.ctaTexto ?? '#FFFFFF';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Karla:wght@400;500;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1080px; height:1350px; background:${t.bg}; font-family:'Karla',sans-serif; color:${t.texto}; overflow:hidden; position:relative; }
  .orb { position:absolute; border-radius:50%; z-index:0; background:radial-gradient(circle, ${t.orb} 0%, transparent 70%); }
  .orb-a { width:720px; height:720px; top:-300px; right:-220px; }
  .orb-b { width:560px; height:560px; bottom:-240px; left:-180px; }
  .frame { position:relative; z-index:1; height:100%; padding:84px 88px; display:flex; flex-direction:column; }
  .label { font-weight:700; font-size:15px; letter-spacing:6px; text-transform:uppercase; color:${t.label}; }
  .stitch { height:4px; width:100%; border-radius:999px; margin-top:14px; background-image:repeating-linear-gradient(90deg, ${t.label} 0 7px, transparent 7px 16px); }
  .middle { flex:1; display:flex; flex-direction:column; justify-content:center; }
  .headline { font-family:'Cormorant Garamond',Georgia,serif; font-weight:700; font-size:${fs}px; line-height:1.04; letter-spacing:0.005em; }
  .brand { margin-top:44px; font-size:24px; font-weight:700; color:${t.sub}; letter-spacing:1px; }
  .cta-row { display:flex; align-items:center; gap:24px; }
  .pill { display:inline-flex; align-items:center; background:${t.ctaBg}; color:${ctaTexto}; font-weight:700; font-size:22px; padding:22px 38px; border-radius:999px; }
  .phone { font-size:19px; color:${t.sub}; }
</style></head>
<body>
  <div class="orb orb-a"></div><div class="orb orb-b"></div>
  <div class="frame">
    <div><div class="label">${item.categoria}</div><div class="stitch"></div></div>
    <div class="middle">
      <div class="headline">${item.titulo}</div>
      <div class="brand">DIAS DE MODA · UNIFORMES</div>
    </div>
    <div class="cta-row">
      <div class="pill">Pedir orçamento no WhatsApp</div>
      <div class="phone">+55 64 9943-1610</div>
    </div>
  </div>
</body></html>`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const hoje = new Date();
  const item = CONTEUDO[(dayOfYear(hoje) - 1) % CONTEUDO.length];
  const dia = hoje.toISOString().slice(0, 10); // YYYY-MM-DD

  const html = renderHtml(item);
  const htmlPath = join(OUT, `posto-${dia}.html`);
  const pngPath = join(OUT, `posto-${dia}.png`);
  const legendaPath = join(OUT, `posto-${dia}.md`);
  await writeFile(htmlPath, html, 'utf8');

  const chromium = await getChromium();
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: pngPath });
  await browser.close();

  await writeFile(legendaPath, `${item.legenda}\n\n${item.hashtags}\n`, 'utf8');

  console.log(`✓ post do dia ${dia}`);
  console.log(`  título: ${item.titulo}`);
  console.log(`  arte:   ${pngPath}`);
  console.log(`  legenda: ${legendaPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
