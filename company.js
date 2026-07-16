(function initCompanyHero() {
  if (window.__companyHeroInit) return;
  window.__companyHeroInit = true;

  const canvas = document.getElementById('chero-canvas');
  const heroSection = document.querySelector('.section_company-hero');

  if (!canvas || !heroSection) {
    console.warn('Rime Company Hero: Canvas or section not found.');
    return;
  }

  const ctx = canvas.getContext('2d');

  const params = {
    grid: 4,
    dot: 0.345,
    lean: 0.72,
    reach: 0.2,
    ease: 0.115,
    drift: 0.115,
    driftSpeed: 0.75,
    revealDur: 0.9,
    revealStagger: 0.075,
    revealDelay: 0.15
  };

  const rootStyle = getComputedStyle(document.documentElement);
  const getCol = (val, fallback) => rootStyle.getPropertyValue(val).trim() || fallback;

  const pal = [
    getCol('--base-color-brand--yellow', '#FFD46F'),
    getCol('--base-color-brand--pink-light', '#FFA0FF'),
    getCol('--base-color-brand--aqua', '#2CC3E9')
  ];

  let W = 0,
    H = 0;

  function resize() {
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

  const n = params.grid;
  const mid = (n - 1) / 2;
  const cells = [];

  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      cells.push({ gx, gy, dist: Math.hypot(gx - mid, gy - mid) });
    }
  }

  const rankOf = new Map();
  [...cells]
  .sort((a, b) => a.dist - b.dist)
    .forEach((c, i) => rankOf.set(`${c.gx}:${c.gy}`, i));

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let revealT0 = null;

  const easeOutBack = t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const x = t - 1;
    return 1 + c3 * x * x * x + c1 * x * x;
  };

  const cellProgress = (gx, gy, elapsed) => {
    if (reduced) return 1;
    const rank = rankOf.get(`${gx}:${gy}`) || 0;
    const start = params.revealDelay + rank * params.revealStagger;
    const t = (elapsed - start) / params.revealDur;
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return easeOutBack(t);
  };

  let mx = 0,
    my = 0,
    hovering = false;

  heroSection.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
    hovering = true;
  });

  heroSection.addEventListener('pointerleave', () => {
    hovering = false;
  });

  let ox = null,
    oy = null;

  function frame(ts) {
    if (!W) resize();
    const t = ts / 1000;
    if (revealT0 == null) revealT0 = t;
    const elapsed = t - revealT0;

    const ix = W / 2 + Math.cos(t * params.driftSpeed) * W * params.drift;
    const iy = H / 2 + Math.sin(t * params.driftSpeed * 0.8) * W * params.drift;
    const tx = hovering ? mx : ix;
    const ty = hovering ? my : iy;

    if (ox == null) {
      ox = tx;
      oy = ty;
    }

    ox += (tx - ox) * params.ease;
    oy += (ty - oy) * params.ease;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply';

    const cell = W / (n + 0.8);
    const inset = (W - cell * n) / 2;
    const r = cell * params.dot;

    for (let gy = 0; gy < n; gy++) {
      for (let gx = 0; gx < n; gx++) {
        const p = cellProgress(gx, gy, elapsed);
        if (p <= 0.001) continue;

        const px = inset + (gx + 0.5) * cell;
        const py = inset + (gy + 0.5) * cell;
        let dx = px - ox,
          dy = py - oy;

        const len = Math.hypot(dx, dy) || 1;
        const leanAmt = Math.min(1, len / (W * params.reach));

        dx /= len;
        dy /= len;

        const rr = r * p;
        const step = rr * params.lean * leanAmt * p;

        [
          [2, pal[0]],
          [1, pal[1]],
          [0, pal[2]]
        ].forEach(([k, col]) => {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(px + dx * step * k, py + dy * step * k, rr, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

(function companyHeroReveal() {
  if (window.__companyHeroRevealInit) return;
  window.__companyHeroRevealInit = true;

  const boot = () => {
    if (!window.gsap || !window.SplitText) {
      requestAnimationFrame(boot);
      return;
    }
    ready();
  };

  const ready = () => {
    const root = document.querySelector('.company-hero_component');
    const nav = document.querySelector('.nav_fixed');
    const navParts = nav ? [...nav.children] : [];
    if (!root) return;

    const heading = root.querySelector('.company-hero_heading .heading-style-h1');
    const button = root.querySelector('.company-hero_content .button');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = [heading, button].filter(Boolean);
    targets.forEach(el => el.setAttribute('data-anim', ''));

    if (navParts.length) {
      gsap.set(navParts, { y: () => -nav.offsetHeight });
    }

    if (reduced) {
      gsap.set('[data-anim]', { opacity: 1 });
      if (navParts.length) gsap.set(navParts, { clearProps: 'transform' });
      return;
    }

    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();

    fonts.then(() => {
      let headSplit;

      const build = () => {
        headSplit?.revert();
        if (heading) {
          headSplit = new SplitText(heading, {
            type: 'words',
            mask: 'words',
            wordsClass: 'hero-word',
            autoSplit: true
          });
        }
      };

      build();
      gsap.set('[data-anim', { opacity: 1 });

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        delay: 0.15
      });

      if (navParts.length) {
        tl.to(navParts, {
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          onComplete: () => gsap.set(navParts, { clearProps: 'transform' })
        }, 0);
      }

      if (headSplit) {
        tl.from(headSplit.words, {
          yPercent: 118,
          rotate: 3,
          transformOrigin: '0% 100%',
          duration: 1.15,
          stagger: 0.055
        }, 0);
      }

      if (button) {
        tl.from(button, {
          y: 22,
          opacity: 0,
          duration: 0.8,
        }, '-=0.75');
      }

      window.__companySplit = { headSplit, build };
    });
  };

  boot();
})();

(function initMissionYoutubePlayToggle() {
  if (window.__missionYoutubePlayToggleInit) return;
  window.__missionYoutubePlayToggleInit = true;

  const wrappers = [...document.querySelectorAll('.mission_video-wrapper')];
  if (!wrappers.length) return;

  const loadYoutubeApi = () => {
    if (window.YT && window.YT.Player) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const previous = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        if (typeof previous === 'function') previous();
        resolve();
      };

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    });
  };

  const addYoutubeParams = iframe => {
    const src = iframe.getAttribute('src');
    if (!src) return;

    const url = new URL(src, window.location.href);

    url.searchParams.set('enablejsapi', '1');
    url.searchParams.set('playsinline', '1');

    if (window.location.origin && window.location.origin !== 'null') {
      url.searchParams.set('origin', window.location.origin);
    }

    iframe.setAttribute('src', url.toString());
  };

  wrappers.forEach((wrapper, index) => {
    const play = wrapper.querySelector('.mission_play');
    const iframe = wrapper.querySelector('iframe');

    if (!play || !iframe) return;

    if (!iframe.id) {
      iframe.id = `mission-youtube-${index}`;
    }

    addYoutubeParams(iframe);

    gsap.set(play, {
      scale: 1,
      opacity: 1,
      transformOrigin: '50% 50%',
      pointerEvents: 'none'
    });
  });

  loadYoutubeApi().then(() => {
    wrappers.forEach((wrapper, index) => {
      const play = wrapper.querySelector('.mission_play');
      const iframe = wrapper.querySelector('iframe');

      if (!play || !iframe || iframe.dataset.youtubeToggleInit) return;
      iframe.dataset.youtubeToggleInit = 'true';

      const showPlay = () => {
        gsap.set(play, {
          scale: 1,
          opacity: 1
        });
      };

      const hidePlay = () => {
        gsap.set(play, {
          scale: 0,
          opacity: 0
        });
      };

      new YT.Player(iframe.id || `mission-youtube-${index}`, {
        events: {
          onStateChange: event => {
            if (event.data === YT.PlayerState.PLAYING) {
              hidePlay();
            }

            if (
              event.data === YT.PlayerState.PAUSED ||
              event.data === YT.PlayerState.ENDED ||
              event.data === YT.PlayerState.CUED
            ) {
              showPlay();
            }
          }
        }
      });
    });
  });
})();
