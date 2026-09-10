(function initRimePlayer() {
  if (window.__rimePlayerInit) return;
  window.__rimePlayerInit = true;

  const run = () => {
    const playBtn = document.getElementById('play-btn');
    const pml = document.getElementById('pml');
    const pmr = document.getElementById('pmr');
    const animCanvas = document.getElementById('anim-canvas');

    if (!playBtn || !pml || !pmr || !animCanvas) return;

    const cssVar = (name, fallback) => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    };

    const PALETTE = [
      cssVar('--dot-yellow', '#FFD46F'),
      cssVar('--dot-pink', '#FFA0FF'),
      cssVar('--dot-blue', '#2CC3E9'),
    ];

    const randColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const rep = arr => Array.from({ length: 15 }, () => arr).flat();

    const INDUSTRIES = rep(['HEALTHCARE', 'FOOD ORDERING', 'FINANCE', 'TELECOM']);
    const TONES = rep(['HAPPY', 'PROFESSIONAL', 'CASUAL', 'CALM']);

    const shared = { itemH: 36 };
    const pm = {
      R: 560,
      spacing: 39,
      gapVw: -43,
    };

    const ANIM_MS = 600;

    function ease(t) {
      return t < 0.5 ?
        4 * t * t * t :
        1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function makePicker(containerEl, words, naturalRight) {
      const N = words.length;
      const colors = words.map(() => randColor());

      let selFloat = 30;
      let selTarget = 30;
      let animFrom = 30;
      let animTo = 30;
      let animStart = null;
      let rafId = null;
      let activeI = 30;
      let scrollOff = 0;

      function applyPos(el) {
        const posVal = `calc(${50 + pm.gapVw}%)`;

        if (naturalRight) {
          el.style.right = posVal;
          el.style.left = 'auto';
          el.style.transformOrigin = 'right center';
        } else {
          el.style.left = posVal;
          el.style.right = 'auto';
          el.style.transformOrigin = 'left center';
        }
      }

      function arcTransform(d) {
        const absR = Math.abs(pm.R);
        const y = d * pm.spacing;
        const sinT = Math.min(Math.max(y / absR, -1), 1);
        const th = Math.asin(sinT);
        const flip = naturalRight ? -1 : 1;
        const x = flip * absR * (Math.cos(th) - 1);
        const deg = flip * th * (180 / Math.PI);

        return `translateX(${x.toFixed(2)}px) translateY(${(y - shared.itemH / 2).toFixed(2)}px) rotate(${deg.toFixed(4)}deg)`;
      }

      function diff(i) {
        let d = i - selFloat;
        while (d > N / 2) d -= N;
        while (d < -N / 2) d += N;
        return d;
      }

      function setActive(i, on) {
        els[i]?.classList.toggle('active', on);
      }

      function refreshPositions() {
        els.forEach((el, i) => {
          el.style.transform = arcTransform(diff(i));
        });
      }

      function animStep(ts) {
        if (animStart === null) animStart = ts;

        const t = Math.min((ts - animStart) / ANIM_MS, 1);
        selFloat = animFrom + (animTo - animFrom) * ease(t);

        refreshPositions();

        if (t < 1) {
          rafId = requestAnimationFrame(animStep);
        } else {
          selFloat = animTo;
          rafId = null;
        }
      }

      function select(newTarget) {
        if (newTarget === selTarget) return;

        const newI = ((newTarget % N) + N) % N;

        if (newI !== activeI) {
          setActive(activeI, false);
          setActive(newI, true);
          activeI = newI;
        }

        selTarget = newTarget;

        let to = newTarget;
        while (to - selFloat > N / 2) to -= N;
        while (to - selFloat < -N / 2) to += N;

        if (rafId) cancelAnimationFrame(rafId);

        animFrom = selFloat;
        animTo = to;
        animStart = null;
        rafId = requestAnimationFrame(animStep);
      }

      function clickDiff(i) {
        const cur = ((selTarget % N) + N) % N;
        let d = (i - cur + N) % N;
        if (d > N / 2) d -= N;
        return d;
      }

      const els = words.map((name, i) => {
        const el = document.createElement('div');
        el.className = 'arc-item' + (naturalRight ? '' : ' flip');

        applyPos(el);

        el.innerHTML = `<span class="dot" style="background:${colors[i]}"></span>${name}`;
        el.addEventListener('click', () => select(selTarget + clickDiff(i)));

        containerEl.appendChild(el);
        return el;
      });

      setActive(activeI, true);
      refreshPositions();

      function equalizeWidths() {
        els.forEach(el => {
          el.style.width = '';
        });

        requestAnimationFrame(() => {
          const maxW = Math.max(...els.map(el => el.offsetWidth));
          els.forEach(el => {
            el.style.width = maxW + 'px';
          });
        });
      }

      equalizeWidths();

      return {
        centerActive() {
          const to = Math.round(selFloat);
          if (Math.abs(to - selFloat) < 0.001 && !rafId) return;

          const newI = ((to % N) + N) % N;

          if (newI !== activeI) {
            setActive(activeI, false);
            setActive(newI, true);
            activeI = newI;
          }

          selTarget = to;

          if (rafId) cancelAnimationFrame(rafId);

          animFrom = selFloat;
          animTo = to;
          animStart = null;
          rafId = requestAnimationFrame(animStep);
        },
        getActiveDot() {
          return els[activeI]?.querySelector('.dot') || null;
        },
        getActiveDotColor() {
          return colors[activeI];
        },
        getActiveWord() {
          return words[activeI];
        },
        selectWord(word) {
          let bestD = null;

          words.forEach((w, i) => {
            if (w !== word) return;

            const d = clickDiff(i);
            if (bestD === null || Math.abs(d) < Math.abs(bestD)) bestD = d;
          });

          if (bestD !== null) select(selTarget + bestD);
        },
        refresh(reflow) {
          els.forEach(applyPos);
          if (reflow) equalizeWidths();
          refreshPositions();
        },
        setScrollOffset(v) {
          const d = v - scrollOff;
          if (d === 0) return;

          scrollOff = v;
          selFloat += d;
          selTarget += d;
          animFrom += d;
          animTo += d;

          if (!rafId) {
            const newI = ((Math.round(selFloat) % N) + N) % N;

            if (newI !== activeI) {
              setActive(activeI, false);
              setActive(newI, true);
              activeI = newI;
            }
          }

          refreshPositions();
        },
      };
    }

    const cml = makePicker(pml, TONES, true);
    const cmr = makePicker(pmr, INDUSTRIES, false);

    window.RIME_PICKERS = {
      pm,
      shared,
      fontSize: 20.5,
      track: 0.05,
      dot: 7.5,
      refreshAll(reflow) {
        cml.refresh(reflow);
        cmr.refresh(reflow);
      },
    };

    const onArcScroll = () => {
      const raw = window.scrollY / 110;
      const off = matchMedia('(max-width: 700px)').matches ? Math.round(raw) : raw;

      cml.setScrollOffset(-off);
      cmr.setScrollOffset(off);
    };

    window.addEventListener('scroll', onArcScroll, { passive: true });
    onArcScroll();

    const gl = animCanvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
    });

    if (!gl) return;

    const VERT = `
      attribute vec2 aPos;

      void main() {
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `;

    const FRAG = `
      precision highp float;

      uniform vec2 uP0;
      uniform float uR0;
      uniform vec3 uC0;

      uniform vec2 uP1;
      uniform float uR1;
      uniform vec3 uC1;

      uniform vec2 uP2;
      uniform float uR2;
      uniform vec3 uC2;

      uniform vec3 uBg;

      void main() {
        vec2 px = gl_FragCoord.xy;

        float a0 = smoothstep(0.75, -0.75, length(px - uP0) - uR0);
        float a1 = smoothstep(0.75, -0.75, length(px - uP1) - uR1);
        float a2 = smoothstep(0.75, -0.75, length(px - uP2) - uR2);

        float coverage = 1.0 - (1.0 - a0) * (1.0 - a1) * (1.0 - a2);

        if (coverage < 0.002) discard;

        vec3 v = vec3(1.0);
        v = mix(v, max(vec3(0.0), v + uC0 - 1.0), a0);
        v = mix(v, max(vec3(0.0), v + uC1 - 1.0), a1);
        v = mix(v, max(vec3(0.0), v + uC2 - 1.0), a2);

        gl_FragColor = vec4(mix(uBg, v, coverage), 1.0);
      }
    `;

    function makeShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    }

    const vertShader = makeShader(gl.VERTEX_SHADER, VERT);
    const fragShader = makeShader(gl.FRAGMENT_SHADER, FRAG);

    if (!vertShader || !fragShader) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(prog));
      return;
    }

    gl.useProgram(prog);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = name => gl.getUniformLocation(prog, name);

    const uP0 = U('uP0');
    const uR0 = U('uR0');
    const uC0 = U('uC0');

    const uP1 = U('uP1');
    const uR1 = U('uR1');
    const uC1 = U('uC1');

    const uP2 = U('uP2');
    const uR2 = U('uR2');
    const uC2 = U('uC2');

    const uBg = U('uBg');

    gl.uniform3fv(uBg, hexToRgb(cssVar('--dark', '#24211D')));
    gl.clearColor(0, 0, 0, 0);

    const FLY_DUR = 550;
    const VENN_R = 32;
    const VENN_OFF = 16;

    let animState = 'IDLE';
    let rafRef = null;
    let flyStart = 0;

    let startL;
    let startR;
    let targetL;
    let targetR;
    let returnL;
    let returnR;
    let returnFromL;
    let returnFromR;

    let colorL = PALETTE[0];
    let colorR = PALETTE[1];
    let colorP = PALETTE[2];

    let speedL = 1;
    let speedR = 1;
    let sizeL = 1;
    let sizeR = 1;

    function hexToRgb(hex) {
      let clean = String(hex).trim();

      if (clean.startsWith('rgb')) {
        const nums = clean.match(/[\d.]+/g)?.slice(0, 3).map(Number) || [36, 33, 29];
        return nums.map(n => n / 255);
      }

      if (clean[0] === '#') clean = clean.slice(1);
      if (clean.length === 3) {
        clean = clean.split('').map(x => x + x).join('');
      }

      const n = parseInt(clean, 16);

      return [
        ((n >> 16) & 255) / 255,
        ((n >> 8) & 255) / 255,
        (n & 255) / 255,
      ];
    }

    function easeInOut(t) {
      return t < 0.5 ?
        4 * t * t * t :
        1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function lerp2(a, b, t) {
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      };
    }

    function getCenterInCanvas(el) {
      const r = el.getBoundingClientRect();
      const cr = animCanvas.getBoundingClientRect();

      return {
        x: r.left + r.width / 2 - cr.left,
        y: r.top + r.height / 2 - cr.top,
      };
    }

    function getPlayCenter() {
      return getCenterInCanvas(playBtn);
    }

    function getDotCenter(picker) {
      const dot = picker.getActiveDot();
      if (!dot) return getPlayCenter();
      return getCenterInCanvas(dot);
    }

    function drawCircles(posL, posR, rL, rR) {
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      const W = animCanvas.width;
      const H = animCanvas.height;
      const pc = getPlayCenter();

      gl.viewport(0, 0, W, H);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(uP0, posL.x * dpr, H - posL.y * dpr);
      gl.uniform1f(uR0, rL * dpr);
      gl.uniform3fv(uC0, hexToRgb(colorL));

      gl.uniform2f(uP1, posR.x * dpr, H - posR.y * dpr);
      gl.uniform1f(uR1, rR * dpr);
      gl.uniform3fv(uC1, hexToRgb(colorR));

      gl.uniform2f(uP2, pc.x * dpr, H - pc.y * dpr);
      gl.uniform1f(uR2, 32 * dpr);
      gl.uniform3fv(uC2, hexToRgb(colorP));

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    let orbitStartTime = 0;
    const ORBIT_SPEED = 0.55;

    function orbitPositions(now) {
      const dt = (now - orbitStartTime) / 1000;
      const aL = ORBIT_SPEED * speedL * dt + Math.PI;
      const aR = ORBIT_SPEED * speedR * dt;

      const rL = VENN_OFF * (
        1 +
        0.14 * Math.sin(dt * 3.7) +
        0.06 * Math.sin(dt * 6.3 + 1.2)
      );

      const rR = VENN_OFF * (
        1 +
        0.14 * Math.sin(dt * 4.4 + 2.1) +
        0.06 * Math.sin(dt * 7.6)
      );

      const pc = getPlayCenter();

      return {
        L: {
          x: pc.x + rL * Math.cos(aL),
          y: pc.y + rL * Math.sin(aL),
        },
        R: {
          x: pc.x + rR * Math.cos(aR),
          y: pc.y + rR * Math.sin(aR),
        },
      };
    }

    function resizeAnimCanvas() {
      const dpr = Math.max(window.devicePixelRatio || 1, 2);

      animCanvas.width = Math.round(animCanvas.clientWidth * dpr);
      animCanvas.height = Math.round(animCanvas.clientHeight * dpr);
    }

    resizeAnimCanvas();
    window.addEventListener('resize', resizeAnimCanvas);

    if (window.ResizeObserver) {
      new ResizeObserver(resizeAnimCanvas).observe(animCanvas);
    }

    function animFrame(now) {
      const t = Math.min((now - flyStart) / FLY_DUR, 1);
      const e = easeInOut(t);

      if (animState === 'FLYING_IN') {
        drawCircles(
          lerp2(startL, targetL, e),
          lerp2(startR, targetR, e),
          6 + e * (VENN_R * sizeL - 6),
          6 + e * (VENN_R * sizeR - 6)
        );

        if (t >= 1) {
          animState = 'PLAYING';
          orbitStartTime = now;
        }
      } else if (animState === 'PLAYING') {
        const orb = orbitPositions(now);
        drawCircles(orb.L, orb.R, VENN_R * sizeL, VENN_R * sizeR);
      } else if (animState === 'FLYING_OUT') {
        drawCircles(
          lerp2(returnFromL, returnL, e),
          lerp2(returnFromR, returnR, e),
          VENN_R * sizeL * (1 - e) + 6,
          VENN_R * sizeR * (1 - e) + 6
        );

        if (t >= 1) {
          gl.clear(gl.COLOR_BUFFER_BIT);
          playBtn.classList.remove('playing');
          animState = 'IDLE';
          rafRef = null;
          return;
        }
      }

      rafRef = requestAnimationFrame(animFrame);
    }

    const AUDIO_SAMPLES = {
      'healthcare|professional': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e48b1439fb7054c63ba_healthcare_professional.mp3',
      'telecom|professional': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e48b58470d3b4fa61f2_telecom_professional.mp3',
      'finance|happy': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e48dcaccac9e2942831_finance_happy.mp3',
      'healthcare|happy': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e483e092c07bd31e288_healthcare_happy.mp3',
      'telecom|casual': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e47fff0e1b87e4ac87c_telecom_casual.mp3',
      'telecom|calm': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e47c18c080dc0e7e2e9_telecom_calm.mp3',
      'telecom|happy': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e473483ae19d23671be_telecom_happy.mp3',
      'healthcare|casual': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e47f30541d15642256a_healthcare_casual.mp3',
      'finance|casual': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e479e61d11d3c477cac_finance_casual.mp3',
      'finance|professional': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e473e092c07bd31db95_finance_professional.mp3',
      'finance|calm': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e47dbb99aa45272fbd2_finance_calm.mp3',
      'healthcare|calm': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e47de14ca822e8073c5_healthcare_calm.mp3',
      'food-ordering|casual': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e471e75d6f91fb086c2_food_casual.mp3',
      'food-ordering|professional': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e46d12e733117a5ac33_food_professional.mp3',
      'food-ordering|calm': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e4691085d42f56add9a_food_calm.mp3',
      'food-ordering|happy': 'https://cdn.prod.website-files.com/6a4d70b04f64b0fe572eff71/6a516e46de14ca822e807396_food_happy.mp3',
    };

    const audioEl = new Audio();
    audioEl.preload = 'auto';

    function sampleSrc() {
      const tone = cml.getActiveWord().toLowerCase();
      const industry = cmr.getActiveWord().toLowerCase().replace(/\s+/g, '-');
      const key = `${industry}|${tone}`;
      const src = AUDIO_SAMPLES[key];

      if (!src) {
        console.warn('Missing Rime audio sample:', key);
        return AUDIO_SAMPLES['healthcare|happy'];
      }

      return src;
    }

    function stopVenn() {
      playBtn.classList.remove('paused-icon');

      if (animState === 'PLAYING') {
        const orb = orbitPositions(performance.now());
        returnFromL = orb.L;
        returnFromR = orb.R;
      } else {
        const t = Math.min((performance.now() - flyStart) / FLY_DUR, 1);
        const e = easeInOut(t);

        returnFromL = lerp2(startL, targetL, e);
        returnFromR = lerp2(startR, targetR, e);
      }

      returnL = getDotCenter(cml);
      returnR = getDotCenter(cmr);

      flyStart = performance.now();
      animState = 'FLYING_OUT';

      if (!rafRef) rafRef = requestAnimationFrame(animFrame);
    }

    playBtn.addEventListener('click', () => {
      if (animState === 'IDLE' || animState === 'FLYING_OUT') {
        cml.centerActive();
        cmr.centerActive();

        startL = getDotCenter(cml);
        colorL = cml.getActiveDotColor();

        startR = getDotCenter(cmr);
        colorR = cmr.getActiveDotColor();

        colorP = PALETTE.find(c => c !== colorL && c !== colorR) || PALETTE[2];

        speedL = 0.92 + Math.random() * 0.16;
        speedR = 0.92 + Math.random() * 0.16;

        sizeL = 0.98 + Math.random() * 0.04;
        sizeR = 0.98 + Math.random() * 0.04;

        playBtn.classList.add('playing', 'paused-icon');

        const pc = getPlayCenter();

        targetL = {
          x: pc.x - VENN_OFF,
          y: pc.y,
        };

        targetR = {
          x: pc.x + VENN_OFF,
          y: pc.y,
        };

        flyStart = performance.now();
        animState = 'FLYING_IN';

        if (!rafRef) rafRef = requestAnimationFrame(animFrame);

        audioEl.src = sampleSrc();
        audioEl.currentTime = 0;
        audioEl.play().catch(error => {
          console.warn('Rime player audio failed:', {
            src: audioEl.src,
            error,
          });
        });
      } else {
        audioEl.pause();
        stopVenn();
      }
    });

    audioEl.addEventListener('ended', () => {
      if (animState === 'FLYING_IN' || animState === 'PLAYING') {
        stopVenn();
      }
    });
  };

  run()
})();
