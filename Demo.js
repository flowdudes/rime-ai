(function initDemoFormFocusColors() {
  if (window.__demoFormFocusColorsInit) return;
  window.__demoFormFocusColorsInit = true;

  const cssVar = (name, fallback = '') => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  };

  const colors = [
    cssVar('--dot-yellow', cssVar('--base-color-brand--yellow', '#FFD46F')),
    cssVar('--dot-pink', cssVar('--base-color-brand--pink-light', '#FFA0FF')),
    cssVar('--dot-blue', cssVar('--base-color-brand--aqua', '#2CC3E9')),
  ];

  let lastIndex = -1;

  const fields = document.querySelectorAll(
    '.demo_form .field input, .demo_form .field textarea, .demo_form .field select'
  );

  fields.forEach(field => {
    if (field.dataset.focusColorInit) return;
    field.dataset.focusColorInit = 'true';

    field.addEventListener('focus', () => {
      const options = colors
        .map((_, index) => index)
        .filter(index => index !== lastIndex);

      lastIndex = options[(Math.random() * options.length) | 0];

      field.style.setProperty('--fc', colors[lastIndex]);
    });

    field.addEventListener('blur', () => {
      field.style.removeProperty('border-color');
    });
  });
})();

(function demoHeroReveal() {
  if (window.__demoHeroInit) return;
  window.__demoHeroInit = true;

  const boot = () => {
    if (!window.gsap || !window.SplitText) {
      requestAnimationFrame(boot);
      return;
    }
    ready();
  };

  const ready = () => {
    const root = document.querySelector('.demo_component');
    const nav = document.querySelector('.nav_fixed');
    const navParts = nav ? [...nav.children] : [];
    if (!root) return;

    const heading = root.querySelector('.demo_heading .heading-style-h1');
    const para = root.querySelector('.demo_text .text-size-medium');
    const rows = [...root.querySelectorAll('.demo_list .pricing-hero_feature')];
    const formWrap = root.querySelector('.demo_form-wrap');
    const dots = [...root.querySelectorAll('.demo_form .book-dot')];
    const bookHeading = root.querySelector('.demo_form .demo_book .heading-style-h3');
    const fields = [...root.querySelectorAll('.demo_form .field')];
    const submit = root.querySelector('.demo_form .is-form-submit');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    [heading, para, ...rows, formWrap].filter(Boolean).forEach(el => el.setAttribute(
      'data-anim', ''));

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
            autoSplit: true
          });
        }

        if (para) {
          paraSplit = new SplitText(para, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'hero-line',
            autoSplit: true
          });
        }
      };

      build();
      gsap.set('[data-anim]', { opacity: 1 });

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
          opacity: 0,
          rotate: 3,
          transformOrigin: '0% 100%',
          duration: 1.15,
          stagger: 0.055
        }, 0);
      }

      if (paraSplit) {
        tl.from(paraSplit.lines, {
          yPercent: 105,
          duration: 0.95,
          stagger: 0.08
        }, '-=0.85');
      }

      if (rows.length) {
        tl.from(rows, {
          y: 20,
          opacity: 0,
          duration: 0.75,
          stagger: 0.07
        }, '-=0.75');
      }

      if (formWrap) {
        tl.from(formWrap, {
          y: 56,
          scale: 0.97,
          opacity: 0,
          transformOrigin: '50% 100%',
          duration: 1.1
        }, 0.35);
      }

      if (dots.length) {
        tl.from(dots, {
          scale: 0,
          transformOrigin: '50% 50%',
          duration: 0.6,
          stagger: 0.06,
          ease: 'back.out(2.2)'
        }, '<0.3');
      }

      if (bookHeading) {
        tl.from(bookHeading, {
          y: 16,
          opacity: 0,
          duration: 0.7
        }, '-=0.55');
      }

      if (fields.length) {
        tl.from(fields, {
          y: 22,
          opacity: 0,
          duration: 0.75,
          stagger: 0.07
        }, '-=0.5');
      }

      if (submit) {
        tl.from(submit, {
          y: 18,
          opacity: 0,
          duration: 0.7
        }, '-=0.45');
      }

      window.__demoSplit = { headSplit, paraSplit, build };
    });
  };

  boot();
})();
