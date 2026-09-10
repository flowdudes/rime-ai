/* ==========================================================================
   TTS Models — page script.

   Four pieces, each guarded so the file is safe on any page:
     1. the model cards' waveforms
     2. the player card's model + industry tabs
     3. the proof charts
     4. the integration stack's scroll-in

   Requires rime-dots.js (Rime.dots, Rime.level, Rime.enableLevels) and
   orbit.js (Rime.orbit) from the global bundle.
   ========================================================================== */

/* ---- shared data ---- */
const CDN = 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/';

const TTS_AUDIO = {
  telecom: {
    professional: CDN + '6a516e48b58470d3b4fa61f2_telecom_professional.mp3',
    calm: CDN + '6a516e47c18c080dc0e7e2e9_telecom_calm.mp3',
    happy: CDN + '6a516e473483ae19d23671be_telecom_happy.mp3',
    casual: CDN + '6a516e47fff0e1b87e4ac87c_telecom_casual.mp3',
  },
  healthcare: {
    professional: CDN + '6a516e48b1439fb7054c63ba_healthcare_professional.mp3',
    calm: CDN + '6a516e47de14ca822e8073c5_healthcare_calm.mp3',
    happy: CDN + '6a516e483e092c07bd31e288_healthcare_happy.mp3',
    casual: CDN + '6a516e47f30541d15642256a_healthcare_casual.mp3',
  },
  finance: {
    professional: CDN + '6a516e473e092c07bd31db95_finance_professional.mp3',
    calm: CDN + '6a516e47dbb99aa45272fbd2_finance_calm.mp3',
    happy: CDN + '6a516e48dcaccac9e2942831_finance_happy.mp3',
    casual: CDN + '6a516e479e61d11d3c477cac_finance_casual.mp3',
  },
  food: {
    professional: CDN + '6a516e46d12e733117a5ac33_food_professional.mp3',
    calm: CDN + '6a516e4691085d42f56add9a_food_calm.mp3',
    happy: CDN + '6a516e46de14ca822e807396_food_happy.mp3',
    casual: CDN + '6a516e471e75d6f91fb086c2_food_casual.mp3',
  },
};

const TONES = [
  ['Professional', 'Cupola', 'professional'],
  ['Calm', 'Eliphas', 'calm'],
  ['Happy', 'Astra', 'happy'],
  ['Casual', 'Vespera', 'casual'],
];

const PLAY_SVGS =
  '<svg viewBox="0 0 12 15" fill="currentColor" class="player_play"><path d="M4.09114 0.434546C2.33171 -0.71399 0 0.548454 0 2.6496V11.4093C0 13.5104 2.3317 14.7729 4.09114 13.6244L10.8007 9.24449C12.3998 8.20065 12.3998 5.85818 10.8007 4.81439L4.09114 0.434546Z"></path></svg>' +
  '<svg viewBox="0 0 14 16" fill="currentColor" class="player_pause"><rect x="2" y="1" width="3.4" height="14" rx="1.5"></rect><rect x="8.6" y="1" width="3.4" height="14" rx="1.5"></rect></svg>';

const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/* ==========================================================================
   1. Model card waveforms
   ========================================================================== */
(() => {
  const cards = [...document.querySelectorAll('.model-card')];
  if (!cards.length || !window.Rime || !Rime.dots) return;

  Rime.enableLevels();

  cards.forEach((card) => {
    const canvas = card.querySelector('.dots');
    if (!canvas) return;
    card._dots = Rime.dots(canvas, {
      mode: 'coverage',
      colors: (card.dataset.dots || '#ffd46f,#ffd46f').split(','),
      hover: card,
      count: 13,
      amplitude: 0.42,
      push: 3,
      ripple: 0.16,
      // the voice moves through the wave only while THIS card is playing
      level: () => {
        const b = card.querySelector('.player_button');
        return b && b.classList.contains('playing') ? Rime.level() : 0;
      },
    });
  });
})();

/* ==========================================================================
   2. Player card tabs

   Two rows: model, then industry. Both take the chosen model's colour, the
   same colour as its card at the top of the page. Hiding .model-seg leaves
   the card working on Coda alone.
   ========================================================================== */
