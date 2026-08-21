# Dias de Moda Uniformes — Guia da Marca

Confecção de uniformes em Rio Verde · GO, comandada por **Alessandra Dias** (25 anos de costura). Envia para todo o Goiás.

**Contato:** WhatsApp +55 64 9943-1610 · Instagram [@diasdemoda.ale](https://www.instagram.com/diasdemoda.ale/)

## Fontes desta identidade
- Arquivo CorelDRAW do logo (uploads/document.cdss) — paleta extraída de docPalette.xml
- Mockup da camiseta com o logo: `brand/assets/logo-camiseta-mockup.png`
- Site: `Dias de Moda Uniformes.dc.html`

## Logo
⚠️ **Não temos o logo em arquivo isolado (SVG/PNG transparente)** — só o mockup na camiseta. Até recebermos o vetor, escrever a marca em texto: DIAS DE MODA (Cormorant Garamond 700, caixa alta) sobre UNIFORMES (Karla 700, 10px, letter-spacing 5px, rosa). Nunca redesenhar o cabide/pássaro do logo à mão.

## Cores (VISUAL FOUNDATIONS)
- Rosa principal #AE567C — ações, destaques, marca
- Rosa escuro #8C3F63 — hover, ênfase
- Rosa claro #E1ADB1 — detalhes, bordas, texto sobre fundo escuro
- Ameixa #2B1A22 — títulos e seções escuras (nunca preto puro)
- Branco quente #FBF6F4 — fundo padrão (nunca branco puro)
- Superfície rosa #F6E6EA — chips e fundos suaves
- Dourado #C9A24B — só em detalhes (parafuso da tesoura 3D)
- Máx. 2 cores de fundo por página: branco-quente + ameixa.

## Tipografia
- Display: Cormorant Garamond (títulos, números grandes, citações em itálico)
- Corpo: Karla (texto, botões, navegação)
- Rótulos de seção: Karla 700, 12-13px, caixa alta, letter-spacing 6px, rosa principal

## Motivos visuais
- Linha de costura pontilhada (dash 4-5px, animada) como divisor/sublinhado
- Botões-pílula (border-radius 999px); cards com radius 20px e sombra rosa suave
- Placeholders de foto: listras diagonais rosa (repeating-linear-gradient 45°)
- Animações: entrada suave de baixo (28px, cubic-bezier(.22,1,.36,1)), tesoura 3D decorativa, hover 3D leve em cards
- Formas: círculos com gradiente radial rosa como fundo de parallax

## Idioma e tom de voz (CONTENT FUNDAMENTALS)
- Português (Brasil), tratamento "você"; a marca fala em "nós"
- Profissional e caloroso, direto, sem gírias e sem emoji
- Frases curtas; benefícios concretos ("prazo combinado", "qualidade conferida uma a uma")
- CTA sempre para o WhatsApp: "Pedir orçamento no WhatsApp", "Falar com a Alessandra"
- Caixa alta apenas em rótulos curtos de seção (PRODUTOS, CLIENTES…)
- Exemplos reais: "Uniformes que vestem a sua marca com elegância." / "Envie sua logo e receba o orçamento no mesmo dia."

## Iconografia
- Sem biblioteca de ícones; usar tipografia, o glifo ✦ no letreiro rolante e formas simples
- Ícone do WhatsApp apenas no botão flutuante verde (#25D366)

## Índice
- `styles.css` → importa `tokens/colors.css` e `tokens/typography.css`
- `brand/assets/` — mockups do logo na camiseta
- `guidelines/` — cartões de especificação (cores, tipo, voz, logo)
- Site: `Dias de Moda Uniformes.dc.html` + `scissors-3d.js` (tesoura 3D)
