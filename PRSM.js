(() => {
  const DOTS = ['#ffd46f', '#ffa0ff', '#2cc3e9'];
  let last = -1;
  document.querySelectorAll('.cards .card').forEach((card) => {
    card.addEventListener('pointerenter', () => {
      let i;
      do { i = Math.floor(Math.random() * 3); } while (i === last);
      last = i;
      card.style.setProperty('--card-accent', DOTS[i]);
    });
  });
})();

// PRSM MARK
(() => {
  const C = {
    yellow: "#f0be4d",
    pink: "#f08add",
    aqua: "#1dadc7",
    ink: "#2e2a25",
    inkDeep: "#24211d",
    paper: "#f0e9dd",
    paperLight: "#f8f3ea",
    paperDark: "#ddd6c9"
  };
  const MIX = { yellow: "#ffd46f", pink: "#ffa0ff", aqua: "#2cc3e9" };
  const MULT = { yellow: "#ffcf61", pink: "#ff96ff", aqua: "#13bee9" };
  const NAMES = {
    yellow: C.yellow,
    pink: C.pink,
    aqua: C.aqua,
    ink: C.ink,
    paper: C.paper,
    cream: C.paper,
    white: "#ffffff",
    green: "#2ee86b"
  };
  const hex2 = (h) => {
    h = h.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c +
      c).join("");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const toHex = (rgb) => "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(
    16).padStart(2, "0")).join("");
  const multiply = (a, b) => {
    const B = hex2(b);
    return toHex(hex2(a).map((v, i) => v * B[i] /
      255));
  };
  const plusDarker = (a, b) => {
    const B = hex2(b);
    return toHex(hex2(a).map((v, i) => v + B[i] -
      255));
  };
  const screen = (a, b) => {
    const B = hex2(b);
    return toHex(hex2(a).map((v, i) => 255 - (255 -
      v) * (255 - B[i]) / 255));
  };
  const mixc = (a, b, t) => {
    const A = hex2(a),
      B = hex2(b);
    return toHex(A.map((v, i) => v + (B[i] - v) * t));
  };
  const lum = (h) => {
    const [r, g, b] = hex2(h).map((v) => v / 255);
    return 0.2126 * r + 0.7152 *
      g + 0.0722 * b;
  };
  const isDark = (h) => lum(h) < 0.4;
  const resolve = (n) => NAMES[n] || (/^#/.test(n || "") ? n : C.yellow);
  const nameOf = (hex) => Object.keys(NAMES).find((k) => NAMES[k].toLowerCase() === (hex || "")
    .toLowerCase()) || hex;

  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const easeBack = (t) => {
    const c1 = 0.9,
      c2 = c1 * 1.525;
    return t < 0.5 ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2 : (
      Math.pow(2 * t - 2, 2) * ((c2 + 1) * (2 * t - 2) + c2) + 2) / 2;
  };
  class PrsmMark extends HTMLElement {
    static get observedAttributes() {
      return ["circle", "triangle", "overlap", "mode", "ground",
        "motion", "every", "hold", "dir", "recentre", "ease"
      ];
    }
    connectedCallback() {
      this.render();
      this._io = new IntersectionObserver(([e]) => (e.isIntersecting ? this.motion() : this
        .stopMotion()));
      this._io.observe(this);
    }
    disconnectedCallback() { this.stopMotion(); if (this._io) this._io.disconnect(); }
    attributeChangedCallback(n) {
      if (!this.isConnected) return;
      this.render();
      if (n === "motion") this.motion();
    }
    motion() {
      this.stopMotion();
      const m = this.getAttribute("motion");
      if (m === null || REDUCED) return;
      const c = this.querySelector(".c"),
        t = this.querySelector(".t"),
        o = this.querySelector(".o"),
        ot = this.querySelector(".ot"),
        every = +this.getAttribute("every") || 3.1,
        move = 0.9,
        cont = m === "pivot-continuous";
      const num = (n, d) => (this.hasAttribute(n) ? +this.getAttribute(n) : d);
      let last = performance.now(),
        T = 0,
        k = 0,
        land = -9,
        ang = 0,
        phase = 0;
      const step = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        T += dt;
        if (m === "gear" || m === "") {
          phase += dt / (num("every", 2) || 2);
          const g = PRSM.gearAt(phase, num("hold", 0), num("ease", 0.6), num("dir", 1) || 1,
            num("recentre", 0));
          t.style.transformOrigin = "50% 66.67%";
          t.style.transform = `translate(${g.tx}em, ${g.ty}em) rotate(${g.angle}deg)`;
          c.style.transform = `translate(${g.cx}em, ${g.cy}em)`;
          if (o) o.style.transform = c.style.transform;
          if (ot) ot.style.transform =
            `translate(${g.tx - g.cx}em, ${g.ty - g.cy}em) rotate(${g.angle}deg)`;
          this._raf = requestAnimationFrame(step);
          return;
        }
        if (cont) {
          ang += dt * 40;
          const turn = Math.floor(ang / 120);
          if (turn !== k) {
            k =
              turn;
            land = T;
          }
        }
        else {
          const kk = Math.floor(T / every),
            inCyc = T - kk * every,
            hold = every - move;
          if (kk !== k) {
            k = kk;
            land = T;
          }
          ang = 120 * (kk + (inCyc < hold ? 0 : easeBack((inCyc - hold) /
            move)));
        }
        const ks = 1 + 0.05 * Math.sin(Math.PI * Math.min(1, (T - land) / 0.38));
        t.style.transform = `rotate(${ang}deg)`;
        c.style.transform = `rotate(${ang}deg) scale(${ks})`;
        if (o) o.style.transform = c.style.transform;
        if (ot) ot.style.transform = `scale(${1 / ks})`;
        this._raf = requestAnimationFrame(step);
      };
      this._raf = requestAnimationFrame(step);
    }
    stopMotion() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    render() {
      const c = this.getAttribute("circle") || "aqua",
        t = this.getAttribute("triangle") || "yellow";
      const cc = resolve(c),
        tc = resolve(t);
      const o = this.getAttribute("overlap") || multiply(cc, tc);
      const st = this.style;
      st.setProperty("--c", cc);
      st.setProperty("--t", tc);
      st.setProperty("--o", o);
      st.setProperty("--c-mult", MULT[c] || cc);
      st.setProperty("--c-mix", MIX[c] || cc);
      st.setProperty("--t-mult", MULT[t] || tc);
      st.setProperty("--t-mix", MIX[t] || tc);
      if (!this.firstElementChild) this.innerHTML =
        '<i class="c"></i><i class="t"></i><i class="o"><b class="ot"></b></i>';
      this.querySelector(".c").classList.toggle("plain", !MIX[c]);
      this.querySelector(".t").classList.toggle("plain", !MIX[t]);
    }
  }
  if (!customElements.get("prsm-mark")) customElements.define("prsm-mark", PrsmMark);
  const SPOTS = [
    [0, 0],
    [-0.1443, -0.25],
    [0.1443, -0.25]
  ];
  const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const gearAt = (phase, hold = 0, ease = 0.6, dir = 1, recentre = 0) => {
    const k = Math.floor(phase),
      f = phase - k,
      run = Math.max(0.15, 1 - hold);
    const lin = Math.min(1, f / run),
      tt = lin + (easeIO(lin) - lin) * ease;
    const a = ((k % 3) + 3) % 3,
      b = (((k + (dir > 0 ? 1 : -1)) % 3) + 3) % 3;
    const ox = SPOTS[a][0] + (SPOTS[b][0] - SPOTS[a][0]) * tt,
      oy = SPOTS[a][1] + (SPOTS[b][1] - SPOTS[a][1]) * tt;
    const rx = -ox * recentre,
      ry = -oy * recentre;
    return { angle: -dir * 120 * (k + tt), tx: ox + rx, ty: oy + ry, cx: rx, cy: ry, k, f };
  };
  const gear = (T, every = 2, hold = 0, dir = 1, recentre = 0, ease = 0.6) => gearAt(T / every,
    hold, ease, dir, recentre);
  window.PRSM = {
    C,
    MIX,
    MULT,
    NAMES,
    hex2,
    toHex,
    multiply,
    plusDarker,
    screen,
    mixc,
    lum,
    isDark,
    resolve,
    nameOf,
    gear,
    gearAt,
    SPOTS
  };
})();
(() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)),
    toHex = (v) => "#" + v.map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, "0"))
    .join("");
  const multiply = (a, b) => {
      const B = hex2(b);
      return toHex(hex2(a).map((v, i) => v * B[i] /
        255));
    },
    mix = (a, b, k) => {
      const A = hex2(a),
        B = hex2(b);
      return toHex(A.map((v, i) => v + (B[i] - v) * k));
    };
  const easeBack = (t, c1 = 0.9) => {
    const c2 = c1 * 1.525;
    return t < 0.5 ? (Math.pow(2 * t,
      2) * ((c2 + 1) * 2 * t - c2)) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (2 * t - 2) +
      c2) + 2) / 2;
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
      new ResizeObserver(() => this.resize()).observe(canvas);
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
      if (previousWidth && this.s.motionMode === 'refraction') this.cols.forEach(word => {
        const scale = this.W / previousWidth;
        word.x *= scale;
        if (word.entry !== undefined) {
          word.entry *= scale;
          word.depth *= scale;
        }
      });
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
          this
            .phase = "wait";
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
        this.struck =
          true;
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
        }
        else if (t < p.T - p.dn) {
          w = p.w;
          d = 0.5 * p.w * p.up + p.w * (t - p.up);
        }
        else {
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
          this.yaw = (((p.from + p.sgn * p.D) % TAU) + TAU) % TAU;
          this.rest = this.yaw;
          this.omega = 0;
          this.pitch = 0;
          this.swayT = 0;
        }
      }
      else if (s.idleSpin) {
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
        fan: Math.min(this.s.fanOut * 30, reach * 0.19, G.base * 0.28)
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
      if (s.dots)[[O.dotA, s.dotA], [O.dotB, s.dotB]].forEach(([p, col]) => {
        g.fillStyle = col;
        g.beginPath();
        g.arc(p.x, p.y, Math.min(s.radius, this.W * .015) * s.dotSize * appear, 0, TAU);
        g.fill();
      });
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
        const [a, b, c] = idx.map((k) => R[k]), e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[
          2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
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
          fn(c.x, G.cy, s.radius * 0.7, pal[centre % pal
            .length]);
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
        if (Number.isFinite(x) && Number.isFinite(y) &&
          Number.isFinite(r) && r > 0) fn(x, y, r, col);
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
        }
        else if (!on && this.raf) {
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
})();

