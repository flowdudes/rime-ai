/* ==========================================================================
   Rime.orbit — three brand circles orbiting a point, multiply-blended.

   One helper, two users: the play button (large, faster) and the vs badge
   (small, slowed right down). R is each circle's radius, off is how far
   from centre they orbit, speed is radians per second.

     Rime.orbit(canvas, { R: 22, off: 11, speed: 0.3 })

   Returns { start, stop, destroy }. The instance pauses itself when it
   scrolls out of view or the tab hides.
   ========================================================================== */
window.Rime = window.Rime || {};

Rime.orbit = function (canvas, opts) {
  if (!canvas) return null;
  const o = Object.assign({
    R: 30,
    off: 15,
    speed: 0.9,
    colors: ['#FFD46F', '#FFA0FF', '#2CC3E9'],
    autoplay: true,
  }, opts || {});

  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dpr = 1,
    raf = 0,
    phase = 0,
    last = 0,
    visible = true,
    running = false;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    draw();
  }

  function draw() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (!w || !h) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2,
      cy = h / 2;
    // multiply is what makes the overlaps read as a single ink
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < o.colors.length; i++) {
      const a = phase + (i / o.colors.length) * Math.PI * 2;
      ctx.fillStyle = o.colors[i];
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * o.off, cy + Math.sin(a) * o.off, o.R, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function tick(now) {
    if (!running) { raf = 0; return; }
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    phase += o.speed * dt;
    draw();
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running || reduce || !visible || document.hidden) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  const io = new IntersectionObserver((en) => {
    visible = en[0].isIntersecting;
    if (visible && o.autoplay) start();
    else stop();
  }, { rootMargin: '80px' });
  io.observe(canvas);

  const onVis = () => {
    if (document.hidden) stop();
    else if (o.autoplay) start();
  };
  document.addEventListener('visibilitychange', onVis);
  addEventListener('resize', resize);

  resize();
  if (o.autoplay) start();
  else draw();

  return {
    start,
    stop,
    destroy() {
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      removeEventListener('resize', resize);
    },
  };
};

/* ---- vs badge ---- */
(() => {
  const c = document.querySelector('.vs-orbit');
  if (c) Rime.orbit(c, { R: 22, off: 11, speed: 0.3 });
})();

/* ---- A/B player ---- */
(() => {
  const wraps = [...document.querySelectorAll('.play-wrap[data-src]')];
  if (!wraps.length) return;

  const players = wraps.map((wrap) => {
    const button = wrap.querySelector('.player_button');
    const canvas = wrap.querySelector('.play-orbit');
    const audio = new Audio();
    audio.preload = 'none';
    audio.src = wrap.dataset.src;

    const orbit = canvas ? Rime.orbit(canvas, { R: 44, off: 22, speed: 0.9 }) : null;

    const p = { wrap, button, audio, orbit };

    p.setState = () => {
      const on = !audio.paused;
      button.classList.toggle('playing', on);
      button.classList.toggle('paused-icon', on);
      button.setAttribute('aria-pressed', String(on));
    };

    button.addEventListener('click', () => {
      // one at a time: pressing either stops the other
      players.forEach((o) => {
        if (o !== p) {
          o.audio.pause();
          o.setState();
        }
      });
      if (audio.paused) {
        const pr = audio.play();
        if (pr && pr.catch) pr.catch(() => {});
      } else {
        audio.pause();
      }
    });

    ['play', 'pause', 'ended'].forEach((ev) => audio.addEventListener(ev, p.setState));
    audio.addEventListener('ended', () => { audio.currentTime = 0; });

    p.setState();
    return p;
  });

  const stopAll = () => players.forEach((p) => {
    p.audio.pause();
    p.setState();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });

  const card = players[0].wrap.closest('.player-card') || players[0].wrap;
  new IntersectionObserver((en) => { if (!en[0].isIntersecting) stopAll(); }, { threshold: 0 })
    .observe(card);
})();
