import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

const EASE = 'power3.out';

/**
 * Divide o título em linhas mascaradas, revela cada uma e desfaz a divisão
 * ao terminar — assim o texto volta a refluir normalmente em qualquer resize.
 */
function revealHeadings() {
  document.querySelectorAll('[data-split]').forEach((element) => {
    const split = new SplitType(element, { types: 'lines', lineClass: 'split-line' });

    const inners = split.lines.map((line) => {
      const inner = document.createElement('span');
      inner.style.display = 'block';
      inner.style.willChange = 'transform';
      while (line.firstChild) inner.appendChild(line.firstChild);
      line.appendChild(inner);
      line.style.display = 'block';
      line.style.overflow = 'hidden';
      return inner;
    });

    gsap.from(inners, {
      yPercent: 120,
      duration: 1.1,
      ease: EASE,
      stagger: 0.08,
      scrollTrigger: { trigger: element, start: 'top 90%', once: true },
      onComplete: () => split.revert(),
    });
  });
}

/**
 * `clearProps` é obrigatório aqui: sem isso o GSAP deixa um transform inline
 * permanente que desalinha o elemento e sobrescreve o :hover do CSS.
 */
function revealBlocks() {
  document.querySelectorAll('[data-reveal]').forEach((element) => {
    gsap.fromTo(
      element,
      { opacity: 0, y: 26 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: EASE,
        delay: Number(element.dataset.revealDelay ?? 0),
        clearProps: 'all',
        scrollTrigger: { trigger: element, start: 'top 92%', once: true },
      },
    );
  });

  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    gsap.fromTo(
      group.children,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: EASE,
        stagger: 0.07,
        clearProps: 'all',
        scrollTrigger: { trigger: group, start: 'top 90%', once: true },
      },
    );
  });
}

function parallaxLayers() {
  document.querySelectorAll('[data-parallax]').forEach((layer) => {
    gsap.to(layer, {
      y: () => window.innerHeight * Number(layer.dataset.parallax),
      ease: 'none',
      scrollTrigger: {
        trigger: layer.closest('section, header') ?? layer,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  });
}

/** Costura que avança com o scroll, preservando o pontilhado. */
function drawStitches() {
  document.querySelectorAll('[data-stitch-fill]').forEach((fill) => {
    gsap.fromTo(
      fill,
      { width: '0%' },
      {
        width: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: fill.closest('section') ?? fill,
          start: 'top 72%',
          end: 'bottom 82%',
          scrub: 0.6,
        },
      },
    );
  });
}

function countUp() {
  document.querySelectorAll('[data-count]').forEach((element) => {
    const target = Number(element.dataset.count);
    const counter = { value: 0 };
    gsap.to(counter, {
      value: target,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: element, start: 'top 95%', once: true },
      onUpdate: () => {
        element.textContent = String(Math.round(counter.value));
      },
    });
  });
}

function stickyNav() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;

  ScrollTrigger.create({
    start: 'top -60',
    end: 99999,
    onToggle: (self) => nav.classList.toggle('is-scrolled', self.isActive),
  });
}

function heroProgress(onProgress) {
  const hero = document.querySelector('[data-hero]');
  if (!hero || typeof onProgress !== 'function') return;

  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => onProgress(self.progress),
  });
}

export async function initMotion({ reducedMotion = false, onHeroProgress } = {}) {
  if (reducedMotion) {
    stickyNav();
    return;
  }

  // as fontes mudam a quebra de linha e a altura da página: esperar antes de
  // medir evita que todo ScrollTrigger nasça com posição defasada
  await document.fonts.ready;

  revealHeadings();
  revealBlocks();
  parallaxLayers();
  drawStitches();
  countUp();
  stickyNav();
  heroProgress(onHeroProgress);

  ScrollTrigger.refresh();
}