// PRSM PAGE 
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
    const hero = new PrsmHero(canvas, PrsmHero.REFRACTION);
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
        return u * u * u * (u * (u * 6 -
          15) + 10);
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
    const subEl = heroEl.querySelector('.hero_sub .text-size-medium') ||
      heroEl.querySelector('.hero_sub');
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

(() => {
  const modal = document.getElementById('video-modal');
  const frame = document.getElementById('video-open');
  if (!modal || !frame) return;

  const card = modal.querySelector('.vm-card');
  const back = document.getElementById('video-back');
  const x = document.getElementById('video-x');

  const frameTransform = () => {
    const f = frame.getBoundingClientRect();
    const t = card.getBoundingClientRect();
    const dx = f.left + f.width / 2 - (t.left + t.width / 2);
    const dy = f.top + f.height / 2 - (t.top + t.height / 2);
    return 'translate(' + dx + 'px, ' + dy + 'px) scale(' +
      (f.width / t.width) + ', ' + (f.height / t.height) + ')';
  };

  const open = () => {
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    if (REDUCED) return;
    card.style.transition = 'none';
    card.style.transform = frameTransform();
    back.style.opacity = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      card.style.transition = 'transform .55s cubic-bezier(.22, 1, .36, 1)';
      card.style.transform = '';
      back.style.opacity = '1';
    }));
  };

  const close = () => {
    if (REDUCED) {
      modal.hidden = true;
      document.documentElement.style.overflow = '';
      return;
    }
    card.style.transition = 'transform .4s cubic-bezier(.4, 0, .6, 1)';
    card.style.transform = frameTransform();
    back.style.opacity = '0';
    setTimeout(() => {
      modal.hidden = true;
      document.documentElement.style.overflow = '';
      card.style.transform = '';
      card.style.transition = 'none';
    }, 400);
  };

  frame.addEventListener('click', (e) => {
    e.stopPropagation();
    open();
  }, true);
  frame.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });
  if (x) x.addEventListener('click', close);
  if (back) back.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
})();

