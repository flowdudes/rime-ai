document.querySelectorAll(".resources_circle").forEach((el) => {
  const words = el.textContent
    .trim()
    .split(/[\s\-_]+/)
    .filter(Boolean);

  const initials =
    words.length > 1 ?
    words.slice(0, 2).map((w) => w[0]).join("") :
    words[0].slice(0, 2);

  el.textContent = initials.toUpperCase();
});

(function initResourceCardColors() {
  if (window.__resourceCardColorsInit) return;
  window.__resourceCardColorsInit = true;

  const cssVar = (name, fallback = '') => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  };

  const colors = [
    cssVar('--dot-yellow', cssVar('--base-color-brand--yellow', '#FFD46F')),
    cssVar('--dot-pink', cssVar('--base-color-brand--pink-light', '#FFA0FF')),
    cssVar('--dot-blue', cssVar('--base-color-brand--aqua', '#2CC3E9')),
  ];

  const pick = excludeIndex => {
    const options = colors
      .map((_, index) => index)
      .filter(index => index !== excludeIndex);

    return options[(Math.random() * options.length) | 0];
  };

  document.querySelectorAll('.resources_item').forEach(item => {
    if (item.dataset.resourceColorsInit) return;
    item.dataset.resourceColorsInit = 'true';

    const accentIndex = pick(-1);
    const coverIndex = pick(accentIndex);

    const accent = colors[accentIndex];
    const cover = colors[coverIndex];

    item.style.setProperty('--resource-accent', accent);
    item.style.setProperty('--resource-cover', cover);

    const imgWrap =
      item.querySelector('.resources_img-wrap') ||
      item.querySelector('.rsources_img-wrap');

    const dot = item.querySelector('.resources_dot');
    const circle = item.querySelector('.resources_circle');

    if (imgWrap) imgWrap.style.backgroundColor = cover;
    if (dot) dot.style.backgroundColor = accent;
    if (circle) circle.style.backgroundColor = accent;
  });
})();

(function resourcesHeroReveal() {
  if (window.__resourcesHeroInit) return;
  window.__resourcesHeroInit = true;

  const boot = () => {
    if (!window.gsap || !window.SplitText) {
      requestAnimationFrame(boot);
      return;
    }
    ready();
  };

  const ready = () => {
    const root = document.querySelector('.resources_component');
    const nav = document.querySelector('.nav_fixed');
    const navParts = nav ? [...nav.children] : [];
    if (!root) return;

    const eyebrow = root.querySelector('.eyebrow');
    const heading = root.querySelector('.resources_heading .heading-style-h1');
    const para = root.querySelector('.resources_text .text-size-medium');
    const cards = [...root.querySelectorAll('.resources_item')].slice(0, 3);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = [eyebrow, heading, para, ...cards].filter(Boolean);
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
      let headSplit, paraSplit;

      const build = () => {
        headSplit?.revert();
        paraSplit?.revert();

        if (heading) {
          headSplit = new SplitText(heading, {
            type: 'words',
            mask: 'words',
            wordsClass: 'hero-word',
            autoSplit: true,
          });
        }

        if (para) {
          paraSplit = new SplitText(para, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'hero-line',
            autoSplit: true,
          });
        }
      };

      build();
      gsap.set('[data-anim]', { opacity: 1 });

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        delay: 0.15,
      });

      if (navParts.length) {
        tl.to(navParts, {
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          onComplete: () => gsap.set(navParts, { clearProps: 'transform' }),
        }, 0);
      }

      if (eyebrow) {
        tl.from(eyebrow, {
          scale: 0.72,
          opacity: 0,
          duration: 0.7,
          ease: 'back.out(1.9)',
        }, 0.1);
      }

      if (headSplit) {
        tl.from(headSplit.words, {
          yPercent: 118,
          opacity: 0,
          duration: 1.15,
          stagger: 0.055,
        }, '-=0.4');
      }

      if (paraSplit) {
        tl.from(paraSplit.lines, {
          yPercent: 105,
          duration: 0.95,
          stagger: 0.08,
        }, '-=0.85');
      }

      if (cards.length) {
        tl.from(cards, {
          y: 48,
          opacity: 0,
          duration: 1,
          stagger: 0.1,
        }, '-=0.7');
      }

      window.__resourcesSplit = { headSplit, paraSplit, build };
    });
  };

  boot();
})();
