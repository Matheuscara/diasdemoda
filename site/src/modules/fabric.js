const TRAIL_LIFETIME = 1500;
const TRAIL_MAX_POINTS = 80;
const DASH = [5, 6];

/**
 * Duas camadas sobre a malha do fundo:
 *  - `.knit-reveal` adensa a trama num círculo que segue o ponteiro;
 *  - o canvas desenha um tracejado de costura no rastro do cursor.
 * Ambas desligam sem ponteiro fino (toque) ou com movimento reduzido.
 */
export function initFabric({ reducedMotion = false } = {}) {
  if (reducedMotion || window.matchMedia('(hover: none)').matches) return () => {};

  const reveal = document.querySelector('[data-knit-reveal]');

  const canvas = document.createElement('canvas');
  canvas.className = 'stitch-trail';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let points = [];
  let frame = 0;
  let pending = null;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  resize();
  window.addEventListener('resize', resize);

  const draw = (now) => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    points = points.filter((point) => now - point.time < TRAIL_LIFETIME);

    if (points.length > 1) {
      ctx.lineCap = 'round';
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = '#AE567C';
      ctx.setLineDash(DASH);

      let travelled = 0;
      for (let i = 1; i < points.length; i += 1) {
        const from = points[i - 1];
        const to = points[i];
        const age = (now - to.time) / TRAIL_LIFETIME;

        ctx.globalAlpha = (1 - age) ** 1.2 * 0.85;
        // ancora o tracejado na distância percorrida: os pontos ficam presos
        // ao caminho em vez de escorregar junto com o cursor
        ctx.lineDashOffset = -travelled;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        travelled += Math.hypot(to.x - from.x, to.y - from.y);
      }

      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    frame = points.length > 0 ? requestAnimationFrame(draw) : 0;
  };

  const onPointerMove = (event) => {
    if (event.pointerType === 'touch') return;
    pending = { x: event.clientX, y: event.clientY };

    points.push({ x: event.clientX, y: event.clientY, time: performance.now() });
    if (points.length > TRAIL_MAX_POINTS) points.shift();
    if (frame === 0) frame = requestAnimationFrame(draw);
  };

  // a posição do círculo vai para o CSS uma vez por quadro, não a cada evento
  let revealFrame = 0;
  const flushReveal = () => {
    revealFrame = 0;
    if (!reveal || !pending) return;
    reveal.style.setProperty('--mx', `${pending.x}px`);
    reveal.style.setProperty('--my', `${pending.y}px`);
  };

  const onMoveThrottled = (event) => {
    onPointerMove(event);
    if (revealFrame === 0) revealFrame = requestAnimationFrame(flushReveal);
  };

  window.addEventListener('pointermove', onMoveThrottled, { passive: true });

  const onLeave = () => {
    points = [];
  };
  document.addEventListener('pointerleave', onLeave);

  return () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(revealFrame);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMoveThrottled);
    document.removeEventListener('pointerleave', onLeave);
    canvas.remove();
  };
}