(() => {
  const circle = (x, y, r, colour, attrs = '') =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${colour}" ${attrs}/>`;
  const label = (x, y, value, cls = '') =>
    `<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${value}</text>`;
  const descriptions = {
    compliance: ['Every word is checked before speech',
      'Short phrases type beside a Compliance boundary. Approved phrases cross, turn green, and become moving voice dots. Alternating rejected phrases turn red and dissolve on the left.'
    ],
    learn: ['Your call data improves your model',
      'Call data flows into your model. A return arrow shows the better next call feeding the cycle.'
    ],
    guard: ['Your business data shapes your model',
      'Scattered coloured dots flow right between dotted Previous calls and Docs &amp; product boundaries, gather into an overlapping stream, and fade out. The boundary dots travel right along fixed curves.'
    ],
    garden: ['Your model runs inside your environment',
      'Overlapping coloured circles follow one path, bouncing off a dotted enclosure around a central lock.'
    ]
  };
  let serial = 0;
  class Feature extends HTMLElement {
    connectedCallback() {
      if (this.ready) return;
      this.ready = true;
      this.kind = this.getAttribute('type');
      const description = descriptions[this.kind];
      if (!description) return;
      this.elapsed = 0;
      this.visible = false;
      this.done = false;
      this.distance = 0;
      this.funnelPhase = 0;
      this.funnel = {
        speed: 100,
        radius: 7.4,
        count: 32,
        overlap: .65,
        width: 295,
        height: 270,
        outlet: 50,
        stroke: 1.95,
        dash: .1,
        gap: 4.1,
        strokeSpeed: 23
      };
      this.snake = { radius: 15, length: 24, speed: 95, spacing: 1.2, angle: 55, lockSize: 54 };
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      const id = `pf-simple-${++serial}`;
      this.innerHTML =
        `<svg class="pf-drawing" viewBox="0 0 560 ${this.kind==='garden'?560:360}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${description[0]}</title><desc id="${id}-desc">${description[1]}</desc>${this[this.kind]()}</svg>`;
      this.dot = this.querySelector('.pf-signal');
      this.returnPath = this.querySelector('.pf-return');
      this.check = this.querySelector('.pf-check');
      this.voice = this.querySelector('.pf-voice');
      this.flow = [...this.querySelectorAll('.pf-flow circle')];
      this.rules = [...this.querySelectorAll('.pf-rule')];
      this.onMotion = () => {
        if (this.motion.matches && this.kind === 'learn') this.done =
          true;
        this.paint();
        this.schedule();
      };
      this.onVisibility = () => this.schedule();
      this.motion.addEventListener('change', this.onMotion);
      document.addEventListener('visibilitychange', this.onVisibility);
      this.observer = new IntersectionObserver(entries => {
        this.visible = entries[0]
          .isIntersecting;
        this.schedule();
      }, { threshold: .45 });
      this.observer.observe(this);
      this.paint();
    }
    disconnectedCallback() {
      cancelAnimationFrame(this.raf);
      this.observer?.disconnect();
      this.motion?.removeEventListener('change', this.onMotion);
      document.removeEventListener('visibilitychange', this.onVisibility);
      this.ready = false;
    }
    schedule() {
      cancelAnimationFrame(this.raf);
      this.last = 0;
      if (this.visible && !this.done && !this.motion.matches && !document.hidden) this.raf =
        requestAnimationFrame(t => this.tick(t));
    }
    tick(now) {
      if (this.last) {
        const dt = Math.min((now - this.last) / 1000, .05);
        this.elapsed += dt;
        this.distance += dt * this.snake.speed;
        if (this.kind === 'guard') this.funnelPhase +=
          dt / this.funnelDuration;
      }
      this.last = now;
      if (this.kind === 'learn' && this.elapsed >= 4.4) this.done = true;
      this.paint();
      if (!this.done) this.raf = requestAnimationFrame(t => this.tick(t));
    }
    learn() {
      return `${label(140,65,'Your call data')}${label(410,65,'Your model')}
        <rect x="60" y="105" width="160" height="112" rx="12" fill="#2cc3e9" fill-opacity=".24"/>
        <path d="M84 133h86m-86 25h112m-112 25h66" class="pf-line" stroke-width="3"/>
        <path d="M237 161h77m-7-6 7 6-7 6" class="pf-line"/>
        <g>${circle(410,153,60,'#1dadc7')}
          <path d="M410 93 479.3 213H340.7Z" fill="#f0be4d"/>
          <clipPath id="pf-call-mark-${serial}">${circle(410,153,60,'#fff')}</clipPath>
          <path d="M410 93 479.3 213H340.7Z" fill="#1b813c" clip-path="url(#pf-call-mark-${serial})"/>
        </g>
        <path class="pf-line pf-track pf-return" d="M410 232C410 308 140 308 140 232"/>
        <path class="pf-line pf-track" d="m134 239 6-7 6 7"/>
        ${label(275,329,'Better next call','pf-caption')}
        ${circle(237,161,5,'#2e2a25','class="pf-signal"')}`;
    }
    guard() {
      return `<g class="pf-flow">${Array.from({length:32},(_,i)=>circle(0,190,7.4,['#ffa0ff','#ffd46f','#2cc3e9','#8be89a'][i%4])).join('')}</g>
        <path class="pf-line pf-rule" d="M235 55C333.333 165 431.667 165 530 165"/>
        <path class="pf-line pf-rule" d="M235 325C333.333 215 431.667 215 530 215"/>
        ${circle(235,55,3,'#2e2a25','class="pf-rule-marker"')}${circle(235,325,3,'#2e2a25','class="pf-rule-marker"')}
        <text x="226" y="60" text-anchor="end" class="pf-rule-label">Previous calls</text>
        <text x="226" y="330" text-anchor="end" class="pf-rule-label">Docs &amp; product</text>`;
    }
    setFunnel(values) {
      Object.assign(this.funnel, values);
      this.paintFunnel();
    }
    paintFunnel() {
      const s = this.funnel,
        end = 530,
        start = end - s.width,
        center = 190;
      const radius = s.radius,
        inner = Math.max(s.outlet / 2, radius + 4);
      const outer = Math.max(s.height / 2, inner + 20),
        length = 512;
      const ease = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
      const target = 2 * radius * (1 - s.overlap) * s.count / length;
      let lo = .001,
        hi = 8;
      for (let n = 0; n < 24; n++) {
        const k = (lo + hi) / 2;
        if (k / (Math.exp(k) - 1) >
          target) lo = k;
        else hi = k;
      }
      const k = (lo + hi) / 2,
        norm = 1 - Math.exp(-k);
      this.funnelDuration = length * k / norm / s.speed;
      const group = this.querySelector('.pf-flow');
      if (group.childElementCount !== s.count) {
        group.innerHTML = Array.from({ length: s.count }, (_, i) => circle(0, 190, radius, [
          '#ffa0ff', '#ffd46f', '#2cc3e9', '#8be89a'
        ][i % 4])).join('');
        this.flow = [...group.children];
      }
      const t = this.motion.matches ? 0 : this.elapsed,
        phase = this.motion.matches ? 0 : this.funnelPhase;
      this.flow.forEach((dot, i) => {
        const u = (phase + i / s.count) % 1;
        const x = 18 + length * (1 - Math.exp(-k * u)) / norm;
        const q = Math.max(0, (x - start) / s.width);
        const half = inner + (outer - inner) * Math.pow(1 - q, 3);
        const seed = Math.sin((i + 1) * 127.1) * 43758.5453;
        const lane = ((seed - Math.floor(seed)) * 2 - 1) * .94;
        const scatter = 1.65 * (outer - radius - 4) * (1 - ease((x - 18) / (end - 58)));
        const available = Math.max(0, half - radius - 4);
        const gathered = scatter * available / (scatter + available + 0.001);
        const farLeft = 1 - ease((x - 18) / Math.max(1, start - 18));
        const amplitude = gathered + (Math.min(165 - radius, outer * 1.18) - gathered) *
          farLeft;
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', center + lane * amplitude);
        dot.setAttribute('r', radius);
        dot.style.opacity = String(ease((x - 18) / 30) * (1 - ease((x - (end - 25)) / 25)));
      });
      this.rules.forEach((path, i) => {
        const sign = i === 0 ? -1 : 1;
        path.setAttribute('d',
          `M${start} ${center+sign*outer}C${start+s.width/3} ${center+sign*inner} ${start+s.width*2/3} ${center+sign*inner} ${end} ${center+sign*inner}`
        );
        path.style.strokeDashoffset = String(-(t * s.strokeSpeed) % (s.dash + s.gap));
      });
      [...this.querySelectorAll('.pf-rule-marker')].forEach((dot, i) => {
        dot.setAttribute('cx',
          start);
        dot.setAttribute('cy', center + (i === 0 ? -outer : outer));
      });
      [...this.querySelectorAll('.pf-rule-label')].forEach((text, i) => {
        text.setAttribute('x',
          start - 9);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('y', center + (i === 0 ? -outer : outer) + 5);
      });
    }
    compliance() {
      return `<text x="280" y="349" text-anchor="middle" class="pf-rule-label">Guardrail Check</text>
        ${circle(280,322,3,'#2e2a25')}
        <path d="M280 78V322" class="pf-line pf-compliance-rule"/>
        <defs><clipPath id="pf-approved-${serial}"><rect x="280" y="80" width="280" height="240"/></clipPath><clipPath id="pf-unchecked-${serial}"><rect x="0" y="80" width="280" height="240"/></clipPath></defs>
        <rect class="pf-input-field" x="20" y="172" width="238" height="40" rx="6" fill="#eee7dc"/>
        <g class="pf-verdict" opacity="0">
          <circle cx="20" cy="172" r="9" fill="currentColor"/>
          <path class="pf-verdict-icon" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <g class="pf-phrase-group" clip-path="url(#pf-unchecked-${serial})">
          <text class="pf-phrase" x="40" y="198"></text>
          <path class="pf-cursor pf-line" d="M40 178v25"/>
        </g>
        <g class="pf-flow pf-spoken" clip-path="url(#pf-approved-${serial})">${Array.from({length:7},(_,i)=>circle(360,190,10,['#ffa0ff','#ffd46f','#2cc3e9','#8be89a'][i%4])).join('')}</g>`;
    }
    paintCompliance() {
      const ease = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
      const time = this.motion.matches ? 3.1 : this.elapsed,
        cycle = Math.floor(time / 8.9),
        beat = time % 8.9;
      const pass = beat < 5.2,
        t = pass ? beat : beat - 5.2;
      const phrase = pass ? ['We can do that', "I can help you"][cycle % 2] : [
        'Approval is guaranteed', 'Skip the identity check'
      ][cycle % 2];
      const typed = phrase.slice(0, Math.min(phrase.length, Math.floor(t / 1.5 * phrase
        .length)));
      const text = this.querySelector('.pf-phrase'),
        cursor = this.querySelector('.pf-cursor');
      const group = this.querySelector('.pf-phrase-group');
      if (text.textContent !== typed) text.textContent = typed;
      const width = text.getComputedTextLength();
      const move = pass ? ease((t - 2.7) / .95) : 0,
        x = 34 + move * 274;
      const dissolve = pass ? 0 : ease((t - 2.7) / .7);
      const decided = t >= 1.8,
        verdictColor = pass ? '#287443' : '#c75049';
      text.setAttribute('x', x);
      text.style.fill = decided ? verdictColor : '#2e2a25';
      const field = this.querySelector('.pf-input-field');
      field.style.opacity = '1';
      const reset = pass ? move : dissolve;
      const neutral = [238, 231, 220],
        tint = pass ? [222, 237, 219] : [243, 221, 213];
      field.setAttribute('fill', decided ?
        `rgb(${tint.map((value,i)=>Math.round(value+(neutral[i]-value)*reset)).join(',')})` :
        '#eee7dc');
      const verdict = this.querySelector('.pf-verdict');
      verdict.style.color = verdictColor;
      verdict.style.opacity = String(decided ? (1 - move) * (1 - dissolve) : 0);
      this.querySelector('.pf-verdict-icon').setAttribute('d', pass ? 'm16 172 3 3 5-6' :
        'M20 167.5v5M20 176v.1');
      group.style.opacity = String(1 - dissolve);
      group.style.filter = dissolve ? `blur(${dissolve*6}px)` : 'none';
      cursor.setAttribute('d', `M${x+width+4} 182v17`);
      cursor.style.opacity = t < 1.8 && Math.floor(t * 3.5) % 2 === 0 ? '1' : '0';
      const dots = this.querySelector('.pf-spoken');
      dots.style.opacity = String(pass && t >= 2.7 ? 1 - ease((t - 4.5) / .45) : 0);
      const count = dots.children.length;
      const radius = width / (2 + (count - 1) * 1.3),
        step = radius * 1.3;
      [...dots.children].forEach((dot, i) => {
        const travel = ease((t - 3.4) / 1.5) * Math.min(60, Math.max(0, 548 - (308 +
          width)));
        const cx = x + radius + i * step + travel;
        const wave = ease((cx - 280) / 55);
        dot.setAttribute('cx', cx);
        dot.setAttribute('cy', 190 + Math.sin(i * .8 - (t - 2) * 4.8) * 4 * wave);
        dot.setAttribute('r', radius);
      });
    }
    garden() {
      return `<rect x="40" y="40" width="480" height="480" rx="20" class="pf-line pf-enclosure"/>
        <g class="pf-flow pf-snake"></g>
        <svg class="pf-lock" x="244" y="244" width="72" height="72" viewBox="0 0 56 56"><path fill-rule="evenodd" clip-rule="evenodd" d="M27.9948 5.25C21.5515 5.25 16.3281 10.4734 16.3281 16.9167V21H15.7448C12.201 21 9.32812 23.8728 9.32812 27.4167V44.9167C9.32812 48.4605 12.201 51.3333 15.7448 51.3333H40.2448C43.7887 51.3333 46.6615 48.4605 46.6615 44.9167V27.4167C46.6615 23.8728 43.7887 21 40.2448 21H39.6615V16.9167C39.6615 10.4734 34.4381 5.25 27.9948 5.25ZM36.1615 21V16.9167C36.1615 12.4063 32.5051 8.75 27.9948 8.75C23.4845 8.75 19.8281 12.4063 19.8281 16.9167V21H36.1615ZM27.9948 30.9167C28.9613 30.9167 29.7448 31.7002 29.7448 32.6667V39.6667C29.7448 40.6331 28.9613 41.4167 27.9948 41.4167C27.0283 41.4167 26.2448 40.6331 26.2448 39.6667V32.6667C26.2448 31.7002 27.0283 30.9167 27.9948 30.9167Z" fill="#2E2A25"/></svg>`;
    }
    setSnake(values) {
      Object.assign(this.snake, values);
      this.paintSnake();
    }
    paintSnake() {
      const s = this.snake,
        group = this.querySelector('.pf-snake');
      if (group.childElementCount !== s.length) group.innerHTML = Array.from({
        length: s
          .length
      }, (_, i) => circle(0, 0, s.radius, ['#2cc3e9', '#ffa0ff', '#ffd46f'][i %
        3
      ])).join('');
      const r = s.radius,
        span = 480 - 2 * r,
        low = 40 + r;
      this.querySelector('.pf-enclosure').setAttribute('rx', Math.min(20, r));
      const fold = n => {
        const u = ((n % (2 * span)) + 2 * span) % (2 * span);
        return low + (
          u <= span ? u : 2 * span - u);
      };
      const angle = s.angle * Math.PI / 180,
        distance = this.motion.matches ? 0 : this.distance;
      [...group.children].forEach((dot, i) => {
        const d = distance + 140 - i * r * s.spacing;
        dot.setAttribute('cx', fold(span * .45 + d * Math.cos(angle)));
        dot.setAttribute('cy', fold(span * .38 + d * Math.sin(angle)));
        dot.setAttribute('r', r);
      });
      const lock = this.querySelector('.pf-lock');
      for (const key of ['width', 'height']) lock.setAttribute(key, s.lockSize);
      for (const key of ['x', 'y']) lock.setAttribute(key, 280 - s.lockSize / 2);
    }
    paint() {
      if (this.kind === 'compliance') { this.paintCompliance(); return; }
      if (this.kind === 'garden') { this.paintSnake(); return; }
      if (this.kind === 'guard') { this.paintFunnel(); return; }
      const finish = this.done || this.motion.matches,
        t = finish ? 4.4 : this.elapsed;
      if (this.kind === 'learn') {
        if (t < 1.65) {
          const u = Math.min(t / 1.65, 1);
          this.dot.setAttribute('cx', 237 + 93 * u);
          this.dot.setAttribute('cy', 161);
        } else {
          const u = Math.min((t - 1.65) / 2.5, 1),
            p = this.returnPath.getPointAtLength(this.returnPath.getTotalLength() * u);
          this.dot.setAttribute('cx', p.x);
          this.dot.setAttribute('cy', p.y);
          this.dot.setAttribute('fill', '#4da568');
        }
        this.dot.style.opacity = t >= 4.15 ? '0' : '1';
      } else {
        const checked = t >= 1.8,
          speaking = t >= 2.7;
        this.check.style.opacity = checked ? '1' : '.15';
        this.voice.style.opacity = speaking ? '1' : '.12';
        this.dot.setAttribute('cx', t < 1.1 ? 175 + 58 * t / 1.1 : t < 2.4 ? 233 : 340 + 64 *
          Math.min((t - 2.4) / .8, 1));
        this.dot.setAttribute('fill', checked ? '#4da568' : '#2e2a25');
        this.dot.style.opacity = t >= 3.2 ? '0' : '1';
      }
    }
  }
  customElements.define('prsm-feature', Feature);
})();

