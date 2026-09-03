import './styles/main.css';
import { saveLead, finishLead } from './api.js';

const WHATSAPP = '556499431610';

const state = {
  leadId: null,
  form: { nome: '', empresa: '', telefone: '', origem: 'direto' },
  quiz: { q1: '', q2: '', q3: '', q4: '' },
  codigo: '',
  desconto: 15,
};

const steps = Array.from(document.querySelectorAll('[data-step]'));
const TOTAL = steps.length;

// origem do lead via query string: /oferta?f=folheto ou ?f=cartao
const params = new URLSearchParams(window.location.search);
const origem = params.get('f');
if (origem === 'folheto' || origem === 'cartao') state.form.origem = origem;

/* ---------------- progresso ---------------- */

function updateProgress(index) {
  const label = document.querySelector('[data-progress-label]');
  const fill = document.querySelector('[data-progress-fill]');
  if (label) label.textContent = `Passo ${index + 1} de ${TOTAL}`;
  if (fill) fill.style.width = `${((index + 1) / TOTAL) * 100}%`;
}

function showStep(index) {
  steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
  updateProgress(index);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------------- utilidades ---------------- */

const onlyDigits = (value) => value.replace(/\D/g, '');

function maskPhone(input) {
  input.addEventListener('input', () => {
    const digits = onlyDigits(input.value).slice(0, 11);
    let formatted = '';
    if (digits.length === 0) {
      formatted = '';
    } else if (digits.length <= 2) {
      formatted = `(${digits}`;
    } else if (digits.length <= 6) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 10) {
      // fixo: (64) 9943-1610
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else {
      // celular: (64) 9 9431-1610
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    input.value = formatted;
  });
}

function showQuizError(form, message) {
  let error = form.querySelector('[data-quiz-error]');
  if (!error) {
    error = document.createElement('p');
    error.dataset.quizError = '';
    error.className = 'mt-2 text-center text-sm font-bold text-[#c0392b]';
    form.append(error);
  }
  error.textContent = message;
}

/* ---------------- passo 1: formulário ---------------- */

const formStep = document.querySelector('[data-step-form]');
const phoneInput = formStep.querySelector('input[name="telefone"]');
maskPhone(phoneInput);

formStep.addEventListener('submit', async (event) => {
  event.preventDefault();

  const nome = formStep.nome.value.trim();
  const telefone = formStep.telefone.value.trim();

  if (!nome) {
    formStep.nome.focus();
    return;
  }
  if (onlyDigits(telefone).length < 10) {
    formStep.telefone.focus();
    return;
  }

  state.form.nome = nome;
  state.form.empresa = formStep.empresa.value.trim();
  state.form.telefone = telefone;

  const button = formStep.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Um instante…';

  try {
    const { id } = await saveLead(state.form);
    state.leadId = id;
  } catch {
    // sem servidor ainda: seguimos com o fluxo mesmo assim
  }

  button.disabled = false;
  button.textContent = 'Começar agora →';
  showStep(1);
});

/* ---------------- quiz (partes 1 e 2) ---------------- */

document.querySelectorAll('[data-quiz-form]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fieldsets = Array.from(form.querySelectorAll('fieldset'));
    const answered = fieldsets.every((fieldset) => fieldset.querySelector('input[type="radio"]:checked'));

    if (!answered) {
      showQuizError(form, 'Selecione uma opção em cada pergunta para continuar.');
      return;
    }

    form.querySelectorAll('input[type="radio"]:checked').forEach((input) => {
      state.quiz[input.name] = input.value;
    });

    const currentIndex = steps.findIndex((step) => step.classList.contains('is-active'));

    if (currentIndex === 1) {
      // quiz parte 1 → texto de conexão
      showStep(2);
    } else if (currentIndex === 3) {
      // quiz parte 2 → cupom
      await finalize();
    }
  });
});

/* ---------------- passo 3: botão continuar ---------------- */

document.querySelector('[data-next]')?.addEventListener('click', () => showStep(3));

/* ---------------- escada de desconto (passo 2) ---------------- */

const tierSteps = Array.from(document.querySelectorAll('[data-tier-scale] .tier-step'));
document.querySelectorAll('input[name="q2"]').forEach((input) => {
  input.addEventListener('change', () => {
    tierSteps.forEach((step) => step.classList.toggle('is-active', step.dataset.band === input.value));
  });
});

/* ---------------- passo 5: cupom ---------------- */

async function finalize() {
  try {
    const { codigo, desconto } = await finishLead(state.leadId, state.quiz);
    state.codigo = codigo;
    if (Number.isFinite(desconto)) state.desconto = desconto;
  } catch {
    state.codigo = ''; // nunca deve ocorrer, mas evita tela quebrada
  }

  const codeEl = document.querySelector('[data-coupon-code]');
  if (codeEl) codeEl.textContent = state.codigo;

  document.querySelectorAll('[data-desconto]').forEach((el) => {
    el.textContent = String(state.desconto);
  });

  const message = `Olá Alessandra! Ganhei o cupom ${state.codigo} (${state.desconto}% OFF) e quero fazer meu primeiro pedido.`;
  const waLink = document.querySelector('[data-whatsapp-link]');
  if (waLink) waLink.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

  showStep(4);
}

const copyButton = document.querySelector('[data-copy-coupon]');
copyButton?.addEventListener('click', async () => {
  const code = state.codigo;
  let copied = false;
  try {
    await navigator.clipboard.writeText(code);
    copied = true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    copied = document.execCommand('copy');
    textarea.remove();
  }
  if (copied) {
    copyButton.textContent = 'Copiado!';
    setTimeout(() => (copyButton.textContent = 'Copiar'), 2000);
  }
});

/* ---------------- ano dinâmico ---------------- */

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

/* ---------------- estado inicial ---------------- */

updateProgress(0);
