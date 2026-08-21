import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

export function initSmoothScroll({ reducedMotion = false } = {}) {
  const anchors = document.querySelectorAll('a[href^="#"]:not([href="#"])');

  if (reducedMotion) {
    return null;
  }

  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });

  // ScrollTrigger precisa recalcular a cada quadro virtual do Lenis
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  anchors.forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -78, duration: 1.2 });
    });
  });

  return lenis;
}
