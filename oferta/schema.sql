-- Banco D1: tabela de leads da campanha "Oferta 15%"
-- Rodar com: wrangler d1 execute diasdemoda-leads --file=./schema.sql

CREATE TABLE IF NOT EXISTS leads (
  id         TEXT PRIMARY KEY,
  nome       TEXT NOT NULL,
  empresa    TEXT,
  telefone   TEXT NOT NULL,
  origem     TEXT NOT NULL DEFAULT 'direto',  -- folheto | cartao | direto
  q1         TEXT,                            -- produto
  q2         TEXT,                            -- quantidade
  q3         TEXT,                            -- prazo
  q4         TEXT,                            -- arte da logo
  codigo     TEXT,                            -- cupom DM15-XXXXXX
  status     TEXT NOT NULL DEFAULT 'novo',    -- novo | contatado | recuperado
  criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_criado_em ON leads (criado_em DESC);
