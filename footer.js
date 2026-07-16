(function initRimeFooter() {
  if (window.__rimeFooterInit) return;
  window.__rimeFooterInit = true;

  const run = () => {
    const footer = document.querySelector('.footer_component');
    const spacer = document.querySelector('.footer_spacer');
    const dot = document.querySelector('.footer_i-dot');

    if (!footer) return;

    const cssVar = (name, fallback = '') => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    };

    const setFooterHeight = () => {
      if (!spacer) return;

      const h = footer.offsetHeight;
      document.documentElement.style.setProperty('--footer-height', `${h}px`);
    };

    setFooterHeight();
    window.addEventListener('resize', setFooterHeight);

    if (window.ResizeObserver) {
      new ResizeObserver(setFooterHeight).observe(footer);
    }

    if (dot) {
      const colors = [
        cssVar('--dot-blue', cssVar('--base-color-brand--aqua', '#2CC3E9')),
        cssVar('--dot-pink', cssVar('--base-color-brand--pink-light', '#FFA0FF')),
        cssVar('--dot-yellow', cssVar('--base-color-brand--yellow', '#FFD46F')),
      ];

      let i = 0;

      setInterval(() => {
        i = (i + 1) % colors.length;
        dot.style.fill = colors[i];
      }, 1200);
    }
  };

  run()
})();

(function initRimeFooterParallax() {
  if (window.__rimeFooterParallaxInit) return;
  window.__rimeFooterParallaxInit = true;

  const run = () => {
    const footer = document.querySelector('.footer_component');
    const spacer = document.querySelector('.footer_spacer');
    const footerInner = footer?.querySelector('.padding-global');

    if (!footer || !spacer || !footerInner) return;

    let ticking = false;

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    const update = () => {
      ticking = false;

      const rect = spacer.getBoundingClientRect();
      const vh = window.innerHeight;

      const start = vh;
      const end = 0;

      const progress = clamp((start - rect.top) / (start - end), 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const y = (1 - eased) * 140;

      footerInner.style.transform = `translate3d(0, ${y}px, 0)`;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    if (window.lenis) {
      window.lenis.on('scroll', requestUpdate);
    }
  };

  run()
})();