/* Concurrent work between two voices: understand, retrieve and check while responding. */
(() => {
  const playbackRate = 1.15;
  const yellow = '#ffd46f',
    green = '#8be89a',
    voiceY = 106,
    pulseTravel = 2.25;
  const callerPulseGap = .5,
    callerDuration = pulseTravel + 2 * callerPulseGap;
  const callerStart = 1.1,
    workStart = callerStart + pulseTravel;
  const timing = {
    discernEnd: 2.1,
    toolStart: .65,
    toolEnd: 5.85,
    ackCheckStart: 1.35,
    ackCheckEnd: 2.35,
    ackStart: 2.6,
    finalCheckEnd: 7.1,
    replyStart: 7.35,
    voiceDuration: 3.15
  };
  const total = workStart + timing.replyStart + timing.voiceDuration + 1.1;
  const clamp = v => Math.max(0, Math.min(1, v)),
    ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  // Independent work clocks let speech and a lookup overlap without making the speakers overlap.
  const scene = t => {
    const work = t - workStart,
      callerTime = t - callerStart;
    const caller = callerTime >= 0 && callerTime < callerDuration;
    const ack = work >= timing.ackStart && work < timing.ackStart + timing.voiceDuration;
    const reply = work >= timing.replyStart && work < timing.replyStart + timing.voiceDuration;
    const voice = caller ? {
      side: 0,
      local: callerTime,
      duration: callerDuration,
      gap: callerPulseGap,
      inbound: true
    } : ack || reply ? {
      side: 1,
      local: work - (reply ?
        timing.replyStart : timing.ackStart),
      duration: timing.voiceDuration,
      gap: .45,
      inbound: false
    } : null;
    return {
      work,
      callerTime,
      voice,
      ack,
      reply,
      waiting: work < 0,
      approved: work >= timing.finalCheckEnd,
      phase: t < callerStart ? 'ready' : work < 0 ? 'caller-in' : reply ? 'agent-reply' : ack ?
        'agent-acknowledgment' : work >= timing.finalCheckEnd ? 'approved' : 'working'
    };
  };
  const exchanges = [
  {
    discern: {
      thinking: 'Listening to the caller’s pace and concern about after-surgery care.',
      outcome: 'Worried tone',
      tab: 'Caller: worried',
      detail: '“Worried” and an uncertain tone call for reassurance.'
    },
    tools: {
      thinking: 'Looking up the caller’s care plan while the conversation continues.',
      outcome: 'Care plan retrieved',
      tab: 'Plan: found',
      detail: 'The care team’s after-surgery instructions are ready.'
    },
    acknowledgment: 'I hear your concern. Let me check your care instructions.',
    reply: 'Let’s review your care team’s instructions together.',
    finalDetail: 'The response stays within the retrieved care plan.'
  },
  {
    discern: {
      thinking: 'Listening to the caller’s uncertainty about who to contact.',
      outcome: 'Confused tone',
      tab: 'Caller: confused',
      detail: '“Who should I call?” signals a need for a clear next step.'
    },
    tools: {
      thinking: 'Finding the caller’s assigned care team while the agent reassures them.',
      outcome: 'Care team found',
      tab: 'Team: found',
      detail: 'The assigned care team’s contact details are ready.'
    },
    acknowledgment: 'I can help with that. Let me find the right person.',
    reply: 'I can connect you with your assigned care team.',
    finalDetail: 'The response uses the verified care-team contact.'
  }];
  class CallFlow extends HTMLElement {
    connectedCallback() {
      if (this.ready) return;
      this.ready = true;
      this.style.setProperty('--cf-rate', playbackRate);
      this.time = 0;
      this.exchange = 0;
      this.columns = 0;
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.innerHTML = `<div class="cf-journey" role="img" aria-label="Caller waves feed a shared workspace. Discernment, tools and guardrails work concurrently. The agent gives a checked acknowledgment while the tool lookup continues, then gives a checked response using the result.">
        <div class="cf-speech"><div class="cf-person"><span class="cf-name"><i></i>Caller</span></div><div class="cf-person cf-agent"><span class="cf-name"><i></i>Agent</span></div></div>
        <svg class="cf-signal" aria-hidden="true"><g class="cf-wave">${'<circle/>'.repeat(400)}</g></svg>
        <div class="cf-deck-space"><div class="cf-deck">
          <svg class="cf-orbit" aria-hidden="true"><path fill="none" stroke="none"/><circle class="cf-work-dot" r="6"/><circle class="cf-response-dot" r="6"/></svg>
          <div class="cf-content">
            <div class="cf-waiting"><div class="cf-ready-dots"><i></i><i></i><i></i></div><h3>Ready when you are.</h3><p>Waiting for the caller.</p></div>
            <div class="cf-workspace">
              <div class="cf-rows">
                ${['Discernment','Tools','Guardrails'].map((label,i)=>`<article class="cf-row cf-row-${i}">
                  <div class="cf-row-head"><div class="cf-step"><i class="cf-step-fill"></i><span><svg class="cf-step-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10 3 3 7-7"/></svg><b class="cf-step-label">${label}</b></span></div><span class="cf-status"><i></i><b>Waiting</b></span></div>
                  <div class="cf-row-body"><h3></h3><p></p></div>
                </article>`).join('')}
              </div>
              <div class="cf-output"><div class="cf-output-head"><i></i><span>Listening to the caller</span></div><p>The right response starts with understanding.</p></div>
            </div>
          </div>
        </div></div>
      </div>`;
      this.shell = this.querySelector('.cf-journey');
      this.svg = this.querySelector('.cf-signal');
      this.deck = this.querySelector('.cf-deck');
      this.deckSpace = this.querySelector('.cf-deck-space');
      this.content = this.querySelector('.cf-content');
      this.wave = [...this.querySelectorAll('.cf-wave circle')];
      this.people = [...this.querySelectorAll('.cf-person')];
      this.rows = [...this.querySelectorAll('.cf-row')];
      this.steps = [...this.querySelectorAll('.cf-step')];
      this.stepLabels = this.steps.map(e => e.querySelector('.cf-step-label'));
      this.fills = this.steps.map(e => e.querySelector('.cf-step-fill'));
      this.workspace = this.querySelector('.cf-workspace');
      this.waiting = this.querySelector('.cf-waiting');
      this.waitTitle = this.waiting.querySelector('h3');
      this.waitCaption = this.waiting.querySelector('p');
      this.output = this.querySelector('.cf-output');
      this.orbit = this.querySelector('.cf-orbit');
      this.orbitPath = this.orbit.querySelector('path');
      this.orbitDot = this.querySelector('.cf-work-dot');
      this.responseDot = this.querySelector('.cf-response-dot');
      this.resize = new ResizeObserver(() => this.measure());
      this.resize.observe(this.shell);
      this.onResize = () => this.measure();
      window.addEventListener('resize', this.onResize);
      this.onMotion = () => this.schedule();
      this.onVisibility = () => this.schedule();
      this.motion.addEventListener('change', this.onMotion);
      document.addEventListener('visibilitychange', this.onVisibility);
      this.observer = new IntersectionObserver(e => {
        this.visible = e[0].isIntersecting;
        this.schedule();
      }, { threshold: .1 });
      this.observer.observe(this);
      this.measure();
    }
    measure() {
      const box = this.shell.getBoundingClientRect();
      if (!box.width) return;
      this.W = box.width;
      this.deckTop = this.deckSpace.offsetTop;
      const viewport = document.documentElement.clientWidth;
      // Draw across the actual page viewport, including the studio iframe's viewport.
      // The path continues beyond the clipped SVG so neither voice has a visible end.
      this.bleed = Math.max(box.left, viewport - box.right) + 64;
      this.svg.style.left = `${-box.left}px`;
      this.svg.style.width = `${viewport}px`;
      this.svg.setAttribute('viewBox', `${-box.left} 0 ${viewport} ${box.height}`);
      const geometry = this.voicePath(0, 0),
        columns = Math.max(40, Math.ceil(geometry.length / (geometry.r * 1.75)) + 1);
      if (this.columns !== columns) {
        this.columns = columns;
        this.querySelector('.cf-wave').innerHTML = '<circle/>'.repeat(columns * 10);
        this.wave = [...this.querySelectorAll('.cf-wave circle')];
      }
      const deckBox = this.deck.getBoundingClientRect(),
        w = deckBox.width,
        h = deckBox.height,
        gap = 14,
        r = parseFloat(getComputedStyle(this.deck).borderTopLeftRadius) + gap;
      this.deckLeft = (this.W - w) / 2;
      this.orbit.setAttribute('viewBox', `0 0 ${w} ${h}`);
      this.orbitPath.setAttribute('d',
        `M ${w/2} ${-gap} H ${w+gap-r} Q ${w+gap} ${-gap} ${w+gap} ${r-gap} V ${h+gap-r} Q ${w+gap} ${h+gap} ${w+gap-r} ${h+gap} H ${r-gap} Q ${-gap} ${h+gap} ${-gap} ${h+gap-r} V ${r-gap} Q ${-gap} ${-gap} ${r-gap} ${-gap} Z`
      );
      this.orbitLength = this.orbitPath.getTotalLength();
      this.update();
    }
    voicePath(distance, side) {
      const start = -this.bleed,
        r = Math.min(8, (this.W * .46 + this.deckTop - voiceY) / 39 * .62),
        lane = r * .75,
        mid = this.W / 2 - lane,
        turn = Math.min(32, this.W * .065);
      const straight = mid - start - turn,
        arc = Math.PI * turn / 2,
        drop = this.deckTop - 14 - voiceY - turn,
        length = straight + arc + drop;
      let x, y, nx, ny;
      if (distance < straight) {
        x = start + distance;
        y = voiceY;
        nx = 0;
        ny = 1;
      }
      else if (distance < straight + arc) {
        const a = (distance - straight) / turn;
        x = mid - turn + Math.sin(a) * turn;
        y = voiceY + turn - Math.cos(a) * turn;
        nx = -Math.sin(a);
        ny = Math.cos(a);
      }
      else {
        // Separate yellow and green stems, then gently meet at the orbit dock.
        const merge = clamp((distance - (length - 28)) / 28),
          slope = lane * 6 * merge * (1 - merge) / 28;
        x = mid + lane * ease(merge);
        y = voiceY + turn + distance - straight - arc;
        nx = -1 / Math.hypot(1, slope);
        ny = slope / Math.hypot(1, slope);
      }
      return { x: side ? this.W - x : x, y, nx: side ? -nx : nx, ny, length, straight, r };
    }
    update() {
      if (!this.W) return;
      const t = this.motion.matches ? total - 1.2 : this.time,
        state = scene(t),
        { work, voice, waiting, approved } = state,
        data = exchanges[this.exchange];
      this.dataset.phase = state.phase;
      this.people.forEach((el, i) => el.classList.toggle('cf-speaking', voice?.side === i));
      this.waiting.classList.toggle('cf-waiting-visible', waiting);
      this.waiting.setAttribute('aria-hidden', String(!waiting));
      this.workspace.classList.toggle('cf-workspace-visible', !waiting);
      this.workspace.setAttribute('aria-hidden', String(waiting));
      this.waitTitle.textContent = t >= callerStart ? 'Listening to the caller.' :
        'Ready when you are.';
      this.waitCaption.textContent = t >= callerStart ? 'Following their tone and intent.' :
        'Waiting for the caller.';
      this.content.style.opacity = String(t > total - .6 ? 1 - ease((t - (total - .6)) / .6) :
        ease(t / .35));
      const guardResult = work >= timing.toolEnd,
        guardStart = guardResult ? timing.toolEnd : timing.ackCheckStart,
        guardEnd = guardResult ? timing.finalCheckEnd : timing.ackCheckEnd;
      const tasks = [
      {
        ...data.discern,
        start: 0,
        end: timing.discernEnd,
        status: 'Understanding',
        pending: 'Ready to hear tone and intent.'
      },
      {
        ...data.tools,
        start: timing.toolStart,
        end: timing.toolEnd,
        status: 'Retrieving',
        pending: 'Ready to find the caller’s context.'
      },
      {
        start: guardStart,
        end: guardEnd,
        status: guardResult ? 'Checking result' : 'Checking acknowledgment',
        pending: 'Ready to check each response.',
        thinking: guardResult ?
          'Checking the tool result and proposed response against your policies.' :
          'Checking a reassuring acknowledgment before the agent speaks.',
        outcome: guardResult ? 'Approved to speak' : 'Acknowledgment checked',
        tab: guardResult ? 'Speech: approved' : 'Ack: checked',
        detail: guardResult ? data.finalDetail :
          'The agent can reassure the caller while the lookup runs.'
      }];
      tasks.forEach((task, i) => {
        const elapsed = work - task.start,
          started = elapsed >= 0,
          resolved = work >= task.end,
          active = started && !resolved;
        const row = this.rows[i],
          progress = clamp(elapsed / (task.end - task.start)),
          label = resolved ? task.tab : ['Discernment', 'Tools', 'Guardrails'][i];
        row.dataset.state = resolved ? 'done' : active ? 'working' : 'waiting';
        this.stepLabels[i].textContent = label;
        this.steps[i].classList.toggle('cf-step-resolved', resolved);
        this.steps[i].classList.toggle('cf-step-active', started);
        this.steps[i].setAttribute('aria-label',
          `${['Discernment','Tools','Guardrails'][i]}: ${resolved?task.outcome:active?task.status:'waiting'}`
        );
        this.fills[i].style.transform = `scaleX(${progress})`;
        row.querySelector('.cf-status b').textContent = resolved ? 'Complete' : active ?
          task.status : 'Waiting';
        row.querySelector('h3').textContent = resolved ? task.outcome : '';
        const text = resolved ? task.detail : started ? task.thinking : task.pending;
        // A quick text reveal without a cursor; row dimensions stay stable while it resolves.
        const visible = active ? text.slice(0, Math.max(1, Math.floor(text.length * clamp((
          elapsed + .08) / .65)))) : text;
        row.querySelector('.cf-row-body p').textContent = visible;
      });
      this.deck.classList.toggle('cf-deck-approved', approved);
      const responseReady = work >= timing.replyStart,
        ackReady = work >= timing.ackStart,
        speaking = state.ack || state.reply;
      this.output.classList.toggle('cf-output-speaking', speaking);
      this.output.querySelector('span').textContent = responseReady ?
        'Responding with context' : ackReady && work < timing.toolEnd ? (state.ack ?
          'Speaking · lookup still running' : 'Lookup still running') : work >= timing
        .toolEnd && !approved ? 'Checking the next response' : approved ? 'Ready to respond' :
        ackReady ? 'Acknowledgment delivered' : 'Preparing an acknowledgment';
      this.output.querySelector('p').textContent = responseReady ? `“${data.reply}”` :
        ackReady ? `“${data.acknowledgment}”` : 'The agent can respond while work continues.';
      const height = waiting ? this.waiting.offsetHeight : this.workspace.offsetHeight;
      if (this.content.style.height !== `${height}px`) this.content.style.height =
        `${height}px`;
      const geometry = this.voicePath(0, 0),
        halfWidth = Math.max(36, geometry.straight * .34);
      // Keep work moving around the outside while an independently checked acknowledgment exits.
      let dotPoint = null,
        dotOpacity = 1,
        dotRadius = 6;
      if (work >= 0 && work < timing.replyStart && this.orbitLength) {
        const lap = clamp(work / timing.replyStart);
        dotPoint = this.orbitPath.getPointAtLength(lap * this.orbitLength);
        dotRadius = 6 + (geometry.r - 6) * (1 - ease(Math.min(lap, 1 - lap) / .025));
      } else if (work < 0 && state.callerTime > pulseTravel - .4) {
        const q = clamp(state.callerTime / pulseTravel),
          head = -halfWidth + (geometry.length + halfWidth) * q,
          point = this.voicePath(clamp(head / geometry.length) * geometry.length, 0);
        dotPoint = { x: point.x - this.deckLeft, y: point.y - this.deckTop };
        dotOpacity = ease((state.callerTime - (pulseTravel - .4)) / .15);
        dotRadius = geometry.r;
      }
      if (dotPoint) {
        this.orbitDot.setAttribute('cx', dotPoint.x);
        this.orbitDot.setAttribute('cy', dotPoint.y);
        this.orbitDot.setAttribute('r', dotRadius);
        this.orbitDot.setAttribute('fill', yellow);
      }
      this.orbitDot.style.opacity = dotPoint ?
        String(dotOpacity) : '0';
      const exiting = voice?.side === 1 && voice.local < .4;
      if (exiting) {
        const point = this.voicePath(geometry.length - (geometry.length +
          halfWidth) * voice.local / pulseTravel, 1);
        this.responseDot.setAttribute('cx', point.x - this.deckLeft);
        this.responseDot.setAttribute('cy', point.y - this.deckTop);
        this.responseDot.setAttribute('r', geometry.r);
        this.responseDot.setAttribute('fill', green);
      }
      this.responseDot.style.opacity = exiting ? String(1 - ease((voice.local - .15) / .25)) :
        '0';
      this.wave.forEach((dot, i) => {
        const perSide = this.columns * 5,
          side = i < perSide ? 0 : 1,
          col = Math.floor((i % perSide) / 5),
          row = i % 5 - 2,
          d = geometry.length * col / (this.columns - 1),
          point = this.voicePath(d, side),
          active = voice?.side === side;
        let energy = 0;
        if (active)
          for (let pulse = 0; pulse < 3; pulse++) {
            const travel = (voice.local - pulse * voice.gap) / pulseTravel;
            if (travel < 0 || travel > 1) continue;
            const head = voice.inbound ? -halfWidth + (geometry.length + halfWidth) *
              travel : geometry.length - (geometry.length + halfWidth) * travel,
              z = (d - head) / halfWidth;
            if (Math.abs(z) < 1) energy += (1 + Math.cos(Math.PI * z)) / 2 * (voice
              .inbound ? ease((1 - travel) / .14) : ease(travel / .14)) * [1, .78, .9][
              pulse
            ];
          }
        const crest = Math.tanh(energy) * 1.25,
          offset = row * crest * point.r * 1.22,
          bud = row === 0 ? 1 : ease(Math.abs(offset) / (point.r * 1.65));
        const activity = active ? ease(voice.local / .4) * ease((voice.duration - voice
          .local) / .4) : 0;
        // Both resting paths stay present through typing, outcomes and the reset.
        const opacity = .64 + .22 * activity;
        dot.setAttribute('cx', point.x + point.nx * offset);
        dot.setAttribute('cy', point.y + point.ny * offset);
        dot.setAttribute('r', point.r * bud);
        dot.setAttribute('fill', side ? green : yellow);
        dot.setAttribute('opacity', String(opacity));
      });
    }
    schedule() {
      cancelAnimationFrame(this.raf);
      this.last = 0;
      this.update();
      if (this.visible && !this.motion.matches && !document.hidden) this.raf =
        requestAnimationFrame(t => this.tick(t));
    }
    tick(now) {
      if (this.last) {
        this.time += Math.min(.05, (now - this.last) / 1000) *
          playbackRate;
        if (this.time >= total) {
          this.time %= total;
          this.exchange = (this.exchange + 1) % exchanges.length;
        }
      }
      this.last = now;
      this.update();
      this.raf = requestAnimationFrame(t => this.tick(t));
    }
    disconnectedCallback() {
      cancelAnimationFrame(this.raf);
      this.observer?.disconnect();
      this.resize?.disconnect();
      window.removeEventListener('resize', this.onResize);
      this.motion?.removeEventListener('change', this.onMotion);
      document.removeEventListener('visibilitychange', this.onVisibility);
      this.ready = false;
    }
  }
  customElements.define('prsm-call-flow', CallFlow);
})();
