(function initRimeRoulette() {
  if (window.__rimeRouletteInit) return;
  window.__rimeRouletteInit = true;

  const run = () => {
    const host = document.querySelector('.roulette');
    if (!host) return;

    const ring = document.getElementById('rl-ring');
    const pill = document.getElementById('rl-pill');
    const textEl = document.getElementById('rl-text');
    const timerEl = document.getElementById('rl-timer');
    const centerEl = host.querySelector('.rl-center');

    if (!ring || !pill || !textEl || !timerEl || !centerEl) return;

    const cssVar = (name, fallback = '') => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    };

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    const P = {
      count: 27,
      dot: 21,
      orbit: 109,
      pulseAmp: 3,
      pulseSpeed: 0.9,
      center: 70,
      timer: 12.5,
      typeMs: 38,
      holdMs: 1550,
      blend: false,
    };

    window.RIME_ROULETTE = P;

    const RING_CENTER_X = 71;

    let dots = [];
    let phases = [];
    let step = 360 / P.count;

    function paintDots() {
      dots.forEach(dot => {
        dot.style.background = cssVar(dot.dataset.var, '#2CC3E9');
      });
    }

    P.apply = () => {
      dots.forEach(dot => {
        dot.style.width = P.dot + 'px';
        dot.style.height = P.dot + 'px';
        dot.style.margin = -P.dot / 2 + 'px';
        dot.style.mixBlendMode = P.blend ? 'multiply' : '';
      });

      pill.style.mixBlendMode = P.blend ? 'multiply' : '';
      pill.style.minWidth = P.dot + 'px';
      pill.style.height = P.dot + 'px';
      pill.style.left = RING_CENTER_X + P.orbit - P.dot / 2 + 'px';
      pill.style.fontSize = P.timer + 'px';

      centerEl.style.width = P.center + 'px';
      centerEl.style.height = P.center + 'px';
      centerEl.style.left = RING_CENTER_X - P.center / 2 + 'px';
      centerEl.style.fontSize = P.timer + 'px';
    };

    function buildDots() {
      dots.forEach(dot => dot.remove());

      const base = ['--dot-pink', '--dot-yellow', '--dot-blue'];
      const vars = Array.from({ length: P.count }, (_, i) => base[i % 3]);

      if (P.count % 3 === 1) vars[P.count - 1] = '--dot-yellow';

      step = 360 / P.count;
      phases = vars.map(() => Math.random() * Math.PI * 2);

      dots = vars.map((colorVar, i) => {
        const dot = document.createElement('div');

        dot.className = 'rl-dot';
        dot.dataset.var = colorVar;
        dot.style.transform = `rotate(${i * step}deg) translateX(${P.orbit}px)`;

        ring.appendChild(dot);
        return dot;
      });

      paintDots();
      P.apply();
    }

    P.rebuild = buildDots;
    buildDots();

    let pillLive = false;
    let activeIdx = 0;
    let pulsing = false;

    function pulse(now) {
      if (!pulsing) return;

      const t = now / 1000;

      dots.forEach((dot, i) => {
        const isActive = pillLive && i === activeIdx;
        const amp = isActive ? 0 : P.pulseAmp;
        const radius = P.orbit + Math.sin(t * P.pulseSpeed * 2 + phases[i]) * amp;

        dot.style.opacity = isActive ? 0 : 1;
        dot.style.transform = `rotate(${i * step}deg) translateX(${radius.toFixed(2)}px)`;
      });

      requestAnimationFrame(pulse);
    }

    const messages = [
      'THANKS FOR CALLING',
      'HOW CAN I HELP?',
      'SURE, ONE MOMENT',
      'CAN I GET YOUR NAME?',
      'THANKS, MR. NGUYEN',
      "YOU'RE VERIFIED",
      'CHECKING THURSDAY AT 7PM',
      'DR. SHAH HAS AN OPENING',
      'BOOKED THURSDAY, 7PM',
      'CONFIRMATION TEXT SENT',
      'ANYTHING ELSE?',
      'GLAD I COULD HELP',
    ];

    let running = false;
    let seconds = 0;
    let timerId = null;
    let angle = 0;
    let msgIdx = 0;
    let seqId = 0;

    const formatTime = s => {
      const mins = String(Math.floor(s / 60)).padStart(2, '0');
      const secs = String(s % 60).padStart(2, '0');
      return `${mins}:${secs}`;
    };

    async function sequence(myId) {
      while (running && seqId === myId) {
        const total = dots.length;

        activeIdx = (((-Math.round(angle / step)) % total) + total) % total;

        pill.style.background = cssVar(dots[activeIdx].dataset.var, '#2CC3E9');
        textEl.textContent = '';
        pill.style.width = P.dot + 'px';

        const setPillWidth = () => {
          pill.style.width = Math.max(P.dot, textEl.offsetWidth + 14) + 'px';
        };

        pillLive = true;
        pill.classList.add('on');

        const msg = messages[msgIdx++ % messages.length];

        for (const char of msg) {
          if (!running || seqId !== myId) return;

          textEl.textContent += char;
          setPillWidth();

          await wait(P.typeMs);
        }

        await wait(P.holdMs);

        while (textEl.textContent.length) {
          if (!running || seqId !== myId) return;

          textEl.textContent = textEl.textContent.slice(0, -1);
          setPillWidth();

          await wait(Math.max(12, P.typeMs / 2));
        }

        pill.classList.remove('on');
        pillLive = false;

        await wait(260);

        const spin =
          step *
          (2 + Math.floor(Math.random() * 5)) *
          (Math.random() < 0.5 ? -1 : 1);

        angle += spin;
        ring.style.rotate = angle + 'deg';

        await wait(950);
      }
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const wasRunning = running;
        running = entry.isIntersecting;

        if (running && !wasRunning) {
          if (!timerId) {
            timerId = setInterval(() => {
              seconds = (seconds + 1) % 120;
              timerEl.textContent = formatTime(seconds);
            }, 1000);
          }

          if (!pulsing) {
            pulsing = true;
            requestAnimationFrame(pulse);
          }

          sequence(++seqId);
        }

        if (!running) {
          if (timerId) {
            clearInterval(timerId);
            timerId = null;
          }

          pulsing = false;
        }
      });
    }, { threshold: 0.35 });

    io.observe(host);
  };

  run()
})();
