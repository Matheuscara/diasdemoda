# Dias de Moda Uniformes — site

Site estático (uma página) da confecção de uniformes da Alessandra Dias, em Rio Verde · GO.

Recriado a partir do protótipo do Claude Designer (`../Designer/Web/Dias de Moda Uniformes.dc.html`),
que dependia de um runtime proprietário. Este projeto é HTML/CSS/JS padrão, sem amarração a
ferramenta nenhuma.

## Stack

| Ferramenta          | Versão | Papel                                                        |
| ------------------- | ------ | ------------------------------------------------------------ |
| Vite                | 8      | dev server e build                                           |
| Tailwind CSS        | 4      | utilitários + tokens da marca (`@theme` em `src/styles`)      |
| Three.js            | 0.185  | tesoura 3D com a animação de corte vinda do Blender           |
| GSAP + ScrollTrigger| 3.15   | revelações, parallax, contadores, costura que avança          |
| Lenis               | 1.3    | rolagem suave                                                |
| SplitType           | 0.3    | títulos revelados linha por linha                            |
| Fontsource          | 5      | Cormorant Garamond e Karla self-hosted (sem Google Fonts)    |

## Rodando

```bash
npm install
npm run dev      # http://127.0.0.1:5180
npm run build    # gera dist/
npm run preview  # serve o dist/
```

O `dist/` é estático puro e usa caminhos relativos (`base: './'`): funciona na raiz de um
domínio ou em qualquer subpasta (nginx, Dokploy, Netlify, GitHub Pages).

## Estrutura

```
index.html                     marcação completa (seções, SEO, JSON-LD)
src/main.js                    orquestra os módulos
src/styles/main.css            tokens da marca, componentes e utilitários
src/modules/scissors.js        cena Three.js + AnimationMixer do GLB
src/modules/motion.js          GSAP: reveals, parallax, contador, costura
src/modules/smooth-scroll.js   Lenis + integração com ScrollTrigger
src/modules/accordion.js       FAQ com altura animada, um item aberto por vez
src/modules/nav.js             menu mobile
src/modules/quote-form.js      formulário que monta a mensagem do WhatsApp
src/modules/fabric.js          malha do fundo + rastro tracejado do cursor
src/assets/models/scissors.glb modelo da tesoura (empacotado do glTF)
public/logos/                  logos dos clientes
public/brand/                  mockup da marca na camiseta
scripts/gltf-to-glb.mjs        empacota .gltf + .bin num único .glb
```

## Tesoura 3D

O modelo veio como `blender/scene.gltf` + `scene.bin`. Foi empacotado num único arquivo:

```bash
node scripts/gltf-to-glb.mjs ../blender/scene.gltf src/assets/models/scissors.glb
```

A animação de abrir/fechar (2,5 s, 41 keyframes nas duas lâminas) é a que já vinha no arquivo —
roda em loop e **acelera conforme a página rola**. O material branco original foi trocado por aço
polido nas lâminas e dourado no parafuso, seguindo o guia da marca.

O enquadramento é calculado pela **esfera envolvente** do modelo, não pela caixa: a esfera não
muda com a rotação, então a ponta da tesoura não é cortada em nenhum ângulo. A câmera se
reposiciona no `resize` pelo menor dos dois campos de visão (o horizontal é o limite em
containers estreitos).

O chunk do Three.js (≈156 KB gzip) carrega separado e só quando o herói entra na tela; se o
navegador não tiver WebGL, o site funciona sem ele.

Crédito obrigatório (CC-BY 4.0), já exibido no rodapé:
"Scissors (Low Poly)" por game_travel — https://sketchfab.com/3d-models/scissors-low-poly-0d7a67de409d4e21a49dd8ab06df5b27

## Malha e rastro de costura

O fundo do site é uma textura de malha (padrão SVG de laçadas, em `body`; a utilitária `knit`
repete a mesma trama nas seções que têm cor própria). Sobre ela, `src/modules/fabric.js` monta
duas camadas:

- `.knit-reveal` — adensa a trama num círculo de 190px que segue o ponteiro. É um `mask-image`
  radial posicionado por variáveis CSS (`--mx`/`--my`), atualizadas uma vez por quadro. Tem
  `z-index: -1` de propósito: fica acima do fundo do `body` e abaixo das seções coloridas, então
  o efeito só aparece nas áreas creme.
- Canvas do rastro — desenha um tracejado de costura no caminho do cursor, que apaga em 1,5 s. O
  `lineDashOffset` é ancorado na distância percorrida, senão os pontos escorregariam junto com o
  mouse em vez de ficarem presos ao traço.

Ambas desligam em toque (`hover: none`) e em `prefers-reduced-motion`. O `requestAnimationFrame`
para sozinho quando não há pontos vivos.

## Algarismos

A Cormorant Garamond usa algarismos *old-style* por padrão — o telefone, o "25" e os passos
"01/02/03" saíam desalinhados (o zero parecia um "O"). O `body` força
`font-variant-numeric: lining-nums`, que a fonte suporta.

## Manutenção

**Trocar/adicionar logo de cliente:** solte o arquivo em `public/logos/` e ajuste o bloco
correspondente na seção `#clientes` do `index.html`. As logos aparecem em tons de cinza e ganham
cor no hover — é o que mantém a paleta rosa da marca limpa com logos de cores variadas.

**Fotos dos produtos:** os cards usam ilustrações de costura em SVG, não fotos. Quando houver
fotos reais das peças, substitua o `<svg class="garment">` por `<img>` dentro do mesmo container.

**Depoimentos:** o texto atual veio do protótipo e não tem autoria verificada. Trocar por
depoimentos reais (há um `TODO` marcado no HTML).

**Contato:** WhatsApp `+55 64 9943-1610` e Instagram `@diasdemoda.ale` aparecem no menu, no herói,
na seção da Alessandra, no rodapé e no botão flutuante. Alterando o número, buscar por
`556499431610` no `index.html` e em `src/modules/quote-form.js`.

## Acessibilidade e performance

- `prefers-reduced-motion`: desliga Lenis, reveals e o giro do 3D; todo o conteúdo aparece direto.
- Navegação por teclado com `:focus-visible` visível, skip link e `aria-expanded` no menu.
- Fontes self-hosted (só os subsets latinos), imagens abaixo da dobra com `loading="lazy"`.
- JS inicial ≈56 KB gzip; o 3D vem depois, sob demanda.
