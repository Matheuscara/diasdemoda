# Deploy — Página de Vendas "Oferta 15%"

A campanha roda como um **Cloudflare Worker** (com Static Assets + D1) no mesmo
domínio `diasdemoda.com`, nas rotas:

| Rota | O que faz |
|---|---|
| `diasdemoda.com/oferta` | página de vendas (o QR aponta pra cá) |
| `diasdemoda.com/api/*` | grava e consulta leads |
| `diasdemoda.com/leads` | painel com senha (Basic Auth) |

O site atual (`site/`) **não é alterado** — as rotas específicas têm prioridade.

---

## Pré-requisitos

- Conta Cloudflare (a mesma do site)
- Node.js 20+ (para rodar `npm`/`npx` localmente, se preferir o CLI)

---

## Passo a passo (via Dashboard, sem CLI)

### 1. Criar o banco D1
1. Cloudflare Dashboard → **Workers & Pages** → **D1 SQL database** → **Create**.
2. Nome: `diasdemoda-leads`. Confirmar.
3. Copie o **Database ID** mostrado.
4. Cole esse id em [`wrangler.toml`](./wrangler.toml), no campo
   `database_id` (substitua `REPLACE_WITH_YOUR_D1_DATABASE_ID`).

> A tabela de leads é criada automaticamente na primeira requisição — não precisa
> rodar nenhum SQL à mão.

### 2. Importar o repositório (deploy)
1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Import a repository**.
2. Escolha o repositório `diasdemoda` (autorize se pedir).
3. Na tela de setup:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - **Advanced → Path:** `oferta` ⚠️ (não deixe `/` — o site principal usa `site`)
4. **Deploy.**

### 3. Definir a senha do painel
1. No Worker criado → **Settings** → **Variables and Secrets** → **Add** → **Secret**.
2. Nome: `ADMIN_PASSWORD` · Valor: a senha que você escolher.
3. Salvar. **Redeploy** para o segredo valer.

### 4. Ligar as rotas no domínio
1. No Worker → **Settings** → **Domains & Routes** → **Add → Route**.
2. Adicione (zona `diasdemoda.com`):
   - `diasdemoda.com/oferta*`
   - `diasdemoda.com/api/*`
   - `diasdemoda.com/leads*`

> Se o dashboard avisar de conflito com o Worker do site principal, tudo bem:
> rotas **mais específicas** vencem o domínio inteiro.

### 5. Testar
- `https://diasdemoda.com/oferta` → deve abrir o formulário.
- `https://diasdemoda.com/leads` → deve pedir usuário/senha (qualquer usuário + a senha).
- `https://diasdemoda.com/api/leads` → com a senha, lista os leads em JSON.

---

## Passo a passo (via CLI — alternativa)

```bash
cd oferta
npm install

# 1. criar o banco e pegar o id
npx wrangler d1 create diasdemoda-leads
#   → cole o "database_id" no wrangler.toml

# 2. senha do painel
npx wrangler secret put ADMIN_PASSWORD   # digite a senha e Enter

# 3. deploy
npm run build
npx wrangler deploy

# 4. rotas (se não estiverem no wrangler.toml)
#    adicione pelo Dashboard (passo 4 acima)
```

---

## Como a captura funciona

1. O visitante lê o QR → cai em `/oferta`.
2. Preenche nome/empresa/telefone → `POST /api/lead` cria o lead.
3. Responde o quiz → `POST /api/lead/quiz` grava as respostas e gera o cupom.
4. O cupom aparece na tela + botão WhatsApp com a mensagem pronta.

Os leads ficam no D1 e aparecem em `/leads`, com **busca**, **status**
(novo/contatado/recuperado) e **exportação CSV**.

## Segurança

- `/leads` e `/api/leads` usam **HTTP Basic Auth**; a senha fica como **secret**
  (não vai para o repositório).
- Use uma senha forte (letras + números); dá para trocar a qualquer momento pelo
  Dashboard sem mexer no código.
