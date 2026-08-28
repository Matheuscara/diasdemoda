/**
 * Worker da campanha "Oferta 15%" — Dias de Moda Uniformes.
 *
 * Rotas (todas no mesmo domínio diasdemoda.com):
 *   POST /api/lead          -> cria o lead (nome, empresa, telefone, origem)
 *   POST /api/lead/quiz     -> grava respostas do quiz e gera o cupom
 *   GET  /api/leads         -> lista leads (Basic Auth)
 *   GET  /api/leads?format=csv -> exporta CSV (Basic Auth)
 *   PATCH /api/leads/:id    -> atualiza o status do lead (Basic Auth)
 *   DELETE /api/leads/:id   -> remove um lead (Basic Auth)
 *   /leads                  -> painel (Basic Auth)
 *   /oferta                 -> página de vendas (assets estáticos)
 */

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I/L

function randomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return `DM15-${code}`;
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

// cria a tabela na primeira execução (idempotente — evita rodar schema.sql manualmente)
let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady) return;
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS leads (
      id         TEXT PRIMARY KEY,
      nome       TEXT NOT NULL,
      empresa    TEXT,
      telefone   TEXT NOT NULL,
      origem     TEXT NOT NULL DEFAULT 'direto',
      q1         TEXT,
      q2         TEXT,
      q3         TEXT,
      q4         TEXT,
      codigo     TEXT,
      status     TEXT NOT NULL DEFAULT 'novo',
      criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_leads_criado_em ON leads (criado_em DESC)').run();
  schemaReady = true;
}

function isAuthorized(request, env) {
  const expected = env.ADMIN_PASSWORD;
  if (!expected) return false;
  const header = request.headers.get('Authorization') || '';
  const space = header.indexOf(' ');
  if (space === -1) return false;
  const scheme = header.slice(0, space);
  if (scheme !== 'Basic') return false;
  let decoded = '';
  try {
    decoded = atob(header.slice(space + 1));
  } catch {
    return false;
  }
  const pass = decoded.slice(decoded.indexOf(':') + 1);
  return pass === expected;
}

const unauthorized = () =>
  new Response('Acesso negado', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Leads Dias de Moda", charset="UTF-8"' },
  });

// serve um asset do diretório dist/ reescrevendo o caminho
function serveAsset(env, request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = '';
  return env.ASSETS.fetch(new Request(url.toString(), request));
}

/* ---------------- handlers ---------------- */

async function createLead(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const nome = String(body.nome || '').trim();
  const telefone = String(body.telefone || '').trim();
  const empresa = String(body.empresa || '').trim();
  const origem = ['folheto', 'cartao', 'direto'].includes(body.origem) ? body.origem : 'direto';

  if (!nome || telefone.replace(/\D/g, '').length < 10) {
    return json({ error: 'Nome e telefone são obrigatórios' }, 400);
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO leads (id, nome, empresa, telefone, origem, status, criado_em)
     VALUES (?, ?, ?, ?, ?, 'novo', datetime('now'))`,
  )
    .bind(id, nome, empresa, telefone, origem)
    .run();

  return json({ id });
}

async function completeLead(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const id = String(body.id || '');
  if (!id) return json({ error: 'id ausente' }, 400);

  const row = await env.DB.prepare('SELECT id, codigo FROM leads WHERE id = ?').bind(id).first();
  if (!row) return json({ error: 'Lead não encontrado' }, 404);

  const codigo = row.codigo || randomCode();

  await env.DB.prepare(
    `UPDATE leads SET q1 = ?, q2 = ?, q3 = ?, q4 = ?, codigo = ? WHERE id = ?`,
  )
    .bind(
      body.q1 ? String(body.q1) : null,
      body.q2 ? String(body.q2) : null,
      body.q3 ? String(body.q3) : null,
      body.q4 ? String(body.q4) : null,
      codigo,
      id,
    )
    .run();

  return json({ codigo });
}

async function listLeads(env, url) {
  const { results } = await env.DB.prepare('SELECT * FROM leads ORDER BY criado_em DESC').all();

  if (url.searchParams.get('format') === 'csv') {
    const cols = ['id', 'nome', 'empresa', 'telefone', 'origem', 'q1', 'q2', 'q3', 'q4', 'codigo', 'status', 'criado_em'];
    const escapeCsv = (v) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [cols.join(',')];
    for (const r of results) lines.push(cols.map((c) => escapeCsv(r[c])).join(','));
    // BOM para o Excel abrir com acentos corretos
    const csv = '\uFEFF' + lines.join('\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="leads-diasdemoda.csv"',
      },
    });
  }

  return json(results);
}

async function updateStatus(request, env, id) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }
  const status = ['novo', 'contatado', 'recuperado'].includes(body.status) ? body.status : null;
  if (!status) return json({ error: 'Status inválido' }, 400);

  const info = await env.DB.prepare('UPDATE leads SET status = ? WHERE id = ?').bind(status, id).run();
  if (!info.meta.changes) return json({ error: 'Lead não encontrado' }, 404);
  return json({ ok: true });
}

async function deleteLead(env, id) {
  const info = await env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(id).run();
  if (!info.meta.changes) return json({ error: 'Lead não encontrado' }, 404);
  return json({ ok: true });
}

/* ---------------- roteamento ---------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/api/') || path === '/leads' || path === '/leads/') {
      await ensureSchema(env);
    }

    // API
    if (path === '/api/lead' && request.method === 'POST') return createLead(request, env);
    if (path === '/api/lead/quiz' && request.method === 'POST') return completeLead(request, env);

    if (path === '/api/leads' && request.method === 'GET') {
      if (!isAuthorized(request, env)) return unauthorized();
      return listLeads(env, url);
    }

    if (path.startsWith('/api/leads/') && request.method === 'PATCH') {
      if (!isAuthorized(request, env)) return unauthorized();
      const id = path.slice('/api/leads/'.length);
      return updateStatus(request, env, id);
    }

    if (path.startsWith('/api/leads/') && request.method === 'DELETE') {
      if (!isAuthorized(request, env)) return unauthorized();
      const id = path.slice('/api/leads/'.length);
      return deleteLead(env, id);
    }

    // Painel admin
    if (path === '/leads' || path === '/leads/') {
      if (!isAuthorized(request, env)) return unauthorized();
      return serveAsset(env, request, '/leads.html');
    }

    // Página de vendas (mantém barra final p/ os assets relativos resolverem)
    if (path === '/oferta') {
      return Response.redirect(url.origin + '/oferta/', 301);
    }
    if (path === '/oferta/') {
      return serveAsset(env, request, '/index.html');
    }
    if (path.startsWith('/oferta/')) {
      const assetPath = path.slice('/oferta'.length) || '/';
      return serveAsset(env, request, assetPath);
    }

    return new Response('Not found', { status: 404 });
  },
};
