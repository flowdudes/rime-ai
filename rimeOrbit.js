/* ==========================================================================
   Rime.orbit — the homepage player's three circles, also used by the vs
   badge. Ported from system/rime.js.

   Built against WHITE on an offscreen canvas, multiply-blended, then cut
   back to only the pixels the circles cover (destination-in). That is what
   lets it sit on paper, on a pink card or on ink without carrying a white
   box, and it is why the mixes stay bright instead of going muddy.

   Two circles orbit, the third is fixed at centre. The orbiters grow in
   from 6px and their orbit radius breathes on two sine terms.

     Rime.orbit(canvas, { R: 22, off: 11, speed: 0.3 })   // vs badge
     Rime.orbit(canvas)                                    // play button

   Returns a stop function.
   ========================================================================== */
window.Rime = window.Rime || {};

Rime.MULT = { yellow: '#ffcf61', pink: '#ff96ff', aqua: '#13bee9' };

Rime.orbit = function (canvas, o) {
  if (!canvas) return function () {};
  o = o || {};
  const colors = o.colors || [Rime.MULT.yellow, Rime.MULT.pink, Rime.MULT.aqua];
  const R = o.R || 32;
  const OFF = o.off || 16;
  const SPEED = o.speed || 0.55;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const g = canvas.getContext('2d');
  const off = document.createElement('canvas');
  const og = off.getContext('2d');
  const dpr = 2;

  let W = 0,
    H = 0,
    raf = 0,
    alive = true,
    visible = true;
  const t0 = performance.now();

  function size() {
    W = canvas.clientWidth || canvas.width / dpr;
    H = canvas.clientHeight || canvas.height / dpr;
    if (!W || !H) return;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    off.width = canvas.width;
    off.height = canvas.height;
  }

  const circle = (ctx, x, y, r) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  function paint(now) {
    if (!W || !H) return;
    const dt = reduced ? 1.2 : (now - t0) / 1000;
    const cx = W / 2,
      cy = H / 2;
    const k = Math.min(1, dt / 0.55);
    const grow = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const aL = SPEED * dt + Math.PI,
      aR = SPEED * dt;
    const rL = OFF * (1 + 0.14 * Math.sin(dt * 3.7) + 0.06 * Math.sin(dt * 6.3 + 1.2));
    const rR = OFF * (1 + 0.14 * Math.sin(dt * 4.4 + 2.1) + 0.06 * Math.sin(dt * 7.6));
    const pts = [
      [cx + rL * Math.cos(aL), cy + rL * Math.sin(aL), 6 + grow * (R - 6)],
      [cx + rR * Math.cos(aR), cy + rR * Math.sin(aR), 6 + grow * (R - 6)],
      [cx, cy, R],
    ];

    og.setTransform(dpr, 0, 0, dpr, 0, 0);
    og.globalCompositeOperation = 'source-over';
    og.fillStyle = '#fff';
    og.fillRect(0, 0, W, H);

    og.globalCompositeOperation = 'multiply';
    pts.forEach(([x, y, r], i) => {
      og.fillStyle = colors[i];
      circle(og, x, y, r);
    });

    // keep only what the circles cover, so there is no white plate
    og.globalCompositeOperation = 'destination-in';
    og.fillStyle = '#000';
    og.beginPath();
    pts.forEach(([x, y, r]) => {
      og.moveTo(x + r, y);
      og.arc(x, y, r, 0, Math.PI * 2);
    });
    og.fill();

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(off, 0, 0);
  }

  function frame(now) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    paint(now);
  }

  const onResize = () => {
    size();
    paint(performance.now());
  };
  addEventListener('resize', onResize);

  const io = new IntersectionObserver((es) => {
    visible = es[0]
      .isIntersecting;
  }, { rootMargin: '80px' });
  io.observe(canvas);

  size();

  if (reduced) {
    paint(performance.now());
  } else {
    raf = requestAnimationFrame(frame);
  }

  return function stop() {
    alive = false;
    cancelAnimationFrame(raf);
    io.disconnect();
    removeEventListener('resize', onResize);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
  };
};

/* ---- vs badge ---- */
(() => {
  const c = document.querySelector('.vs-orbit');
  if (c) Rime.orbit(c, { R: 22, off: 11, speed: 0.3 });
})();

/* ---- compare page A/B player ----
   One shared audio element, one playing at a time. The orbit only runs
   while a sample plays: the button goes transparent and the circles show
   through it. The competitor's orbit is greyed rather than brand-coloured. */
(() => {
  const buttons = [...document.querySelectorAll('.player_button[data-src]')];
  if (!buttons.length) return;

  const audio = new Audio();
  audio.preload = 'none';
  const orbits = new WeakMap();
  let active = null;

  const isThem = (btn) => btn.classList.contains('them') || btn.classList.contains('is-them');

  function startOrbit(btn) {
    stopOrbit(btn);
    const wrap = btn.parentElement;
    const c = wrap && wrap.querySelector('.play-orbit');
    if (!c) return;
    const base = (wrap.style.getPropertyValue('--play-mult') || '').trim().toLowerCase();
    const all = [Rime.MULT.yellow, Rime.MULT.pink, Rime.MULT.aqua];
    const others = all.filter((m) => m !== base);
    // the centre circle takes the button's own colour, the two that orbit
    // are the other brand colours
    const colors = isThem(btn) ? ['#e8e1d4', '#f0e9dd', '#ddd6c9'] :
      base ? [others[0], others[1], base] : null;
    orbits.set(btn, Rime.orbit(c, colors ? { colors } : {}));
  }

  function stopOrbit(btn) {
    const stop = orbits.get(btn);
    if (stop) {
      stop();
      orbits.delete(btn);
    }
  }

  function stop() {
    if (!active) return;
    active.classList.remove('is-playing', 'playing', 'paused-icon');
    active.setAttribute('aria-pressed', 'false');
    stopOrbit(active);
    const cell = active.closest('.player-cell');
    if (cell) cell.classList.remove('is-active');
    active = null;
  }

  audio.addEventListener('ended', stop);
  audio.addEventListener('pause', () => { if (!audio.ended && active) stop(); });

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (active === btn) { audio.pause(); return; }
      stop();
      audio.src = btn.dataset.src;
      const p = audio.play();
      if (p && p.catch) p.catch(() => {});
      active = btn;
      btn.classList.add('is-playing', 'playing', 'paused-icon');
      btn.setAttribute('aria-pressed', 'true');
      startOrbit(btn);
      const cell = btn.closest('.player-cell');
      if (cell) cell.classList.add('is-active');
    });
  });

  document.addEventListener('visibilitychange', () => { if (document.hidden) audio.pause(); });
})();
