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

// mesma tabela do Worker — quanto mais peças, maior o desconto
const FAIXAS_DESCONTO = {
  'Até 10': 5,
  '11 a 30': 8,
  '31 a 100': 12,
  'Mais de 100': 15,
};

export const descontoPorFaixa = (q2) => FAIXAS_DESCONTO[q2] ?? 5;

function clientCode(desconto = 15) {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return `DM${desconto}-${code}`;
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
 * Conclui o lead com as respostas do quiz. Retorna { codigo, desconto }.
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
    const desconto = descontoPorFaixa(quiz.q2);
    return { codigo: clientCode(desconto), desconto };
  }
}
