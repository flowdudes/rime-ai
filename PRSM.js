/* ==========================================================================
   PRISM HERO ENGINE (Refraction + Stream Studies, Standalone Runner)
   ========================================================================== */
(() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const fluid = (n) => { const t = clamp(n); return clamp(t * t * t * (t * (t * 6 - 15) + 10)); };
  const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (v) => "#" + v.map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2,
    "0")).join("");
  const multiply = (a, b) => {
    const B = hex2(b);
    return toHex(hex2(a).map((v, i) => (v * B[i]) / 255));
  };
  const mix = (a, b, k) => {
    const A = hex2(a),
      B = hex2(b);
    return toHex(A.map((v, i) => v + (B[i] - v) * k));
  };
  const easeBack = (t, c1 = 0.9) => {
    const c2 = c1 * 1.525;
    return t < 0.5 ?
      (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2 :
      (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (2 * t - 2) + c2) + 2) / 2;
  };

  const REFRACTION = Object.freeze({
    spectrum: ['#ffa0ff', '#ffd46f', '#2cc3e9', '#ffa0ff', '#ffd46f'],
    motionMode: 'refraction',
    faceAlpha: 0.86,
    faceBlend: 'multiply',
    blend: 'burn',
    radius: 9,
    count: 5,
    colGap: 2.35,
    words: 22,
    speed: 280,
    speedMul: 1.05,
    pause: 0.15,
    turn: 1.1,
    drift: 0,
    idleSpin: 0.28,
    passRoll: 0,
    sway: 0.13,
    whiteIn: 1,
    lineIn: 1,
    fanOut: 2.2,
    dotSize: 1.55,
    appear: 0.8,
    arrow: '#ffa0ff',
    faceBack: '#2cc3e9',
    faceA: '#ffd46f',
    faceB: '#ffffff',
  });

  const DEFAULTS = {
    motionMode: 'classic',
    faceBlend: 'screen',
    spectrum: ['#ffa0ff', '#ffd46f', '#8be89a', '#2cc3e9', '#ff756f'],
    ground: "#2e2a25",
    arrow: "#ffa0ff",
    dotA: "#ffd46f",
    dotB: "#8be89a",
    voiceA: ["#ffcf61", "#ff756f", "#ff96ff"],
    voiceB: ["#8be89a", "#13bee9", "#2c9859"],
    waveA: 1,
    waveB: 0.72,
    refract: true,
    blend: "burn",
    count: 5,
    radius: 11,
    overlap: 0.35,
    colGap: 2.2,
    words: 26,
    speed: 240,
    amp: 1,
    wavelength: 420,
    waveSpeed: 1.4,
    arrowSize: 0.2,
    lineY: 0.5,
    pause: 0.55,
    turn: 0.8,
    dots: true,
    speedMul: 1.5,
    arrowShape: 0.866,
    turnDir: 1,
    overshoot: 0,
    dotSize: 1.3,
    dotX: 0.07,
    dotPulse: 0,
    jitter: 0,
    emerge: 4,
    suck: 170,
    suckPull: 0,
    inside: 1,
    exit: 4,
    land: 140,
    landPull: 0,
    faceBack: "#2cc3e9",
    faceA: "#ffd46f",
    faceB: "#8be89a",
    spin: 3.2,
    strike: 0.45,
    brake: 1.3,
    slack: 1.2,
    drift: 36,
    driftRate: 3.5,
    end: "loop",
    markCircle: "#1dadc7",
    bloom: 1,
    sway: 0.12,
    swaySpeed: 0.7,
    appear: 1.1,
    faceAlpha: 1,
    whiteIn: 0,
    lineIn: 0,
    fanOut: 1,
    idleSpin: 0,
    passRoll: 0,
  };

  class PrsmHero {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.g = canvas.getContext("2d");
      this.off = document.createElement("canvas");
      this.og = this.off.getContext("2d");
      this.s = Object.assign({}, DEFAULTS, opts);
      this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.raf = 0;
      this.reset();
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(canvas);
      this.resize();
    }
    set(patch) {
      const mode = this.s.motionMode;
      Object.assign(this.s, patch);
      if (mode !== this.s.motionMode) this.reset();
    }
    reset() {
      this.appear = 0;
      this.t = 0;
      this.speaker = 0;
      this.phase = "speak";
      this.cols = [];
      this.spawned = 0;
      this.spawnT = 0;
      this.struck = false;
      this.angle = 0;
      this.from = 0;
      this.turnT = 0;
      this.wait = 0;
      this.lastSpawn = [-9, -9];
      this.yaw = 0;
      this.pitch = 0;
      this.rest = 0;
      this.faceLeft = false;
      this.swayT = 0;
      this.omega = 0;
      this.spin = "rest";
      this.plan = null;
      this.runT = 0;
      this.mark = null;
      this.bloom = 0;
      this.rollA = 0;
      this.drift = 0;
      this.driftV = 0;
      this.driftTo = 0;
      this.edgeL = null;
      this.edgeR = null;
      if (this.s.motionMode === 'refraction') {
        this.yaw = 0.25;
        this.pitch = -0.3;
        this.passSpin = null;
        this.prismPulse = 0;
      }
    }
    resize() {
      const c = this.canvas,
        previousWidth = this.W;
      this.dpr = Math.min(devicePixelRatio || 1, 2);
      this.W = c.clientWidth || 1;
      this.H = c.clientHeight || 1;
      if (previousWidth && this.s.motionMode === 'refraction') {
        this.cols.forEach(word => {
          const scale = this.W / previousWidth;
          word.x *= scale;
          if (word.entry !== undefined) {
            word.entry *= scale;
            word.depth *= scale;
          }
        });
      }
      c.width = this.off.width = Math.floor(this.W * this.dpr);
      c.height = this.off.height = Math.floor(this.H * this.dpr);
    }
    geo() {
      const s = this.s,
        W = this.W,
        H = this.H;
      const breath = s.motionMode === 'refraction' ? 0.68 + 0.4 * (this.prismPulse || 0) : 1;
      const base = H * s.arrowSize * breath,
        hx = base * s.arrowShape;
      const cx = W / 2 + this.drift,
        cy = H * s.lineY;
      return {
        cx,
        cy,
        base,
        hx,
        dotA: { x: W * s.dotX, y: cy },
        dotB: {
          x: W * (1 - s.dotX),
          y: cy
        }
      };
    }
    tick(dt) {
      if (this.s.motionMode === 'refraction') return this.tickOptics(dt);
      const s = this.s;
      if (this.reduced) {
        dt = 0;
        this.appear = 1;
      }
      dt *= s.speedMul;
      this.t += dt;
      if (this.appear < 1) this.appear = s.appear > 0 ? Math.min(1, this.appear + dt / s
        .appear) : 1;
      if (this.canvas.clientWidth !== this.W || this.canvas.clientHeight !== this.H) this
        .resize();
      const G = this.geo(),
        dir = this.speaker === 0 ? 1 : -1,
        listener = 1 - this.speaker;
      const P = this.project(G),
        xs = P.map((v) => v[0]),
        rawL = G.cx + Math.min(...xs),
        rawR = G.cx + Math.max(...xs);
      if (this.edgeL === null) {
        this.edgeL = rawL;
        this.edgeR = rawR;
      }
      const f = Math.min(1, dt * 5);
      this.edgeL += (rawL - this.edgeL) * f;
      this.edgeR += (rawR - this.edgeR) * f;
      const xL = this.edgeL,
        xR = this.edgeR,
        xBase = dir > 0 ? xL : xR,
        xApex = dir > 0 ? xR : xL;
      const from = this.speaker === 0 ? G.dotA : G.dotB,
        to = listener === 0 ? G.dotA : G.dotB,
        sgn = s.turnDir < 0 ? -1 : 1;
      if (this.phase === "speak" || this.phase === "done") {
        this.spawnT += dt;
        const every = (s.colGap * s.radius) / s.speed;
        if (this.appear >= 1 && this.spawned < s.words && (!this.spawned || this.spawnT >=
            every)) {
          this.spawnT = this.spawned ? this.spawnT - every : 0;
          this.spawned++;
          this.lastSpawn[this.speaker] = this.t;
          this.cols.push({
            x: from.x,
            i: this.spawned,
            stage: "out",
            e: 0,
            s: 0,
            g: 0,
            run: 0
          });
        }
        this.cols.forEach((c) => {
          if (c.stage === "out") {
            c.run += s.speed * dt;
            c.g = 0.45 + 0.55 * smooth(clamp(c.run / (s.radius * 1.2), 0, 1));
            c.e = smooth(clamp(c.run / (s.radius * Math.max(0.5, s.emerge)), 0, 1));
            c.x = from.x + dir * c.run;
            const d = dir > 0 ? xBase - c.x : c.x - xBase;
            c.s = smooth(clamp(1 - d / s.suck, 0, 1));
            c.run += s.speed * dt * s.suckPull * c.s * c.s;
            if (d <= 0) {
              c.stage = "in";
              c.run = 0;
            }
          } else if (c.stage === "in" && s.end === "mark" && c.i >= Math.round(s.words)) {
            const xM = G.cx + dir * G.hx / 6,
              dM = dir > 0 ? xM - c.x : c.x - xM;
            if (dM > 0.5) c.x += dir * Math.min(dM, s.speed * s.inside * dt);
            else if (this.spin === "rest") {
              c.stage = "mark";
              this.mark = c;
              this.phase = "done";
              this.bloom = 0;
              this.driftTo = 0;
            }
          } else if (c.stage === "mark") {
            c.x = G.cx + dir * G.hx / 6;
          } else if (c.stage === "in") {
            c.x += dir * s.speed * s.inside * dt;
            if (dir > 0 ? c.x >= xApex : c.x <= xApex) {
              c.stage = "back";
              c.run = 0;
              c.e = 0;
              c.s = 0;
              c.g = 0.5;
            }
          } else if (c.stage === "back") {
            const d0 = dir > 0 ? to.x - c.x : c.x - to.x;
            c.s = smooth(clamp(1 - d0 / s.land, 0, 1));
            const step = s.speed * dt * (1 + s.landPull * c.s * c.s);
            c.x += dir * step;
            c.run += step;
            c.g = 0.5 + 0.5 * smooth(clamp(c.run / (s.radius * 1.2), 0, 1));
            c.e = smooth(clamp(c.run / (s.radius * Math.max(0.5, s.exit)), 0, 1));
            if ((dir > 0 ? to.x - c.x : c.x - to.x) <= 0) c.stage = "done";
          }
        });
        this.cols = this.cols.filter((c) => c.stage !== "done");
        if (this.phase === "speak" && this.spawned >= s.words && !this.cols.length) {
          this.phase = "wait";
          this.wait = s.pause;
        }
        if (this.phase === "done") this.bloom = Math.min(1, this.bloom + dt / Math.max(0.05, s
          .bloom));
      } else if (this.phase === "wait") {
        this.wait -= dt;
        if (this.wait <= 0 && this.spin === "rest") {
          this.speaker = 1 - this.speaker;
          this.phase = "speak";
          this.spawned = 0;
          this.spawnT = 0;
          this.struck = false;
        }
      }
      const reach = s.radius * 0.75,
        onEdge = (c) => c.stage === "out" && (dir > 0 ? xBase - c.x : c.x - xBase) <= reach;
      if (!this.struck && this.phase === "speak" && this.cols.some(onEdge)) {
        this.struck = true;
        this.planSpin(G, sgn);
        this.driftTo = dir * s.drift;
      }
      if (this.spin === "run") {
        const p = this.plan;
        this.runT += dt;
        const t = Math.min(this.runT, p.T);
        let w, d;
        if (t < p.up) {
          w = p.w * t / p.up;
          d = 0.5 * p.w * t * t / p.up;
        } else if (t < p.T - p.dn) {
          w = p.w;
          d = 0.5 * p.w * p.up + p.w * (t - p.up);
        } else {
          const r = p.T - t;
          w = p.w * r / p.dn;
          d = p.D - 0.5 * p.w * r * r / p.dn;
        }
        this.yaw = p.from + p.sgn * d;
        this.omega = p.sgn * w;
        this.swayT += dt;
        const a = clamp(w / Math.max(0.1, s.spin) * 1.3, 0, 1);
        this.pitch = a * s.sway * Math.sin(this.swayT * s.swaySpeed + 1.1);
        if (this.runT >= p.T) {
          this.spin = "rest";
          if (s.end !== "mark") this.faceLeft = !this.faceLeft;
          // Clean wrap to keep yaw finite and prevent planSpin from producing NaN
          this.yaw = (((p.from + p.sgn * p.D) % TAU) + TAU) % TAU;
          this.rest = this.yaw;
          this.omega = 0;
          this.pitch = 0;
          this.swayT = 0;
        }
      } else if (s.idleSpin) {
        this.yaw = (this.yaw + s.idleSpin * dt) % TAU;
        this.omega = s.idleSpin;
      }
      if (this.spin !== "run") this.pitch = 0;
      this.rollA = this.rollA || 0;
      if (s.passRoll && this.cols.some((c) => c.stage === "in")) this.rollA += s.passRoll * dt;
      else this.rollA += (0 - this.rollA) * Math.min(1, dt * 2.2);
      this.pitch += this.rollA;
      {
        const r = s.driftRate,
          acc = -r * r * (this.drift - this.driftTo) - 1.5 * r * this.driftV;
        this.driftV += acc * dt;
        this.drift += this.driftV * dt;
      }
    }
    opticsPose(who) { return who === 0 ? 0.25 : this.flip(this.geo()) - 0.25; }
    tickOptics(dt) {
      const s = this.s;
      if (this.canvas.clientWidth !== this.W || this.canvas.clientHeight !== this.H) this
        .resize();
      if (this.reduced) {
        this.appear = 1;
        this.speaker = 0;
        this.yaw = this.opticsPose(0);
        this.pitch = -0.3;
        this.prismPulse = 1;
        const G = this.geo(),
          span = G.dotB.x - G.dotA.x;
        this.cols = Array.from({ length: 17 }, (_, i) => ({
          x: G.dotA.x + span * (i + 1) / 18,
          i
        }));
        return;
      }
      dt *= s.speedMul;
      this.t += dt;
      this.appear = Math.min(1, this.appear + dt / Math.max(0.05, s.appear));
      this.yaw = (this.yaw + s.idleSpin * dt) % TAU;
      this.pitch = -0.3 + this.rollA + 0.055 * Math.sin(this.t * 0.9);
      if (this.appear < 1) return;
      const G = this.geo(),
        dir = this.speaker === 0 ? 1 : -1;
      const from = this.speaker === 0 ? G.dotA : G.dotB,
        to = this.speaker === 0 ? G.dotB : G.dotA;
      const radius = Math.min(s.radius, this.W * 0.015),
        gap = radius * s.colGap;
      const speed = s.speed * clamp(this.W / 1000, 0.6, 1.15);
      const total = Math.max(3, Math.min(Math.round(s.words), Math.floor(Math.abs(to.x - from
        .x) / gap * 0.48)));
      if (this.phase === 'speak') {
        this.spawnT += dt;
        const every = gap / speed;
        while (this.spawned < total && (this.spawned === 0 || this.spawnT >= every)) {
          this.spawnT = this.spawned ? this.spawnT - every : 0;
          this.spawned++;
          this.cols.push({ x: from.x, i: this.spawned });
          this.lastSpawn[this.speaker] = this.t;
        }
        this.cols.forEach(c => { c.x += dir * speed * dt; });
        this.cols = this.cols.filter(c => dir * (to.x - c.x) > 0);
        const O = this.opticsGeometry();
        if (!this.passSpin && this.cols.some(c => dir * (c.x - O.entry) >= 0)) {
          const tail = this.cols[this.cols.length - 1];
          this.passSpin = {
            time: 0,
            duration: Math.max(1.7, 1.3 * (Math.max(0, dir * (O.exit - tail.x)) + Math.max(0,
              total - this.spawned) * gap) / speed)
          };
          this.spin = 'run';
        }
        this.cols.forEach(c => {
          if (c.entry === undefined && dir * (c.x - O.entry) >= 0) {
            c.entry = O.entry;
            c.depth = Math.max(1, Math.abs(O.exit - O.entry));
          }
        });
        if (this.spawned >= total && !this.cols.length) {
          this.phase = 'wait';
          this.wait = s.pause;
        }
      } else if (this.phase === 'wait') {
        this.wait -= dt;
        if (this.wait <= 0 && (!this.passSpin || this.passSpin.time >= this.passSpin
            .duration)) {
          this.phase = 'turn';
          this.spin = 'run';
          this.turnT = 0;
          this.from = this.yaw;
          const delta = this.opticsPose(1 - this.speaker) - this.opticsPose(this.speaker);
          this.turnTo = this.from + delta;
        }
      } else if (this.phase === 'turn') {
        this.turnT += dt;
        const u = clamp(this.turnT / Math.max(0.3, s.turn), 0, 1);
        const ease = u * u * u * (u * (u * 6 - 15) + 10);
        this.yaw = this.from + (this.turnTo - this.from) * ease + s.idleSpin * this.turnT;
        if (u >= 1) {
          this.speaker = 1 - this.speaker;
          this.spin = 'rest';
          this.phase = 'speak';
          this.spawned = 0;
          this.spawnT = 0;
          this.passSpin = null;
          this.rollA = 0;
          this.yaw = ((this.yaw % TAU) + TAU) % TAU;
        }
      }
      if (this.passSpin && this.phase !== 'turn') {
        const p = this.passSpin;
        p.time = Math.min(p.duration, p.time + dt);
        const u = p.time / p.duration;
        const turn = smooth(u);
        this.rollA = TAU * turn;
        if (u >= 1) this.spin = 'rest';
      }
      const pulseGeo = this.opticsGeometry();
      const nearGlass = this.cols.some(c => {
        const approach = pulseGeo.dir * (c.x - pulseGeo.entry);
        return approach >= -radius * 2.5 && pulseGeo.dir * (pulseGeo.exit - c.x) >= -radius;
      });
      this.prismPulse += ((nearGlass ? 1 : 0) - this.prismPulse) * Math.min(1, dt * (nearGlass ?
        7 : 3.5));
      this.pitch = -0.3 + this.rollA + 0.055 * Math.sin(this.t * 0.9);
      this.drift = 0;
    }
    opticsGeometry() {
      const G = this.geo(),
        R = this.project(G),
        cuts = [];
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 2],
        [1, 3],
        [2, 3]
      ].forEach(([i, j]) => {
        const a = R[i],
          b = R[j];
        if ((a[1] <= 0 && b[1] >= 0) || (b[1] <= 0 && a[1] >= 0)) {
          const t = Math.abs(b[1] - a[1]) < 0.0001 ? 0 : -a[1] / (b[1] - a[1]);
          cuts.push(G.cx + a[0] + (b[0] - a[0]) * t);
        }
      });
      const dir = this.speaker === 0 ? 1 : -1;
      const entry = dir > 0 ? Math.min(...cuts) : Math.max(...cuts);
      const exit = dir > 0 ? Math.max(...cuts) : Math.min(...cuts);
      const from = this.speaker === 0 ? G.dotA.x : G.dotB.x;
      const to = this.speaker === 0 ? G.dotB.x : G.dotA.x;
      const reach = Math.max(1, Math.abs(to - entry));
      return {
        ...G,
        dir,
        entry,
        exit,
        from,
        to,
        reach,
        fan: Math.min(this.s.fanOut * 30,
          reach * 0.19, G.base * 0.28)
      };
    }
    opticsSample(x, lane, O) {
      const q = clamp(O.dir * (x - O.entry) / O.reach, 0, 1);
      const exitQ = clamp(Math.abs(O.exit - O.entry) / O.reach, 0.05, 0.9);
      const outgoing = clamp(O.dir * (x - O.exit) / Math.max(1, Math.abs(O.to - O.exit)), 0, 1);
      const fanShape = q <= exitQ ?
        0.45 * Math.pow(Math.sin(Math.PI * q / exitQ), 2) :
        Math.pow(Math.sin(TAU * outgoing), 2);
      const spread = O.fan * fanShape;
      const colour = smooth(clamp((q / exitQ - 0.38) / 0.48, 0, 1));
      const arrival = smooth(clamp((outgoing - 0.65) / 0.35, 0, 1));
      return { y: O.cy + lane * spread, spread, colour, arrival, swell: fanShape };
    }
    opticsCircles(fn) {
      const s = this.s,
        O = this.opticsGeometry();
      const n = Math.max(1, Math.round(s.count)),
        mid = (n - 1) / 2,
        centre = Math.floor(n / 2);
      const r = Math.min(s.radius, this.W * 0.015);
      this.cols.forEach(c => {
        const start = smooth(clamp(Math.abs(c.x - O.from) / (r * 2), 0, 1));
        for (let j = 0; j < n; j++) {
          const lane = (j - mid) / Math.max(1, mid),
            P = this.opticsSample(c.x, lane, O),
            offset = Math.abs(P.y - O.cy);
          const bud = j === centre ? 1 : smooth(clamp(offset / (r * 1.8), 0, 1));
          const radius = r * (0.72 + 0.28 * start) * bud * (c.entry === undefined ? 1 :
            0.8 + 0.2 * P.swell);
          if (radius < 0.3) continue;
          const colour = c.entry === undefined ? (this.reduced ? P.colour : 0) : P.colour;
          const pal = s.spectrum,
            spectral = mix('#ffffff', pal[j % pal.length], colour);
          const destination = this.speaker === 0 ? s.dotB : s.dotA;
          const col = mix(spectral, destination, P.arrival);
          fn(c.x, P.y, radius, col, colour);
        }
      });
    }
    glassLayer(g, G, front, appear) {
      const s = this.s,
        R = this.project(G),
        faces = this.faces(G, true);
      g.save();
      g.translate(G.cx, G.cy);
      g.scale(0.94 + 0.06 * appear, 0.94 + 0.06 * appear);
      if (!front) {
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = appear * 0.92;
        g.fillStyle = '#f8f3ea';
        g.beginPath();
        faces.filter(f => f.front).forEach(f => {
          f.idx.forEach((k, j) => j ? g.lineTo(R[k][0], R[k][1]) : g.moveTo(R[k][0], R[k][
            1
          ]));
          g.closePath();
        });
        g.fill();
      }
      g.globalCompositeOperation = s.faceBlend;
      faces.filter(f => f.front === front).forEach(f => {
        g.beginPath();
        f.idx.forEach((k, j) => j ? g.lineTo(R[k][0], R[k][1]) : g.moveTo(R[k][0], R[k][
          1
        ]));
        g.closePath();
        g.fillStyle = f.colour;
        g.globalAlpha = appear * s.faceAlpha;
        g.fill();
      });
      g.restore();
    }
    drawOptics() {
      const g = this.g,
        s = this.s,
        O = this.opticsGeometry(),
        d = this.dpr;
      g.setTransform(d, 0, 0, d, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = s.ground;
      g.fillRect(0, 0, this.W, this.H);
      const appear = smooth(this.appear);
      this.glassLayer(g, O, false, appear);
      this.glassLayer(g, O, true, appear);
      const circles = [];
      this.opticsCircles((x, y, r, col, energy) => {
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(r) && r > 0) circles
          .push({ x, y, r, col, energy });
      });
      if (circles.length) {
        const o = this.og;
        g.save();
        g.globalAlpha = .16;
        circles.forEach(({ x, y, r, col, energy }) => {
          if (energy < .01) return;
          g.shadowColor = col;
          g.shadowBlur = energy * r;
          g.fillStyle = col;
          g.beginPath();
          g.arc(x, y, r, 0, TAU);
          g.fill();
        });
        g.restore();
        o.setTransform(d, 0, 0, d, 0, 0);
        o.globalAlpha = 1;
        o.globalCompositeOperation = 'source-over';
        o.fillStyle = '#ffffff';
        o.fillRect(0, 0, this.W, this.H);
        o.globalCompositeOperation = 'multiply';
        circles.forEach(({ x, y, r, col }) => {
          o.fillStyle = col;
          o.beginPath();
          o.arc(x, y, r, 0, TAU);
          o.fill();
        });
        o.globalCompositeOperation = 'destination-in';
        o.fillStyle = '#000000';
        o.beginPath();
        circles.forEach(({ x, y, r }) => {
          o.moveTo(x + r, y);
          o.arc(x, y, r, 0, TAU);
        });
        o.fill();
        g.drawImage(this.off, 0, 0, this.W, this.H);
      }
      if (s.dots) {
        [
          [O.dotA, s.dotA],
          [O.dotB, s.dotB]
        ].forEach(([p, col]) => {
          g.fillStyle = col;
          g.beginPath();
          g.arc(p.x, p.y, Math.min(s.radius, this.W * .015) * s.dotSize * appear, 0, TAU);
          g.fill();
        });
      }
    }
    planSpin(G, sgn) {
      const s = this.s,
        base = (this.faceLeft !== (s.end === "mark")) ? 0 : this.flip(G),
        y0 = sgn * this.yaw;
      const Tc = (Math.max(1, Math.round(s.words)) - 1) * (s.colGap * s.radius) / s.speed,
        ramps = s.strike + s.brake;
      let best = null;
      for (let k = 0; k < 16; k++) {
        const D = base + TAU * k - y0;
        if (D < 0.5) continue;
        const T = Math.max(clamp(D / s.spin + ramps / 2, Tc - 0.5 * s.slack, Tc + 0.5 * s
          .slack), ramps / 2, 0.3);
        const f = Math.min(1, T / ramps),
          up = s.strike * f,
          dn = s.brake * f,
          w = D / (T - (up + dn) / 2),
          cost = Math.abs(Math.log(w / s.spin));
        if (!best || cost < best.cost) best = { D, T, up, dn, w, cost, Tc };
        if (w > s.spin * 3) break;
      }
      if (!best) {
        const from = Number.isFinite(y0) ? y0 : 0;
        const D = (((base - from) % TAU) + TAU) % TAU + TAU;
        const T = Math.max(D / s.spin, ramps / 2, 0.3),
          f = Math.min(1, T / ramps),
          up = s.strike * f,
          dn = s.brake * f;
        best = { D, T, up, dn, w: D / (T - (up + dn) / 2), cost: 0, Tc };
        if (!Number.isFinite(this.yaw)) this.yaw = 0;
      }
      this.plan = { ...best, from: this.yaw, sgn };
      this.runT = 0;
      this.spin = "run";
    }
    solid(G) {
      const hx = G.hx,
        b = G.base,
        F = [
          [hx * 2 / 3, 0],
          [-hx / 3, -b / 2],
          [-hx / 3, b / 2]
        ];
      const edge = (Math.hypot(F[0][0] - F[1][0], F[0][1] - F[1][1]) + Math.hypot(F[1][0] - F[2]
          [0], F[1][1] - F[2][1]) + Math.hypot(F[2][0] - F[0][0], F[2][1] - F[0][1])) / 3,
        h = edge * 0.8165;
      return {
        V: [
          [F[0][0], F[0][1], h / 4],
          [F[1][0], F[1][1], h / 4],
          [F[2][0], F[2][1], h / 4],
          [0, 0, -3 * h / 4]
        ],
        h,
        hx
      };
    }
    flip(G) { const { h, hx } = this.solid(G); return Math.atan2(-h, hx / 3) + Math.PI; }
    project(G) {
      const { V } = this.solid(G), cA = Math.cos(this.yaw), sA = Math.sin(this.yaw), cP = Math
        .cos(this.pitch), sP = Math.sin(this.pitch);
      return V.map(([x, y, z]) => {
        const x1 = x * cA + z * sA,
          z1 = -x * sA + z * cA;
        return [x1, y * cP - z1 * sP, y * sP + z1 * cP];
      });
    }
    faces(G, includeBack = false) {
      const s = this.s,
        R = this.project(G || this.geo()),
        cols = [s.arrow, s.faceBack, s.faceA, s.faceB];
      return [
        [0, 1, 2],
        [3, 2, 1],
        [0, 3, 1],
        [0, 2, 3]
      ].map((idx, i) => {
        const [a, b, c] = idx.map((k) => R[k]),
          e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
          e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[
          1] - e1[1] * e2[0]];
        const ctr = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[
          2]) / 3];
        if (n[0] * ctr[0] + n[1] * ctr[1] + n[2] * ctr[2] < 0) n = n.map((v) => -v);
        const area = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[
          1])) / 2;
        return { idx, i, z: ctr[2], front: n[2] > 0, colour: cols[i], area };
      }).filter((f) => includeBack || f.front).sort((a, b) => a.z - b.z);
    }
    pyramid(g, G) {
      const R = this.project(G);
      this.faces(G).forEach((f) => {
        g.fillStyle = f.colour;
        g.strokeStyle = f.colour;
        g.lineWidth = 1;
        g.beginPath();
        f.idx.forEach((k, j) => (j ? g.lineTo(R[k][0], R[k][1]) : g.moveTo(R[k][0], R[k][
          1
        ])));
        g.closePath();
        g.fill();
        g.stroke();
      });
    }
    eachCircle(fn) {
      const s = this.s,
        G = this.geo(),
        dir = this.speaker === 0 ? 1 : -1,
        n = Math.max(1, Math.round(s.count)),
        mid = (n - 1) / 2,
        centre = Math.floor(n / 2);
      const voice = (v) => [v === 0 ? s.voiceA : s.voiceB, s.wavelength * (v === 0 ? s.waveA : s
        .waveB)];
      this.cols.forEach((c) => {
        const before = c.stage === "out" || (c.stage === "in" && (dir > 0 ? c.x < G.cx : c
          .x > G.cx));
        let [pal, wl] = voice(!s.refract || before ? this.speaker : 1 - this.speaker);
        if (s.whiteIn > 0 && before) pal = pal.map((v) => mix(v, "#ffffff", s.whiteIn));
        if (c.stage === "in") {
          fn(c.x, G.cy, s.radius * 0.7, pal[centre % pal.length]);
          return;
        }
        if (c.stage !== "out" && c.stage !== "back") return;
        const wave = 0.5 + 0.5 * Math.sin((c.x / wl) * TAU - this.t * s.waveSpeed + s
          .jitter * Math.sin(c.i * 7.3) * 2);
        const open = c.e * (1 - c.s),
          fold = 1 - 0.3 * c.s * c.s;
        const r = s.radius * c.g * fold;
        if (r < 0.4) return;
        let E = s.amp * wave * open;
        if (s.lineIn && c.stage === "out") E *= 1 - s.lineIn;
        if (c.stage === "back") E *= s.fanOut;
        const spacing = 2 * r * (1 - s.overlap);
        for (let j = 0; j < n; j++) {
          const idx = n - 1 - j,
            off = E * (idx - mid) * spacing;
          const bud = idx === centre ? 1 : smooth(clamp((Math.abs(off) - 0.3 * r) / (0.7 *
            r), 0, 1));
          const rj = r * bud;
          if (rj < 0.4) continue;
          fn(c.x, G.cy + off, rj, pal[idx % pal.length]);
        }
      });
    }
    draw() {
      if (this.s.motionMode === 'refraction') return this.drawOptics();
      const g = this.g,
        o = this.og,
        s = this.s,
        G = this.geo(),
        d = this.dpr;
      g.setTransform(d, 0, 0, d, 0, 0);
      g.globalCompositeOperation = "source-over";
      g.fillStyle = s.ground;
      g.fillRect(0, 0, this.W, this.H);
      const safe = (fn) => (x, y, r, col) => {
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(r) && r > 0) fn(x, y,
          r, col);
      };
      let circles = 0;
      this.eachCircle(safe(() => { circles++; }));
      if (circles) {
        o.setTransform(d, 0, 0, d, 0, 0);
        o.globalCompositeOperation = "source-over";
        const lit = s.blend === "screen" || s.blend === "lighten";
        o.fillStyle = lit ? "#000" : "#fff";
        o.fillRect(0, 0, this.W, this.H);
        o.globalCompositeOperation = s.blend === "screen" ? "screen" : s.blend === "lighten" ?
          "lighten" : "multiply";
        this.eachCircle(safe((x, y, r, col) => {
          o.fillStyle = col;
          o.beginPath();
          o.arc(x, y, r, 0, TAU);
          o.fill();
        }));
        o.globalCompositeOperation = "destination-in";
        o.fillStyle = "#000";
        o.beginPath();
        this.eachCircle(safe((x, y, r) => {
          o.moveTo(x + r, y);
          o.arc(x, y, r, 0, TAU);
        }));
        o.fill();
        g.drawImage(this.off, 0, 0, this.W, this.H);
      }
      if (s.dots) {
        [
          [G.dotA, s.dotA, 0],
          [G.dotB, s.dotB, 1]
        ].forEach(([p, col, who]) => {
          const spoke = s.dotPulse ? clamp(1 - (this.t - this.lastSpawn[who]) / 0.28, 0,
            1) : 0;
          const pop = smooth(clamp((this.appear - (who ? 0.15 : 0)) / 0.5, 0, 1));
          const r = s.radius * s.dotSize * (1 + s.dotPulse * Math.sin(spoke * Math.PI)) *
            pop;
          if (r <= 0) return;
          g.fillStyle = col;
          g.beginPath();
          g.arc(p.x, p.y, r, 0, TAU);
          g.fill();
        });
      }
      const ak = this.appear >= 1 ? 1 : easeBack(clamp((this.appear - 0.3) / 0.7, 0, 1));
      if (ak > 0.01) {
        g.save();
        g.translate(G.cx, G.cy);
        g.scale(ak, ak);
        this.pyramid(g, G);
        g.restore();
      }
      if (this.mark) {
        const k = smooth(this.bloom),
          c = this.mark,
          palB = this.speaker === 0 ? s.voiceB : s.voiceA,
          from = palB[Math.floor(Math.max(1, Math.round(s.count)) / 2) % palB.length];
        const R = s.radius * 0.7 + (G.hx / 2 - s.radius * 0.7) * k,
          col = mix(from, s.markCircle, k),
          P = this.project(G);
        g.fillStyle = col;
        g.beginPath();
        g.arc(c.x, G.cy, R, 0, TAU);
        g.fill();
        g.save();
        g.beginPath();
        g.arc(c.x, G.cy, R, 0, TAU);
        g.clip();
        g.translate(G.cx, G.cy);
        g.globalAlpha = k;
        g.fillStyle = multiply(s.markCircle, s.arrow);
        g.beginPath();
        [0, 1, 2].forEach((i, j) => (j ? g.lineTo(P[i][0], P[i][1]) : g.moveTo(P[i][0], P[i][
          1
        ])));
        g.closePath();
        g.fill();
        g.restore();
      }
    }
    start() {
      if (this.io) return;
      let last = 0;
      const loop = (now) => {
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
        last = now;
        this.tick(dt);
        this.draw();
        this.raf = requestAnimationFrame(loop);
      };
      this.io = new IntersectionObserver((es) => {
        const on = es.some((e) => e.isIntersecting);
        if (on && !this.raf) {
          last = 0;
          this.raf = requestAnimationFrame(loop);
        } else if (!on && this.raf) {
          cancelAnimationFrame(this.raf);
          this.raf = 0;
        }
      });
      this.io.observe(this.canvas);
    }
    stop() {
      if (this.io) {
        this.io.disconnect();
        this.io = null;
      }
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  PrsmHero.REFRACTION = REFRACTION;
  window.PrsmHero = PrsmHero;

  /* ==========================================================================
     PRISM STREAM HERO (Ribbon, Signal, Fan Studies)
     ========================================================================== */
  const { C, MIX } = window.PRSM;
  const GREEN = multiply(C.aqua, C.yellow),
    BLUE = multiply(MIX.pink, MIX.aqua),
    CORAL = multiply(MIX.pink, MIX.yellow);
  const FACES = Object.freeze({
    arrow: C.pink,
    faceBack: C.aqua,
    faceA: C.yellow,
    faceB: '#ffffff'
  });
  const GROUPED_FACETS = Object.freeze({
    '1:0': BLUE,
    '1:2': GREEN,
    '1:3': C.aqua,
    '0:1': BLUE,
    '2:1': CORAL,
    '3:1': C.pink,
    '0:2': CORAL,
    '2:0': CORAL,
    '0:3': C.pink,
    '3:0': C.pink,
    '2:3': C.yellow,
    '3:2': C.yellow,
  });
  const FACETS = Object.freeze({
    '0:1': C.yellow,
    '0:2': BLUE,
    '0:3': C.pink,
    '1:2': CORAL,
    '1:3': C.aqua,
    '2:3': GREEN,
  });
  const COLORS = Object.freeze([C.yellow, BLUE, C.pink, GREEN, CORAL, C.aqua]);
  const INSIDE_BLENDS = Object.freeze({
    Screen: 'screen',
    Overlay: 'overlay',
    Multiply: 'multiply'
  });
  const TRANSIT = 5,
    EMIT = 1.7,
    HOLD = .65;
  const STUDIES = Object.freeze({
    ribbon: {
      label: 'Mirrored split',
      colors: COLORS,
      description: 'Two voices exchange dot streams...'
    },
    signal: {
      label: 'Parallel bands',
      colors: COLORS,
      description: 'Gold dots separate through the prism...'
    },
    fan: {
      label: 'Dot fan',
      colors: COLORS,
      description: 'A steady chain of gold dots opens...'
    },
  });

  class PrsmStreamHero extends PrsmHero {
    constructor(canvas, opts = {}) {
      super(canvas, { ...PrsmHero.REFRACTION, ...opts, motionMode: 'stream' });
      this.study = Object.hasOwn(STUDIES, opts.study) ? opts.study : 'ribbon';
      Object.assign(this.s, {
        streamWidth: .95,
        streamSpread: 1.25,
        streamSpeed: 1.3,
        streamSpacing: 1.45,
        streamLines: 17,
        streamPaused: false,
        streamRotationX: 0,
        streamRotationY: 0,
        streamFloat: .15,
        streamTurnSeconds: 1.65,
        streamShiftX: 70,
        streamReactionEase: 1.2,
        streamScaleGrowth: .55,
        streamSettleSeconds: 1.15,
        streamInsideBlend: 'Multiply',
        streamInsideStrength: .95,
        streamFacetLayout: 'Grouped',
        streamPrismSize: .75,
        streamFloatSpeed: 1.25,
        streamBellPower: 1.8,
        streamBloom: 1.2,
        streamColorOffset: 0,
        streamArrivalFlow: 1,
        streamTurnCarry: 1,
        streamReturnLength: 2.5,
        streamTransit: TRANSIT,
        streamEmit: EMIT,
        streamHold: HOLD,
        ...FACES
      });
      canvas.setAttribute('aria-label', STUDIES[this.study].description);
      this.pose();
    }
    get palette() { return COLORS; }
    get voiceColors() { return [C.yellow, C.pink]; }
    timing() {
      const transit = this.s.streamTransit,
        emit = this.s.streamEmit,
        hold = this.s.streamHold;
      return { transit, emit, hold, leg: transit + emit + hold };
    }
    facetColor(a, b) {
      return this.s.streamFacetLayout === 'Grouped' ?
        GROUPED_FACETS[a.i + ':' + b.i] :
        FACETS[[a.i, b.i].sort((x, y) => x - y).join(':')];
    }
    resize() {
      super.resize();
      if (this.study) {
        this.pose();
        this.draw();
      }
    }
    pose() {
      if (this.study === 'ribbon') {
        const { leg } = this.timing();
        const turn = Math.floor(this.t / leg),
          dir = turn % 2 ? -1 : 1,
          elapsed = this.t % leg;
        if (this.reduced) {
          this.yaw = .24;
          this.pitch = -.3 * this.s.streamFloat;
          this.poseAnchor = .5;
          this.drift = 0;
          this.prismScale = 1;
          this.spin = 'rest';
        } else {
          const plan = this.contactPlan(turn, dir);
          this.impactTime = plan.impact;
          this.releaseTime = plan.release;
          const hit = elapsed - plan.impact,
            rotation = fluid(hit / plan.turnSeconds);
          const response = fluid(hit / plan.attack) * (1 - fluid((elapsed - plan.release) / plan
            .settle));
          this.setPose(elapsed, turn * leg, dir, rotation, response);
          this.spin = hit > 0 && (response > 0 || rotation < 1) ? 'run' : 'rest';
        }
        Object.assign(this.s, FACES);
        return;
      }
      this.yaw = -.48;
      this.pitch = 0;
      this.poseAnchor = .5;
      this.prismScale = 1;
      this.spin = 'rest';
      Object.assign(this.s, FACES);
    }
    idleYaw(time) {
      return .12 + .045 * Math.sin(time * .7 * this.s.streamFloatSpeed) * this.s.streamFloat;
    }
    setPose(elapsed, start, dir, rotation, response) {
      const float = this.s.streamFloat,
        left = this.flip({ base: 1, hx: this.s.arrowShape });
      const from = dir > 0 ? left : left + Math.PI,
        to = dir > 0 ? left + Math.PI : left;
      const idleYaw = this.idleYaw(start + elapsed);
      const excursion = 16 * rotation * rotation * (1 - rotation) * (1 - rotation);
      this.yaw = from + (to - from) * rotation + idleYaw + dir * this.s.streamRotationY * Math
        .PI / 180 * excursion;
      this.pitch = -.3 * float + dir * this.s.streamRotationX * Math.PI / 180 * excursion;
      this.contactCorner = 3;
      this.drift = dir * this.s.streamShiftX * Math.min(1, this.W / 1150) * response;
      this.prismScale = 1 + this.s.streamScaleGrowth * response;
    }
    touchesPrism(circles, G) {
      const pts = G.P.map(([x, y]) => ({ x: G.cx + x, y: G.cy + y })).sort((a, b) => a.x - b
        .x || a.y - b.y);
      const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      const half = points => {
        const out = [];
        for (const p of points) {
          while (out.length > 1 && cross(out.at(-2), out.at(-1), p) <= 0) out.pop();
          out.push(p);
        }
        return out;
      };
      const hull = half(pts).slice(0, -1).concat(half(pts.slice().reverse()).slice(0, -1));
      const minX = pts[0].x,
        maxX = pts.at(-1).x;
      return circles.some(c => {
        if (c.x + c.r < minX || c.x - c.r > maxX) return false;
        let inside = true;
        for (let i = 0; i < hull.length; i++) {
          const a = hull[i],
            b = hull[(i + 1) % hull.length],
            dx = b.x - a.x,
            dy = b.y - a.y;
          if (cross(a, b, c) < 0) inside = false;
          const q = clamp(((c.x - a.x) * dx + (c.y - a.y) * dy) / (dx * dx + dy * dy || 1));
          if ((c.x - a.x - q * dx) ** 2 + (c.y - a.y - q * dy) ** 2 <= c.r * c.r)
            return true;
        }
        return inside;
      });
    }
    contactPlan(turn, dir) {
      const key = JSON.stringify([this.W, this.H, turn, this.s]);
      if (this._contactPlan?.key === key) return this._contactPlan;
      const { transit, emit, leg } = this.timing(), start = turn * leg;
      const firstTouches = t => {
        this.setPose(t, start, dir, 0, 0);
        const G = this.geometry(),
          x = G.start + (G.end - G.start) * t / transit;
        return this.touchesPrism([{ x, y: G.cy, r: this.dotRadius() }], G);
      };
      let lo = 0,
        hi = transit;
      for (let i = 1; i <= 96; i++) {
        const t = transit * i / 96;
        if (firstTouches(t)) { hi = t; break; } lo = t;
      }
      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;
        if (firstTouches(mid)) hi = mid;
        else lo = mid;
      }
      const impact = hi,
        baseAttack = Math.min(this.s.streamReactionEase, emit * .8);
      const motionFor = release => {
        const span = Math.max(.05, release - impact);
        const settle = Math.min(this.s.streamSettleSeconds * this.s.streamReturnLength, leg -
          release - .12);
        return {
          attack: Math.min(span, baseAttack + (span - baseAttack) * this.s.streamArrivalFlow),
          settle,
          turnSeconds: Math.min(this.s.streamTurnSeconds + span * .6 * this.s
            .streamArrivalFlow + settle * this.s.streamTurnCarry, leg - impact - .12)
        };
      };
      const passing = t => {
        const { turnSeconds } = motionFor(t);
        this.setPose(t, start, dir, fluid((t - impact) / turnSeconds), 1);
        const G = this.geometry();
        G.legTime = t;
        const xs = G.P.map(p => G.cx + p[0]),
          r = this.dotRadius();
        return this.touchesPrism(this.circles(G, {
          min: Math.min(...xs) - r,
          max: Math.max(...
            xs) + r
        }), G);
      };
      const end = transit + emit;
      const lastContact = () => {
        let lastInside = impact,
          firstClear = end;
        for (let i = 0; i <= 48; i++) {
          const t = impact + (end - impact) * i / 48;
          if (passing(t)) {
            lastInside = t;
            firstClear = end;
          }
          else if (firstClear === end) firstClear = t;
        }
        let a = lastInside,
          b = Math.max(firstClear, a);
        for (let i = 0; i < 18; i++) {
          const mid = (a + b) / 2;
          if (passing(mid)) a = mid;
          else b = mid;
        }
        return b;
      };
      const release = lastContact();
      return this._contactPlan = { key, impact, release, ...motionFor(release) };
    }
    set(patch) {
      super.set(patch);
      if (this.study) {
        this.pose();
        this.draw();
      }
    }
    tick(dt) {
      if (!this.reduced && !this.s.streamPaused) this.t += dt * this.s.speedMul * this.s
        .streamSpeed;
      this.appear = 1;
      if (this.canvas.clientWidth !== this.W || this.canvas.clientHeight !== this.H) this
        .resize();
      this.pose();
    }
    geo() {
      const G = super.geo();
      G.restBase = Math.min(G.base, this.W * .23);
      const clearance = Math.abs(G.dotB.x - G.dotA.x) / 2 - Math.abs(this.drift) - this
        .dotRadius() * 2;
      G.base = Math.min(G.restBase * (this.s.streamPrismSize ?? 1) * (this.prismScale || 1),
        clearance);
      G.hx = G.base * this.s.arrowShape;
      return G;
    }
    project(G) {
      const P = super.project(G);
      if (this.study !== 'ribbon') return P;
      const offset = P[this.contactCorner ?? 3][1];
      return P.map(([x, y, z]) => [x, y - offset, z]);
    }
    faces(G, includeBack = false) {
      const R = super.project(G || this.geo());
      return super.faces(G, true).map(f => {
        const [a, b, c] = f.idx.map(k => R[k]), u = b.map((v, i) => v - a[i]), v = c.map((n,
          i) => n - a[i]);
        const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[
          1] * v[0]];
        const ctr = a.map((p, i) => (p + b[i] + c[i]) / 3),
          outward = n.reduce((sum, p, i) => sum + p * ctr[i], 0) < 0 ? -1 : 1;
        return { ...f, front: n[2] * outward > 0 };
      }).filter(f => includeBack || f.front);
    }
    dotRadius() {
      return (this.study === 'ribbon' ? 8.2 : 6.8) * clamp(this.W / 1150, .46, 1.15) * this.s
        .streamWidth;
    }
    lanePairs() {
      return this.study === 'ribbon' ? Math.max(2, Math.min(8, Math.round((this.s.streamLines -
        1) / 2))) : 2;
    }
    lanes() {
      const pairs = this.lanePairs();
      return Array.from({ length: pairs * 2 + 1 }, (_, i) => (i - pairs) / pairs);
    }
    geometry() {
      const G = this.geo(),
        P = this.project(G),
        cuts = [];
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 2],
        [1, 3],
        [2, 3]
      ].forEach(([i, j]) => {
        const a = P[i],
          b = P[j];
        if ((a[1] <= 0 && b[1] >= 0) || (b[1] <= 0 && a[1] >= 0)) {
          const u = Math.abs(b[1] - a[1]) < .0001 ? 0 : -a[1] / (b[1] - a[1]);
          cuts.push(G.cx + a[0] + (b[0] - a[0]) * u);
        }
      });
      const { leg } = this.timing(), turn = Math.floor(this.t / leg), dir = this.study ===
        'ribbon' && turn % 2 ? -1 : 1;
      const entry = dir > 0 ? Math.min(...cuts) : Math.max(...cuts);
      return {
        ...G,
        P,
        dir,
        legTime: this.t % leg,
        entry,
        splitStart: entry - dir * this.dotRadius(),
        exit: dir > 0 ? Math.max(...cuts) : Math.min(...cuts),
        start: dir > 0 ? G.dotA.x : G.dotB.x,
        end: this.study === 'fan' ? this.W * 1.04 : dir > 0 ? G.dotB.x : G.dotA.x,
        spread: Math.min(G.restBase * (this.study === 'ribbon' ? .43 : .55), this.W * .09) *
          this.s.streamSpread,
        width: clamp(this.W / 1150, .46, 1.15) * this.s.streamWidth
      };
    }
    point(x, lane, G) {
      const origin = this.study === 'ribbon' ? G.splitStart : G.entry;
      const q = clamp(G.dir * (x - origin) / Math.max(1, Math.abs(G.end - origin)));
      let opening;
      if (this.study === 'fan') opening = q * 1.5;
      else if (this.study === 'signal') opening = Math.min(q / .27, 1, (1 - q) / .23);
      else opening = Math.pow(Math.max(0, Math.sin(Math.PI * q)), this.s.streamBellPower);
      return { x, y: G.cy + lane * G.spread * opening };
    }
    dotColor(x, lane, G) {
      if (this.study !== 'ribbon') return COLORS[Math.round(Math.abs(lane) * (COLORS.length -
        1))];
      if (G.dir * (x - G.splitStart) <= 0) return this.voiceColors[G.dir > 0 ? 0 : 1];
      if (lane === 0) return this.voiceColors[G.dir > 0 ? 1 : 0];
      return COLORS[(Math.round(Math.abs(lane) * this.lanePairs()) + Math.round(this.s
        .streamColorOffset)) % COLORS.length];
    }
    circles(G = this.geometry(), bounds) {
      const radius = this.dotRadius();
      const spacing = radius * this.s.streamSpacing;
      const phase = (this.t * 72 * clamp(this.W / 1150, .46, 1.15)) % spacing;
      const circles = [];
      const reach = Math.abs(G.end - G.start),
        positions = [];
      if (this.study === 'ribbon') {
        const { transit, emit } = this.timing(), speed = reach / transit, head = this.reduced ?
          reach : G.legTime * speed;
        const length = this.reduced ? reach : emit * speed;
        const count = Math.floor(length / spacing) + 1;
        for (let i = 0; i < count; i++) {
          const distance = head - i * spacing;
          if (distance >= 0 && distance <= reach) positions.push(G.start + G.dir * distance);
        }
      } else {
        for (let x = G.start - spacing + phase; x <= G.end; x += spacing)
          if (x >= G.start) positions.push(x);
      }
      const lanes = this.lanes();
      for (const x of positions) {
        if (bounds && (x < bounds.min || x > bounds.max)) continue;
        for (const lane of lanes) {
          const pt = this.point(x, lane, G);
          const r = lane === 0 ? radius : radius * smooth(Math.abs(pt.y - G.cy) / (radius * this
            .s.streamBloom));
          if (r < .1) continue;
          circles.push({ x: pt.x, y: pt.y, r, color: this.dotColor(x, lane, G), lane });
        }
      }
      return circles;
    }
    glass(g, G, front) {
      if (!front) return;
      g.save();
      g.translate(G.cx, G.cy);
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      const faces = this.faces(G, true);
      const path = f => {
        g.beginPath();
        f.idx.forEach((k, j) => j ? g.lineTo(G.P[k][0], G.P[k][1]) : g.moveTo(G.P[k][0], G.P[
          k][1]));
        g.closePath();
      };
      faces.filter(f => f.front).forEach(near => {
        g.save();
        path(near);
        g.clip();
        faces.filter(f => !f.front).forEach(far => {
          const color = this.facetColor(near, far);
          g.fillStyle = color;
          g.strokeStyle = color;
          g.lineWidth = .6;
          path(far);
          g.fill();
          g.stroke();
        });
        g.restore();
      });
      g.restore();
    }
    prismClip(g, G) {
      g.beginPath();
      this.faces(G).forEach(f => {
        f.idx.forEach((k, j) => {
          const x = G.cx + G.P[k][0],
            y = G.cy + G.P[k][1];
          if (j) g.lineTo(x, y);
          else g.moveTo(x, y);
        });
        g.closePath();
      });
      g.clip();
    }
    liftDarkMixes(circles) {
      if (!circles.length) return;
      if (!this.floorCanvas) {
        this.floorCanvas = document.createElement('canvas');
        this.floorG = this.floorCanvas.getContext('2d');
      }
      const floor = this.floorCanvas,
        f = this.floorG,
        g = this.g,
        d = this.dpr;
      if (floor.width !== this.canvas.width || floor.height !== this.canvas.height) {
        floor.width = this.canvas.width;
        floor.height = this.canvas.height;
      }
      const x = Math.max(0, Math.floor(Math.min(...circles.map(c => c.x - c.r)) * d) - 1);
      const y = Math.max(0, Math.floor(Math.min(...circles.map(c => c.y - c.r)) * d) - 1);
      const w = Math.min(floor.width, Math.ceil(Math.max(...circles.map(c => c.x + c.r)) * d) +
        1) - x;
      const h = Math.min(floor.height, Math.ceil(Math.max(...circles.map(c => c.y + c.r)) * d) +
        1) - y;
      if (w <= 0 || h <= 0) return;
      f.setTransform(1, 0, 0, 1, 0, 0);
      f.globalAlpha = 1;
      f.globalCompositeOperation = 'source-over';
      f.drawImage(this.canvas, x, y, w, h, x, y, w, h);
      f.globalCompositeOperation = 'luminosity';
      f.fillStyle = this.s.ground;
      f.fillRect(x, y, w, h);
      g.save();
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'lighten';
      g.drawImage(floor, x, y, w, h, x / d, y / d, w / d, h / d);
      g.restore();
    }
    draw() {
      if (!this.study) return;
      const g = this.g,
        o = this.og,
        G = this.geometry(),
        circles = this.circles(G);
      g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.fillStyle = this.s.ground;
      g.fillRect(0, 0, this.W, this.H);
      if (circles.length) {
        o.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        o.globalAlpha = 1;
        o.globalCompositeOperation = 'source-over';
        o.fillStyle = '#ffffff';
        o.fillRect(0, 0, this.W, this.H);
        o.globalCompositeOperation = 'multiply';
        circles.forEach(c => {
          o.fillStyle = c.color;
          o.beginPath();
          o.arc(c.x, c.y, c.r, 0, TAU);
          o.fill();
        });
        o.globalCompositeOperation = 'destination-in';
        o.fillStyle = '#000000';
        o.beginPath();
        circles.forEach(c => {
          o.moveTo(c.x + c.r, c.y);
          o.arc(c.x, c.y, c.r, 0, TAU);
        });
        o.fill();
        g.drawImage(this.off, 0, 0, this.W, this.H);
      }
      this.glass(g, G, true);
      if (circles.length) {
        g.save();
        this.prismClip(g, G);
        const strength = clamp(this.s.streamInsideStrength);
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = 1 - strength;
        g.drawImage(this.off, 0, 0, this.W, this.H);
        g.globalCompositeOperation = INSIDE_BLENDS[this.s.streamInsideBlend] || 'screen';
        g.globalAlpha = strength;
        g.drawImage(this.off, 0, 0, this.W, this.H);
        g.restore();
      }
      this.liftDarkMixes(circles);
      const voices = this.study === 'fan' ? [
        [G.dotA, this.voiceColors[0]]
      ] : [
        [G.dotA, this.voiceColors[0]],
        [G.dotB, this.voiceColors[1]]
      ];
      if (this.s.dots) voices.forEach(([pt, col]) => {
        g.globalAlpha = 1;
        g.fillStyle = col;
        g.beginPath();
        g.arc(pt.x, pt.y, Math.min(this.s.radius, this.W * .015) * this.s.dotSize, 0, TAU);
        g.fill();
      });
      g.globalAlpha = 1;
    }
  }

  PrsmStreamHero.STUDIES = STUDIES;
  window.PrsmStreamHero = PrsmStreamHero;
})();

