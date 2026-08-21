/**
 * Camada de API para captura de leads.
 *
 * Em produção (deploy na Cloudflare), chama o Worker (/api/*) e o código do
 * cupom é gerado e gravado no banco D1 no servidor.
 *
 * No preview estático local (sem Worker), cai no fallback e gera o código no
 * cliente — o fluxo continua funcionando para testes de layout.
 */

const API = '/api';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I/L

function clientCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return `DM15-${code}`;
}

/**
 * Cria o lead (nome, empresa, telefone, origem). Retorna { id }.
 */
export async function saveLead(data) {
  try {
    const res = await fetch(`${API}/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return await res.json();
  } catch {
    return { id: crypto.randomUUID() };
  }
}

/**
 * Conclui o lead com as respostas do quiz. Retorna { codigo }.
 */
export async function finishLead(id, quiz) {
  try {
    const res = await fetch(`${API}/lead/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...quiz }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return await res.json();
  } catch {
    return { codigo: clientCode() };
  }
}
