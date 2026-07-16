(function initRimeVoicesDemo() {
  if (window.__rimeVoicesDemoInit) return;
  window.__rimeVoicesDemoInit = true;

  const run = () => {
    const demo = document.querySelector('.voices_demo');
    if (!demo) return;

    const tabsWrap = demo.querySelector('.voices_tabs');
    const tabs = [...demo.querySelectorAll('.voices_tab-btn')];
    const canvas = demo.querySelector('.voices_canvas');

    const circles = [
      demo.querySelector('.voices_circle.professional'),
      demo.querySelector('.voices_circle.casual'),
      demo.querySelector('.voices_circle.formal'),
      demo.querySelector('.voices_circle.energetic'),
    ].filter(Boolean);

    if (!tabsWrap || !tabs.length || !canvas || circles.length !== 4) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cssVar = (name, fallback = '') => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    };

    const colorVar = name => {
      if (name === '--dot-blue') return cssVar('--dot-blue', cssVar(
        '--base-color-brand--aqua', '#2CC3E9'));
      if (name === '--dot-pink') return cssVar('--dot-pink', cssVar(
        '--base-color-brand--pink-light', '#FFA0FF'));
      if (name === '--dot-yellow') return cssVar('--dot-yellow', cssVar(
        '--base-color-brand--yellow', '#FFD46F'));
      if (name === '--dot-green') return cssVar('--dot-green', '#6FDC8C');
      return '#2CC3E9';
    };

    const CIRCLE_VARS = ['--dot-blue', '--dot-pink', '--dot-yellow', '--dot-green'];

    const SIZES = [
      [176, 76, 248, 96], // banking
      [248, 140, 108, 72], // healthcare
      [100, 232, 76, 148], // food ordering
    ];

    const BASE = [3.74, 2.17, 0.6, 5.31];
    const ORBIT = 72;
    const SLOW = 0.15;
    const HOLD_MS = 4000;

    let tabIdx = Math.max(0, tabs.findIndex(tab => tab.classList.contains('is-active')));
    let tabStart = performance.now();
    let last = performance.now();
    let angle = 0;
    let extra = 0;
    let extraFrom = 0;
    let extraTo = 0;
    let spinStart = 0;

    const indicator = document.createElement('div');
    indicator.className = 'voices_tab-ind';
    tabsWrap.prepend(indicator);

    function fit() {
      return Math.min(1, demo.clientWidth / 460);
    }

    function resizeCanvas() {
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(demo.clientWidth * dpr);
      canvas.height = Math.round(demo.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function placeIndicator() {
      const tab = tabs[tabIdx];
      if (!tab) return;

      indicator.style.left = tab.offsetLeft + 'px';
      indicator.style.width = tab.offsetWidth + 'px';
    }

    function setSizes() {
      const k = fit();

      SIZES[tabIdx].forEach((size, i) => {
        circles[i].style.width = size * k + 'px';
        circles[i].style.height = size * k + 'px';
      });
    }

    function setActiveTab(nextIdx) {
      tabIdx = nextIdx;

      tabs.forEach((tab, i) => {
        tab.classList.toggle('is-active', i === tabIdx);
      });

      tabStart = performance.now();
      extraFrom = extra;
      extraTo = extra + Math.PI * 2;
      spinStart = tabStart;

      setSizes();
      placeIndicator();
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => setActiveTab(i));
    });

    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function drawCircle(x, y, r, color) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      angle += dt * SLOW;

      const progress = Math.min((now - tabStart) / HOLD_MS, 1);
      indicator.style.setProperty('--p', `${progress * 100}%`);

      if (progress >= 1) {
        setActiveTab((tabIdx + 1) % tabs.length);
      }

      const spinT = Math.min((now - spinStart) / 700, 1);
      extra = extraFrom + (extraTo - extraFrom) * easeOut(spinT);

      const w = demo.clientWidth;
      const h = demo.clientHeight;
      const k = fit();

      const cx = w * 0.5;
      const cy = h * 0.56;
      const orbit = ORBIT * k;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'multiply';

      circles.forEach((circle, i) => {
        const rect = circle.getBoundingClientRect();
        const demoRect = demo.getBoundingClientRect();

        const size = rect.width;
        const r = size / 2;

        const a = BASE[i] + angle + extra;
        const x = cx + Math.cos(a) * orbit;
        const y = cy + Math.sin(a) * orbit;

        circle.style.left = x - r + 'px';
        circle.style.top = y - r + 'px';

        drawCircle(x, y, r, colorVar(CIRCLE_VARS[i]));
      });

      ctx.globalCompositeOperation = 'source-over';

      requestAnimationFrame(frame);
    }

    resizeCanvas();
    setSizes();
    placeIndicator();

    requestAnimationFrame(frame);

    window.addEventListener('resize', () => {
      resizeCanvas();
      setSizes();
      placeIndicator();
    });

    document.fonts?.ready.then(() => {
      setSizes();
      placeIndicator();
    });
  };

  run()
})();
