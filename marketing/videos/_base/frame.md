---
version: alpha
name: Dias de Moda — Frame (camada de vídeo)
description: >
  Sistema de design da camada de vídeo (anúncios) da Dias de Moda Uniformes. A unidade é o frame.
  Átomos sagrados e idênticos aos posts: dois registros de superfície (ameixa escura / rosa cheio),
  títulos em Cormorant Garamond (serifada, elegante, com itálico como acento), chrome em Karla
  (caixa-alta, tracking largo), o único acento rosa, plano chapado e divisórias de 1px. Composição
  e escala reescritas para o frame. Motivos da marca: linha costurada pontilhada, pílulas e cantos
  arredondados. Sem emoji. Tom pt-br, "você"/"nós". CTA sempre pro WhatsApp.
unit: o frame — 1080×1920 (9:16) primário; 1:1 e 16:9 documentados
principle: átomos são sagrados · composição é livre · os números vêm do roteiro

colors:
  ameixa: "#2B1A22"
  ameixa-card: "#3A2530"
  ameixa-suave: "#5C4450"
  branco: "#FBF6F4"
  superficie: "#F6E6EA"
  rosa: "#AE567C"
  rosa-escuro: "#8C3F63"
  rosa-claro: "#E1ADB1"
  dourado: "#C9A24B"
  branco-sobre-rosa-muted: "rgba(255,255,255,0.85)"
  branco-sobre-rosa-faint: "rgba(255,255,255,0.62)"
  border: "rgba(251,246,244,0.16)"

typography:
  # — títulos / display (Cormorant Garamond, serifada) —
  display: { fontFamily: "Cormorant Garamond", weight: 700, lineHeight: 0.98 }
  accent:  { fontFamily: "Cormorant Garamond", weight: 500, style: italic }
  # — corpo e chrome (Karla) —
  body:    { fontFamily: "Karla", weight: 500, lineHeight: 1.4 }
  label:   { fontFamily: "Karla", weight: 700, tracking: "0.30em", upper: true }

registers:
  dark: { bg: ameixa (com brilho radial rosa), text: branco, kicker: rosa, accent: rosa }
  rosa: { bg: rosa, text: branco, kicker: branco-faint, accent: branco }

motifs:
  - linha costurada pontilhada (repeating-linear-gradient) como régua/divisória
  - botões-pílula (border-radius 999px) para CTA
  - cards com cantos arredondados (radius ~2cqw) e topo rosa de 3px
  - brilho radial rosa no fundo escuro

voice:
  - português (pt-br), "você"/"nós", profissional e caloroso
  - sem emoji
  - CTA sempre pro WhatsApp: +55 64 9943-1610 · diasdemoda.com
---

# Frame — Dias de Moda

Companion de vídeo do sistema dos posts. Os átomos (cor, tipografia, acento, motivos) são os mesmos;
muda só a escala e o fato de haver movimento (GSAP, timeline pausada, seek-safe).

Kinds disponíveis no gerador (`tools/genad.mjs`): `stack` (linhas empilhadas), `list` (itens),
`card` (tabela com contagem animada), `stat` (número grande) e `cta` (chamada final rosa).
