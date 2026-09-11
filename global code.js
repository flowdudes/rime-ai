const isMobile = window.innerWidth <= 991
window.lenis = null

if (!isMobile) {
  window.lenis = new Lenis({ anchors: false, autoResize: true })

  window.lenis.on('scroll', ScrollTrigger.update)

  gsap.ticker.add(time => {
    window.lenis.raf(time * 1000)
  })

  gsap.ticker.lagSmoothing(0)
}

document.querySelectorAll('[data-load-more]').forEach((btn) => {
  btn.addEventListener('click', () => {
    setTimeout(() => {
      if (window.lenis) window.lenis.resize();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 300);
  });
});

gsap.set('.footer_column', { y: 30, opacity: 0 })
gsap.set('.footer_bottom', { y: 10, opacity: 0, scale: 0.95 })
gsap.fromTo('.footer_column', { y: 30, opacity: 0 },
{
  y: 0,
  opacity: 1,
  stagger: 0.1,
  ease: 'none',
  scrollTrigger: {
    trigger: '.main-wrapper',
    start: 'bottom 60%',
    end: 'bottom 30%',
    scrub: 1,
  }
});

gsap.fromTo('.footer_bottom', { y: 10, scale: 0.95, opacity: 0 },
{
  y: 0,
  scale: 1,
  opacity: 1,
  ease: 'none',
  scrollTrigger: {
    trigger: '.main-wrapper',
    start: 'bottom 40%',
    end: 'bottom 30%',
    scrub: 1
  }
});

ScrollTrigger.refresh();
(function initGlobalNavAndButtons() {
  if (window.__rimeGlobalNavAndButtonsInit) return;
  window.__rimeGlobalNavAndButtonsInit = true;

  const cssVar = (name, fallback = '') => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelector('.nav_fixed')?.classList.add('is-in');
    });
  });

  const nav = document.querySelector(".nav_fixed");
  const banner = document.querySelector(".banner10_component");

  let bannerH = 0;
  let totalH = 0;
  let state = "";

  const HIDE_AFTER = 24;

  const setY = gsap.quickTo(nav, "y", {
    duration: 0.5,
    ease: "power3.out"
  });

  const measure = () => {
    bannerH = banner.offsetHeight;
    totalH = nav.offsetHeight;
  };

  const go = (next) => {
    if (next === state) return;
    state = next;

    if (next === "top") setY(0);
    if (next === "peek") setY(-bannerH);
    if (next === "hidden") setY(-totalH);
  };

  measure();
  gsap.set(nav, { y: 0 });
  state = "top";

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onRefresh: measure,
    onUpdate: (self) => {
      const y = self.scroll();

      if (y <= 1) {
        go("top");
        return;
      }

      if (self.direction === 1 && y > bannerH + HIDE_AFTER) {
        go("hidden");
      } else if (self.direction === -1) {
        go("peek");
      }
    }
  });

  (function buttonHoverFX() {
    if (matchMedia('(pointer: coarse)').matches) return;

    const VARS = {
      pink: '--dot-pink',
      yellow: '--dot-yellow',
      blue: '--dot-blue',
    };

    const KEYS = Object.keys(VARS);

    document.querySelectorAll('.button').forEach(btn => {
      if (btn.dataset.hoverFxInit) return;
      btn.dataset.hoverFxInit = 'true';

      btn.style.position = btn.style.position || 'relative';
      btn.style.overflow = 'hidden';
      btn.style.isolation = 'isolate';

      const label = document.createElement('span');
      label.className = 'btn-label';

      const l1 = document.createElement('span');
      l1.className = 'l1';

      while (btn.firstChild) l1.appendChild(btn.firstChild);

      const l2 = l1.cloneNode(true);
      l2.className = 'l2';

      label.appendChild(l1);
      label.appendChild(l2);
      btn.appendChild(label);

      const fx = document.createElement('span');
      fx.className = 'btn-fx';
      btn.insertBefore(fx, btn.firstChild);

      let circles = [];

      btn.addEventListener('pointerenter', e => {
        btn.dataset.prevColor = btn.style.color || '';
        btn.style.color = 'var(--dark, #24211D)';

        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;

        const maxD = Math.max(
          Math.hypot(x, y),
          Math.hypot(r.width - x, y),
          Math.hypot(x, r.height - y),
          Math.hypot(r.width - x, r.height - y)
        );

        const D = maxD * 2.4;
        fx.innerHTML = '';

        const order = [...KEYS].sort(() => Math.random() - 0.5);

        circles = order.map((key, i) => {
          const c = document.createElement('span');
          c.className = 'c';
          c.style.width = D + 'px';
          c.style.height = D + 'px';
          c.style.left = x + 'px';
          c.style.top = y + 'px';
          c.style.background = cssVar(VARS[key], '#2CC3E9');
          c.style.transitionDelay = (i * 95) + 'ms';
          fx.appendChild(c);
          return c;
        });

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            circles.forEach(c => {
              c.style.transform = 'translate(-50%, -50%) scale(1)';
            });
          });
        });
      });

      btn.addEventListener('pointerleave', () => {
        btn.style.color = btn.dataset.prevColor || '';
        delete btn.dataset.prevColor;

        const dead = circles;
        circles = [];

        dead.forEach((c, i) => {
          c.style.transitionDelay = (i * 35) + 'ms';
          c.style.transform = 'translate(-50%, -50%) scale(0)';
        });

        setTimeout(() => {
          dead.forEach(c => c.remove());
        }, 650);
      });
    });
  })();
})();

