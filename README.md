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

## Deploy — Cloudflare Pages

O `site/dist/` é estático puro (caminhos relativos), servível em qualquer host. A produção usa
**Cloudflare Pages**. Passo a passo em [`site/DEPLOY.md`](site/DEPLOY.md).

Resumo (integração com Git, recomendada):

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Selecionar este repositório.
3. Configurar o build:
   - **Root directory:** `site`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Save and Deploy**. A cada `git push` na branch principal, o site reconstrói sozinho.
5. **Custom domains** → adicionar `diasdemoda.com` e `www.diasdemoda.com`.

## Créditos

- Modelo 3D: "Scissors (Low Poly)" por game_travel — CC-BY 4.0.
- Logos dos clientes: propriedade das respectivas empresas.
- Código sob licença MIT (ver [`LICENSE`](LICENSE)).