(() => {
  const card = document.querySelector('#tts-player');
  if (!card) return;
  const row = card.querySelector('#pl-row');
  const controls = card.querySelector('.controls');
  if (!row || !controls) return;

  const NAMES = { coda: 'Coda', mist: 'Mist v3' };
  let model = 'coda';
  let ind = 'telecom';

  const colorOf = (m) => cssVar('--' + m, m === 'coda' ? '#8be89a' : '#f0be4d');

  const render = () => {
    const col = colorOf(model);
    controls.style.setProperty('--seg-on', col);
    row.innerHTML = TONES.map(([tone, voice, key], i) => `${i ? '<div class="vrule"></div>' : ''}
      <div class="player-cell is-tone">
        <span class="play-wrap" style="--play-base:${col};--play-mult:${col}">
          <canvas class="play-orbit" width="320" height="320" aria-hidden="true"></canvas>
          <button class="player_button" type="button" data-src="${TTS_AUDIO[ind][key]}"
            aria-label="Play ${tone}, ${voice}, ${NAMES[model]}">${PLAY_SVGS}</button>
        </span>
        <div class="tone" style="--tone:${col}">
          <div class="eyebrow">${tone}</div>
          <div class="tone_voice">${voice}</div>
        </div>
      </div>`).join('');
  };

  const swap = () => {
    if (Rime.stopAudio) Rime.stopAudio();
    const parts = card.querySelectorAll('.swap');
    parts.forEach((p) => p.classList.add('out'));
    setTimeout(() => {
      render();
      parts.forEach((p) => p.classList.remove('out'));
    }, 240);
  };

  card.querySelectorAll('.seg').forEach((seg) => {
    const ink = document.createElement('span');
    ink.className = 'seg_ink';
    seg.prepend(ink);

    const place = (animate = true) => {
      const a = seg.querySelector('.seg_btn.is-active');
      if (!a) return;
      if (!animate) ink.style.transition = 'none';
      ink.style.left = a.offsetLeft + 'px';
      ink.style.width = a.offsetWidth + 'px';
      if (!animate) requestAnimationFrame(() => { ink.style.transition = ''; });
    };

    place(false);
    new ResizeObserver(() => place(false)).observe(seg);
    if (document.fonts) document.fonts.ready.then(() => place(false));

    seg.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg_btn');
      if (!btn) return;
      seg.querySelectorAll('.seg_btn').forEach((b) => b.classList.toggle('is-active',
        b === btn));
      place();
      if (btn.dataset.model) model = btn.dataset.model;
      if (btn.dataset.ind) ind = btn.dataset.ind;
      swap();
    });
  });

  render();
})();

/* ==========================================================================
   3. Proof charts

   A chain of circles per contender, its length the share. Multiply blended,
   so overlaps read as one ink. They draw themselves once the section is
   well in view and its reveal has landed, so the drawing is seen rather
   than hidden under the fade.
   ========================================================================== */
(() => {
  const section = document.querySelector('#evidence');
  if (!section) return;
  const bars = [...section.querySelectorAll('.q-bar')];
  if (!bars.length) return;

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  const ctx2 = (cv) => {
    const dpr = 2,
      W = cv.clientWidth,
      H = cv.clientHeight;
    if (!W || !H) return null;
    if (cv.width !== W * dpr) {
      cv.width = W * dpr;
      cv.height = H * dpr;
    }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    return { g, W, H };
  };

  const drawChain = (cv, k) => {
    const c = ctx2(cv);
    if (!c) return;
    const { g, W, H } = c;
    const v = +cv.dataset.v,
      r = 9,
      step = 12.5;
    const n = Math.max(1, Math.round(v * ((W - 2 * r) / step)));
    const m = Math.round(n * k);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = cv.dataset.col || (cv.dataset.rime ? cssVar('--coda', '#8be89a') : '#ddd6c9');
    for (let i = 0; i < m; i++) {
      g.beginPath();
      g.arc(r + i * step, H / 2, r, 0, Math.PI * 2);
      g.fill();
    }
  };

  const animate = (fn, ms, delay = 0) => {
    const t0 = performance.now() + delay;
    const step = (now) => {
      const k = Math.min(1, Math.max(0, (now - t0) / ms));
      fn(ease(k));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  let shown = false;
  const redraw = () => bars.forEach((cv) => drawChain(cv, 1));

  const show = () => {
    shown = true;
    bars.forEach((cv, i) => animate((k) => drawChain(cv, k), 1000, i * 180));
  };

  new IntersectionObserver((es, io) => {
    if (!es.some((e) => e.intersectionRatio >= 0.5)) return;
    io.disconnect();
    setTimeout(show, 350);
  }, { threshold: [0.5] }).observe(section);

  new ResizeObserver(() => { if (shown) redraw(); }).observe(section);
})();

/* ==========================================================================
   4. Integration stack

   The four tiers come in one after another as you scroll, sliding up into
   the dark card and settling; scroll back and they leave the same way.
   Progress is the card's place in the viewport, eased per tier.
   ========================================================================== */
(() => {
  const stack = document.querySelector('#stack');
  if (!stack) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const tiers = [...stack.querySelectorAll('.tier')];
  if (!tiers.length) return;

  const settled = tiers.map(() => 0);
  let raf = 0;

  const frame = () => {
    const r = stack.getBoundingClientRect();
    const vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.8)));
    tiers.forEach((t, i) => {
      const n = tiers.length,
        w = 0.45;
      const k = Math.min(1, Math.max(0, (p - (i / n) * (1 - w)) / w));
      const e = 1 - Math.pow(1 - k, 3);
      settled[i] += (e - settled[i]) * 0.16;
      const v = settled[i];
      t.style.opacity = v.toFixed(3);
      t.style.transform = 'translateY(' + ((1 - v) * (96 + i * 36)).toFixed(1) +
        'px) scale(' + (0.96 + 0.04 * v).toFixed(4) + ')';
    });
    raf = requestAnimationFrame(frame);
  };

  new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(frame); }
    else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }), { rootMargin: '25% 0px 25% 0px' }).observe(stack);
})();

/* ==========================================================================
   5. Quotes marquee

   Two copies of the three cards, so the -50% loop is seamless. Replace this
   block with a Collection List once the Testimonials collection exists;
   the duplication still has to happen either way.
   ========================================================================== */
(() => {
  const track = document.querySelector('#quotes');
  if (!track) return;

  const cards = [...track.children];
  if (!cards.length) return;

  cards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
    track.appendChild(clone);
  });
})();
