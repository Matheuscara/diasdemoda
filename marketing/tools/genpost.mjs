#!/usr/bin/env node
// genpost.mjs — gera um post/carrossel de Instagram (Dias de Moda) a partir de uma spec.
// Emite instagram/posts/<slug>/NN-*.html (1080x1350, 4:5), copia fontes e escreve LEGENDA.md.
// Render pra PNG é feito pelo buildpost.sh (Chromium). Uso: node genpost.mjs <spec.json> <marketingDir>
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const [specPath, M] = process.argv.slice(2);
if (!specPath || !M) { console.error("uso: node genpost.mjs <spec.json> <marketingDir>"); process.exit(1); }
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const dir = join(M, "instagram", "posts", spec.slug);
mkdirSync(join(dir, "fonts"), { recursive: true });
const fsrc = join(M, "assets", "fonts");
for (const f of readdirSync(fsrc)) copyFileSync(join(fsrc, f), join(dir, "fonts", f));

// ——— Paleta e fontes da marca ———
const C = {
  ameixa: "#2B1A22", ameixaSuave: "#5C4450", branco: "#FBF6F4", superficie: "#F6E6EA",
  rosa: "#AE567C", rosaEscuro: "#8C3F63", rosaClaro: "#E1ADB1", dourado: "#C9A24B",
  cardDark: "#3A2530",
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function reg(r) {
  if (r === "dark") return { bg: C.ameixa, text: C.branco, kicker: C.rosaClaro, em: C.rosaClaro, sub: "rgba(251,246,244,0.74)", meta: "rgba(251,246,244,0.62)", card: C.cardDark, border: "rgba(251,246,244,0.14)", nav: "rgba(251,246,244,0.55)", ghost: "rgba(251,246,244,0.05)" };
  if (r === "rosa") return { bg: C.rosa, text: C.branco, kicker: "rgba(255,255,255,0.85)", em: C.branco, sub: "rgba(255,255,255,0.92)", meta: "rgba(255,255,255,0.82)", card: "rgba(255,255,255,0.13)", border: "rgba(255,255,255,0.3)", nav: "rgba(255,255,255,0.75)", ghost: "rgba(255,255,255,0.08)" };
  return { bg: C.branco, text: C.ameixa, kicker: C.rosa, em: C.rosaEscuro, sub: C.ameixaSuave, meta: C.ameixaSuave, card: C.superficie, border: "rgba(43,26,34,0.1)", nav: C.ameixaSuave, ghost: "rgba(174,86,124,0.06)" };
}

const HEAD = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><style>
@import url("fonts/fonts.css");
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1350px;overflow:hidden}
.stage{position:relative;width:1080px;height:1350px;font-family:"Karla",sans-serif;overflow:hidden}
.pad{position:absolute;inset:0;padding:88px;display:flex;flex-direction:column;justify-content:center}
.serif{font-family:"Cormorant Garamond",Georgia,serif}
.kick{font-family:"Karla",sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.34em;font-size:22px}
.stitch{height:5px;width:132px;border-radius:999px;margin:24px 0 40px;background-image:repeating-linear-gradient(90deg,currentColor 0 8px,transparent 8px 18px)}
.nav{position:absolute;left:88px;right:88px;bottom:74px;display:flex;justify-content:space-between;align-items:center;font-family:"Karla",sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;font-size:22px}
.orb{position:absolute;border-radius:50%;z-index:0}
.ghost{position:absolute;font-family:"Cormorant Garamond",serif;font-weight:700;line-height:0.8;letter-spacing:-0.04em;z-index:0}
em{font-style:italic;font-weight:500}
</style></head><body>`;
const FOOT = `</body></html>`;
const nav = (n, total, r) => `<div class="nav" style="color:${r.nav}"><span>diasdemoda.com</span><span>${n} / ${String(total).padStart(2, "0")}</span></div>`;
const orbs = (r) => `<div class="orb" style="width:760px;height:760px;top:-320px;right:-240px;background:radial-gradient(circle,${C.rosaClaro}55 0%,${C.rosaClaro}00 70%)"></div><div class="orb" style="width:580px;height:580px;bottom:-260px;left:-200px;background:radial-gradient(circle,${C.rosa}33 0%,${C.rosa}00 70%)"></div>`;
const wordmark = (r) => `<div style="position:relative;z-index:1"><div class="serif" style="font-weight:700;font-size:36px;letter-spacing:0.05em;color:${r.text};line-height:1">DIAS DE MODA</div><div class="kick" style="font-size:14px;letter-spacing:0.4em;color:${C.rosa};margin-top:8px">Uniformes</div></div>`;

function cover(f, n, total, r) {
  return HEAD + `<div class="stage" style="background:${r.bg};color:${r.text}">${orbs(r)}
    <div class="pad" style="justify-content:space-between;padding-top:96px;padding-bottom:150px">
      <div style="position:relative;z-index:1">${f.kicker ? `<div class="kick" style="color:${r.kicker}">${esc(f.kicker)}</div><div class="stitch" style="color:${C.rosa}"></div>` : ""}${wordmark(r)}</div>
      <div style="position:relative;z-index:1">
        <div class="serif" style="font-size:${f.size || 128}px;font-weight:700;line-height:0.98;letter-spacing:0.005em">${f.title}</div>
        ${f.sub ? `<div style="margin-top:36px;font-size:34px;font-weight:500;color:${r.sub};max-width:820px;line-height:1.35">${f.sub}</div>` : ""}
      </div>
    </div>${nav(n, total, r)}</div>` + FOOT;
}
function point(f, n, total, r) {
  return HEAD + `<div class="stage" style="background:${r.bg};color:${r.text}">
    ${f.ghost ? `<div class="ghost" style="top:-40px;right:20px;font-size:${f.ghostSize || 420}px;color:${r.ghost}">${esc(f.ghost)}</div>` : ""}
    <div class="pad">
      ${f.kicker ? `<div class="kick" style="color:${r.kicker};position:relative;z-index:1">${esc(f.kicker)}</div><div class="stitch" style="color:${C.rosa};position:relative;z-index:1"></div>` : ""}
      <div class="serif" style="position:relative;z-index:1;font-size:${f.size || 104}px;font-weight:700;line-height:1.0;letter-spacing:0.005em">${f.title}</div>
      ${f.sub ? `<div style="position:relative;z-index:1;margin-top:34px;font-size:36px;font-weight:500;line-height:1.4;color:${r.sub};max-width:820px">${f.sub}</div>` : ""}
    </div>${nav(n, total, r)}</div>` + FOOT;
}
function big(f, n, total, r) {
  return HEAD + `<div class="stage" style="background:${r.bg};color:${r.text}"><div class="pad">
    ${f.kicker ? `<div class="kick" style="color:${r.kicker}">${esc(f.kicker)}</div><div class="stitch" style="color:${r.em}"></div>` : ""}
    <div class="serif" style="font-size:${f.size || 150}px;font-weight:700;line-height:0.94;letter-spacing:0.005em">${f.big}</div>
    ${f.sub ? `<div style="margin-top:38px;font-size:40px;font-weight:600;color:${r.sub};max-width:840px;line-height:1.3">${f.sub}</div>` : ""}
  </div>${nav(n, total, r)}</div>` + FOOT;
}
function card(f, n, total, r) {
  const rows = f.rows.map((row) => `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:24px 0;border-top:1px solid ${r.border}">
      <span style="font-size:${row.hero ? 40 : 34}px;${row.hero ? "font-weight:700;" : `font-weight:500;color:${r.sub};`}">${esc(row.label)}</span>
      <span class="serif" style="font-size:${row.hero ? 76 : 56}px;font-weight:700;${row.hero ? `color:${C.rosa};` : ""}">${esc(row.value)}</span></div>`).join("");
  return HEAD + `<div class="stage" style="background:${r.bg};color:${r.text}"><div class="pad">
    ${f.kicker ? `<div class="kick" style="color:${r.kicker}">${esc(f.kicker)}</div><div class="stitch" style="color:${C.rosa}"></div>` : ""}
    ${f.head ? `<div class="serif" style="font-size:${f.size || 78}px;font-weight:700;line-height:1.0">${f.head}</div>` : ""}
    <div style="margin-top:44px;border:1px solid ${r.border};border-top:5px solid ${C.rosa};border-radius:20px;background:${r.card};padding:44px 48px">
      ${f.ctitle ? `<div class="kick" style="color:${r.kicker};font-size:20px;margin-bottom:22px">${esc(f.ctitle)}</div>` : ""}
      ${rows}
    </div>
  </div>${nav(n, total, r)}</div>` + FOOT;
}
function steps(f, n, total, r) {
  const items = f.steps.map((s, i) => `<div style="display:flex;align-items:flex-start;gap:28px;padding:22px 0;border-top:${i ? `1px solid ${r.border}` : "none"}">
      <span class="serif" style="flex:0 0 auto;font-size:64px;font-weight:700;line-height:1;color:${C.rosa};min-width:70px">${i + 1}</span>
      <div><div style="font-size:${s.title ? 36 : 34}px;font-weight:700;line-height:1.2">${s.title || s}</div>${s.sub ? `<div style="margin-top:8px;font-size:26px;font-weight:500;color:${r.sub};line-height:1.35">${s.sub}</div>` : ""}</div>
    </div>`).join("");
  return HEAD + `<div class="stage" style="background:${r.bg};color:${r.text}"><div class="pad">
    ${f.kicker ? `<div class="kick" style="color:${r.kicker}">${esc(f.kicker)}</div><div class="stitch" style="color:${C.rosa}"></div>` : ""}
    ${f.head ? `<div class="serif" style="font-size:${f.size || 82}px;font-weight:700;line-height:1.0;margin-bottom:20px">${f.head}</div>` : ""}
    <div>${items}</div>
  </div>${nav(n, total, r)}</div>` + FOOT;
}
function compare(f, n, total, r) {
  const col = (c, accent) => `<div style="flex:1;border:1px solid ${r.border};border-top:5px solid ${accent};border-radius:20px;background:${r.card};padding:40px 36px">
    <div class="kick" style="color:${accent};font-size:20px;margin-bottom:20px">${esc(c.title)}</div>
    ${c.items.map((it) => `<div style="display:flex;gap:16px;align-items:baseline;padding:14px 0;font-size:29px;font-weight:500;line-height:1.3"><span style="color:${accent};font-weight:700">${c.marker || "·"}</span><span>${it}</span></div>`).join("")}
  </div>`;
  return HEAD + `<div class="stage" style="background:${r.bg};color:${r.text}"><div class="pad">
    ${f.kicker ? `<div class="kick" style="color:${r.kicker}">${esc(f.kicker)}</div><div class="stitch" style="color:${C.rosa}"></div>` : ""}
    ${f.head ? `<div class="serif" style="font-size:${f.size || 74}px;font-weight:700;line-height:1.0;margin-bottom:40px">${f.head}</div>` : ""}
    <div style="display:flex;gap:28px;align-items:stretch">${col(f.left, C.ameixaSuave === r.text ? C.rosa : C.rosaClaro)}${col(f.right, C.rosa)}</div>
  </div>${nav(n, total, r)}</div>` + FOOT;
}
function cta(f, n, total, r) {
  return HEAD + `<div class="stage" style="background:${C.rosa};color:${C.branco}">${orbs({})}
    <div class="pad" style="justify-content:center;position:relative;z-index:1">
    <div class="serif" style="font-size:${f.size || 128}px;font-weight:700;line-height:0.96;letter-spacing:0.005em">${f.title || "Vamos vestir<br>a sua marca?"}</div>
    <div style="margin-top:26px;font-size:44px;font-weight:600;color:rgba(255,255,255,0.9)">${f.sub || "Orçamento no mesmo dia."}</div>
    <div style="margin-top:56px;display:inline-flex;align-self:flex-start;align-items:center;background:${C.branco};color:${C.rosa};font-weight:700;font-size:38px;padding:30px 52px;border-radius:999px;box-shadow:0 18px 44px rgba(43,26,34,0.28)">${esc(f.pill || "Pedir orçamento no WhatsApp")}</div>
    <div style="margin-top:34px;font-family:'Karla',sans-serif;font-weight:700;font-size:40px;letter-spacing:0.02em">${esc(f.phone || "+55 64 9943-1610")}</div>
  </div>${nav(n, total, { nav: "rgba(255,255,255,0.75)" })}</div>` + FOOT;
}
const KINDS = { cover, point, big, card, steps, compare, cta };

// Registro por slide; se omitido, alterna claro/escuro (REGRAS-DESIGN §1) a partir de spec.startRegister.
let auto = spec.startRegister === "dark" ? "dark" : "light";
const total = spec.slides.length;
spec.slides.forEach((f, i) => {
  const n = i + 1;
  let register = f.register;
  if (!register) { register = auto; auto = auto === "light" ? "dark" : "light"; }
  else if (register !== "rosa") auto = register === "light" ? "dark" : "light";
  const r = reg(register);
  const name = `${String(n).padStart(2, "0")}-${f.id || f.kind}`;
  writeFileSync(join(dir, `${name}.html`), KINDS[f.kind](f, n, total, r));
});
const tags = Array.isArray(spec.hashtags) ? spec.hashtags.join(" ") : (spec.hashtags || "");
writeFileSync(join(dir, "LEGENDA.md"), spec.legenda.trim() + "\n\n" + tags + "\n");
console.log(`✓ ${spec.slug}: ${total} telas + LEGENDA.md -> ${dir}`);
