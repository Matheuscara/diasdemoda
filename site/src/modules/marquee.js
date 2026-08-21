const SPEED = 55; // px por segundo — velocidade constante, independente da tela

/**
 * O truque de translateX(-50%) com duas cópias só emenda se o conteúdo cobrir
 * o dobro da largura da tela. Em telas largas duas cópias não bastam e sobra
 * um vazio. Aqui clonamos a cópia-fonte até cobrir 2× o container e deslocamos
 * exatamente a largura de UMA cópia — emenda perfeita em qualquer largura.
 */
export function initMarquee({ reducedMotion = false } = {}) {
  const tracks = document.querySelectorAll('[data-marquee]');
  if (tracks.length === 0) return;

  const build = () => {
    tracks.forEach((track) => {
      const source = track.querySelector('[data-marquee-item]');
      if (!source) return;

      track.querySelectorAll('[data-marquee-clone]').forEach((clone) => clone.remove());
      track.style.removeProperty('animation');

      const unit = source.getBoundingClientRect().width;
      if (unit === 0) return;

      const container = track.parentElement.getBoundingClientRect().width;
      // cópias necessárias para cobrir 2× o container, no mínimo 2 (emenda)
      const copies = Math.max(2, Math.ceil((container * 2) / unit));

      for (let i = 1; i < copies; i += 1) {
        const clone = source.cloneNode(true);
        clone.setAttribute('data-marquee-clone', '');
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      }

      if (reducedMotion) return;

      track.style.setProperty('--marquee-shift', `${unit}px`);
      track.style.animation = `marquee ${unit / SPEED}s linear infinite`;
    });
  };

  // a largura muda quando a fonte troca: medir antes emendaria errado
  if (document.fonts?.status === 'loaded') build();
  else document.fonts?.ready.then(build);

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(build, 200);
  });
}
