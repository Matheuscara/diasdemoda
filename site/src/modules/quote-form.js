export const WHATSAPP_PHONE = '556499431610';

export function whatsappLink(message) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

/**
 * O site é estático: em vez de um backend, o formulário monta a mensagem
 * e abre a conversa no WhatsApp já preenchida.
 */
export function initQuoteForm() {
  const form = document.querySelector('[data-quote-form]');
  if (!form) return;

  const feedback = form.querySelector('[data-quote-feedback]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const value = (key) => String(data.get(key) ?? '').trim();

    const nome = value('nome');
    const empresa = value('empresa');
    const produto = value('produto');
    const quantidade = value('quantidade');
    const detalhes = value('detalhes');

    const lines = ['Olá, Alessandra! Vim pelo site e quero um orçamento de uniformes.', ''];
    if (nome) lines.push(`Nome: ${nome}`);
    if (empresa) lines.push(`Empresa: ${empresa}`);
    if (produto) lines.push(`Produto: ${produto}`);
    if (quantidade) lines.push(`Quantidade aproximada: ${quantidade} peças`);
    if (detalhes) lines.push(`Detalhes: ${detalhes}`);

    window.open(whatsappLink(lines.join('\n')), '_blank', 'noopener');

    if (feedback) {
      feedback.textContent = 'Abrimos o WhatsApp com o seu pedido pronto para enviar.';
      feedback.hidden = false;
    }
  });
}