/* ==========================================================================
   PRSM PAGE RUNNER & HOOKS
   ========================================================================== */
const HERO_ABOVE = 226;
const HERO_BELOW = 100;
const SUB_NUDGE = 0;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

(() => {
  const canvas = document.getElementById('hero-c');
  const heroEl = document.getElementById('hero');
  if (!canvas || !heroEl) return;

  const boot = () => {
    if (typeof PrsmHero === 'undefined') return setTimeout(boot, 40);
    start();
  };

  function start() {
    // Select between Refraction (default) and Stream Studies (?heroStudy=ribbon | signal | fan)
    const study = new URLSearchParams(location.search).get('heroStudy');
    const hero = (window.PrsmStreamHero && window.PrsmStreamHero.STUDIES && study && window
        .PrsmStreamHero.STUDIES[study]) ?
      new PrsmStreamHero(canvas, { study }) :
      new PrsmHero(canvas, PrsmHero.REFRACTION);

    hero.set({ lineY: 0.4 });
    heroEl.style.background = hero.s.ground;
    window.__prsm = { hero };

    const entering = document.documentElement.classList.contains('prsm-entering');
    if (entering) intro(hero);
    else hero.start();

    layout(hero);
    align(hero);
    wearFace(hero);
  }

  function intro(hero) {
    const stage = document.getElementById('stage');
    const reveal = [...document.querySelectorAll('.hero-copy')];
    const overlay = document.createElement('canvas');
    overlay.className = 'prsm-intro';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
    const ctx = overlay.getContext('2d');

    let began, lastTime, previousTurn = -1.7;
    hero.yaw -= 1.7;

    const finish = () => {
      reveal.forEach((el) => {
        el.style.removeProperty('transform');
        el.style.removeProperty('transform-origin');
      });
      overlay.remove();
      if (stage) {
        stage.style.removeProperty('opacity');
        stage.style.removeProperty('transform');
        stage.style.removeProperty('transform-origin');
      }
      document.documentElement.classList.remove('prsm-entering');
      hero.appear = 1;
      hero.draw();
      hero.start();
    };

    const frame = (now) => {
      if (began === undefined) began = now;
      const elapsed = (now - began) / 1000;
      const dt = lastTime === undefined ? 0 : Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (elapsed >= 2.1 || REDUCED) { finish(); return; }

      const ease = (u) => {
        u = Math.max(0, Math.min(1, u));
        return u * u * u * (u * (u * 6 - 15) + 10);
      };
      const zoom = ease((elapsed - 0.35) / 1.2);
      const W = innerWidth,
        H = innerHeight,
        d = Math.min(devicePixelRatio || 1, 2);

      if (overlay.width !== Math.round(W * d) || overlay.height !== Math.round(H * d)) {
        overlay.width = Math.round(W * d);
        overlay.height = Math.round(H * d);
      }
      if (hero.canvas.clientWidth !== hero.W || hero.canvas.clientHeight !== hero.H) hero
        .resize();

      const base = hero.geo();
      const bounds = hero.canvas.getBoundingClientRect();
      const initial = Math.min(W, H) * 0.76;
      const G = {
        ...base,
        cx: W / 2 + (bounds.left + base.cx - W / 2) * zoom,
        cy: H / 2 + (bounds.top + base.cy - H / 2) * zoom,
        base: initial + (base.base - initial) * zoom,
      };
      G.hx = G.base * hero.s.arrowShape;

      const turn = -1.7 * (1 - zoom);
      hero.yaw += turn - previousTurn;
      previousTurn = turn;

      const originalGeo = hero.geo;
      hero.geo = () => ({
        ...G,
        cx: G.cx - bounds.left,
        cy: G.cy - bounds.top,
        dotA: { ...G.dotA, y: G.cy - bounds.top },
        dotB: { ...G.dotB, y: G.cy - bounds.top },
      });
      hero.appear = 1;
      if (elapsed >= 0.35) hero.tick(dt);
      hero.pitch = -0.3 + (hero.rollA || 0) + 0.055 * Math.sin(hero.t * 0.9) + 0.4 * (1 - zoom);
      const showDots = hero.s.dots;
      hero.s.dots = elapsed >= 0.35;
      hero.draw();
      hero.s.dots = showDots;
      hero.geo = originalGeo;

      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = hero.s.ground;
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(hero.canvas, bounds.left, bounds.top, hero.W, hero.H);

      const contentZoom = ease((elapsed - 0.55) / 1.55);
      const scale = 1 + 1.35 * (1 - contentZoom);
      reveal.forEach((el) => {
        el.style.transform = 'none';
        const box = el.getBoundingClientRect();
        el.style.transformOrigin =
          (bounds.left + base.cx - box.left) + 'px ' + (bounds.top + base.cy - box.top) +
          'px';
        el.style.transform = 'scale(' + scale + ')';
      });

      if (elapsed > 0.65) {
        document.documentElement.classList.remove('prsm-entering');
        if (stage) stage.style.opacity = '1';
      }

      overlay.style.opacity = String(1 - ease((elapsed - 0.65) / 0.75));
      requestAnimationFrame(frame);
    };

    const go = () => requestAnimationFrame(() => requestAnimationFrame(frame));
    if (document.fonts) document.fonts.ready.then(go);
    else go();
  }

  function layout(hero) {
    const run = () => {
      const h = heroEl.clientHeight || 1;
      const prism = hero.s.arrowSize * h;
      hero.set({ lineY: Math.max(0.05, Math.min(0.95, (HERO_ABOVE + prism / 2) / h)) });
      heroEl.style.setProperty('--hero-copy-top', Math.round(HERO_ABOVE + prism + HERO_BELOW) +
        'px');
    };
    new ResizeObserver(run).observe(heroEl);
    run();
  }

  function align() {
    const h1El = heroEl.querySelector('h1');
    const subEl = heroEl.querySelector('.hero_sub .text-size-medium') || heroEl.querySelector(
      '.hero_sub');
    const wrapEl = heroEl.querySelector('.hero_text-wrap');
    if (!h1El || !subEl || !wrapEl) return;

    const inkTop = (el, sample) => {
      const cs = getComputedStyle(el);
      const g = document.createElement('canvas').getContext('2d');
      g.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const m = g.measureText(sample);
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize);
      return (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 +
        (m.fontBoundingBoxAscent - m.actualBoundingBoxAscent);
    };

    const run = () => {
      const d = inkTop(h1El, 'Prism is the first') - inkTop(subEl, 'Prism reasons over');
      wrapEl.style.setProperty('--hero-sub-top', (Math.round(d) + SUB_NUDGE) + 'px');
    };

    new ResizeObserver(run).observe(h1El);
    if (document.fonts) document.fonts.ready.then(run);
    run();
  }

  function wearFace(hero) {
    const word = heroEl.querySelector('.hero-lockup .word');
    if (!word) return;
    let worn = null;
    let wasSpinning = false;
    const wear = () => {
      const front = hero.faces().slice().sort((a, b) => b.area - a.area)[0];
      if (front && front.colour !== worn) {
        word.style.setProperty('--hero-word', front.colour);
        worn = front.colour;
      }
    };
    (function watch() {
      const spinning = hero.spin !== 'rest';
      if (wasSpinning && !spinning) wear();
      wasSpinning = spinning;
      requestAnimationFrame(watch);
    })();
  }

  boot();
})();
