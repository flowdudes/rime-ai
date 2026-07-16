(function initRimeGlobe() {
  if (window.__rimeGlobeInit) return;
  window.__rimeGlobeInit = true;

  const run = () => {
    const wrap = document.getElementById('globe-wrap');
    const canvas = document.getElementById('globe-canvas');
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cssVar = (name, fallback = '') => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    };

    const getColor = name => {
      if (name === 'yellow') return cssVar('--dot-yellow', cssVar(
        '--base-color-brand--yellow', '#FFD46F'));
      if (name === 'pink') return cssVar('--dot-pink', cssVar(
        '--base-color-brand--pink-light', '#FFA0FF'));
      if (name === 'blue') return cssVar('--dot-blue', cssVar('--base-color-brand--aqua',
        '#2CC3E9'));
      return '#2CC3E9';
    };

    canvas.style.touchAction = 'pan-y';
    canvas.style.cursor = 'grab';

    const params = {
      points: 8000,
      dotSize: 5.5,
      radius: 0.48,
      spin: 0.02,
      tilt: 0,
      blend: 'source-over',
    };

    window.RIME_GLOBE = params;

    const LAND = [
      { lat: 50, lon: -100, latR: 22, lonR: 28 },
      { lat: 30, lon: -95, latR: 14, lonR: 20 },
      { lat: 12, lon: -84, latR: 10, lonR: 9 },
      { lat: -8, lon: -60, latR: 16, lonR: 13 },
      { lat: -30, lon: -66, latR: 15, lonR: 9 },
      { lat: 72, lon: -42, latR: 9, lonR: 16 },
      { lat: 8, lon: 20, latR: 22, lonR: 18 },
      { lat: -18, lon: 25, latR: 16, lonR: 14 },
      { lat: 52, lon: 18, latR: 12, lonR: 28 },
      { lat: 55, lon: 95, latR: 22, lonR: 50 },
      { lat: 27, lon: 80, latR: 14, lonR: 20 },
      { lat: 10, lon: 106, latR: 12, lonR: 14 },
      { lat: -25, lon: 134, latR: 11, lonR: 18 },
    ];

    const DEG = 180 / Math.PI;

    function landIndex(x, y, z) {
      const lat = Math.asin(Math.max(-1, Math.min(1, y))) * DEG;
      const lon = Math.atan2(z, x) * DEG;

      let best = Infinity;

      LAND.forEach(b => {
        let dlon = lon - b.lon;
        while (dlon > 180) dlon -= 360;
        while (dlon < -180) dlon += 360;

        const dlat = lat - b.lat;
        const e = (dlat / b.latR) ** 2 + (dlon / b.lonR) ** 2;
        if (e < best) best = e;
      });

      return best < 0.85 ? 2 : best < 1.3 ? 1 : 0;
    }

    let pts = [];
    let langAnchors = null;

    function buildPoints() {
      const n = Math.max(50, Math.round(params.points));
      const gr = Math.PI * (3 - Math.sqrt(5));

      pts = Array.from({ length: n }, (_, i) => {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const th = gr * i;
        const x = Math.cos(th) * r;
        const z = Math.sin(th) * r;

        return { x, y, z, ci: landIndex(x, y, z) };
      });

      langAnchors = null;
    }

    buildPoints();
    params.rebuild = buildPoints;

    let Wc = 0;
    let Hc = 0;

    function resizeGlobe() {
      const dpr = Math.max(window.devicePixelRatio || 1, 2);

      Wc = canvas.clientWidth;
      Hc = canvas.clientHeight;

      canvas.width = Math.round(Wc * dpr);
      canvas.height = Math.round(Hc * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function fitDomeWidth() {
      wrap.style.setProperty('--globe-w', Math.ceil(wrap.clientHeight / params.radius + 8) +
        'px');
    }

    resizeGlobe();
    fitDomeWidth();

    window.addEventListener('resize', () => {
      resizeGlobe();
      fitDomeWidth();
    });

    if (window.ResizeObserver) {
      new ResizeObserver(resizeGlobe).observe(canvas);
      new ResizeObserver(fitDomeWidth).observe(wrap);
    }

    let rotY = -0.52;
    let rotX = params.tilt;
    let velY = 0;
    let velX = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let hoverX = -1e5;
    let hoverY = -1e5;
    let hovering = false;

    const clampPitch = () => {
      rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
    };

    const localXY = e => {
      const r = canvas.getBoundingClientRect();
      return {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
      };
    };

    canvas.addEventListener('pointerdown', e => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velY = 0;
      velX = 0;
      canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', e => {
      const p = localXY(e);
      hoverX = p.x;
      hoverY = p.y;
      hovering = true;

      if (!dragging) return;

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;

      lastX = e.clientX;
      lastY = e.clientY;

      velY = dx * 0.006;
      velX = dy * 0.006;

      rotY += velY;
      rotX += velX;

      clampPitch();
    });

    canvas.addEventListener('pointerleave', () => {
      hovering = false;
    });

    const endDrag = () => {
      dragging = false;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    let cX = 1;
    let sX = 0;
    let cY = 1;
    let sY = 0;
    let Rr = 0;
    let ox = 0;
    let oy = 0;
    let dotK = 1;

    function project(p) {
      const x = p.x * cY + p.z * sY;
      const z = -p.x * sY + p.z * cY;
      const y2 = p.y * cX - z * sX;
      const z2 = p.y * sX + z * cX;

      return {
        sx: ox + x * Rr,
        sy: oy - y2 * Rr,
        z: z2,
      };
    }

    const LANGS = [
      { f: '🇬🇧', lat: 54, lon: -2 },
      { f: '🇨🇳', lat: 35, lon: 105 },
      { f: '🇮🇳', lat: 22, lon: 79 },
      { f: '🇪🇸', lat: 40, lon: -4 },
      { f: '🇫🇷', lat: 47, lon: 2 },
      { f: '🇸🇦', lat: 24, lon: 45 },
      { f: '🇧🇩', lat: 24, lon: 90 },
      { f: '🇵🇹', lat: 39, lon: -8 },
      { f: '🇷🇺', lat: 58, lon: 60 },
      { f: '🇯🇵', lat: 36, lon: 138 },
      { f: '🇩🇪', lat: 51, lon: 10 },
      { f: '🇰🇷', lat: 36, lon: 128 },
      { f: '🇮🇩', lat: -2, lon: 118 },
      { f: '🇹🇷', lat: 39, lon: 35 },
      { f: '🇺🇸', lat: 39, lon: -98 },
      { f: '🇧🇷', lat: -10, lon: -55 },
      { f: '🇲🇽', lat: 23, lon: -102 },
      { f: '🇳🇬', lat: 9, lon: 8 },
    ];

    const MAX_TIPS = 3;
    const TIP_IN = 280;
    const TIP_HOLD = 1500;
    const TIP_OUT = 320;
    const TIP_GAP = 260;

    const tips = [];

    for (let i = 0; i < MAX_TIPS; i++) {
      const el = document.createElement('div');
      el.className = 'globe-tip';
      wrap.appendChild(el);

      tips.push({
        el,
        anchor: 0,
        lang: '',
        born: 0,
        alive: false,
        spawnAt: null,
      });
    }

    function anchorForLang(L) {
      const la = L.lat / DEG;
      const lo = L.lon / DEG;
      const ty = Math.sin(la);
      const tr = Math.cos(la);
      const tx = Math.cos(lo) * tr;
      const tz = Math.sin(lo) * tr;

      let best = 0;
      let bd = -2;

      pts.forEach((p, i) => {
        const d = p.x * tx + p.y * ty + p.z * tz;
        if (d > bd) {
          bd = d;
          best = i;
        }
      });

      return best;
    }

    function pickVisibleLang() {
      if (!langAnchors) langAnchors = LANGS.map(anchorForLang);

      const used = new Set(tips.filter(t => t.alive).map(t => t.lang));
      const opts = [];

      LANGS.forEach((L, i) => {
        if (used.has(L.f)) return;

        if (project(pts[langAnchors[i]]).z > 0.35) {
          opts.push({
            flag: L.f,
            anchor: langAnchors[i],
          });
        }
      });

      return opts.length ? opts[(Math.random() * opts.length) | 0] : null;
    }

    function updateTips(ts, pal) {
      const total = TIP_IN + TIP_HOLD + TIP_OUT;

      tips.forEach((tp, i) => {
        if (tp.spawnAt == null) tp.spawnAt = ts + i * 800;

        if (!tp.alive) {
          if (ts < tp.spawnAt) return;

          const cand = pickVisibleLang();

          if (!cand) {
            tp.spawnAt = ts + 400;
            return;
          }

          tp.anchor = cand.anchor;
          tp.lang = cand.flag;
          tp.el.textContent = tp.lang;
          tp.el.style.background = pal[pts[tp.anchor].ci];
          tp.born = ts;
          tp.alive = true;
        }

        if (tp.anchor >= pts.length) {
          tp.alive = false;
          tp.spawnAt = ts + TIP_GAP;
          tp.el.style.opacity = '0';
          return;
        }

        const e = ts - tp.born;
        const pr = project(pts[tp.anchor]);

        if (e >= total || (pr.z < 0.05 && e > TIP_IN)) {
          tp.alive = false;
          tp.spawnAt = ts + TIP_GAP;
          tp.el.style.opacity = '0';
          return;
        }

        let grow;

        if (e < TIP_IN) {
          const x = e / TIP_IN - 1;
          grow = 1 + 2.70158 * x * x * x + 1.70158 * x * x;
        } else if (e < TIP_IN + TIP_HOLD) {
          grow = 1;
        } else {
          grow = 1 - (e - TIP_IN - TIP_HOLD) / TIP_OUT;
        }

        const zFade = Math.max(0, Math.min(1, pr.z / 0.35));

        tp.el.style.opacity = (zFade * Math.max(0, Math.min(1, grow * 4))).toFixed(3);
        tp.el.style.transform =
          `translate(${pr.sx.toFixed(1)}px, ${pr.sy.toFixed(1)}px) translate(-50%, -50%) scale(${Math.max(0.15, grow).toFixed(3)})`;
      });
    }

    let rev = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0;
    let revT0 = null;

    if (rev < 1 && window.IntersectionObserver) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && revT0 == null) {
            revT0 = performance.now();
            io.disconnect();
          }
        });
      }, { threshold: 0.2 });

      io.observe(wrap);
    }

    let last = null;

    function frame(ts) {
      if (last == null) last = ts;

      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;

      if (revT0 != null && rev < 1) {
        const x = Math.min(1, (ts - revT0) / 1200);
        rev = 1 - Math.pow(1 - x, 3);
      }

      if (!dragging) {
        rotY += velY;
        rotX += velX;

        velY *= 0.94;
        velX *= 0.94;

        rotY += params.spin * dt;

        clampPitch();
      }

      const comp = wrap.closest('.languages_component') || wrap;
      const cr = comp.getBoundingClientRect();
      const vh = window.innerHeight;

      const compCenter = cr.top + cr.height / 2;
      const viewCenter = vh / 2;

      const PAR_DEPTH = 260;
      const PAR_OVERSHOOT = 40;
      const PAR_SETTLE = 0.22;

      const progress = (viewCenter - compCenter) / (vh / 2 + cr.height / 2);

      let par;
      if (progress <= 0) {
        par = -progress * PAR_DEPTH;
      } else {
        const k = Math.min(1, progress / PAR_SETTLE);
        par = -PAR_OVERSHOOT * Math.sin(k * Math.PI);
      }

      const vy = rotY - (1 - rev) * 0.6;

      cX = Math.cos(rotX);
      sX = Math.sin(rotX);
      cY = Math.cos(vy);
      sY = Math.sin(vy);

      ox = Wc * 0.5;
      oy = Hc * 0.5 + par;

      Rr = Math.min(Wc * params.radius, Hc * 0.5 * 0.99) * (0.08 + 0.92 * rev);
      dotK = Math.min(1, Math.min(Wc * params.radius, Hc * 0.5 * 0.99) / 380);

      const proj = pts.map(p => {
        const pr = project(p);
        pr.ci = p.ci;
        return pr;
      });

      proj.sort((a, b) => a.z - b.z);

      const pal = [
        getColor('blue'),
        getColor('pink'),
        getColor('yellow'),
      ];

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, Wc, Hc);
      ctx.globalCompositeOperation = params.blend;

      const HOVER_R = 70;

      proj.forEach(q => {
        const depth = (q.z + 1) / 2;

        let rad = params.dotSize * dotK * (0.45 + 0.75 * depth);

        if (hovering && q.z > 0) {
          const dd = Math.hypot(q.sx - hoverX, q.sy - hoverY);

          if (dd < HOVER_R) {
            const f = 1 - dd / HOVER_R;
            rad *= 1 + 1.1 * f * f;
          }
        }

        ctx.globalAlpha = 0.55 + 0.45 * depth;
        ctx.fillStyle = pal[q.ci];

        ctx.beginPath();
        ctx.arc(q.sx, q.sy, rad, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      updateTips(ts, pal);

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  };

  run()
})();
