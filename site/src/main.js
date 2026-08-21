import './styles/main.css';
import { initSmoothScroll } from './modules/smooth-scroll.js';
import { initMotion } from './modules/motion.js';
import { initAccordion } from './modules/accordion.js';
import { initNav } from './modules/nav.js';
import { initQuoteForm } from './modules/quote-form.js';
import { initFabric } from './modules/fabric.js';
import { initMarquee } from './modules/marquee.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

/**
 * Three.js é o pedaço mais pesado do site: carrega em chunk separado, só quando
 * o herói entra em cena e o navegador tem WebGL.
 */
let scissors = null;

const loadScissors = () => {
  const host = document.querySelector('[data-scissors]');
  if (!host || !supportsWebGL()) return;

  const observer = new IntersectionObserver(
    async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const { initScissors } = await import('./modules/scissors.js');
      scissors = initScissors(host, { reducedMotion });
    },
    { rootMargin: '250px' },
  );

  observer.observe(host);
};

loadScissors();
initSmoothScroll({ reducedMotion });
initMotion({
  reducedMotion,
  onHeroProgress: (progress) => scissors?.setScrollProgress(progress),
});
initNav();
initAccordion();
initQuoteForm();
initFabric({ reducedMotion });
initMarquee({ reducedMotion });

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