(function initFdReveals() {
  if (window.__fdRevealsInit) return;
  window.__fdRevealsInit = true;

  const SCRUBBED = new Set(['converge', 'scale-in', 'scale-soft']);

  const boot = () => {
    if (!window.gsap || !window.ScrollTrigger) {
      requestAnimationFrame(boot);
      return;
    }
    run();
  };

  const run = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

    const num = (el, attr, fallback) => {
      const value = el.getAttribute(attr);
      if (value === null || value === '') return fallback;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const str = (el, attr, fallback) => el.getAttribute(attr) || fallback;

    const bool = (el, attr, fallback = true) => {
      const value = el.getAttribute(attr);
      if (value === null) return fallback;
      return value !== 'false';
    };

    const getChildren = el => {
      const marked = [...el.querySelectorAll('[fd-reveal-child]')].filter(
        child => child.closest('[fd-reveal]') === el
      );
      return marked.length ? marked : [...el.children];
    };

    const getTrigger = el => {
      const selector = el.getAttribute('fd-trigger');
      if (!selector) return el;
      return document.querySelector(selector) || el;
    };

    const scrubValue = el => {
      const raw = el.getAttribute('fd-scrub');
      if (raw === null || raw === '' || raw === 'true') return 1;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : 1;
    };

    const playTrigger = (trigger, once, start) => ({
      trigger,
      start,
      once,
      toggleActions: once ? 'play none none none' : 'play none none reverse',
    });

    const scrubTrigger = (el, trigger, start, end) => ({
      trigger,
      start,
      end,
      scrub: scrubValue(el),
      invalidateOnRefresh: true,
    });

    const getFromVars = (type, distance) => {
      const effects = {
        'fade-up': { y: distance, opacity: 0 },
        'fade-down': { y: -distance, opacity: 0 },
        'fade-left': { x: distance, opacity: 0 },
        'fade-right': { x: -distance, opacity: 0 },
        'blur-up': { y: distance, opacity: 0, filter: 'blur(0px)' },
        'snap-up': { y: distance * 1.6, opacity: 0 },
        'clip-up': { y: distance * 0.25, opacity: 0, clipPath: 'inset(100% 0% 0% 0%)' },
      };
      return effects[type] || effects['fade-up'];
    };

    const sideOf = (child, host) => {
      const hr = host.getBoundingClientRect();
      const cr = child.getBoundingClientRect();
      return (cr.left + cr.right) / 2 < (hr.left + hr.right) / 2 ? -1 : 1;
    };

    const convergeTargets = el => {
      const marked = [...el.querySelectorAll('[fd-converge]')].filter(
        child => child.closest('[fd-reveal]') === el
      );
      const pool = marked.length ? marked : [...el.children];
      return pool.map(child => ({ el: child, side: sideOf(child, el) }));
    };

    document.querySelectorAll('[fd-reveal]').forEach(el => {
      if (el.dataset.fdRevealInit) return;
      el.dataset.fdRevealInit = 'true';

      const type = str(el, 'fd-reveal', 'fade-up');
      const trigger = getTrigger(el);
      const once = bool(el, 'fd-once', true);
      const delay = num(el, 'fd-delay', 0);
      const duration = num(el, 'fd-duration', 1);
      const stagger = num(el, 'fd-stagger', 0.08);
      const distance = num(el, 'fd-distance', 40);
      const scrubbed = SCRUBBED.has(type);

      const start = str(el, 'fd-start', scrubbed ? 'top bottom' : 'top 82%');
      const end = str(el, 'fd-end', 'top 45%');
      const ease = str(el, 'fd-ease', scrubbed ? 'none' : 'power4.out');

      if (type === 'converge') {
        const targets = convergeTargets(el);
        if (!targets.length) return;

        const angle = num(el, 'fd-rotate', 7);
        const lift = num(el, 'fd-lift', distance * 2.2);
        const push = num(el, 'fd-push', distance * 0.9);
        const offset = num(el, 'fd-offset', 0.06);
        const mobile = isMobile();

        targets.forEach(({ el: child, side }) => {
          gsap.set(child, { transformOrigin: side < 0 ? '0% 0%' : '100% 0%' });
        });

        const tl = gsap.timeline({
          scrollTrigger: scrubTrigger(el, trigger, start, end),
        });

        targets.forEach(({ el: child, side }, i) => {
          tl.fromTo(child, {
            y: lift,
            x: mobile ? 0 : side * push,
            rotate: mobile ? 0 : -side * angle,
            opacity: 0,
          }, {
            y: 0,
            x: 0,
            rotate: 0,
            opacity: 1,
            duration: 1,
            ease,
            immediateRender: true,
          }, i * offset);
        });
        return;
      }

      if (type === 'scale-in') {
        const fromScale = num(el, 'fd-scale', 0.9);

        gsap.fromTo(el, {
          scale: fromScale,
          opacity: 0,
          transformOrigin: '50% 55%',
        }, {
          scale: 1,
          opacity: 1,
          ease,
          immediateRender: true,
          scrollTrigger: scrubTrigger(el, trigger, start, end),
        });
        return;
      }

      if (type === 'scale-soft') {
        const fromScale = num(el, 'fd-scale', 0.96);

        gsap.fromTo(el, {
          y: distance * 0.4,
          scale: fromScale,
          opacity: 0,
          transformOrigin: '50% 60%',
        }, {
          y: 0,
          scale: 1,
          opacity: 1,
          ease,
          immediateRender: true,
          scrollTrigger: scrubTrigger(el, trigger, start, end),
        });
        return;
      }

      if (type === 'stagger') {
        const children = getChildren(el);
        if (!children.length) return;

        gsap.from(children, {
          y: distance,
          opacity: 0,
          duration,
          delay,
          stagger,
          ease,
          overwrite: 'auto',
          scrollTrigger: playTrigger(trigger, once, start),
        });
        return;
      }

      if (type === 'card-grow') {
        const fromScale = num(el, 'fd-scale', 1.15);

        gsap.fromTo(el, {
          scale: fromScale,
          transformOrigin: '50% 0%',
        }, {
          scale: 1,
          ease: 'none',
          immediateRender: true,
          scrollTrigger: {
            trigger,
            start: str(el, 'fd-start', 'top bottom'),
            end: str(el, 'fd-end', 'top 38%'),
            scrub: scrubValue(el),
            invalidateOnRefresh: true,
          },
        });
        return;
      }

      gsap.from(el, {
        ...getFromVars(type, distance),
        duration,
        delay,
        ease,
        overwrite: 'auto',
        scrollTrigger: playTrigger(trigger, once, start),
      });
    });

    ScrollTrigger.refresh();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  };

  boot();
})();

