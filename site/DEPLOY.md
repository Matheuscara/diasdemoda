# Deploy — Cloudflare Pages + diasdemoda.com

Duas formas. A **integração com Git** é a recomendada: deploy automático a cada `push`, sem
token nenhum na sua máquina.

---

## Opção A — Integração com Git (recomendada)

1. **Cloudflare Dashboard** → **Workers & Pages** → **Create** → aba **Pages** →
   **Connect to Git** → autorizar o GitHub e escolher o repositório `diasdemoda`.
2. Na tela de build:
   | Campo | Valor |
   | --- | --- |
   | Production branch | `main` |
   | Framework preset | `None` (ou `Vite`) |
   | Root directory | `site` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
3. **Save and Deploy**. Sai um domínio `diasdemoda.pages.dev` para testar.
4. Cada `git push` na `main` reconstrói e publica sozinho.

> A versão do Node vem do `site/.nvmrc` (22). Se o build reclamar, defina a variável de
> ambiente `NODE_VERSION=22` nas configurações do projeto Pages.

## Opção B — Linha de comando (wrangler)

Deploy manual, sem CI:

```bash
cd site
npm run build
npx wrangler login            # abre o navegador para autenticar na sua conta Cloudflare
npx wrangler pages deploy dist --project-name diasdemoda
```

---

## Domínio diasdemoda.com

O `wrangler.toml` já define o projeto. Depois do primeiro deploy:

1. Projeto Pages → **Custom domains** → **Set up a custom domain**.
2. Adicionar **`diasdemoda.com`** e **`www.diasdemoda.com`**.
3. Se o DNS do domínio já está na Cloudflare, os registros são criados automaticamente.
   Se ainda não está: Cloudflare → **Add a site** → `diasdemoda.com`, e troque os
   nameservers no seu registrador (registro.br) pelos que a Cloudflare indicar.

### www → apex (evita conteúdo duplicado no Google)

Cloudflare → **Rules** → **Redirect Rules** → **Create**:
- **When:** Hostname equals `www.diasdemoda.com`
- **Then:** Dynamic redirect → `concat("https://diasdemoda.com", http.request.uri.path)` → **301**

O site canoniza tudo em `https://diasdemoda.com/` (tag `<link rel="canonical">`), então o
apex é a URL oficial.

---

## Indexação no Google

O site já sai com tudo pronto: `robots.txt`, `sitemap.xml`, canonical, Open Graph, Twitter
Card, JSON-LD (`ClothingStore`), favicons e manifest. Falta só avisar o Google:

1. **Google Search Console** (https://search.google.com/search-console) → adicionar propriedade
   **Domínio** `diasdemoda.com` → verificar com o registro TXT que ele indicar (adicionar no DNS
   da Cloudflare).
2. Em **Sitemaps**, enviar: `https://diasdemoda.com/sitemap.xml`.
3. **Inspeção de URL** → colar `https://diasdemoda.com/` → **Solicitar indexação**.
4. (Opcional) Criar o **Perfil da Empresa no Google** (Google Business Profile) para aparecer no
   Maps e nas buscas locais de "uniformes Rio Verde".

Prazo típico: de algumas horas a poucos dias para começar a aparecer.

## Ao mudar de domínio ou conteúdo

Se um dia trocar o domínio, atualizar as URLs absolutas em:
- `site/index.html` (canonical, `og:url`, `og:image`, `twitter:image`, JSON-LD)
- `site/public/robots.txt` (linha `Sitemap:`)
- `site/public/sitemap.xml` (`<loc>` e `<lastmod>`)
