import gsap from 'gsap';

/** Acordeão com <details> nativo, mas abrindo/fechando com altura animada e um item por vez. */
export function initAccordion() {
  const items = Array.from(document.querySelectorAll('[data-accordion] details'));
  if (items.length === 0) return;

  const bodyOf = (item) => item.querySelector('[data-accordion-body]');

  const close = (item) => {
    const body = bodyOf(item);
    if (!body) {
      item.open = false;
      return;
    }
    gsap.to(body, {
      height: 0,
      opacity: 0,
      duration: 0.32,
      ease: 'power2.inOut',
      onComplete: () => {
        item.open = false;
        gsap.set(body, { height: 'auto' });
      },
    });
  };

  const open = (item) => {
    const body = bodyOf(item);
    item.open = true;
    if (!body) return;
    gsap.fromTo(
      body,
      { height: 0, opacity: 0 },
      { height: 'auto', opacity: 1, duration: 0.45, ease: 'power2.out' },
    );
  };

  items.forEach((item) => {
    const summary = item.querySelector('summary');
    const body = bodyOf(item);
    if (body) body.style.overflow = 'hidden';

    summary?.addEventListener('click', (event) => {
      event.preventDefault();
      if (item.open) {
        close(item);
        return;
      }
      items.filter((other) => other !== item && other.open).forEach(close);
      open(item);
    });
  });
}
