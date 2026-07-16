(function initRimePrefooter() {
  if (window.__rimePrefooterInit) return;
  window.__rimePrefooterInit = true;

  const run = () => {
    const canvas = document.getElementById('prefooter-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cssVar = (name, fallback = '') => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    };

    const getVar = (name, fallback) => {
      if (name === '--dot-yellow') return cssVar('--dot-yellow', cssVar(
        '--base-color-brand--yellow', fallback));
      if (name === '--dot-pink') return cssVar('--dot-pink', cssVar(
        '--base-color-brand--pink-light', fallback));
      if (name === '--dot-blue') return cssVar('--dot-blue', cssVar(
        '--base-color-brand--aqua', fallback));
      if (name === '--bg-light-1') return cssVar('--bg-light-1', cssVar(
        '--base-color-neutral--light', fallback));
      return cssVar(name, fallback);
    };

    const params = {
      mode: 'snake',
      snakeCount: 13,
      snakeSize: 177,
      snakeOverlap: 0.6,
      snakeFollow: 0.05,
      snakeIdlePace: 0.3,
      snakeStagger: 0.22,
    };

    window.RIME_PREFOOTER = params;

    let W = 0;
    let H = 0;
    let mx = -1e5;
    let my = -1e5;
    let hovering = false;

    function resize() {
      const dpr = Math.max(window.devicePixelRatio || 1, 2);

      W = canvas.clientWidth;
      H = canvas.clientHeight;

      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();

    window.addEventListener('resize', resize);

    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvas);
    }

    window.addEventListener('pointermove', e => {
      const rect = canvas.getBoundingClientRect();

      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
      hovering = true;
    });

    window.addEventListener('pointerout', e => {
      if (!e.relatedTarget) hovering = false;
    });

    const circle = (x, y, r) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const shead = { x: 0, y: 0 };

    let spath = [];
    let dots = [];
    let lastSnake = [];
    let seeded = false;

    let grab = 0;
    let grabFrom = 0;
    let grabGoal = 0;
    let grabT0 = 0;

    let hAng = 0.9;
    let prevT = null;

    function idleTurn(time, dt, speed) {
      let wander = 0.45 * Math.sin(time * 0.4) + 0.25 * Math.sin(time * 0.17 + 2);

      const wanderCap = speed / 420;
      wander = Math.max(-wanderCap, Math.min(wanderCap, wander));

      let wall = 0;
      const margin = Math.max(340, params.snakeSize * 1.6);
      const edge = Math.min(shead.x, W - shead.x, shead.y, H - shead.y);

      if (edge < margin) {
        let diff = Math.atan2(H / 2 - shead.y, W / 2 - shead.x) - hAng;

        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        const wallCap = speed / 240;
        wall = Math.max(
          -wallCap,
          Math.min(wallCap, diff * Math.min(1, (margin - edge) / margin) * 2)
        );
      }

      hAng += (wander + wall) * dt;
    }

    function drawSnake() {
      const now = performance.now() / 1000;
      const dt = prevT == null ? 1 / 60 : Math.min(0.05, now - prevT);

      prevT = now;

      const speed = 160 * params.snakeIdlePace;
      const radius = params.snakeSize / 2;
      const diameter = params.snakeSize;
      const spacing = Math.max(2, diameter * (1 - params.snakeOverlap));

      if (!seeded) {
        seeded = true;

        shead.x = W * 0.5;
        shead.y = H * 0.42;

        const frames = Math.min(
          6000,
          Math.ceil((params.snakeCount * spacing * 1.6) / speed * 60)
        );

        for (let i = frames; i >= 1; i--) {
          idleTurn(now - i / 60, 1 / 60, speed);

          shead.x = Math.min(W - radius, Math.max(radius, shead.x + Math.cos(hAng) * speed /
            60));
          shead.y = Math.min(H - radius, Math.max(radius, shead.y + Math.sin(hAng) * speed /
            60));

          if (!spath.length || Math.hypot(shead.x - spath[0].x, shead.y - spath[0].y) > 1) {
            spath.unshift({ x: shead.x, y: shead.y });
          }
        }
      }

      const overSection = hovering && mx >= 0 && mx <= W && my >= 0 && my <= H;
      const goal = overSection ? 1 : 0;

      if (goal !== grabGoal) {
        grabGoal = goal;
        grabFrom = grab;
        grabT0 = now;
      }

      const grabProgress = Math.min(1, (now - grabT0) / 2);
      const grabEase = grabProgress < 0.5 ?
        4 * grabProgress * grabProgress * grabProgress :
        1 - Math.pow(-2 * grabProgress + 2, 3) / 2;

      grab = grabFrom + (grabGoal - grabFrom) * grabEase;

      idleTurn(now, dt, speed);

      const idleVX = Math.cos(hAng) * speed;
      const idleVY = Math.sin(hAng) * speed;

      const clampedMouseX = Math.min(W - radius, Math.max(radius, mx));
      const clampedMouseY = Math.min(H - radius, Math.max(radius, my));

      const cursorVX = (clampedMouseX - shead.x) * params.snakeFollow * 60;
      const cursorVY = (clampedMouseY - shead.y) * params.snakeFollow * 60;

      const headVX = idleVX + (cursorVX - idleVX) * grab;
      const headVY = idleVY + (cursorVY - idleVY) * grab;

      shead.x = Math.min(W - radius, Math.max(radius, shead.x + headVX * dt));
      shead.y = Math.min(H - radius, Math.max(radius, shead.y + headVY * dt));

      if (grab > 0.05 && (headVX || headVY)) {
        hAng = Math.atan2(headVY, headVX);
      }

      if (!spath.length) {
        spath.push({ x: shead.x, y: shead.y });
      }

      if (Math.hypot(shead.x - spath[0].x, shead.y - spath[0].y) > 1) {
        spath.unshift({ x: shead.x, y: shead.y });
      }

      if (spath.length > 3000) spath.length = 3000;

      const points = [{ x: spath[0].x, y: spath[0].y }];
      let prev = spath[0];
      let acc = 0;

      for (let i = 1; i < spath.length && points.length < params.snakeCount; i++) {
        let cur = spath[i];
        let dx = cur.x - prev.x;
        let dy = cur.y - prev.y;
        let seg = Math.hypot(dx, dy);

        while (seg > 0 && acc + seg >= spacing && points.length < params.snakeCount) {
          const t = (spacing - acc) / seg;

          prev = {
            x: prev.x + dx * t,
            y: prev.y + dy * t,
          };

          points.push({ x: prev.x, y: prev.y });

          dx = cur.x - prev.x;
          dy = cur.y - prev.y;
          seg = Math.hypot(dx, dy);
          acc = 0;
        }

        acc += seg;
        prev = cur;
      }

      const count = points.length;

      if (dots.length !== count) {
        dots = points.map(p => ({ x: p.x, y: p.y }));
      }

      const stagger = Math.min(0.95, Math.max(0, params.snakeStagger));

      for (let i = 0; i < count; i++) {
        const k = 0.55 * (1 - stagger * (count > 1 ? i / (count - 1) : 0));

        dots[i].x += (points[i].x - dots[i].x) * k;
        dots[i].y += (points[i].y - dots[i].y) * k;
      }

      const palette = [
        getVar('--dot-yellow', '#FFD46F'),
        getVar('--dot-pink', '#FFA0FF'),
        getVar('--dot-blue', '#2CC3E9'),
      ];

      ctx.globalCompositeOperation = 'multiply';

      for (let i = count - 1; i >= 0; i--) {
        ctx.fillStyle = palette[i % 3];
        circle(dots[i].x, dots[i].y, diameter / 2);
      }

      ctx.globalCompositeOperation = 'source-over';
      lastSnake = dots;
    }

    const heading =
      document.querySelector('.prefooter_content .heading-style-h1') ||
      document.querySelector('.prefooter_heading .heading-style-h1') ||
      document.querySelector('.prefooter_content .heading-style-h2') ||
      document.querySelector('.prefooter_heading-wrap h2') ||
      document.querySelector('.prefooter_content h2');

    let headingClone = null;

    if (heading) {
      heading.style.position = 'relative';

      headingClone = document.createElement('span');
      headingClone.className = 'prefooter-h2-snake';
      headingClone.setAttribute('aria-hidden', 'true');
      headingClone.textContent = heading.childNodes[0]?.textContent?.trim() || heading
        .textContent.trim();

      heading.appendChild(headingClone);
    }

    function updateSnakeText() {
      if (!headingClone) return;

      if (params.mode !== 'snake' || !lastSnake.length) {
        headingClone.style.display = 'none';
        return;
      }

      headingClone.style.display = 'block';

      const canvasRect = canvas.getBoundingClientRect();
      const headingRect = heading.getBoundingClientRect();

      const offsetX = canvasRect.left - headingRect.left;
      const offsetY = canvasRect.top - headingRect.top;
      const radius = params.snakeSize / 2;

      let path = '';

      lastSnake.forEach(point => {
        const x = point.x + offsetX;
        const y = point.y + offsetY;

        path += `M ${(x + radius).toFixed(1)} ${y.toFixed(1)} `;
        path += `A ${radius} ${radius} 0 1 0 ${(x - radius).toFixed(1)} ${y.toFixed(1)} `;
        path += `A ${radius} ${radius} 0 1 0 ${(x + radius).toFixed(1)} ${y.toFixed(1)} Z `;
      });

      const clip = `path('${path}')`;

      headingClone.style.clipPath = clip;
      headingClone.style.webkitClipPath = clip;
    }

    function frame() {
      const dpr = Math.max(window.devicePixelRatio || 1, 2);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = getVar('--bg-light-1', '#F0E9DD');
      ctx.fillRect(0, 0, W, H);

      drawSnake();
      updateSnakeText();

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  };

  run();
})();