/* ==========================================================================
   Nav dropdowns with a shared morphing panel.

   One backdrop lives in .navbar1_menu-links and animates its left, top,
   width and height to whichever list is open. The lists themselves are
   transparent and fade in on top of it, which is what makes moving between
   triggers read as one box travelling rather than two boxes swapping.

   Desktop only: below 992px the lists sit open in the mobile menu and the
   panel is hidden, so this does nothing there.
   ========================================================================== */
(() => {
  const wired = new WeakSet();

  function wireDropdowns(root) {
    (root || document).querySelectorAll('.navbar1_menu-links').forEach((links) => {
      if (wired.has(links)) return;
      wired.add(links);

      const panel = links.querySelector('.nav-panel');
      const drops = [...links.querySelectorAll('.navbar1_dropdown')];
      if (!drops.length) return;

      const desktop = matchMedia('(min-width: 992px)');
      let open = null;
      let closeT = 0;
      let switchT = 0;

      // the panel measures the list's box against the links row, since that
      // is the panel's offset parent
      const place = (drop) => {
        if (!panel) return;
        const list = drop.querySelector('.navbar1_dropdown-list');
        if (!list) return;
        const a = links.getBoundingClientRect();
        const b = list.getBoundingClientRect();
        panel.style.left = (b.left - a.left) + 'px';
        panel.style.top = (b.top - a.top) + 'px';
        panel.style.width = b.width + 'px';
        panel.style.height = b.height + 'px';
      };

      const show = (drop) => {
        if (!desktop.matches || drop === open) return;
        clearTimeout(closeT);

        // moving straight from one trigger to another: cross-fade the lists
        // fast so only the panel's travel reads
        if (open) {
          links.classList.add('is-switch');
          clearTimeout(switchT);
          switchT = setTimeout(() => links.classList.remove('is-switch'), 260);
        }

        drops.forEach((d) => {
          const on = d === drop;
          d.classList.toggle('is-open', on);
          const t = d.querySelector('.navbar1_dropdown-toggle');
          if (t) t.setAttribute('aria-expanded', String(on));
        });

        open = drop;
        if (drop.classList.contains('no-panel')) {
          if (panel) panel.classList.remove('is-on');
          return;
        }
        place(drop);
        if (panel) panel.classList.add('is-on');
      };

      const hide = () => {
        clearTimeout(closeT);
        closeT = setTimeout(() => {
          drops.forEach((d) => {
            d.classList.remove('is-open');
            const t = d.querySelector('.navbar1_dropdown-toggle');
            if (t) t.setAttribute('aria-expanded', 'false');
          });
          if (panel) panel.classList.remove('is-on');
          open = null;
        }, 120); // the gap between two triggers is crossable
      };

      drops.forEach((drop) => {
        const toggle = drop.querySelector('.navbar1_dropdown-toggle');

        drop.addEventListener('pointerenter', () => show(drop));
        drop.addEventListener('pointerleave', hide);
        drop.addEventListener('focusin', () => show(drop));

        if (!toggle) return;
        toggle.setAttribute('aria-haspopup', 'true');
        toggle.setAttribute('aria-expanded', 'false');

        // keyboard and touch: the trigger toggles rather than only hovering
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          if (open === drop) {
            clearTimeout(closeT);
            hide();
          }
          else show(drop);
        });
      });

      links.addEventListener('focusout', (e) => {
        if (!links.contains(e.relatedTarget)) hide();
      });

      addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && open) {
          clearTimeout(closeT);
          hide();
        }
      });

      // the panel has to follow a reflow: a resize, a font landing, or the
      // row rewrapping. Re-measure against whatever is open.
      const remeasure = () => {
        if (open && !open.classList.contains('no-panel')) place(
          open);
      };
      addEventListener('resize', remeasure);
      new ResizeObserver(remeasure).observe(links);
      if (document.fonts) document.fonts.ready.then(remeasure);

      desktop.addEventListener('change', () => {
        clearTimeout(closeT);
        hide();
      });
    });
  }

  window.RimeChrome = window.RimeChrome || {};
  window.RimeChrome.wireDropdowns = wireDropdowns;

  wireDropdowns(document);
})();
