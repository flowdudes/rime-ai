(function initRimeHeroDots() {
  if (window.__rimeHeroDotsInit) return;
  window.__rimeHeroDotsInit = true;

  const run = () => {
    const canvas = document.querySelector('.hero_canvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const cssVar = (name, fallback) => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    };

    const params = {
      cols: 46,
      count: 15,
      radiusFrac: 0.47,
      overlap: 0,
      waveCycles: 1,
      waveSpeed: 0.25,
      amplitude: 0.6,
      phaseOffset: 0,
      headColor: cssVar('--dot-yellow', '#FFD46F'),
      midColor: cssVar('--dot-pink', '#FFA0FF'),
      tailColor: cssVar('--dot-blue', '#2CC3E9'),
      bgColor: cssVar('--bg-light-1', '#F0E9DD'),
      hoverRadius: 0.12,
      hoverScale: 1.35,
      hoverFalloff: 1.4,
      hoverEase: 0.1,
    };

    window.RIME_HERO = params;

    const VERT = `
      attribute vec2 aPos;

      void main() {
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `;

    const FRAG = `
      precision highp float;

      uniform vec2 uCanvas;
      uniform float uTime;
      uniform float uCols;
      uniform float uCount;
      uniform float uRadius;
      uniform float uOverlap;
      uniform float uWaveCycles;
      uniform float uWaveSpeed;
      uniform float uAmplitude;
      uniform float uPhaseOffset;
      uniform float uReveal;
      uniform vec2 uMouse;
      uniform float uHoverRadius;
      uniform float uHoverScale;
      uniform float uHoverFalloff;
      uniform float uHoverStrength;
      uniform vec3 uBg;
      uniform vec3 uC0;
      uniform vec3 uC1;
      uniform vec3 uC2;

      void main() {
        vec2 px = gl_FragCoord.xy;
        float colW = uCanvas.x / uCols;
        float pxCol = floor(px.x / colW);
        float cY = uCanvas.y * 0.5;
        float spacing = 2.0 * uRadius * (1.0 - uOverlap);
        vec3 color = uBg;

        for (int k = -2; k <= 2; k++) {
          float col = pxCol + float(k);
          if (col < 0.0 || col > uCols - 1.0) continue;

          float cX = (col + 0.5) * colW;
          float phase = col / (uCols - 1.0) * uWaveCycles * 6.28318 - uTime * uWaveSpeed + uPhaseOffset;
          float expand = uReveal * uAmplitude * (0.5 + 0.5 * sin(phase));

          for (int j = 0; j < 64; j++) {
            if (float(j) >= uCount) break;

            float drawIdx = uCount - 1.0 - float(j);
            float idx3 = mod(drawIdx, 3.0);

            vec3 dotColor = idx3 < 0.5 ? uC0 : idx3 < 1.5 ? uC1 : uC2;

            float yOff = expand * (drawIdx - (uCount - 1.0) * 0.5) * spacing;
            vec2 dotC = vec2(cX, cY + yOff);

            float prox = smoothstep(uHoverRadius, 0.0, length(dotC - uMouse));
            float grow = 1.0 + (uHoverScale - 1.0) * uHoverStrength * pow(prox, uHoverFalloff);
            float d = length(px - dotC) - uRadius * max(grow, 0.0);
            float a = smoothstep(0.75, -0.75, d);

            if (a > 0.0) {
              vec3 burned = max(vec3(0.0), color + dotColor - 1.0);
              color = mix(color, burned, a);
            }
          }
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const createShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, VERT);
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAG);
    if (!vertShader || !fragShader) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(prog));
      return;
    }

    const uniforms = [
      'uCanvas',
      'uTime',
      'uCols',
      'uCount',
      'uRadius',
      'uOverlap',
      'uWaveCycles',
      'uWaveSpeed',
      'uAmplitude',
      'uPhaseOffset',
      'uReveal',
      'uMouse',
      'uHoverRadius',
      'uHoverScale',
      'uHoverFalloff',
      'uHoverStrength',
      'uBg',
      'uC0',
      'uC1',
      'uC2',
    ];

    const uLoc = {};
    uniforms.forEach(name => {
      uLoc[name] = gl.getUniformLocation(prog, name);
    });

    const aPos = gl.getAttribLocation(prog, 'aPos');

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );

    const hex3 = hex => {
      const clean = hex.trim();
      const n = parseInt(clean.slice(1), 16);

      return [
        ((n >> 16) & 255) / 255,
        ((n >> 8) & 255) / 255,
        (n & 255) / 255,
      ];
    };

    let W = 0;
    let H = 0;
    let dpr = 2;

    function resize() {
      dpr = Math.max(window.devicePixelRatio || 1, 2);
      W = Math.round(canvas.clientWidth * dpr);
      H = Math.round(canvas.clientHeight * dpr);

      if (!W || !H) return;

      canvas.width = W;
      canvas.height = H;
    }

    resize();
    window.addEventListener('resize', resize);

    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvas);
    }

    const mouse = {
      x: 0,
      y: 0,
      tx: 0,
      ty: 0,
      s: 0,
      ts: 0,
      seen: false,
    };

    const hero = canvas.closest('.section_hero') || canvas.closest('.hero_component') || canvas;

    hero.addEventListener('pointermove', event => {
      const rect = canvas.getBoundingClientRect();

      mouse.tx = event.clientX - rect.left;
      mouse.ty = event.clientY - rect.top;
      mouse.ts = 1;

      if (!mouse.seen) {
        mouse.seen = true;
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      }
    });

    hero.addEventListener('pointerleave', () => {
      mouse.ts = 0;
    });

    let t0 = null;
    const HOLD_S = 0.14;
    const GROW_S = 0.95;

    function frame(ts) {
      if (!t0) t0 = ts;

      const t = (ts - t0) / 1000;
      const p = Math.min(Math.max((t - HOLD_S) / GROW_S, 0), 1);
      const reveal = p < 0.5 ?
        4 * p * p * p :
        1 - Math.pow(-2 * p + 2, 3) / 2;

      params.headColor = cssVar('--dot-yellow', '#FFD46F');
      params.midColor = cssVar('--dot-pink', '#FFA0FF');
      params.tailColor = cssVar('--dot-blue', '#2CC3E9');
      params.bgColor = cssVar('--bg-light-1', '#F0E9DD');

      const colW = W / params.cols;
      const radius = colW * params.radiusFrac;

      gl.viewport(0, 0, W, H);
      gl.useProgram(prog);

      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      mouse.x += (mouse.tx - mouse.x) * params.hoverEase;
      mouse.y += (mouse.ty - mouse.y) * params.hoverEase;
      mouse.s += (mouse.ts - mouse.s) * params.hoverEase;

      gl.uniform2f(uLoc.uCanvas, W, H);
      gl.uniform1f(uLoc.uTime, t);
      gl.uniform1f(uLoc.uCols, params.cols);
      gl.uniform1f(uLoc.uCount, params.count);
      gl.uniform1f(uLoc.uRadius, radius);
      gl.uniform1f(uLoc.uOverlap, params.overlap);
      gl.uniform1f(uLoc.uWaveCycles, params.waveCycles);
      gl.uniform1f(uLoc.uWaveSpeed, params.waveSpeed);
      gl.uniform1f(uLoc.uAmplitude, params.amplitude);
      gl.uniform1f(uLoc.uPhaseOffset, params.phaseOffset);
      gl.uniform1f(uLoc.uReveal, reveal);
      gl.uniform2f(uLoc.uMouse, mouse.x * dpr, H - mouse.y * dpr);
      gl.uniform1f(uLoc.uHoverRadius, params.hoverRadius * W);
      gl.uniform1f(uLoc.uHoverScale, params.hoverScale);
      gl.uniform1f(uLoc.uHoverFalloff, params.hoverFalloff);
      gl.uniform1f(uLoc.uHoverStrength, mouse.s * reveal);
      gl.uniform3fv(uLoc.uBg, hex3(params.bgColor));
      gl.uniform3fv(uLoc.uC0, hex3(params.headColor));
      gl.uniform3fv(uLoc.uC1, hex3(params.midColor));
      gl.uniform3fv(uLoc.uC2, hex3(params.tailColor));

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  };

  run()
})();

(function initHomeHeroReveal() {
  if (window.__rimeHomeHeroRevealInit) return;
  window.__rimeHomeHeroRevealInit = true;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelector('.hero_component')?.classList.add('is-in');
    });
  });
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
(function heroLoadReveal() {
  if (window.__heroRevealInit) return;
  window.__heroRevealInit = true;

  const boot = () => {
    if (!window.gsap || !window.SplitText) {
      requestAnimationFrame(boot);
      return;
    }
    ready();
  };

  const ready = () => {
    const heading = document.querySelector('.hero_heading .heading-style-h1');
    const para = document.querySelector('.hero_text-wrap .text-size-medium');
    const buttons = [...document.querySelectorAll('.hero_text-wrap .button-group .button')];
    const nav = document.querySelector('.nav_fixed');
    const navParts = nav ? [...nav.children] : [];
    if (!heading) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = [heading, para, ...buttons].filter(Boolean);
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

        headSplit = new SplitText(heading, {
          type: 'words',
          mask: 'words',
          wordsClass: 'hero-word',
          autoSplit: true,
        });

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

      tl.from(headSplit.words, {
        yPercent: 130,
        duration: 1.15,
        stagger: 0.055,
      });

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
        }, '-=0.8');
      }

      if (buttons.length) {
        tl.from(buttons, {
          y: 22,
          opacity: 0,
          duration: 0.8,
          stagger: 0.09,
        }, '-=0.65');
      }

      window.__heroSplit = { headSplit, paraSplit, build };
    });
  };

  boot();
})();
