import gsap from 'gsap';

export function initNav() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const panel = document.querySelector('[data-menu-panel]');
  if (!toggle || !panel) return;

  const links = panel.querySelectorAll('a');
  let animation = null;

  const setState = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('menu-open', open);

    animation?.kill();

    if (open) {
      panel.hidden = false;
      animation = gsap
        .timeline()
        .fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
        .fromTo(links, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power3.out' }, 0.05);
      return;
    }

    animation = gsap.to(panel, {
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        panel.hidden = true;
      },
    });
  };

  toggle.addEventListener('click', () => {
    setState(toggle.getAttribute('aria-expanded') !== 'true');
  });

  links.forEach((link) => link.addEventListener('click', () => setState(false)));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setState(false);
  });
}
