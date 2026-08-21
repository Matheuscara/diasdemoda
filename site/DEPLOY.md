# Deploy — Cloudflare (Workers Static Assets) + diasdemoda.com

Site 100% estático. A Cloudflare hoje empurra o fluxo de **Workers** (Static Assets) ao
conectar um repositório — é o recomendado e o que usamos. O "diretório de saída" mora no
`site/wrangler.toml` (`[assets] directory = "./dist"`), **não** na tela de setup.

---

## Opção A — Import do Git (recomendada, deploy automático)

1. **Cloudflare Dashboard** → **Workers & Pages** → **Create** → **Import a repository** →
   autorizar o GitHub e escolher `diasdemoda`.
2. Na tela **Set up your application**:
   | Campo | Valor |
   | --- | --- |
   | Project name | `diasdemoda` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | **Advanced → Path** | **`site`** ← aponta para a subpasta do app (não deixe `/`) |

   Não existe campo "output directory" aqui: quem define é o `[assets] directory = "./dist"`
   do `site/wrangler.toml`.
3. **Deploy**. Sai um domínio `diasdemoda.<sua-conta>.workers.dev` para testar.
4. Cada `git push` na `main` reconstrói e publica sozinho.

> **API token:** o aviso sobre `email_routing_*` é irrelevante (é de roteamento de e-mail).
> O token só precisa de permissão de **Workers Scripts: Edit**. Se o deploy falhar por
> permissão, edite o token em **My Profile → API Tokens**.
>
> **Node:** a versão vem do `site/.nvmrc` (22). Se reclamar, defina `NODE_VERSION=22` nas
> variáveis do projeto.

### Alternativa: fluxo clássico de Pages

Se preferir a tela antiga com campos explícitos: **Create** → aba **Pages** → **Connect to Git**,
e use Root directory `site`, Build command `npm run build`, Build output directory `dist`.
(Nesse caso o `[assets]` do `wrangler.toml` é ignorado — quem manda são os campos da tela.)

## Opção B — Linha de comando (wrangler)

Deploy manual, sem CI:

```bash
cd site
npm run build
npx wrangler login      # abre o navegador para autenticar na sua conta Cloudflare
npx wrangler deploy     # lê o wrangler.toml e sobe o ./dist
```

---

## Domínio diasdemoda.com

Depois do primeiro deploy, no Worker `diasdemoda`:

1. **Settings** → **Domains & Routes** → **Add** → **Custom domain**.
2. Adicionar **`diasdemoda.com`** e **`www.diasdemoda.com`**.
3. Como o DNS já está na Cloudflare, os registros são criados automaticamente.

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
