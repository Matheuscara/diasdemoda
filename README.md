# Dias de Moda Uniformes

Site institucional da **Dias de Moda Uniformes** — confecção de uniformes em Rio Verde · GO,
comandada por Alessandra Dias (25 anos de costura). Uma página, estática, com tesoura 3D
(Three.js), animações (GSAP + Lenis) e textura de malha interativa.

🔗 Produção: **https://diasdemoda.com**

## Estrutura do repositório

```
site/       aplicação web (Vite + Tailwind v4 + Three.js). É o que vai pro ar.
blender/    fonte do modelo 3D da tesoura (glTF) + licença CC-BY
Designer/   protótipo original (Claude Designer) e kit de marca, mantidos como referência
```

O código do site e o guia de manutenção estão em [`site/README.md`](site/README.md).

## Desenvolvimento

```bash
cd site
npm install
npm run dev      # http://127.0.0.1:5180
npm run build    # gera site/dist/
npm run preview
```

## Deploy — Cloudflare

O `site/dist/` é estático puro (caminhos relativos). A produção usa **Cloudflare Workers
(Static Assets)** — o diretório de saída fica em `site/wrangler.toml`. Passo a passo completo em
[`site/DEPLOY.md`](site/DEPLOY.md).

Resumo (import do Git, deploy automático):

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Import a repository** → escolher `diasdemoda`.
2. Na tela de setup:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - **Advanced → Path:** `site` (não deixe `/`)
3. **Deploy**. A cada `git push` na `main`, o site reconstrói sozinho.
4. No Worker → **Settings → Domains & Routes** → adicionar `diasdemoda.com` e `www.diasdemoda.com`.

## Créditos

- Modelo 3D: "Scissors (Low Poly)" por game_travel — CC-BY 4.0.
- Logos dos clientes: propriedade das respectivas empresas.
- Código sob licença MIT (ver [`LICENSE`](LICENSE)).
