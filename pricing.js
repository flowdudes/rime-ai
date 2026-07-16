(function pricingHeroReveal() {
  if (window.__pricingHeroInit) return;
  window.__pricingHeroInit = true;

  const boot = () => {
    if (!window.gsap || !window.SplitText) {
      requestAnimationFrame(boot);
      return;
    }
    ready();
  };

  const ready = () => {
    const root = document.querySelector('.pricing-hero_component');
    const nav = document.querySelector('.nav_fixed');
    const navParts = nav ? [...nav.children] : [];
    if (!root) return;

    const eyebrow = root.querySelector('.eyebrow');
    const heading = root.querySelector('.pricing-hero_content .heading-style-h2');
    const para = root.querySelector('.pricing-hero_content .text-size-medium');
    const cards = [...root.querySelectorAll('.pricing-hero_card-wrap')];
    const featureGroups = [...root.querySelectorAll('.pricing-hero_features')];
    const cardButtons = [...root.querySelectorAll('.pricing-hero_card .button')];

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = [eyebrow, heading, para, ...cards, ...featureGroups].filter(Boolean);
    targets.forEach(el => el.setAttribute('data-anim', ''));

    if (navParts.length) {
      gsap.set(navParts, { y: () => -nav.offsetHeight });
    }

    if (reduced) {
      gsap.set(targets, { opacity: 1 });
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
      gsap.set(cards, { transformOrigin: '50% 100%' });

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        delay: 0.15,
      });

      if (eyebrow) {
        tl.from(eyebrow, {
          scale: 0.72,
          opacity: 0,
          duration: 0.7,
          ease: 'back.out(1.9)',
        });
      }

      if (headSplit) {
        tl.from(headSplit.words, {
          yPercent: 130,
          opacity: 0,
          duration: 1.15,
          stagger: 0.045,
        }, '-=0.5');
      }

      if (navParts.length) {
        tl.to(navParts, {
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          onComplete: () => gsap.set(navParts, { clearProps: 'transform' }),
        }, 0);
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
          y: 64,
          scale: 0.965,
          opacity: 0,
          duration: 1.1,
          stagger: 0.12,
        }, '-=0.7');
      }

      featureGroups.forEach((group, gi) => {
        const rows = [...group.querySelectorAll('.pricing-hero_feature')];
        if (!rows.length) return;

        tl.from(rows, {
          y: 20,
          opacity: 0,
          duration: 0.75,
          stagger: 0.07,
          clearProps: 'transform,opacity',
        }, `-=${0.85 - gi * 0.1}`);
      });

      window.__pricingSplit = { headSplit, paraSplit, build };
    });
  };

  boot();
})();

(function initRimeFaq() {
  if (window.__rimeFaqInit) return;
  window.__rimeFaqInit = true;

  const run = () => {
    const items = [...document.querySelectorAll('.faq_item')];
    if (!items.length) return;

    const cssVar = (name, fallback = '') => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    };

    const colors = [
      cssVar('--dot-yellow', cssVar('--base-color-brand--yellow', '#FFD46F')),
      cssVar('--dot-pink', cssVar('--base-color-brand--pink-light', '#FFA0FF')),
      cssVar('--dot-blue', cssVar('--base-color-brand--aqua', '#2CC3E9')),
    ];

    const closeItem = item => {
      const answer = item.querySelector('.faq_answer');
      const fx = item.querySelector('.faq_fx');

      item.classList.remove('is-open');

      if (answer) {
        answer.style.maxHeight = '0px';
      }

      if (fx) {
        fx.classList.remove('is-in');
      }
    };

    const openItem = item => {
      const answer = item.querySelector('.faq_answer');
      const fx = item.querySelector('.faq_fx');

      item.classList.add('is-open');

      if (answer) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }

      if (fx) {
        fx.classList.add('is-in');
      }
    };

    const toggleItem = clickedItem => {
      const wasOpen = clickedItem.classList.contains('is-open');

      items.forEach(item => {
        closeItem(item);
      });

      if (!wasOpen) {
        openItem(clickedItem);
      }
    };

    items.forEach((item, index) => {
      if (item.dataset.faqInit) return;
      item.dataset.faqInit = 'true';

      const question = item.querySelector('.faq_question');
      const answer = item.querySelector('.faq_answer');
      const toggle = item.querySelector('.faq_toggle');

      if (!question || !answer || !toggle) return;

      const color = colors[index % colors.length];
      item.style.setProperty('--qc', color);

      let fx = item.querySelector('.faq_fx');

      if (!fx) {
        fx = document.createElement('span');
        fx.className = 'faq_fx';
        item.prepend(fx);
      }

      const setFx = event => {
        const rect = item.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const maxD = Math.max(
          Math.hypot(x, y),
          Math.hypot(rect.width - x, y),
          Math.hypot(x, rect.height - y),
          Math.hypot(rect.width - x, rect.height - y)
        );

        const size = maxD * 2.25;

        fx.style.width = size + 'px';
        fx.style.height = size + 'px';
        fx.style.left = x + 'px';
        fx.style.top = y + 'px';
      };

      item.addEventListener('pointerenter', event => {
        if (matchMedia('(pointer: coarse)').matches) return;

        setFx(event);

        requestAnimationFrame(() => {
          fx.classList.add('is-in');
        });
      });

      item.addEventListener('pointermove', event => {
        if (matchMedia('(pointer: coarse)').matches) return;

        if (!fx.classList.contains('is-in')) {
          setFx(event);
        }
      });

      item.addEventListener('pointerleave', () => {
        if (item.classList.contains('is-open')) return;

        fx.classList.remove('is-in');
      });

      question.addEventListener('click', () => {
        toggleItem(item);
      });
    });

    window.addEventListener('resize', () => {
      items.forEach(item => {
        if (!item.classList.contains('is-open')) return;

        const answer = item.querySelector('.faq_answer');

        if (answer) {
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });
  };

  run();
})();
