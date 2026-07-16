(function initRimeLetters() {
  if (window.__rimeLettersInit) return;
  window.__rimeLettersInit = true;

  const run = () => {
    const host = document.querySelector('.letters');
    if (!host) return;

    if (host.dataset.lettersInit) return;
    host.dataset.lettersInit = 'true';

    const P = {
      rows: 20,
      cols: 20,
      count: 12,
      speed: 0.8,
    };

    window.RIME_LETTERS = P;

    const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const rand = () => AZ[Math.floor(Math.random() * AZ.length)];

    const grid = document.createElement('div');
    grid.className = 'lg-grid';

    const layer = document.createElement('div');
    layer.className = 'pill-layer';

    host.appendChild(grid);
    host.appendChild(layer);

    let spans = [];

    function buildGrid() {
      grid.style.setProperty('--lg-cols', P.cols);
      grid.innerHTML = '';
      spans = [];

      for (let r = 0; r < P.rows; r++) {
        const row = [];

        for (let c = 0; c < P.cols; c++) {
          const cell = document.createElement('span');
          cell.textContent = rand();
          grid.appendChild(cell);
          row.push(cell);
        }

        spans.push(row);
      }
    }

    buildGrid();

    const WORDS = [
      'CONVERSATION',
      'PRONUNCIATION',
      'AUTHENTIC',
      'EXPRESSION',
      'VOCABULARY',
      'ARTICULATE',
      'ELOQUENT',
      'RESONANCE',
      'INTONATION',
      'CADENCE',
      'DIALECT',
      'LINGUISTICS',
      'STORYTELLING',
      'MELODIC',
      'HARMONY',
      'FLUENCY',
      'PERSONALITY',
      'NATURALNESS',
    ];

    const COLORS = ['yellow', 'blue', 'pink'];
    const SPEEDS = [4.0, 2.6, 3.2, 2.2, 3.6, 2.9];
    const runners = [];

    let wordIdx = Math.floor(Math.random() * WORDS.length);

    const lanesOf = runner => runner.vertical ? P.rows : P.cols;
    const laneMax = runner => runner.vertical ? P.cols : P.rows;

    function restore(runner) {
      runner.lit.forEach(cell => {
        cell.classList.remove('lit');
        cell.textContent = rand();
      });

      runner.lit = [];
    }

    function reset(runner) {
      runner.word = WORDS[wordIdx++ % WORDS.length];
      runner.dir = Math.random() < 0.5 ? 1 : -1;

      let lane;
      let tries = 0;

      do {
        lane = 1 + Math.floor(Math.random() * (laneMax(runner) - 2));
      } while (
        ++tries < 20 &&
        runners.some(other =>
          other !== runner &&
          other.vertical === runner.vertical &&
          Math.abs((other.lane ?? -9) - lane) < 3
        )
      );

      runner.lane = lane;
      runner.pos = runner.dir > 0 ? -runner.word.length : lanesOf(runner);
      runner.painted = null;
    }

    function addRunner(index) {
      const runner = {
        color: COLORS[index % COLORS.length],
        vertical: index % 2 === 1,
        speed: SPEEDS[index % SPEEDS.length],
        lit: [],
      };

      runner.pill = document.createElement('div');
      runner.pill.className = `pill pill-${runner.color}`;

      layer.appendChild(runner.pill);
      runners.push(runner);
      reset(runner);

      runner.pos += runner.dir * Math.random() * lanesOf(runner) * 0.5;
    }

    function setCount(count) {
      while (runners.length < count) addRunner(runners.length);

      while (runners.length > count) {
        const runner = runners.pop();
        restore(runner);
        runner.pill.remove();
      }
    }

    P.setCount = setCount;
    setCount(P.count);

    function paint(runner) {
      restore(runner);

      const base = Math.round(runner.pos);

      [...runner.word].forEach((char, i) => {
        const idx = base + i;
        if (idx < 0 || idx >= lanesOf(runner)) return;

        const cell = runner.vertical ?
          spans[idx]?.[runner.lane] :
          spans[runner.lane]?.[idx];

        if (!cell) return;

        cell.textContent = char;
        cell.classList.add('lit');
        runner.lit.push(cell);
      });

      runner.painted = base;
    }

    function metrics() {
      const hostRect = host.getBoundingClientRect();
      const first = spans[0][0].getBoundingClientRect();
      const secondX = spans[0][1].getBoundingClientRect();
      const secondY = spans[1][0].getBoundingClientRect();

      return {
        x0: first.left - hostRect.left,
        y0: first.top - hostRect.top,
        pitchX: secondX.left - first.left,
        pitchY: secondY.top - first.top,
        cell: first.width,
      };
    }

    function placePill(runner, m) {
      const len = runner.word.length;
      const style = runner.pill.style;
      const edge = 1;

      if (runner.vertical) {
        const cx = m.x0 + runner.lane * m.pitchX + m.cell / 2;
        const rawTop = m.y0 + runner.pos * m.pitchY - 5;
        const rawBottom = rawTop + (len - 1) * m.pitchY + m.cell + 10;

        const top = Math.max(rawTop, edge);
        const bottom = Math.min(rawBottom, host.clientHeight - edge);

        style.left = `${cx - m.cell / 2 - 5}px`;
        style.top = `${top}px`;
        style.width = `${m.cell + 10}px`;
        style.height = `${Math.max(0, bottom - top)}px`;
        style.visibility = bottom - top > 6 ? '' : 'hidden';
      } else {
        const cy = m.y0 + runner.lane * m.pitchY + m.cell / 2;
        const rawLeft = m.x0 + runner.pos * m.pitchX - 5;
        const rawRight = rawLeft + (len - 1) * m.pitchX + m.cell + 10;

        const left = Math.max(rawLeft, edge);
        const right = Math.min(rawRight, host.clientWidth - edge);

        style.left = `${left}px`;
        style.top = `${cy - m.cell / 2 - 5}px`;
        style.width = `${Math.max(0, right - left)}px`;
        style.height = `${m.cell + 10}px`;
        style.visibility = right - left > 6 ? '' : 'hidden';
      }
    }

    let running = false;
    let last = 0;
    let scrambleTimer = null;

    function frame(now) {
      if (!running) return;

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const m = metrics();

      runners.forEach(runner => {
        runner.pos += runner.dir * runner.speed * P.speed * dt;

        const out = runner.dir > 0 ?
          runner.pos > lanesOf(runner) :
          runner.pos < -runner.word.length;

        if (out) {
          restore(runner);
          reset(runner);
        }

        if (Math.round(runner.pos) !== runner.painted) {
          paint(runner);
        }

        placePill(runner, m);
      });

      requestAnimationFrame(frame);
    }

    function scrambleTick() {
      spans.forEach(row => {
        row.forEach(cell => {
          if (!cell.classList.contains('lit')) {
            cell.textContent = rand();
          }
        });
      });
    }

    P.rebuild = () => {
      runners.forEach(runner => {
        restore(runner);
        runner.lit = [];
      });

      buildGrid();

      runners.forEach(runner => {
        reset(runner);
      });
    };

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const wasRunning = running;
        running = entry.isIntersecting;

        if (running && !wasRunning) {
          last = performance.now();
          requestAnimationFrame(frame);
        }

        if (running && !scrambleTimer) {
          scrambleTimer = setInterval(scrambleTick, 220);
        }

        if (!running && scrambleTimer) {
          clearInterval(scrambleTimer);
          scrambleTimer = null;
        }
      });
    }, { threshold: 0.35 });

    io.observe(host);
  };

  run()
})();
