# Marketing — Dias de Moda Uniformes

Sistema de marketing **guiado por specs** (mesmo padrão do 3D Control): você escreve um JSON
pequeno com o conteúdo, roda um script, e ele gera a arte da marca pronta — **posts/carrosséis**
de Instagram (PNG 1080×1350) e **anúncios em vídeo** (MP4 9:16 / 1:1 / 16:9 com SFX embutido).

A identidade (cores, fontes, motivos, tom de voz) já está embutida nos geradores. Você foca no
conteúdo; a arte sai consistente.

## Estrutura

```
marketing/
  specs/
    posts/<slug>.json     ← spec de post/carrossel de Instagram
    <slug>.json           ← spec de anúncio em vídeo
  tools/
    genpost.mjs           spec → HTML das telas (não chame direto; use buildpost.sh)
    buildpost.sh          gera + rasteriza o post pra PNG (Chromium)
    genad.mjs             spec → composição HyperFrames (não chame direto; use buildad.sh)
    buildad.sh            gera + renderiza o vídeo (HyperFrames + Docker)
  instagram/
    posts/<slug>/         saída dos posts: NN-*.html + NN-*.png + LEGENDA.md
    destaques/ logo/ diario/ bio.md legendas.md REGRAS-DESIGN.md   (conteúdo existente)
  videos/
    _base/                assets compartilhados dos vídeos (fontes, gsap, frame.md, hyperframes.json)
    <slug>/renders/       saída dos vídeos: <slug>-9x16.mp4, -1x1.mp4, -16x9.mp4 + ROTEIRO.md
  assets/
    fonts/                Cormorant Garamond + Karla (woff2 locais) + fonts.css
    sfx-clean/            biblioteca de efeitos sonoros
```

## Marca (já embutida)

- **Cores:** ameixa `#2B1A22`, rosa `#AE567C`, rosa-escuro `#8C3F63`, rosa-claro `#E1ADB1`,
  branco quente `#FBF6F4`, superfície `#F6E6EA`, dourado `#C9A24B`.
- **Fontes:** Cormorant Garamond (títulos, serifada) + Karla (corpo/rótulos).
- **Motivos:** linha costurada pontilhada, botões-pílula, cards arredondados, brilho radial rosa.
- **Tom:** pt-br, "você"/"nós", elegante e caloroso, **sem emoji**. CTA sempre pro WhatsApp
  `+55 64 9943-1610` · `diasdemoda.com`.
- Regras completas em [`instagram/REGRAS-DESIGN.md`](instagram/REGRAS-DESIGN.md).

---

## Posts / carrosséis (Instagram)

1. Crie `specs/posts/<slug>.json` (veja `post-quem-somos.json` de exemplo).
2. Rode:

```bash
tools/buildpost.sh post-quem-somos     # gera as telas + PNG + LEGENDA.md
tools/buildpost.sh                      # sem argumento: lista as specs
```

3. Saída em `instagram/posts/<slug>/`: `NN-*.png` (1080×1350) + `LEGENDA.md`.

### Formato da spec de post

```jsonc
{
  "slug": "post-exemplo",
  "startRegister": "light",           // "light" (claro) ou "dark" (escuro) — alterna sozinho a cada tela
  "legenda": "Texto da legenda...",   // vira LEGENDA.md
  "hashtags": ["#uniformes", "..."],
  "slides": [ /* uma entrada por tela; ver kinds abaixo */ ]
}
```

O fundo **alterna claro/escuro automaticamente** a cada tela (REGRAS-DESIGN §1). Para forçar,
use `"register": "light" | "dark" | "rosa"` na tela.

**Kinds de tela** (`kind`): campos comuns `kicker`, `id`.
- `cover` — capa: `title` (aceita `<em>`/`<br>`), `sub`, `size`.
- `point` — afirmação: `title`, `sub`, `ghost` (marca-d'água atrás), `size`.
- `big` — frase gigante: `big`, `sub`, `kicker`.
- `card` — tabela: `head`, `ctitle`, `rows:[{label,value,hero?}]`.
- `steps` — passos numerados: `head`, `steps:[{title,sub}]`.
- `compare` — 2 colunas: `head`, `left/right:{title,marker,items[]}`.
- `cta` — chamada final (sempre rosa): `title`, `sub`, `pill`, `phone`.

Em `title`/`head`/`big`/`sub` você pode usar HTML (`<em>itálico</em>`, `<br>`).

---

## Anúncios em vídeo

Requer **Docker** e o ambiente HyperFrames (`~/.hf_env` + skill `product-launch-video`).

1. Crie `specs/<slug>.json` (veja `ad-primeira-impressao.json` de exemplo).
2. Rode:

```bash
tools/buildad.sh ad-primeira-impressao            # 3 formatos: 9:16, 1:1, 16:9
tools/buildad.sh ad-primeira-impressao portrait   # só 9:16 (mais rápido, pra revisar)
tools/buildad.sh                                   # sem argumento: lista as specs
```

3. Saída em `videos/<slug>/renders/`: `<slug>-9x16.mp4`, `-1x1.mp4`, `-16x9.mp4` +
   `ROTEIRO.md` (a narração pra você gravar por cima — o vídeo sai só com SFX).

### Formato da spec de anúncio

```jsonc
{
  "slug": "ad-exemplo",
  "title": "...", "trigger": "...", "tone": "...",
  "message": "...", "arc": "Gancho → Dor → Marca → Prova → Virada → CTA",
  "frames": [ /* um frame por beat; register "dark" ou "rosa" */ ]
}
```

**Kinds de frame** (`kind`): comuns `id`, `dur` (segundos), `register`, `name`, `type`,
`vo` (narração), `delivery`, `transition_in`, `sfx:[{lib,at,dur,vol}]`.
- `stack` — linhas empilhadas: `lines:[{t,hl?,size?}]`, `kicker`.
- `list` — itens: `items[]`, `marker`, `kicker`.
- `card` — tabela (com contagem animada em valores `R$`): `head`, `ctitle`, `rows[]`.
- `stat` — número grande: `big`/`countTo`/`fmt`, `label`, `chip`.
- `cta` — chamada final: `l1`, `l2`, `pill`, `phone`, `url`.

SFX disponíveis: veja os nomes em `assets/sfx-clean/` (use o nome sem `.mp3` em `lib`).

---

## Diário (post do dia)

`instagram/diario/` tem um gerador do "post do dia" a partir de um banco de conteúdo
(`conteudo.js`), escolhido de forma determinística pela data:

```bash
node instagram/diario/generate.mjs      # gera saida/posto-YYYY-MM-DD.{html,png,md}
```
