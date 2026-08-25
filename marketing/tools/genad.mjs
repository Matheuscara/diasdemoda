#!/usr/bin/env node
// genad.mjs — gera um anúncio HyperFrames (só-SFX) da Dias de Moda a partir de uma spec.
// Emite compositions/frames/*.html, STORYBOARD.md, audio_meta_sfx.json, ROTEIRO.md em <outDir>,
// copiando os assets compartilhados (fontes, gsap, sfx referenciados) + frame.md + hyperframes.json.
// Uso: node genad.mjs <spec.json> <outDir> <sharedDir> [sfxLibDir] [aspect]
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, symlinkSync, readdirSync } from "node:fs";
import { join } from "node:path";

const [specPath, outDir, sharedDir, sfxLibArg, aspectArg] = process.argv.slice(2);
if (!specPath || !outDir || !sharedDir) { console.error("args: <spec.json> <outDir> <sharedDir> [sfxLibDir] [aspect]"); process.exit(1); }
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const ASPECTS = { portrait: [1080, 1920], square: [1080, 1080], landscape: [1920, 1080] };
const [CW, CH] = ASPECTS[aspectArg || "portrait"] || ASPECTS.portrait;

// ——— Paleta da marca (registros escuro / rosa) ———
const C = {
  ink: "#2B1A22", inkAlt: "#3A2530", cream: "#FBF6F4", secondary: "#E1ADB1",
  muted: "rgba(251,246,244,0.6)", rosa: "#AE567C", rosaEscuro: "#8C3F63", border: "rgba(251,246,244,0.16)",
  onRosaMuted: "rgba(255,255,255,0.85)", onRosaFaint: "rgba(255,255,255,0.62)",
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// @font-face local (Cormorant Garamond + Karla) lido do fonts.css compartilhado, com urls reapontadas p/ assets/fonts.
const FONTS = readFileSync(join(sharedDir, "assets/fonts/fonts.css"), "utf8")
  .replace(/url\("([^"]+\.woff2)"\)/g, 'url("assets/fonts/$1")');
const cssPrefix = (id) => "f" + id;
const jsPrefix = (id) => "v" + id.replace(/[^A-Za-z0-9_]/g, "_");
const isRosa = (register) => register === "rosa" || register === "orange";

function reg(register) {
  return isRosa(register)
    ? { bg: C.rosa, text: C.cream, kicker: C.onRosaFaint, hl: C.cream, sub: C.onRosaMuted }
    : { bg: C.ink, text: C.cream, kicker: C.rosa, hl: C.rosa, sub: C.secondary };
}
const bgCss = (register) => isRosa(register)
  ? `background:${C.rosa};`
  : `background: radial-gradient(120% 70% at 18% 16%, rgba(174,86,124,0.20), rgba(174,86,124,0) 60%), ${C.ink};`;

function wrap(id, p, dur, register, inner, style, script) {
  const isLand = CW > CH;
  const center = isLand ? `
        #root [class$="-wrap"] { align-items:center; text-align:center; }
        #root [class$="-it"] { justify-content:center; }
        #root [class$="-card"] { align-self:center; width:100%; max-width:130cqmin; }
        #root [class$="-head"], #root [class$="-label"] { max-width:150cqmin; }
        #root [class$="-chip"], #root [class$="-pill"], #root [class$="-brand"] { align-self:center; }` : "";
  let html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8" /></head><body>
    <template>
      <style>${FONTS}
        #root { position:absolute; inset:0; container-type:size; overflow:hidden; font-family:"Cormorant Garamond",Georgia,serif; }
        .${p}-bg { position:absolute; inset:0; ${bgCss(register)} }
${style}${center}
      </style>
      <div id="root" data-composition-id="${id}" data-duration="${dur}" data-width="${CW}" data-height="${CH}">
        <div id="${p}-bg" class="${p}-bg clip" data-start="0" data-duration="${dur}" data-track-index="0"></div>
${inner}
      </div>
      <script src="assets/gsap.min.js"></script>
      <script>
        (function(){ window.__timelines = window.__timelines || {}; const tl = gsap.timeline({ paused:true });
${script}
        window.__timelines["${id}"] = tl; })();
      </script>
    </template>
  </body></html>
`;
  html = html.replaceAll("cqw", "cqmin");
  const scale = isLand ? 1.15 : 1;
  if (scale !== 1) html = html.replace(/([\d.]+)cqmin/g, (_, n) => (parseFloat(n) * scale).toFixed(2) + "cqmin");
  return html;
}

function kindStack(f) {
  const r = reg(f.register), id = f.id, p = cssPrefix(id);
  const lines = f.lines.map((l, i) => {
    const size = l.size || (l.hl ? 13.2 : 8.4), w = l.hl ? 700 : 600;
    const col = l.hl ? r.hl : (l.dim ? r.sub : r.text);
    return `          <div class="${p}-l${i}" id="${p}-l${i}" style="font-size:${size}cqw;font-weight:${w};line-height:0.98;letter-spacing:0.003em;color:${col};margin:0.4cqw 0;">${l.t}</div>`;
  }).join("\n");
  const style = `        .${p}-wrap { position:absolute; inset:0; padding:9cqw 5.5cqw; display:flex; flex-direction:column; justify-content:center; }
        .${p}-kick { font-family:"Karla",sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:0.3em; font-size:2.5cqw; color:${r.kicker}; margin-bottom:3cqw; }`;
  const inner = `        <div class="${p}-wrap">
          ${f.kicker ? `<div class="${p}-kick" id="${p}-kick">${esc(f.kicker)}</div>` : ""}
${lines}
        </div>`;
  const cues = f.cues || f.lines.map((_, i) => 0.35 + i * 1.1);
  let s = f.kicker ? `        tl.fromTo("#${p}-kick",{opacity:0,y:20},{opacity:1,y:0,duration:0.4,ease:"power2.out"},0.1);\n` : "";
  f.lines.forEach((l, i) => {
    const t = cues[i] ?? (0.35 + i * 1.1);
    s += l.hl
      ? `        tl.fromTo("#${p}-l${i}",{opacity:0,y:56,scale:1.1},{opacity:1,y:0,scale:1,duration:0.5,ease:"power4.out"},${t});\n`
      : `        tl.fromTo("#${p}-l${i}",{opacity:0,y:40},{opacity:1,y:0,duration:0.5,ease:"power3.out"},${t});\n`;
  });
  return wrap(id, p, f.dur, f.register, inner, style, s);
}

function kindList(f) {
  const r = reg(f.register), id = f.id, p = cssPrefix(id), marker = f.marker || "·";
  const items = f.items.map((t, i) =>
    `          <div class="${p}-it" id="${p}-i${i}" style="display:flex;align-items:baseline;gap:2.4cqw;font-size:10.5cqw;font-weight:700;line-height:1.05;letter-spacing:0.003em;color:${r.text};margin:1.3cqw 0;">${t}</div>`
  ).join("\n");
  const style = `        .${p}-wrap { position:absolute; inset:0; padding:9cqw 5.5cqw; display:flex; flex-direction:column; justify-content:center; }
        .${p}-kick { font-family:"Karla",sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:0.3em; font-size:2.5cqw; color:${r.kicker}; margin-bottom:3.5cqw; }
        .${p}-it::before { content:"${marker} "; font-family:"Karla",sans-serif; font-weight:700; font-size:5cqw; color:${r.hl}; }`;
  const inner = `        <div class="${p}-wrap">
          ${f.kicker ? `<div class="${p}-kick" id="${p}-kick">${esc(f.kicker)}</div>` : ""}
${items}
        </div>`;
  const cues = f.cues || f.items.map((_, i) => 0.35 + i * 1.05);
  let s = f.kicker ? `        tl.fromTo("#${p}-kick",{opacity:0,y:20},{opacity:1,y:0,duration:0.4,ease:"power2.out"},0.1);\n` : "";
  f.items.forEach((_, i) => {
    const t = cues[i] ?? (0.35 + i * 1.05);
    s += `        tl.fromTo("#${p}-i${i}",{opacity:0,x:-40},{opacity:1,x:0,duration:0.45,ease:"power3.out"},${t});\n`;
    if (i < f.items.length - 1) s += `        tl.to("#${p}-i${i}",{opacity:0.35,duration:0.4,ease:"power1.out"},${(cues[i + 1] ?? (t + 1)) - 0.1});\n`;
  });
  return wrap(id, p, f.dur, f.register, inner, style, s);
}

const parseNum = (v) => { const m = String(v).match(/-?\d+[.,]?\d*/); return m ? parseFloat(m[0].replace(",", ".")) : null; };
function kindCard(f) {
  const r = reg(f.register), id = f.id, p = cssPrefix(id), j = jsPrefix(id);
  const rows = f.rows.map((row, i) =>
    `            <div class="${p}-row${row.hero ? " hero" : ""}" id="${p}-r${i}">
              <span class="${p}-lab">${esc(row.label)}</span>
              <span class="${p}-val" id="${p}-v${i}">${esc(row.value0 || row.value)}</span>
            </div>`).join("\n");
  const style = `        .${p}-wrap { position:absolute; inset:0; padding:8cqw 5.5cqw; display:flex; flex-direction:column; justify-content:center; gap:4cqw; }
        .${p}-kick { font-family:"Karla",sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:0.3em; font-size:2.5cqw; color:${r.kicker}; }
        .${p}-head { font-size:8.4cqw; font-weight:700; line-height:1.0; letter-spacing:0.003em; color:${r.text}; }
        .${p}-head b { color:${C.rosa}; font-weight:700; font-style:italic; }
        .${p}-card { border:1px solid ${C.border}; border-top:3px solid ${C.rosa}; border-radius:2cqw; background:${C.inkAlt}; padding:4.5cqw 5cqw; }
        .${p}-ct { font-family:"Karla",sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:0.26em; font-size:2.3cqw; color:${C.secondary}; margin-bottom:3.5cqw; }
        .${p}-row { display:flex; align-items:baseline; justify-content:space-between; padding:2.4cqw 0; border-top:1px solid ${C.border}; }
        .${p}-row:first-of-type { border-top:0; }
        .${p}-lab { font-family:"Karla",sans-serif; font-size:3.6cqw; font-weight:500; color:${C.secondary}; }
        .${p}-val { font-size:6.6cqw; font-weight:700; letter-spacing:0.003em; color:${r.text}; }
        .${p}-row.hero .${p}-lab { color:${C.cream}; font-weight:700; }
        .${p}-row.hero .${p}-val { font-size:9cqw; font-weight:700; color:${C.rosa}; }`;
  const inner = `        <div class="${p}-wrap">
          ${f.kicker ? `<div class="${p}-kick" id="${p}-kick">${esc(f.kicker)}</div>` : ""}
          ${f.head ? `<div class="${p}-head" id="${p}-head">${f.head}</div>` : ""}
          <div class="${p}-card" id="${p}-card">
            ${f.ctitle ? `<div class="${p}-ct">${esc(f.ctitle)}</div>` : ""}
${rows}
          </div>
        </div>`;
  const cues = f.cues || f.rows.map((_, i) => 0.6 + i * 1.4);
  let s = "";
  if (f.kicker) s += `        tl.fromTo("#${p}-kick",{opacity:0,y:18},{opacity:1,y:0,duration:0.4,ease:"power2.out"},0.1);\n`;
  if (f.head) s += `        tl.fromTo("#${p}-head",{opacity:0,y:30},{opacity:1,y:0,duration:0.5,ease:"power3.out"},0.25);\n`;
  s += `        tl.fromTo("#${p}-card",{opacity:0,y:40},{opacity:1,y:0,duration:0.5,ease:"power3.out"},0.4);\n`;
  s += `        const ${j}_fmt=(n)=>"R$ "+n.toFixed(2).replace(".",",");\n        const ${j}_v={};\n`;
  f.rows.forEach((row, i) => {
    const t = cues[i] ?? (0.6 + i * 1.4);
    s += `        tl.fromTo("#${p}-r${i}",{opacity:0,x:-24},{opacity:1,x:0,duration:0.4,ease:"power2.out"},${t});\n`;
    const target = row.count === false ? null : parseNum(row.value);
    if (target != null && /R\$|\d,\d/.test(String(row.value)))
      s += `        ${j}_v.k${i}=0; tl.to(${j}_v,{k${i}:${target},duration:0.75,ease:"power2.out",onUpdate:()=>{const e=document.getElementById("${p}-v${i}"); if(e) e.textContent=${j}_fmt(${j}_v.k${i});}},${t + 0.1});\n`;
  });
  return wrap(id, p, f.dur, f.register, inner, style, s);
}

function kindStat(f) {
  const r = reg(f.register), id = f.id, p = cssPrefix(id), j = jsPrefix(id);
  const style = `        .${p}-wrap { position:absolute; inset:0; padding:10cqw 5.5cqw; display:flex; flex-direction:column; justify-content:center; }
        .${p}-kick { font-family:"Karla",sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:0.3em; font-size:2.5cqw; color:${r.kicker}; margin-bottom:6cqw; }
        .${p}-big { font-size:${f.bigSize || 42}cqw; font-weight:700; line-height:0.84; letter-spacing:0.003em; color:${C.rosa}; margin-bottom:4cqw; }
        .${p}-label { font-size:8.4cqw; font-weight:700; line-height:1.02; letter-spacing:0.003em; color:${r.text}; max-width:82cqw; }
        .${p}-chip { display:inline-block; align-self:flex-start; font-family:"Karla",sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; font-size:2.8cqw; color:${C.cream}; background:${C.rosa}; padding:1.4cqw 2.4cqw; border-radius:999px; margin-top:6cqw; }
        .${p}-attr { font-family:"Karla",sans-serif; font-weight:500; font-size:2.8cqw; color:${C.muted}; margin-top:4cqw; }`;
  const inner = `        <div class="${p}-wrap">
          ${f.kicker ? `<div class="${p}-kick" id="${p}-kick">${esc(f.kicker)}</div>` : ""}
          <div class="${p}-big" id="${p}-big">${esc(f.big0 || f.big)}</div>
          <div class="${p}-label" id="${p}-label">${f.label}</div>
          ${f.chip ? `<div class="${p}-chip" id="${p}-chip">${esc(f.chip)}</div>` : ""}
          ${f.attr ? `<div class="${p}-attr" id="${p}-attr">${esc(f.attr)}</div>` : ""}
        </div>`;
  let s = "";
  if (f.kicker) s += `        tl.fromTo("#${p}-kick",{opacity:0,y:18},{opacity:1,y:0,duration:0.4,ease:"power2.out"},0.1);\n`;
  s += `        tl.fromTo("#${p}-big",{opacity:0,scale:0.72},{opacity:1,scale:1,duration:0.55,ease:"back.out(1.6)"},0.35);\n`;
  if (f.countTo != null) {
    const suf = f.suffix || "";
    const fmt = f.fmt === "x"
      ? `(Math.abs(n-Math.round(n))<0.05?Math.round(n):n.toFixed(1))+"\\u00D7"`
      : f.fmt === "money" ? `"R$ "+Math.round(n)` : `Math.round(n)+${JSON.stringify(suf)}`;
    s += `        const ${j}_b=document.getElementById("${p}-big"); const ${j}_o={n:${f.countFrom ?? 0}};\n`;
    s += `        tl.to(${j}_o,{n:${f.countTo},duration:1.4,ease:"power2.out",onUpdate:()=>{const n=${j}_o.n; if(${j}_b) ${j}_b.textContent=${fmt};}},0.5);\n`;
  }
  s += `        tl.fromTo("#${p}-label",{opacity:0,y:22},{opacity:1,y:0,duration:0.45,ease:"power2.out"},1.5);\n`;
  if (f.chip) s += `        tl.fromTo("#${p}-chip",{opacity:0,scale:0.85},{opacity:1,scale:1,duration:0.4,ease:"back.out(2)"},2.3);\n`;
  if (f.attr) s += `        tl.fromTo("#${p}-attr",{opacity:0},{opacity:1,duration:0.5,ease:"power1.out"},2.8);\n`;
  return wrap(id, p, f.dur, f.register, inner, style, s);
}

function kindCta(f) {
  const id = f.id, p = cssPrefix(id), j = jsPrefix(id);
  const style = `        .${p}-wrap { position:absolute; inset:0; padding:9cqw 5.5cqw; display:flex; flex-direction:column; justify-content:center; gap:1cqw; }
        .${p}-l1 { font-size:14cqw; font-weight:700; line-height:0.94; letter-spacing:0.003em; color:${C.cream}; }
        .${p}-l2 { font-family:"Karla",sans-serif; font-size:6.4cqw; font-weight:700; letter-spacing:0.003em; color:${C.onRosaMuted}; margin-top:1.4cqw; }
        .${p}-brand { display:flex; align-items:center; gap:2cqw; margin-top:6cqw; }
        .${p}-badge { font-family:"Karla",sans-serif; font-weight:700; font-size:4cqw; letter-spacing:0.02em; background:${C.ink}; color:${C.cream}; padding:1cqw 2cqw; border-radius:0.8cqw; }
        .${p}-url { font-family:"Karla",sans-serif; font-weight:700; font-size:4.2cqw; color:${C.cream}; }
        .${p}-pill { margin-top:5cqw; align-self:flex-start; background:${C.cream}; color:${C.rosa}; border-radius:999px; padding:2.6cqw 4.8cqw; font-family:"Karla",sans-serif; font-size:4.6cqw; font-weight:700; letter-spacing:0.01em; transform-origin:left center; }
        .${p}-phone { font-family:"Karla",sans-serif; font-weight:700; font-size:4.4cqw; letter-spacing:0.02em; color:${C.cream}; margin-top:3cqw; }`;
  const inner = `        <div class="${p}-wrap">
          <div class="${p}-l1" id="${p}-l1">${f.l1 || "Vamos vestir a sua marca?"}</div>
          <div class="${p}-l2" id="${p}-l2">${esc(f.l2 || "Orçamento no mesmo dia.")}</div>
          <div class="${p}-brand" id="${p}-brand"><span class="${p}-badge">DM</span><span class="${p}-url">${esc(f.url || "diasdemoda.com")}</span></div>
          <div class="${p}-pill" id="${p}-pill">${esc(f.pill || "Pedir orçamento no WhatsApp")}</div>
          <div class="${p}-phone" id="${p}-phone">${esc(f.phone || "+55 64 9943-1610")}</div>
        </div>`;
  let s = `        tl.fromTo("#${p}-l1",{opacity:0,y:48},{opacity:1,y:0,duration:0.5,ease:"power3.out"},0.35);\n`;
  s += `        tl.fromTo("#${p}-l2",{opacity:0,y:30},{opacity:1,y:0,duration:0.45,ease:"power2.out"},1.1);\n`;
  s += `        tl.fromTo("#${p}-brand",{opacity:0,y:26},{opacity:1,y:0,duration:0.45,ease:"power2.out"},1.7);\n`;
  s += `        tl.fromTo("#${p}-pill",{opacity:0,y:24},{opacity:1,y:0,duration:0.45,ease:"back.out(1.6)"},2.3);\n`;
  s += `        tl.fromTo("#${p}-phone",{opacity:0,y:20},{opacity:1,y:0,duration:0.4,ease:"power2.out"},2.8);\n`;
  s += `        const ${j}_p=document.getElementById("${p}-pill");\n`;
  s += `        tl.to({},{duration:${Math.max(0.3, f.dur - 3.2)},onUpdate:function(){const t=tl.time(); const k=t>3.2?1+0.03*Math.sin((t-3.2)*7):1; if(${j}_p) gsap.set(${j}_p,{scale:k});}},3.2);\n`;
  return wrap(id, p, f.dur, "rosa", inner, style, s);
}
const KINDS = { stack: kindStack, list: kindList, card: kindCard, stat: kindStat, cta: kindCta };

// ---- emit ----
mkdirSync(join(outDir, "compositions", "frames"), { recursive: true });
mkdirSync(join(outDir, "assets", "fonts"), { recursive: true });
mkdirSync(join(outDir, "assets", "sfx"), { recursive: true });
for (const f of readdirSync(join(sharedDir, "assets/fonts"))) copyFileSync(join(sharedDir, "assets/fonts", f), join(outDir, "assets/fonts", f));
copyFileSync(join(sharedDir, "assets/gsap.min.js"), join(outDir, "assets/gsap.min.js"));
copyFileSync(join(sharedDir, "frame.md"), join(outDir, "frame.md"));
copyFileSync(join(sharedDir, "hyperframes.json"), join(outDir, "hyperframes.json"));
const nm = join(outDir, "node_modules");
if (!existsSync(nm)) { try { symlinkSync(join(sharedDir, "node_modules"), nm); } catch {} }

const SFXLIB = sfxLibArg || spec.sfxLib;
const usedSfx = new Set();
for (const f of spec.frames) for (const c of (f.sfx || [])) usedSfx.add(c.lib);
for (const name of usedSfx) copyFileSync(join(SFXLIB, name + ".mp3"), join(outDir, "assets/sfx", name + ".mp3"));

let storyboard = `---\nformat: ${CW}x${CH}\nduration: ${spec.totalHint || "24s"}\nmessage: ${JSON.stringify(spec.message)}\narc: ${spec.arc}\naudience: Empresas e equipes que precisam de uniforme (Rio Verde · GO e todo Goiás)\nmode: collaborative\nmusic: none\n---\n\n`;
const audioSfx = [];
let roteiro = `# ROTEIRO — ${spec.title}\n\n> Anúncio ${spec.slug} · vídeo com SÓ SFX (grave sua voz por cima).\n> Gatilho: **${spec.trigger}**. Tom: ${spec.tone}.\n\n| # | Janela | O que falar | Entrega | SFX |\n|---|---|---|---|---|\n`;
let acc = 0;
spec.frames.forEach((f, idx) => {
  const n = idx + 1;
  writeFileSync(join(outDir, "compositions/frames", `${f.id}.html`), KINDS[f.kind](f));
  storyboard += `## Frame ${n} — ${f.name}\n\n- scene: ${f.scene || f.name}\n- duration: ${f.dur}s\n- transition_in: ${f.transition_in || (n === 1 ? "cut" : "crossfade")}\n- status: animated\n- type: ${f.type || "beat"}\n- voiceover: ${JSON.stringify(f.vo || "")}\n- src: compositions/frames/${f.id}.html\n\n`;
  for (const c of (f.sfx || [])) audioSfx.push({ frame: n, file: `assets/sfx/${c.lib}.mp3`, offset_s: c.at, duration_s: c.dur, volume: c.vol });
  const start = acc; acc += f.dur;
  const sfxList = (f.sfx || []).map((c) => `${c.lib}@${c.at}s`).join(", ") || "—";
  roteiro += `| ${n} | ${start.toFixed(1)}–${acc.toFixed(1)}s | ${(f.vo || "").replace(/\|/g, "/")} | ${f.delivery || ""} | ${sfxList} |\n`;
});
writeFileSync(join(outDir, "STORYBOARD.md"), storyboard);
writeFileSync(join(outDir, "audio_meta_sfx.json"), JSON.stringify({ bgm: null, voices: [], sfx: audioSfx }, null, 2));
roteiro += `\n**Duração total ≈ ${acc.toFixed(1)}s.**\n\nDica: fale no ritmo da tabela; os SFX marcam os momentos-chave. O texto é base — mantenha o gancho no início e o CTA no fim.\n`;
writeFileSync(join(outDir, "ROTEIRO.md"), roteiro);
console.log(`✓ ${spec.slug}: ${spec.frames.length} frames, ${audioSfx.length} sfx, ${acc.toFixed(1)}s -> ${outDir}`);
