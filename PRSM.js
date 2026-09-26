/* Rime Prism motion. GSAP/ScrollTrigger 3.15.0 + Lenis 1.3.26.
 * Single motion entry point for 02-PRSM.html and its 03 study wrapper.
 * Geometry and colors below are intentionally unchanged. Section orchestration follows.
 * Third-party libraries are vendored separately. See PRISM-MOTION-HANDOFF.md.
 */
// BEGIN PRISM MARK
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
  const MIX = { yellow: "#ffd46f", pink: "#ffa0ff", aqua: "#2cc3e9" }; // plus-darker set
  const MULT = { yellow: "#ffcf61", pink: "#ff96ff", aqua: "#13bee9" }; // multiply fallback
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
    connectedCallback() { this.render(); }
    attributeChangedCallback() { if (this.isConnected) this.render(); }
    render() {
      const c = this.getAttribute("circle") || "aqua",
        t = this.getAttribute("triangle") || "yellow";
      const cc = resolve(c),
        tc = resolve(t);
      // the overlap is the same made colour on every ground (the multiply, green for the locked pair), on ink as on paper
      // (Hunter, 2026-09-07: keep the middle green in dark mode); it used to lighten to the screen mix on a dark ground
      const o = this.getAttribute("overlap") || multiply(cc, tc);
      const st = this.style;
      st.setProperty("--c", cc);
      st.setProperty("--t", tc);
      st.setProperty("--o", o);
      st.setProperty("--c-mult", MULT[c] || cc);
      st.setProperty("--c-mix", MIX[c] || cc);
      st.setProperty("--t-mult", MULT[t] || tc);
      st.setProperty("--t-mix", MIX[t] || tc);
      // the flat overlap is a moving triangle (.ot) clipped inside a still circle (.o), so it follows the motion on ink
      if (!this.firstElementChild) this.innerHTML =
        '<i class="c"></i><i class="t"></i><i class="o"><b class="ot"></b></i>';
      this.querySelector(".c").classList.toggle("plain", !MIX[c]);
      this.querySelector(".t").classList.toggle("plain", !MIX[t]);
    }
  }
  if (!customElements.get("prsm-mark")) customElements.define("prsm-mark", PrsmMark);
  // Gear, in em of the mark's height. The circle holds still. For the triangle's corner to touch the
  // inside of the ring at 12, 4 and 8 o'clock, its centroid has to sit r/3 (r = .5em) on the far side of
  // the circle's centre: below it, up-left, up-right. So the triangle SHIFTS between those three spots
  // and TURNS 120° against the direction the contact travels (a planet gear inside a ring spins the
  // other way), which is what carries the next corner onto the ring. Shift and turn are one motion on one ease,
  // then both hold. recentre (0..1) nudges the whole mark back toward centre as the triangle moves.
  const SPOTS = [
    [0, 0],
    [-0.1443, -0.25],
    [0.1443, -0.25]
  ]; // triangle offsets: contact at top, bottom right, bottom left
  const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  // phase is progress in steps (k + f); the caller advances it by dt / every so the pace can change live
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
      ry = -oy * recentre; // the nudge that keeps the pair centred, if asked for
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

// END PRISM MARK
// BEGIN PRISM HERO
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
  // Shared preset for the landing-page hero and its dedicated design tool.
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
    voiceB: ["#8be89a", "#13bee9",
      "#2c9859"
    ], // each voice's wave in its own family: warm for the yellow dot, cool for the green one
    waveA: 1,
    waveB: 0.72, // each voice's wavelength, as a share of `wavelength`, so the two waves read differently
    refract: true, // past the prism a word carries the listener's colours and wavelength: the prism turns the voice (Hunter, 2026-09-07)
    blend: "burn", // burn = the site's dark-ground code; screen = additive, overlaps go light
    count: 5,
    radius: 11,
    overlap: 0.35,
    colGap: 2.2,
    words: 26,
    speed: 240, // px a second: the crossing wants to feel zippy (Hunter, 2026-09-07)
    amp: 1,
    wavelength: 420,
    waveSpeed: 1.4,
    arrowSize: 0.2,
    lineY: 0.5,
    pause: 0.55,
    turn: 0.8,
    dots: true,
    speedMul: 1.5, // the whole sequence runs quicker than real time, on the page and in the tool alike (Hunter, 2026-09-07, twice)
    arrowShape: 0.866,
    turnDir: 1,
    overshoot: 0,
    dotSize: 1.3,
    dotX: 0.07,
    dotPulse: 0,
    jitter: 0, // no overshoot: the spin never reverses; the dots hold still (Hunter, 2026-09-07)
    emerge: 4, // radii of travel over which a word opens out of its dot
    suck: 170,
    suckPull: 0, // the fold into the prism: over this many px; no pull by default, so the stream keeps one speed and its spacing
    inside: 1, // speed through the prism, as a share of the word's speed
    exit: 4, // radii of travel over which a word opens back out of the apex
    land: 140,
    landPull: 0, // the fold into the listener's dot; no pull by default, same reason
    faceBack: "#2cc3e9",
    faceA: "#ffd46f",
    faceB: "#8be89a", // the pyramid's other faces: the one that swings in to face the other way, the top, the bottom (the front is `arrow`)
    spin: 3.2,
    strike: 0.45,
    brake: 1.3,
    slack: 1.2, // the spin: radians a second at speed, seconds to get there, seconds of braking, and the window (this wide, centred on the last word's entry) the rest may fall in
    drift: 36,
    driftRate: 3.5,
    end: "loop",
    markCircle: "#1dadc7",
    bloom: 1, // "mark": the first voice runs once and the last word blooms into the mark's circle (this colour, over this many seconds) on the resting face       // the push: how far the stream shoves the prism along, in px, and how briskly it goes (a soft spring)
    sway: 0.12,
    swaySpeed: 0.7, // a slight pitch that rocks the top and bottom faces into view while it spins
    appear: 1.1, // the reveal, in seconds: the dots pop in, the prism springs from its centre, then the first word goes (Hunter, 2026-09-09). 0 skips it
    faceAlpha: 1, // the pyramid's opacity: below 1 it reads as glass and the words show through it (Megan, 2026-09-11)
    whiteIn: 0, // how far a word's colours wash toward white BEFORE the prism, so light goes in white and comes out colour (Megan, 2026-09-11)
    lineIn: 0, // 1: the word goes in as ONE flat line of circles, the stack only opening past the prism (Hunter, 2026-09-11)
    fanOut: 1, // how much wider the stack opens on the far side: the prism's dispersion, which the landing fold then converges into the dot
    idleSpin: 0, // radians a second the prism keeps turning on its vertical axis while at rest, so it is never still
    passRoll: 0, // radians a second it rolls on its HORIZONTAL axis while a word is inside it, easing back level once nothing is passing
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
        cy = H * s.lineY; // the prism sits where the stream has pushed it
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
        rawR = G.cx + Math.max(...xs); // the prism's outline this frame
      if (this.edgeL === null) {
        this.edgeL = rawL;
        this.edgeR = rawR;
      }
      const f = Math.min(1, dt * 5);
      this.edgeL += (rawL - this.edgeL) * f;
      this.edgeR += (rawR - this.edgeR) * f; // smoothed, so the words never chase a jump
      const xL = this.edgeL,
        xR = this.edgeR,
        xBase = dir > 0 ? xL : xR,
        xApex = dir > 0 ? xR :
        xL; // words go in at the speaker's side of it and come out at the listener's
      const from = this.speaker === 0 ? G.dotA : G.dotB,
        to = listener === 0 ? G.dotA : G.dotB,
        sgn = s.turnDir < 0 ? -1 : 1;
      if (this.phase === "speak" || this.phase ===
        "done") { // done: the mark is blooming, the tail still landing
        this.spawnT += dt;
        const every = (s.colGap * s.radius) / s.speed;
        if (this.appear >= 1 && this.spawned < s.words && (!this.spawned || this.spawnT >=
            every)) { // the first word goes the moment the reveal settles
          this.spawnT = this.spawned ? this.spawnT - every : 0;
          this.spawned++;
          this.lastSpawn[this.speaker] = this
            .t; // the remainder carries, so the interval is exact whatever the frame rate
          this.cols.push({
            x: from.x,
            i: this.spawned,
            stage: "out",
            e: 0,
            s: 0,
            g: 0,
            run: 0
          }); // it leaves the dot itself, collapsed
        }
        this.cols.forEach((c) => {
          if (c.stage === "out") {
            c.run += s.speed *
              dt; // one speed for every word, so the spacing holds from dot to dot
            c.g = 0.45 + 0.55 * smooth(clamp(c.run / (s.radius * 1.2), 0,
              1)); // the circle itself grows to size over its first radius
            c.e = smooth(clamp(c.run / (s.radius * Math.max(0.5, s.emerge)), 0,
              1)); // then the stack opens out of it
            c.x = from.x + dir * c.run;
            const d = dir > 0 ? xBase - c.x : c.x - xBase;
            c.s = smooth(clamp(1 - d / s.suck, 0, 1)); // folding into the prism
            c.run += s.speed * dt * s.suckPull * c.s * c.s; // and pulled in
            if (d <= 0) {
              c.stage = "in";
              c.run = 0;
            } // taken in
          } else if (c.stage === "in" && s.end === "mark" && c.i >= Math.round(s.words)) {
            // the last word stops at the mark's circle centre, half the face's height in from the apex, and waits for the rest
            const xM = G.cx + dir * G.hx / 6,
              dM = dir > 0 ? xM - c.x : c.x - xM;
            if (dM > 0.5) c.x += dir * Math.min(dM, s.speed * s.inside * dt);
            else if (this.spin === "rest") {
              c.stage = "mark";
              this.mark = c;
              this.phase = "done";
              this.bloom = 0;
              this.driftTo = 0;
            } // then blooms, as the prism settles back to centre
          } else if (c.stage === "mark") {
            c.x = G.cx + dir * G.hx / 6; // it rides with the prism
          } else if (c.stage === "in") {
            c.x += dir * s.speed * s.inside *
              dt; // through the prism, a single circle under it
            if (dir > 0 ? c.x >= xApex : c.x <= xApex) {
              c.stage = "back";
              c.run = 0;
              c.e = 0;
              c.s = 0;
              c.g = 0.5;
            }
          } else if (c.stage === "back") {
            // out of the prism at the stream's own speed, its position its own (never tied to the outline, which moves)
            const d0 = dir > 0 ? to.x - c.x : c.x - to.x;
            c.s = smooth(clamp(1 - d0 / s.land, 0, 1)); // folding into the listener's dot
            const step = s.speed * dt * (1 + s.landPull * c.s * c.s);
            c.x += dir * step;
            c.run += step;
            c.g = 0.5 + 0.5 * smooth(clamp(c.run / (s.radius * 1.2), 0, 1));
            c.e = smooth(clamp(c.run / (s.radius * Math.max(0.5, s.exit)), 0,
              1)); // opening back out of the prism
            if ((dir > 0 ? to.x - c.x : c.x - to.x) <= 0) c.stage = "done"; // landed
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
      // contact is a word's own edge on the outline, not its centre: the leading edge arriving at the flat side (a folded
      // word is 0.7 of its radius, Hunter, 2026-09-07)
      const reach = s.radius * 0.75,
        onEdge = (c) => c.stage === "out" && (dir > 0 ? xBase - c.x : c.x - xBase) <= reach;
      // the pyramid's spin has weight: struck by the first word to touch it, it runs up to speed, holds, and brakes steadily to
      // rest on the face that looks at the next voice, timed to the last word going in. The run is planned at the strike from
      // the stream's own timing (planSpin), so it lands square whatever the dials say. The strike is also the push.
      if (!this.struck && this.phase === "speak" && this.cols.some(onEdge)) {
        this.struck =
          true;
        this.planSpin(G, sgn);
        this.driftTo = dir * s.drift;
      } // once a turn
      if (this.spin === "run") {
        const p = this.plan;
        this.runT += dt;
        const t = Math.min(this.runT, p.T);
        let w, d;
        if (t < p.up) {
          w = p.w * t / p.up;
          d = 0.5 * p.w * t * t / p.up;
        } // the strike: up to speed
        else if (t < p.T - p.dn) {
          w = p.w;
          d = 0.5 * p.w * p.up + p.w * (t - p.up);
        } // at speed
        else {
          const r = p.T - t;
          w = p.w * r / p.dn;
          d = p.D - 0.5 * p.w * r * r / p
            .dn;
        } // the brake: one steady deceleration on to the face
        this.yaw = p.from + p.sgn * d;
        this.omega = p.sgn * w;
        this.swayT += dt;
        const a = clamp(w / Math.max(0.1, s.spin) * 1.3, 0,
          1); // it rocks in proportion to its spin, so it rests level
        this.pitch = a * s.sway * Math.sin(this.swayT * s.swaySpeed + 1.1);
        if (this.runT >= p.T) {
          this.spin = "rest";
          if (s.end !== "mark") this.faceLeft = !this.faceLeft;
          // wrap the resting yaw into one turn: it only ever grew (the spin never reverses), and once
          // it passed ~15 turns planSpin's window found no rest ahead, its plan went NaN, and the
          // word layer painted the canvas white (Hunter's white boxes, 2026-09-09). The rest faces
          // repeat every turn, so wrapping changes nothing the eye can see.
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
      } // never quite still (Hunter, 2026-09-11)
      // the horizontal roll: it rolls while a word is inside it and eases back level once nothing is
      if (this.spin !== "run") this.pitch = 0;
      this.rollA = this.rollA || 0;
      if (s.passRoll && this.cols.some((c) => c.stage === "in")) this.rollA += s.passRoll * dt;
      else this.rollA += (0 - this.rollA) * Math.min(1, dt * 2.2);
      this.pitch += this.rollA;
      // the push: a soft, slightly underdamped spring carries the prism to where the stream shoved it, and the answer carries it back
      {
        const r = s.driftRate,
          acc = -r * r * (this.drift - this.driftTo) - 1.5 * r * this.driftV;
        this.driftV += acc * dt;
        this.drift += this.driftV * dt;
      }
    }
    // Optical choreography: continuously rotate vertically, roll horizontally on
    // each passage, and turn toward the next speaker between packets. The classic waveform engine stays available.
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
          // One revolution spans the full packet, from first entry to last exit.
          const tail = this.cols[this.cols.length - 1];
          this.passSpin = {
            time: 0,
            duration: Math.max(1.7, 1.3 * (Math.max(0, dir * (O.exit - tail.x)) + Math.max(0,
              total - this.spawned) * gap) / speed)
          };
          this.spin = 'run';
        }
        // Colour is gained on contact and retained even as a face rotates away.
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
        // Smooth acceleration and braking, with a readable full turn in between.
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
      // Horizontal passage spin completes a full revolution, so resetting it is seamless.
      this.pitch = -0.3 + this.rollA + 0.055 * Math.sin(this.t * 0.9);
      this.drift = 0;
    }
    opticsGeometry() {
      const G = this.geo(),
        R = this.project(G),
        cuts = [];
      // The light enters the visible silhouette at the centreline, not a moving
      // bounding box. All six tetrahedron edges participate in the intersection.
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
      // Two complete swells after the exit: open, gather, open, arrive.
      // Keep the nodes fixed so every column completes both beats.
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
        // An illuminated acrylic volume supplies light for subtractive pigment.
        // Rear and front planes then filter it, including the dots between them.
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
      // The same isolated multiply treatment as the site's overlapping orbits:
      // mix on white, mask to circle coverage, then place on the dark ground.
      // Neon colour stays saturated; intersections make pigment colours.
      const circles = [];
      this.opticsCircles((x, y, r, col, energy) => {
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(r) && r > 0) circles
          .push({ x, y, r, col, energy });
      });
      if (circles.length) {
        const o = this.og;
        // A faint coloured halo sits behind the opaque blended circle layer.
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

    // the spin's plan, made at the strike: the stream reaches the prism one word every `every` seconds, so the last word goes in
    // at Tc. The prism should be at rest on the next face by then, give or take the slack, turning at about `spin` radians a
    // second in between: of the rests ahead (the next face, or that plus whole turns) it takes the one whose speed comes
    // closest, with the strike and the brake shrinking together when the run is too short to fit them
    planSpin(G, sgn) {
      const s = this.s,
        base = (this.faceLeft !== (s.end === "mark")) ? 0 : this.flip(G),
        y0 = sgn * this.yaw; // the next face, or (ending on the mark) this one again
      const Tc = (Math.max(1, Math.round(s.words)) - 1) * (s.colGap * s.radius) / s.speed,
        ramps = s.strike + s.brake;
      let best = null;
      for (let k = 0; k < 16; k++) {
        const D = base + TAU * k - y0;
        if (D < 0.5) continue; // at least a real nudge on
        const T = Math.max(clamp(D / s.spin + ramps / 2, Tc - 0.5 * s.slack, Tc + 0.5 * s
            .slack), ramps / 2,
          0.3); // when it would like to rest, held to the window round the last word
        const f = Math.min(1, T / ramps),
          up = s.strike * f,
          dn = s.brake * f,
          w = D / (T - (up + dn) / 2),
          cost = Math.abs(Math.log(w / s.spin));
        if (!best || cost < best.cost) best = { D, T, up, dn, w, cost, Tc };
        if (w > s.spin * 3) break;
      }
      // belt and braces: should no candidate land in the window (a huge or non-finite yaw), take
      // the next face at least a whole turn on rather than planning with nothing, which went NaN
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
    // the pyramid: the arrow's triangle as the front face at +h/4, the far vertex at -3h/4 (h = the height of a regular
    // tetrahedron on that face), so the solid's centroid sits at the origin and the front face's centroid on the axis
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
    flip(G) {
      const { h, hx } = this.solid(G);
      return Math.atan2(-h, hx / 3) + Math
        .PI;
    } // the turn that brings the next face square-on, apex the other way (109.5° for a regular tetrahedron)
    project(G) {
      const { V } = this.solid(G), cA = Math.cos(this.yaw), sA = Math.sin(this.yaw), cP = Math
        .cos(this.pitch), sP = Math.sin(this.pitch);
      return V.map(([x, y, z]) => {
        const x1 = x * cA + z * sA,
          z1 = -x * sA + z * cA;
        return [x1, y * cP - z1 * sP, y * sP + z1 *
          cP
        ];
      }); // turned about the vertical, then pitched (the rock); square, no perspective
    }
    // the faces facing us this frame, painter order (furthest first), each with its colour and how much
    // of the screen it takes. The page's own mark reads this so it can wear what the prism is showing.
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
        if (n[0] * ctr[0] + n[1] * ctr[1] + n[2] * ctr[2] < 0) n = n.map((v) => -
          v); // outward
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
        g.stroke(); // stroked in its own colour, so no seam shows where faces meet
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
        // up to the prism's centre a word is its speaker's; past it (under the solid, so the switch never shows) it is the listener's
        const before = c.stage === "out" || (c.stage === "in" && (dir > 0 ? c.x < G.cx : c
          .x > G.cx));
        let [pal, wl] = voice(!s.refract || before ? this.speaker : 1 - this.speaker);
        if (s.whiteIn > 0 && before) pal = pal.map((v) => mix(v, "#ffffff", s
          .whiteIn)); // in white, out colour: the prism is what gives the voice its colour
        if (c.stage === "in") {
          fn(c.x, G.cy, s.radius * 0.7, pal[centre % pal
            .length]);
          return;
        } // inside: one circle, drawn under the solid
        if (c.stage !== "out" && c.stage !== "back") return;
        const wave = 0.5 + 0.5 * Math.sin((c.x / wl) * TAU - this.t * s.waveSpeed + s
          .jitter * Math.sin(c.i * 7.3) * 2);
        const open = c.e * (1 - c.s),
          fold = 1 - 0.3 * c.s * c
          .s; // the stack folds flat into one circle, which slides on under the prism
        const r = s.radius * c.g * fold;
        if (r < 0.4) return;
        let E = s.amp * wave * open;
        if (s.lineIn && c.stage === "out") E *= 1 - s
          .lineIn; // in as one line: the stack stays shut until the prism opens it
        if (c.stage === "back") E *= s
          .fanOut; // and out as a fan, the landing fold converging it into the dot
        const spacing = 2 * r * (1 - s.overlap);
        for (let j = 0; j < n; j++) {
          const idx = n - 1 - j,
            off = E * (idx - mid) * spacing; // the homepage draws top to bottom
          // the centre circle is always whole; the others bud out of it as they separate, so a collapsed stack is one circle
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
      // the words: built against white (or black for screen), then only the covered pixels come across. With no
      // circle to mask it the layer would come across whole, white over the ground, so it is skipped on those frames.
      // Circles are counted and drawn through one finite-guard: canvas path calls silently ignore non-finite
      // coordinates, so a NaN circle that counted but never joined the mask handed the whole white layer across.
      const safe = (fn) => (x, y, r, col) => {
        if (Number.isFinite(x) && Number.isFinite(y) &&
          Number.isFinite(r) && r > 0) fn(x, y, r, col);
      };
      let circles = 0;
      this.eachCircle(safe(() => { circles++; }));
      if (circles) {
        o.setTransform(d, 0, 0, d, 0, 0);
        o.globalCompositeOperation = "source-over";
        const lit = s.blend === "screen" || s.blend ===
          "lighten"; // the additive looks build on black, the burn on white
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
        o.globalCompositeOperation =
          "destination-in"; // one fill: destination-in composites per call
        o.fillStyle = "#000";
        o.beginPath();
        this.eachCircle(safe((x, y, r) => {
          o.moveTo(x + r, y);
          o.arc(x, y, r, 0, TAU);
        }));
        o.fill();
        g.drawImage(this.off, 0, 0, this.W, this.H);
      }
      // the two voices, still (a pulse as a word leaves is there on a dial, off by default)
      if (s.dots) {
        [
          [G.dotA, s.dotA, 0],
          [G.dotB, s.dotB, 1]
        ].forEach(([p, col, who]) => {
          const spoke = s.dotPulse ? clamp(1 - (this.t - this.lastSpawn[who]) / 0.28, 0,
            1) : 0;
          const pop = smooth(clamp((this.appear - (who ? 0.15 : 0)) / 0.5, 0,
            1)); // the reveal: each dot pops in, the second a beat later
          const r = s.radius * s.dotSize * (1 + s.dotPulse * Math.sin(spoke * Math.PI)) *
            pop;
          if (r <= 0) return;
          g.fillStyle = col;
          g.beginPath();
          g.arc(p.x, p.y, r, 0, TAU);
          g.fill();
        });
      }
      // the pyramid, on its centroid; on the reveal it springs out of its centre with a little overshoot
      const ak = this.appear >= 1 ? 1 : easeBack(clamp((this.appear - 0.3) / 0.7, 0, 1));
      if (ak > 0.01) {
        g.save();
        g.translate(G.cx, G.cy);
        g.scale(ak, ak);
        this.pyramid(g, G);
        g.restore();
      }
      // the ending on the mark: the last word blooms into the mark's circle over the resting face, the overlap the mark's own made colour
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
    start() { if (!this.releaseClock) this.releaseClock = window.RimeMotion.bindHero(this); }
    stop() {
      this.releaseClock?.();
      this.releaseClock = null;
    }
  }
  PrsmHero.REFRACTION = REFRACTION;
  window.PrsmHero = PrsmHero;
})();

// END PRISM HERO
// BEGIN PRISM STREAM
(() => {
  const TAU = Math.PI * 2;
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
  const fluid = n => { const t = clamp(n); return clamp(t * t * t * (t * (t * 6 - 15) + 10)); };
  const { C, MIX, multiply } = window.PRSM;
  const GREEN = multiply(C.aqua, C.yellow),
    BLUE = multiply(MIX.pink, MIX.aqua),
    CORAL = multiply(MIX.pink, MIX.yellow);
  // Original pink/aqua/yellow/clear planes make six visible optical regions.
  // Lock the green to the mark instead of generating a third green via alpha.
  const FACES = Object.freeze({
    arrow: C.pink,
    faceBack: C.aqua,
    faceA: C.yellow,
    faceB: '#ffffff'
  });
  const GROUPED_FACETS = Object.freeze({
    // Ordered near:far regions give the two material sides distinct pigments.
    // An unordered intersection repeats the cool palette after a 180° turn.
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
  // Same six pigments, redistributed: the main right view is gold/blue/pink,
  // and the main left view is gold/coral/aqua, not cool-only and pink/coral groups.
  const FACETS = Object.freeze({
    '0:1': C.yellow,
    '0:2': BLUE,
    '0:3': C.pink,
    '1:2': CORAL,
    '1:3': C.aqua,
    '2:3': GREEN,
  });
  // Alternate warm/cool rows out from the center and mirror their placement.
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
      description: 'Two voices exchange dot streams. The faceted prism floats in a quiet three-dimensional pose, gently turning, shifting and growing at contact as the dots split into mirrored bell curves. Dots blend with its six facet colors only inside the prism, and each train arrives before the reply.'
    },
    signal: {
      label: 'Parallel bands',
      colors: COLORS,
      description: 'Gold dots separate through the prism into five straight, symmetric dot channels in its facet colors, then gather into the other voice.'
    },
    fan: {
      label: 'Dot fan',
      colors: COLORS,
      description: 'A steady chain of gold dots opens through the prism into five straight rays in its facet colors. Matching pairs fan out symmetrically.'
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
        }
        else {
          const plan = this.contactPlan(turn, dir);
          this.impactTime = plan.impact;
          this.releaseTime = plan.release;
          const hit = elapsed - plan.impact,
            rotation = fluid(hit / plan.turnSeconds);
          // Contact owns the whole gesture: ease outward, hold while any dot
          // still touches the moving solid, then ease back from actual clearance.
          // Both ends of each ease have zero velocity AND acceleration.
          const response = fluid(hit / plan.attack) * (1 - fluid((elapsed - plan.release) / plan
            .settle));
          this.setPose(elapsed, turn * leg, dir, rotation, response);
          this.spin = hit > 0 && (response > 0 || rotation < 1) ? 'run' : 'rest';
        }
        Object.assign(this.s, FACES);
        return;
      }
      // No pitch or rocking: the solid and its paired facets remain symmetric.
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
      // Carry the SAME material corner (vertex 3) from sender to receiver.
      // The former face-to-face flip handed off from vertex 3 to vertex 0,
      // which made the contact corner disappear instead of travelling around.
      const from = dir > 0 ? left : left + Math.PI,
        to = dir > 0 ? left + Math.PI : left;
      const idleYaw = this.idleYaw(start + elapsed);
      // Optional skew is an excursion, never a competing final target. Its
      // smooth envelope is zero at both rests, so any settings still deliver
      // the receiving corner to the opposite endpoint without an axis snap.
      const excursion = 16 * rotation * rotation * (1 - rotation) * (1 - rotation);
      this.yaw = from + (to - from) * rotation + idleYaw + dir * this.s.streamRotationY * Math
        .PI / 180 * excursion;
      this.pitch = -.3 * float + dir * this.s.streamRotationX * Math.PI / 180 * excursion;
      this.contactCorner = 3;
      this.drift = dir * this.s.streamShiftX * Math.min(1, this.W / 1150) * response;
      this.prismScale = 1 + this.s.streamScaleGrowth * response;
    }
    touchesPrism(circles, G) {
      // Convex silhouette of the original projected tetrahedron. Test complete
      // circles, not just their centers or an axis-aligned prism bounding box.
      const pts = G.P.map(([x, y]) => ({ x: G.cx + x, y: G.cy + y })).sort((a, b) => a.x - b
        .x || a.y - b.y);
      const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      const half = points => {
        const out = [];
        for (const p of points) {
          while (out.length >
            1 && cross(out.at(-2), out.at(-1), p) <= 0) out.pop();
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
      // Cache one deterministic plan per exchange/size/settings. This remains
      // stable through pause, replay and frame-rate changes, with no spring lag.
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
        // Solve at the crest itself: at candidate clearance t the arrival is
        // complete, the prism is fully grown, and its turn is still in flight.
        // This avoids a slow nested simulation or a frame-dependent spring.
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
      // Last contact uses all lanes and the actual discrete last dot. A long
      // turn can briefly uncover/re-cover dots, so find the FINAL occupied span.
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
      // One broad gesture, not "rotate, grow, stop, shrink". Let the rise use
      // the occupied interval and let the corner keep turning into recovery.
      // Clearance changes with the moving silhouette; solve that shared crest
      // once and cache the resulting timeline for all subsequent frames.
      const release = lastContact();
      return this._contactPlan = { key, impact, release, ...motionFor(release) };
    }
    set(patch) {
      super.set(patch);
      if (this.study) {
        this.pose();
        this.syncPlayback();
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
      // Keep size/growth controls independent from the stream spread. At extreme
      // settings, retain clearance between the solid and both endpoint dots.
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
      // Lock the actual struck corner, not a crossfade between different tips.
      // The rigid solid turns around it in depth, and that same vertex remains
      // on the endpoint axis through growth, skew and both conversation legs.
      const offset = P[this.contactCorner ?? 3][1];
      return P.map(([x, y, z]) => [x, y - offset, z]);
    }
    faces(G, includeBack = false) {
      // Face visibility is evaluated in the original centered 3D coordinates,
      // before the screen-space tip anchor translates the projected solid.
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
      return (this.study === 'ribbon' ? 8.2 : 6.8) * clamp(this.W / 1150, .46, 1.15) *
        this.s.streamWidth;
    }
    lanePairs() {
      return this.study === 'ribbon' ? Math.max(2, Math.min(8, Math.round((this.s
        .streamLines - 1) / 2))) : 2;
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
      // A circle refracts when its leading edge touches the entering face,
      // rather than waiting for its center to cross the entire prism.
      const origin = this.study === 'ribbon' ? G.splitStart : G.entry;
      const q = clamp(G.dir * (x - origin) / Math.max(1, Math.abs(G.end - origin)));
      // A soft bell starts opening immediately inside the entering face. One
      // shared envelope preserves the mirror while the prism rotates in 3D.
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
      // The core is what survives when the paired rows fold back together.
      // Refract it into the receiving voice's pigment at contact, so the fan
      // resolves to pink on the right and gold on the left, never a stray color.
      // Keep that identity even when Color Offset rearranges the other rows.
      if (lane === 0) return this.voiceColors[G.dir > 0 ? 1 : 0];
      // One exact facet pigment per lane. Dot intersections use Rime's isolated
      // dark-ground blend; the solid adds a separate, clipped optical treatment.
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
        // One finite, closely packed train. Its last dot must arrive before the
        // other voice can send. The brief empty hold makes the handoff legible.
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
        // Contact planning only needs columns whose circles can touch the
        // silhouette. Rendering still requests the complete unchanged train.
        if (bounds && (x < bounds.min || x > bounds.max)) continue;
        // Every column is one dot before contact. Paired circles bud out only
        // as they separate, so a collapsed stack never becomes a dark knot.
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
      // Retain the original transparent tetrahedron's front/back intersections,
      // but resolve each region to a locked optical color, not an alpha-tinted mix.
      // This keeps the familiar inner facets visible even when a face is square.
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
      // Keep the real subtractive mixes, but not their near-black buildup.
      // A luminosity copy at the ground's brightness, lightened back onto the
      // original, lifts only pixels below that floor. Unlike lightening with a
      // flat charcoal rectangle, this leaves bright primary pigments unchanged.
      // https://www.w3.org/TR/compositing-1/#blendingluminosity
      if (!this.floorCanvas) {
        this.floorCanvas = document.createElement('canvas');
        this.floorG = this.floorCanvas.getContext('2d');
      }
      const floor = this.floorCanvas,
        f = this.floorG,
        g = this.g,
        d = this.dpr;
      if (floor.width !== this.canvas.width || floor.height !== this.canvas.height) {
        floor
          .width = this.canvas.width;
        floor.height = this.canvas.height;
      }
      const x = Math.max(0, Math.floor(Math.min(...circles.map(c => c.x - c.r)) * d) - 1);
      const y = Math.max(0, Math.floor(Math.min(...circles.map(c => c.y - c.r)) * d) - 1);
      const w = Math.min(floor.width, Math.ceil(Math.max(...circles.map(c => c.x + c.r)) * d) +
        1) - x;
      const h = Math.min(floor.height, Math.ceil(Math.max(...circles.map(c => c.y + c.r)) * d) +
        1) - y;
      if (w <= 0 || h <= 0) return;
      // Work only on the dot train's pixel-aligned bounds, with no CPU readback.
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
      // Rime's dark-ground canvas recipe (rime.js orbit / prsm-hero.js):
      // blend pigments against isolated WHITE, then retain only dot coverage.
      // Multiplying directly against charcoal would muddy the whole stream;
      // source-over circles would hide the overlap instead of making a mix.
      // Skip empty frames: an empty destination-in path does not erase white.
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
        // One union mask, not one destination-in operation per circle.
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
        // The same dot pixels are composited a second time ONLY within the
        // current rotating silhouette. Boundary-crossing circles are split
        // precisely, rather than changing the whole circle's color by center.
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
      // Also floor the inside-prism treatment, which can darken the dots again.
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
    syncPlayback() {
      this.pose();
      this.draw();
    }
  }
  PrsmStreamHero.STUDIES = STUDIES;
  window.PrsmStreamHero = PrsmStreamHero;
})();

// END PRISM STREAM
// BEGIN ENTERPRISE RENDERER
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
      this.paint();
    }
    disconnectedCallback() {
      this.releaseClock?.();
      this.ready = false;
    }
    advance(dt) {
      this.elapsed += dt;
      this.distance += dt * this.snake.speed;
      if (this.kind === 'guard') this.funnelPhase += dt / this.funnelDuration;
      if (this.kind === 'learn' && this.elapsed >= 4.4) this.done = true;
      this.paint();
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
      // Choose a continuous deceleration curve from the desired exit spacing.
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
        // Fixed lanes remove lateral jitter. A smooth envelope contains every dot,
        // including through the funnel entrance, with no position discontinuity.
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
      // The circle packet has the exact same horizontal footprint as the text.
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
      // Unfold a rectangular billiard path, then fold every trailing circle back
      // into the enclosure. Each follows the head's exact reflected route.
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

// END ENTERPRISE RENDERER
// BEGIN CALL FLOW RENDERER
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
      if (this.onHeight) this.onHeight(height);
      else this.content.style.height = `${height}px`;
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
    advance(dt) {
      this.time += dt * playbackRate;
      if (this.time >= total) {
        this.time %= total;
        this.exchange = (this.exchange + 1) % exchanges.length;
      }
      this.update();
      this.onPaint?.();
    }
    disconnectedCallback() {
      this.releaseClock?.();
      this.resize?.disconnect();
      window.removeEventListener('resize', this.onResize);
      this.ready = false;
    }
  }
  customElements.define('prsm-call-flow', CallFlow);
})();

// END CALL FLOW RENDERER

// BEGIN HERO INTRO
function animateHeroIntro(env, hero) {
  const $ = id => document.getElementById(id);
  if (document.documentElement.classList.contains('prsm-entering')) {
    const canvas = document.createElement('canvas');
    canvas.className = 'prsm-intro';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const intro = Object.create(hero);
    intro.g = canvas.getContext('2d');
    const landing = Object.create(hero);
    const nav = document.querySelector('.hero-chrome rime-nav'),
      anchor = document.createComment('intro nav');
    const navLayer = document.createElement('div');
    navLayer.className = 'prsm-intro-nav';
    nav.before(anchor);
    navLayer.appendChild(nav);
    document.body.appendChild(navLayer);
    const stage = $('stage'),
      revealContent = [...document.querySelectorAll('.hero-copy')];
    const streamIntro = hero instanceof PrsmStreamHero;
    const canvasVisibility = hero.canvas.style.visibility;
    const showCanvas = () => {
      if (canvasVisibility) hero.canvas.style.visibility =
        canvasVisibility;
      else hero.canvas.style.removeProperty('visibility');
    };
    // Reveal the copy through the overlay before the large prism has landed,
    // without exposing a second, smaller prism underneath it.
    const copyStagger = [
      ['--intro-heading', 0],
      ['--intro-body', .12],
      ['--intro-button', .24],
      ['--intro-logos', .3]
    ];
    if (streamIntro) {
      hero.canvas.style.visibility = 'hidden';
      document.documentElement.classList.add('prsm-stream-reveal');
      revealContent.forEach(el => copyStagger.forEach(([key]) => el.style.setProperty(key, '0')));
    }
    let lastIntroTime, copyRevealAt, previousTurn = -1.7,
      finished = false;
    if (!streamIntro) hero.yaw -= 1.7;

    const finish = () => {
      if (finished) return;
      finished = true;
      hero.introRunning = false;
      revealContent.forEach(el => {
        el.style.removeProperty('transform');
        el.style.removeProperty('transform-origin');
        copyStagger.forEach(([key]) => el.style.removeProperty(key));
      });
      showCanvas();
      canvas.remove();
      anchor.replaceWith(nav);
      navLayer.remove();
      stage.style.removeProperty('opacity');
      stage.style.removeProperty('transform');
      stage.style.removeProperty('transform-origin');
      document.documentElement.classList.remove('prsm-entering');
      hero.appear = 1;
      hero.draw();
    };
    const frame = now => {
      const elapsed = now / 1000;
      const dt = lastIntroTime === undefined ? 0 : Math.min(.05, (now - lastIntroTime) / 1000);
      lastIntroTime = now;
      if (elapsed >= 2.1 || env.reduced) { finish(); return; }
      const ease = u => {
        u = Math.max(0, Math.min(1, u));
        return u * u * u * (u * (u * 6 - 15) +
          10);
      };
      const zoom = ease((elapsed - .35) / 1.2);
      const W = innerWidth,
        H = innerHeight,
        d = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(W * d) || canvas.height !== Math.round(H * d)) {
        canvas
          .width = Math.round(W * d);
        canvas.height = Math.round(H * d);
      }
      if (hero.canvas.clientWidth !== hero.W || hero.canvas.clientHeight !== hero.H) hero
        .resize();
      if (streamIntro) hero.pose();
      const base = hero.geo(),
        bounds = hero.canvas.getBoundingClientRect();
      // Fit the complete rotating solid, not just its nominal triangle height.
      // Its bounding sphere remains inside the viewport at every orientation.
      const radius = Math.max(...hero.solid({ base: 1, hx: hero.s.arrowShape }).V.map(v => Math
        .hypot(...v)));
      const initial = streamIntro ? Math.min(W, H) * .9 / (2 * radius) : Math.min(W, H) * .76;
      const G = {
        ...base,
        cx: W / 2 + (bounds.left + base.cx - W / 2) * zoom,
        cy: H / 2 + (bounds.top + base.cy - H / 2) * zoom,
        base: initial + (base.base - initial) * zoom
      };
      G.hx = G.base * hero.s.arrowShape;
      const g = intro.g;
      g.setTransform(d, 0, 0, d, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, W, H);
      g.globalAlpha = streamIntro ? 1 - ease((elapsed - .15) / .75) : 1;
      g.fillStyle = hero.s.ground;
      g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
      if (streamIntro) {
        // A camera-only pullback: the contact planner must never see the giant
        // intro geometry. Keep the first exchange at rest until the reveal is
        // complete, and render the same facets directly on the fullscreen layer.
        // The camera supplies the reveal, not a separate spin or pitch sweep.
        // Pre-roll the SAME quiet float that continues after landing, with
        // matching phase and velocity while the dot exchange still waits.
        const floatTime = hero.t + (elapsed - 2.1) * hero.s.speedMul * hero.s.streamSpeed;
        intro.yaw = hero.yaw + (hero.study === 'ribbon' ? hero.idleYaw(floatTime) - hero.idleYaw(
          hero.t) : 0);
        intro.pitch = hero.pitch;
        G.P = intro.project(G);
        // The conversation anchors a material corner to the dot axis. That is
        // not the visual center of its tilted silhouette, especially at scale.
        // Center the actual outline, then release this offset into the live pose.
        const xs = G.P.map(p => p[0]),
          ys = G.P.map(p => p[1]);
        G.cx -= (Math.min(...xs) + Math.max(...xs)) * .5 * (1 - zoom);
        G.cy -= (Math.min(...ys) + Math.max(...ys)) * .5 * (1 - zoom);
        intro.glass(g, G, true);
        // Both layers share the continuing turn during the dissolve, without
        // advancing the exchange clock or changing its contact-planning pose.
        landing.yaw = intro.yaw;
        landing.pitch = intro.pitch;
        landing.draw();
        if (zoom === 1) showCanvas();
      } else {
        // Original hero: retain its continuous particles through the pullback.
        const turn = -1.7 * (1 - zoom);
        hero.yaw += turn - previousTurn;
        previousTurn = turn;
        const originalGeo = hero.geo;
        hero.geo = () => ({
          ...G,
          cx: G.cx - bounds.left,
          cy: G.cy - bounds.top,
          dotA: { ...G.dotA, y: G.cy - bounds.top },
          dotB: { ...G.dotB, y: G.cy - bounds.top }
        });
        hero.appear = 1;
        if (elapsed >= .35) hero.tick(dt);
        hero.pitch = -.3 + (hero.rollA || 0) + .055 * Math.sin(hero.t * .9) + .4 * (1 - zoom);
        const showDots = hero.s.dots;
        hero.s.dots = elapsed >= .35;
        hero.draw();
        hero.s.dots = showDots;
        hero.geo = originalGeo;
        g.drawImage(hero.canvas, bounds.left, bounds.top, hero.W, hero.H);
      }
      // Scale the content around the prism's center, leaving the canvas geometry
      // untouched so the live prism never acquires a second moving target.
      const contentZoom = streamIntro ? ease((elapsed - .15) / 1.05) : ease((elapsed - .55) /
          1.55),
        scale = 1 + 1.35 * (1 - contentZoom);
      revealContent.forEach(el => {
        el.style.transform = 'none';
        const box = el.getBoundingClientRect();
        if (streamIntro) {
          // Wait for clearance above the FINAL copy position, not its enlarged
          // offscreen position, so the settling prism never crosses readable text.
          const prismBottom = G.cy + Math.max(...G.P.map(p => p[1]));
          if (copyRevealAt === undefined && elapsed >= .5 && prismBottom + 24 <= box.top)
            copyRevealAt = elapsed;
          copyStagger.forEach(([key, delay]) => el.style.setProperty(key, String(
            copyRevealAt === undefined ? 0 : ease((elapsed - copyRevealAt - delay) /
              .45))));
        }
        el.style.transformOrigin =
          `${bounds.left+base.cx-box.left}px ${bounds.top+base.cy-box.top}px`;
        el.style.transform = `scale(${scale})`;
      });
      if (elapsed > (streamIntro ? .15 : .65)) {
        document.documentElement.classList.remove(
          'prsm-entering');
        stage.style.opacity = '1';
      }

      // In the stream study, fade only after both prism geometries coincide.
      canvas.style.opacity = String(1 - ease((elapsed - (streamIntro ? 1.55 : .65)) / (
        streamIntro ? .55 : .75)));

    };
    // Start after fonts/layout and the first painted frame, not while assets load.
    hero.introRunning = true;
    frame(0);
    const clock = { elapsed: 0 };
    const tween = gsap.to(clock, {
      elapsed: 2.1,
      duration: 2.1,
      ease: 'none',
      onUpdate: () => frame(
        clock.elapsed * 1000),
      onComplete: finish
    });
    env.cleanups.push(() => {
      tween.kill();
      finish();
    });
  } else hero.start();
}

// END HERO INTRO
function prepareHeroWords() {
  const stack = document.querySelector("[data-hero-reveal]") || document.querySelector(
    "main .headline-stack, .headline-stack");
  if (!stack || stack.dataset.revealed) return;
  stack.dataset.revealed = "1";
  const head = stack.querySelector("h1, .display-huge, .display-xl, .vs-line"),
    para = stack.querySelector(".body-lg, .body-md"),
    rest = [...stack.querySelectorAll(".pill, .button, .btn, .prsm-lockup")].filter((el) => !head ||
      !head.contains(el)
    ); // a lockup set into the headline rises with the words, not after them (2026-09-10)
  const words = [];
  const wrap = (n) => {
    const o = document.createElement("span");
    o.className = "hero-word";
    const i = document.createElement("span");
    n.replaceWith(o);
    i.appendChild(n);
    o.appendChild(i);
    words.push(o);
  };
  if (head)[...head.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) frag
          .appendChild(document.createTextNode(w));
        else {
          const t = document.createTextNode(w);
          frag.appendChild(t);
          words.push(t);
        }
      });
      n.replaceWith(frag);
    }
    else if (n.nodeType === 1 && n.tagName !== "BR") words.push(n);
  });
  words.forEach((w) => { if (w.nodeType === 3 || !w.classList.contains("hero-word")) wrap(w); });
  const masks = [...(head ? head.querySelectorAll(".hero-word") : [])];
  if (para) {
    const inner = document.createElement("span");
    while (para.firstChild) inner
      .appendChild(para.firstChild);
    para.appendChild(inner);
    para.classList.add("hero-para");
  }
  rest.forEach((el) => el.classList.add("hero-rise"));
  return { stack, masks, para, rest };
}

// SECTION ORCHESTRATION -------------------------------------------------------
// All lifecycles, timelines, scroll triggers and event-driven motion live here.
(() => {
  const { gsap, ScrollTrigger, CustomEase, Lenis } = window;
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  CustomEase.create('rime-reveal', '0.19,1,0.22,1');
  CustomEase.create('rime-hero', '0.16,1,0.3,1');
  CustomEase.create('rime-out', '0.22,1,0.36,1');
  CustomEase.create('rime-wash', '0.22,0.61,0.36,1');
  CustomEase.create('rime-close', '0.4,0,0.6,1');
  CustomEase.create('rime-back', '0.34,1.56,0.64,1');
  CustomEase.create('css-ease', '0.25,0.1,0.25,1');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const num = (el, name, fallback) => el.hasAttribute(name) ? Number(el.getAttribute(name)) :
    fallback;
  const children = (el, mark) => {
    const marked = $$(`[${mark}]`, el).filter(c => c.closest(
      '[fd-reveal]') === el);
    return marked.length ? marked : [...el.children];
  };
  const cssVar = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(
    name).trim() || fallback;
  let active = null,
    hero, words, wordFollows = true,
    worn = null,
    mm;

  function listen(env, target, event, fn, options) {
    const wrapped = (...args) => env.context.add(() => fn(...args));
    target.addEventListener(event, wrapped, options);
    env.cleanups.push(() => target.removeEventListener(event, wrapped, options));
  }

  function tween(env, target, vars) {
    return gsap.to(target, {
      overwrite: 'auto',
      ...vars,
      duration: env.reduced ? 0 : (vars.duration ?? .35)
    });
  }
  // Read the existing CSS state as the destination. This keeps palette and hover
  // styling in CSS while GSAP owns the transition and its interruptible clock.
  function styleTransition(env, targets, properties, duration, ease = 'css-ease') {
    const read = el => Object.fromEntries(properties.map(p => [p, getComputedStyle(el)[p]]));
    targets.forEach(el => gsap.set(el, read(el)));
    return () => targets.forEach(el => {
      const from = read(el);
      properties.forEach(p => el.style.removeProperty(p.replace(/[A-Z]/g, c => '-' + c
        .toLowerCase())));
      const to = read(el);
      gsap.set(el, from);
      tween(env, el, { ...to, duration, ease });
    });
  }

  function trigger(env, vars) {
    return ScrollTrigger.create({
      scroller: env.scroller,
      ...
      vars
    });
  }

  function bindLoop(env, element, paint, threshold = 0, canRun = () => true) {
    let inView = false,
      wasRunning = false;
    const st = trigger(env, {
      trigger: element,
      start: () => `top+=${element.offsetHeight*threshold} bottom`,
      end: () => `bottom-=${element.offsetHeight*threshold} top`,
      onToggle: self => { inView = self.isActive; },
      onRefresh: self => { inView = self.isActive; }
    });
    inView = st.isActive;
    const step = (_time, delta) => {
      const running = inView && !env.reduced && !document.hidden && element.isConnected &&
        canRun();
      if (running) paint(wasRunning ? Math.min(.05, delta / 1000) : 0);
      wasRunning = running;
    };
    gsap.ticker.add(step);
    const release = () => {
      gsap.ticker.remove(step);
      st.kill();
    };
    env.cleanups.push(release);
    return release;
  }

  function animateSmoothScroll(env) {
    if (env.reduced) return;
    const lenis = new Lenis({
      wrapper: env.scroller,
      content: env.scroller,
      autoRaf: false,
      lerp: .1,
      smoothWheel: true,
      syncTouch: false,
      prevent: node => !!node.closest('[data-lenis-prevent], .video-modal')
    });
    env.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const resize = () => lenis.resize();
    ScrollTrigger.addEventListener('refresh', resize);
    const tick = time => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    env.cleanups.push(() => {
      gsap.ticker.remove(tick);
      ScrollTrigger.removeEventListener('refresh', resize);
      lenis.destroy();
    });
    listen(env, document, 'click', event => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event
        .shiftKey || event.altKey) return;
      const hash = link.getAttribute('href');
      if (hash.length < 2) return;
      let target;
      try { target = $(hash); } catch { return; }
      if (!target) return;
      event.preventDefault();
      history.pushState(null, '', hash);
      lenis.scrollTo(target, {
        duration: 1.1,
        onComplete: () => {
          target.setAttribute(
            'tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      });
    });
  }

  function revealSection(env, root) {
    $$('[fd-reveal], .rev', root).forEach(el => {
      const type = el.getAttribute('fd-reveal') || 'fade-up',
        distance = num(el, 'fd-distance', 40);
      const items = type === 'stagger' ? children(el, 'fd-reveal-child') : [el];
      el.classList.add('fd-ready');
      if (env.reduced) {
        gsap.set([...items, ...(type === 'converge' ? [...el.children] : [])], {
          opacity: 1,
          clearProps: 'transform,filter,clipPath'
        });
        el.classList.add('fd-in', 'in');
        return;
      }
      const scrub = ['converge', 'card-grow', 'scale-in', 'scale-soft'].includes(type);
      if (scrub) {
        const tl = gsap.timeline({
          scrollTrigger: {
            scroller: env.scroller,
            trigger: el,
            start: 'top bottom',
            end: `top ${type==='card-grow'?38:45}%`,
            scrub: true,
            invalidateOnRefresh: true
          }
        });
        if (type === 'converge') {
          const box = el.getBoundingClientRect();
          const targets = children(el, 'fd-converge').map(c => {
            const b = c
              .getBoundingClientRect(),
              dx = (b.left + b.right - box.left - box.right) / 2;
            return {
              c,
              side: Math
                .abs(dx) < 8 ? 0 : Math.sign(dx),
              dist: Math.round(Math.abs(dx) / 8)
            };
          });
          const ranks = [...new Set(targets.map(t => t.dist))].sort((a, b) => a - b);
          targets.forEach(({ c, side, dist }) => tl.fromTo(c, {
              opacity: 0,
              x: () => env.mobile ? 0 : side * num(el, 'fd-push', distance * .9),
              y: num(el, 'fd-lift', distance * 2.2),
              rotation: () => env.mobile ? 0 : -side * num(el, 'fd-rotate', 7),
              transformOrigin: side < 0 ? '0% 0%' : side > 0 ? '100% 0%' : '50% 0%'
            }, { opacity: 1, x: 0, y: 0, rotation: 0, duration: 1, ease: 'none' }, ranks
            .indexOf(dist) * num(el, 'fd-offset', .06)));
        } else tl.fromTo(el, {
          scale: num(el, 'fd-scale', type === 'scale-in' ? .9 : type === 'scale-soft' ?
            .96 : 1.15),
          opacity: type === 'card-grow' ? 1 : 0,
          y: type === 'scale-soft' ? distance * .4 : 0,
          transformOrigin: `50% ${type==='card-grow'?0:type==='scale-in'?55:60}%`
        }, { scale: 1, opacity: 1, y: 0, duration: 1, ease: 'none' });
      } else {
        const from = {
          opacity: 0,
          x: type === 'fade-left' ? distance : type === 'fade-right' ? -distance : 0,
          y: type === 'fade-down' ? -distance : type === 'fade-left' || type ===
            'fade-right' ? 0 : type === 'snap-up' ? distance * 1.6 : type === 'clip-up' ?
            distance * .25 : distance
        };
        if (type === 'blur-up') from.filter = 'blur(8px)';
        if (type === 'clip-up') from.clipPath = 'inset(100% 0% 0% 0%)';
        gsap.fromTo(items, from, {
          opacity: 1,
          x: 0,
          y: 0,
          ...(from.filter ? { filter: 'blur(0px)' } : {}),
          ...(from.clipPath ? { clipPath: 'inset(0% 0% 0% 0%)' } : {}),
          duration: num(el, 'fd-duration', 1),
          delay: num(el, 'fd-delay', 0),
          stagger: type === 'stagger' ? num(el, 'fd-stagger', .08) : 0,
          ease: 'rime-reveal',
          scrollTrigger: {
            scroller: env.scroller,
            trigger: el,
            start: el.classList
              .contains('rev') ? 'top 95%' : 'top 82%',
            once: true
          },
          onComplete: () => el.classList.add('fd-in', 'in')
        });
      }
    });
  }

  function wearHeroWord(env, force = false) {
    const word = $('.hero-lockup .word');
    if (!word) return;
    if (!wordFollows) {
      gsap.killTweensOf(word);
      word.style.removeProperty('color');
      word.style.removeProperty('--hero-word');
      worn = null;
      return;
    }
    const front = hero.faces().slice().sort((a, b) => b.area - a.area)[0];
    if (front && (force || front.colour !== worn)) {
      tween(env, word, {
        color: front.colour,
        duration: .7,
        ease: 'rime-out'
      });
      worn = front.colour;
    }
  }

  function animateHero(env) {
    hero.reduced = env.reduced;
    hero.pose?.();
    hero.appear = 1;
    hero.draw();
    hero.start();
    if (!words) words = prepareHeroWords();
    const study = hero instanceof PrsmStreamHero;
    const { masks, para, rest } = words;
    const spans = masks.map(m => $('span', m));
    if (env.reduced) {
      document.documentElement.classList.remove('prsm-entering');
      gsap.set([...spans, ...rest, ...(para ? [$('span', para)] : [])], {
        y: 0,
        yPercent: 0,
        opacity: 1
      });
    } else {
      gsap.fromTo(spans, { yPercent: 130, y: 0 }, {
        yPercent: 0,
        duration: study ? .65 : 1.15,
        delay: study ? .13 : .18,
        stagger: study ? 0 : .055,
        ease: 'rime-hero'
      });
      if (para) gsap.fromTo($('span', para), { yPercent: 110 }, {
        yPercent: 0,
        duration: study ?
          .65 : .95,
        delay: study ? .13 : Math.max(0, .15 + masks.length * .055 + 1.15 - .8),
        ease: 'rime-hero'
      });
      gsap.fromTo(rest, { opacity: 0, y: 22 }, {
        opacity: 1,
        y: 0,
        duration: study ? .65 : .8,
        delay: study ? .13 : Math.max(0, .15 + masks.length * .055 + .5),
        stagger: study ? 0 : .09,
        ease: 'rime-hero'
      });
      animateHeroIntro(env, hero);
    }
    let wasSpinning = false;
    const watch = () => {
      const spinning = hero.spin !== 'rest';
      if (wordFollows && wasSpinning &&
        !spinning) env.context.add(() => wearHeroWord(env));
      wasSpinning = spinning;
    };
    gsap.ticker.add(watch);
    env.cleanups.push(() => {
      gsap.ticker.remove(watch);
      hero.stop();
    });
    wearHeroWord(env, true);
  }

  function animateLogoReel(env) {
    const track = $('.hero-logos .track');
    if (!track || env.reduced) return;
    // Preserve the existing 84-second reverse marquee and its exact CSS endpoint.
    const loop = gsap.fromTo(track, { x: () => -track.scrollWidth * .5 - 8 }, {
      x: 0,
      duration: 84,
      ease: 'none',
      repeat: -1
    });
    trigger(env, {
      trigger: track.closest('rime-logos'),
      start: 'top bottom',
      end: 'bottom top',
      onToggle: self => loop.paused(!self.isActive)
    });
    const size = new ResizeObserver(() => {
      const p = loop.progress();
      loop.invalidate().progress(p);
    });
    size.observe(track);
    env.cleanups.push(() => size.disconnect());
  }

  function animateFineTuning(env) {
    const section = $('#tune');
    revealSection(env, section);
    const modal = $('#video-modal'),
      card = $('.vm-card', modal),
      back = $('.vm-back', modal),
      frame = $('#video-open');
    const originalOverflow = env.scroller.style.overflowY;
    const framePose = () => {
      const f = frame.getBoundingClientRect();
      const t = card.getBoundingClientRect();
      // Use layout dimensions, not a partly animated modal's current transform.
      return {
        x: f.left + f.width / 2 - innerWidth / 2,
        y: f.top + f.height / 2 - innerHeight /
          2,
        scaleX: f.width / card.offsetWidth,
        scaleY: f.height / card.offsetHeight
      };
    };
    const close = () => {
      tween(env, card, {
        ...framePose(),
        duration: .4,
        ease: 'rime-close',
        onComplete: () => {
          modal.hidden = true;
          env.scroller.style.overflowY = originalOverflow;
          env.lenis?.start();
          gsap.set(card, { clearProps: 'transform' });
          frame.focus({ preventScroll: true });
        }
      });
      tween(env, back, { opacity: 0, duration: .4, ease: 'css-ease' });
    };
    const open = () => {
      modal.hidden = false;
      env.lenis?.stop();
      env.scroller.style.overflowY = 'hidden';
      gsap.killTweensOf(card);
      gsap.set(card, { clearProps: 'transform' });
      gsap.set(card, framePose());
      gsap.set(back, { opacity: 0 });
      tween(env, card, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .55, ease: 'rime-out' });
      tween(env, back, { opacity: 1, duration: .4, ease: 'css-ease' });
      $('#video-x').focus({ preventScroll: true });
    };
    listen(env, frame, 'click', e => {
      e.stopPropagation();
      open();
    }, true);
    listen(env, frame, 'keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e
          .preventDefault();
        open();
      }
    });
    listen(env, $('#video-x'), 'click', close);
    listen(env, back, 'click', close);
    listen(env, document, 'keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });
    env.cleanups.push(() => {
      modal.hidden = true;
      env.scroller.style.overflowY = originalOverflow;
    });
  }

  function animateEnterprise(env) {
    revealSection(env, $('#enterprise'));
    $$('prsm-feature').forEach(feature => {
      feature.motion = { matches: env.reduced };
      feature.paint();
      feature.releaseClock = bindLoop(env, feature, dt => feature.advance(dt), .45, () => !
        feature.done);
    });
  }

  function animateCallFlow(env) {
    const flow = $('prsm-call-flow');
    if (!flow) return;
    flow.motion = { matches: env.reduced };
    let height = -1,
      previous = '',
      approved = false;
    flow.onHeight = value => {
      if (value === height) return;
      height = value;
      tween(env, flow.content, {
        height: value,
        duration: .65,
        ease: 'rime-out',
        onComplete: () => ScrollTrigger.refresh()
      });
    };
    const spinners = $$('.cf-status i', flow).map(el => gsap.to(el, {
      rotation: 360,
      duration: .9,
      ease: 'none',
      repeat: -1,
      paused: true
    }));
    const pulse = gsap.to($('.cf-output-head i', flow), {
      opacity: .35,
      duration: .5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      paused: true
    });
    const paint = () => {
      const state = [flow.dataset.phase, ...flow.rows.map(row => row.dataset.state), ...flow
        .people.map(p => p.className), flow.output.className
      ].join('|');
      if (state === previous) return;
      previous = state;
      const waiting = flow.waiting.classList.contains('cf-waiting-visible');
      tween(env, flow.waiting, { autoAlpha: waiting ? 1 : 0, duration: .25, ease: 'css-ease' });
      tween(env, flow.workspace, {
        autoAlpha: waiting ? 0 : 1,
        y: waiting ? 5 : 0,
        duration: .35,
        ease: 'css-ease'
      });
      flow.people.forEach(person => tween(env, $('.cf-name', person), {
        opacity: person
          .classList.contains('cf-speaking') ? 1 : .65,
        duration: .55 / 1.15,
        ease: 'css-ease'
      }));
      flow.rows.forEach((row, i) => {
        const status = row.dataset.state,
          started = status !== 'waiting',
          resolved = status === 'done';
        const step = flow.steps[i],
          pigment = getComputedStyle(row).getPropertyValue('--step').trim(),
          track = getComputedStyle(row).getPropertyValue('--track').trim();
        tween(env, row, {
          backgroundColor: status === 'waiting' ? 'rgba(255,254,251,.025)' : gsap.utils
            .interpolate('#2d2a25', pigment, status === 'working' ? .09 :
              .05),
          duration: .4,
          ease: 'css-ease'
        });
        tween(env, step, {
          backgroundColor: started ? track : '#535049',
          duration: .35,
          ease: 'css-ease'
        });
        tween(env, $('span', step), {
          color: started ? '#2d2a25' : 'rgba(255,254,251,.28)',
          duration: .25,
          ease: 'css-ease'
        });
        tween(env, flow.fills[i], {
          opacity: started ? 1 : 0,
          duration: .25,
          ease: 'css-ease'
        });
        tween(env, $('.cf-step-icon', step), {
          width: resolved ? 12 : 0,
          marginRight: resolved ? 6 : 0,
          opacity: resolved ? 1 : 0,
          duration: .25,
          ease: 'css-ease'
        });
        spinners[i].paused(env.reduced || status !== 'working');
      });
      const speaking = flow.output.classList.contains('cf-output-speaking');
      pulse.paused(env.reduced || !speaking);
      if (!speaking) gsap.set($('.cf-output-head i', flow), { opacity: 1 });
      const nextApproved = flow.deck.classList.contains('cf-deck-approved');
      if (nextApproved && !approved && !env.reduced) gsap.timeline().to(flow.rows[2], {
        y: -3,
        duration: .21,
        ease: 'power1.out'
      }).to(flow.rows[2], {
        y: 1,
        duration: .18,
        ease: 'power1.out'
      }).to(flow.rows[2], { y: 0, duration: .21, ease: 'power1.out' });
      approved = nextApproved;
    };
    flow.onPaint = () => env.context.add(paint);
    flow.update();
    paint();
    flow.releaseClock = bindLoop(env, flow, dt => flow.advance(dt), .1);
    const visibility = trigger(env, {
      trigger: flow,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: self => {
        if (!self.isActive) {
          spinners.forEach(t => t.pause());
          pulse.pause();
        } else {
          previous = '';
          env.context.add(paint);
        }
      }
    });
    env.cleanups.push(() => {
      flow.onPaint = null;
      flow.onHeight = null;
      visibility.kill();
    });
  }

  function animateOutcomes(env) {
    const root = $('#who'),
      copy = $('.who-copy', root),
      row = $('.who-cols', root);
    // Pin a neutral wrapper so reveal transforms never fight the pin transform.
    let pin = copy.parentElement;
    if (!pin.classList.contains('who-pin')) {
      pin = document.createElement('div');
      pin.className = 'who-pin';
      copy.before(pin);
      pin.appendChild(copy);
    }
    revealSection(env, root);
    if (!env.reduced) trigger(env, {
      trigger: pin,
      start: 'top 120px',
      endTrigger: row,
      end: () =>
        `bottom ${120+pin.offsetHeight}px`,
      pin,
      pinSpacing: false,
      invalidateOnRefresh: true
    });
  }

  function animateFAQ(env) {
    const root = $('rime-faq');
    revealSection(env, root);
    const items = $$('.faq_item', root),
      colors = [cssVar('--dot-yellow', '#ffd46f'), cssVar('--dot-pink', '#ffa0ff'), cssVar(
        '--dot-blue', '#2cc3e9')];
    const coarse = matchMedia('(pointer: coarse)').matches;
    const setOpen = (item, open) => {
      item.classList.toggle('is-open', open);
      const answer = $('.faq_answer', item),
        fx = $('.faq_fx', item);
      $('.faq_question', item).setAttribute('aria-expanded', String(open));
      tween(env, answer, {
        maxHeight: open ? answer.scrollHeight : 0,
        duration: .55,
        ease: 'rime-out',
        onComplete: () => ScrollTrigger.refresh()
      });
      tween(env, answer, { opacity: open ? 1 : 0, duration: .35, ease: 'css-ease' });
      tween(env, answer, { y: open ? 0 : 10, duration: .45, ease: 'rime-out' });
      tween(env, $('.faq_toggle', item), {
        rotation: open ? 135 : 0,
        duration: .55,
        ease: 'rime-back'
      });
      tween(env, item, { y: open ? -3 : 0, duration: .35, ease: 'rime-out' });
      tween(env, fx, { scale: open ? 1 : 0, duration: .5, ease: 'rime-wash' });
    };
    items.forEach((item, index) => {
      item.style.setProperty('--qc', colors[index % colors.length]);
      let fx = $('.faq_fx', item);
      if (!fx) {
        fx = document.createElement('span');
        fx.className = 'faq_fx';
        item.prepend(fx);
      }
      gsap.set(fx, { xPercent: -50, yPercent: -50, scale: 0 });
      const position = event => {
        const b = item.getBoundingClientRect(),
          x = event?.clientX - b.left || b.width / 2,
          y = event?.clientY - b.top || b.height / 2;
        const size = Math.max(Math.hypot(x, y), Math.hypot(b.width - x, y), Math.hypot(x, b
          .height - y), Math.hypot(b.width - x, b.height - y)) * 2.25;
        Object.assign(fx.style, {
          width: size + 'px',
          height: size + 'px',
          left: x + 'px',
          top: y + 'px'
        });
      };
      position();
      const question = $('.faq_question', item);
      question.setAttribute('role', 'button');
      question.tabIndex = 0;
      question.setAttribute('aria-expanded', 'false');
      const toggle = () => {
        const was = item.classList.contains('is-open');
        items.forEach(other => setOpen(other, other === item && !was));
      };
      listen(env, question, 'click', toggle);
      listen(env, question, 'keydown', event => {
        if (event.key === ' ' || event.key ===
          'Enter') {
          event.preventDefault();
          toggle();
        }
      });
      listen(env, item, 'pointerenter', event => {
        if (coarse) return;
        position(event);
        tween(env, fx, { scale: 1, duration: .5, ease: 'rime-wash' });
        tween(env, item, { y: -3, duration: .35, ease: 'rime-out' });
        tween(env, $('.faq_toggle', item), {
          scale: item.classList.contains('is-open') ?
            1 : 1.12,
          duration: .55,
          ease: 'rime-back'
        });
      });
      listen(env, item, 'pointerleave', () => {
        if (!item.classList.contains(
            'is-open')) {
          tween(env, fx, { scale: 0, duration: .5, ease: 'rime-wash' });
          tween(env, item, { y: 0, duration: .35, ease: 'rime-out' });
        }
        tween(env, $(
          '.faq_toggle', item), { scale: 1, duration: .55, ease: 'rime-back' });
      });
      gsap.set($('.faq_answer', item), { y: 10 });
    });
    listen(env, window, 'resize', () => items.forEach(item => {
      if (item.classList.contains(
          'is-open')) setOpen(item, true);
    }));
    env.cleanups.push(() => items.forEach(item => {
      item.classList.remove('is-open');
      $('.faq_question', item).setAttribute('aria-expanded', 'false');
    }));
  }

  function animateBeta(env) { revealSection(env, $('#beta')); }

  function animateFooter(env) {
    const footer = $('.footer_component'),
      spacer = $('.footer_spacer');
    if (!footer) return;
    document.body.classList.add('has-live-footer');
    const size = () => document.documentElement.style.setProperty('--footer-height', footer
      .offsetHeight + 'px');
    size();
    const ro = new ResizeObserver(() => {
      size();
      ScrollTrigger.refresh();
    });
    ro.observe(footer);
    env.cleanups.push(() => ro.disconnect());
    if (env.reduced) {
      gsap.set($$('.footer_column, .footer_bottom', footer), {
        opacity: 1,
        y: 0,
        scale: 1
      });
      return;
    }
    const tl = gsap.timeline({ paused: true }).fromTo($$('.footer_column', footer), {
        opacity: 0,
        y: 30
      }, { opacity: 1, y: 0, duration: .6, stagger: .1, ease: 'css-ease' }, 0)
      .fromTo($('.footer_bottom', footer), { opacity: 0, y: 10, scale: .95 }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: .6,
        ease: 'css-ease'
      }, .25);
    trigger(env, {
      trigger: spacer,
      start: () => `top+=${spacer.offsetHeight*.2} bottom`,
      end: 'bottom top',
      onEnter: () => tl.play(),
      onEnterBack: () => tl.play(),
      onLeaveBack: () => tl.reverse()
    });
  }

  function animateNavigation(env) {
    const nav = $('.nav_fixed'),
      banner = $('.banner10_component', nav);
    if (!nav) return;
    const recolor = styleTransition(env, [nav, ...$$(
      '.navbar1_component, .navbar1_logo-link, .navbar1_link', nav)], ['backgroundColor',
      'color'
    ], .3);
    nav.classList.add('is-in');
    gsap.set(nav, { yPercent: -100 });
    tween(env, nav, { yPercent: 0, duration: 1, delay: .04, ease: 'rime-hero' });
    let state = 'top';
    trigger(env, {
      trigger: env.scroller,
      start: 0,
      end: 'max',
      onUpdate: self => {
        const y = env.scroller.scrollTop,
          next = y <= 1 ? 'top' : self.direction > 0 && y > (banner?.offsetHeight || 0) +
          24 ? 'hidden' : self.direction < 0 ? 'peek' : state;
        if (next === state) return;
        state = next;
        nav.classList.toggle('is-solid', next !== 'top');
        env.context.add(() => {
          recolor();
          tween(env, nav, {
            yPercent: next === 'hidden' ? -100 : 0,
            y: next === 'peek' ?
              -(banner?.offsetHeight || 0) : 0,
            duration: next === 'hidden' ? .45 : 1,
            ease: 'rime-out'
          });
        });
      }
    });
    const dock = () => document.documentElement.style.setProperty('--dock', Math.max(0, Math
      .round(innerWidth - env.scroller.getBoundingClientRect().right)) + 'px');
    dock();
    const ro = new ResizeObserver(dock);
    ro.observe(env.scroller);
    env.cleanups.push(() => ro.disconnect());
    const links = $('.navbar1_menu-links', nav),
      dropdowns = $$('.navbar1_dropdown', nav);
    let panel = $('.nav-panel', links);
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'nav-panel';
      links.appendChild(panel);
    }
    const set = (dd, open) => {
      if (open) dropdowns.filter(d => d !== dd).forEach(d => {
        if (d.classList.contains(
            'is-open')) set(d, false);
      });
      dd.classList.toggle('is-open', open);
      $('.navbar1_dropdown-toggle', dd).setAttribute('aria-expanded', String(open));
      const list = $('.navbar1_dropdown-list', dd);
      tween(env, list, {
        opacity: open ? 1 : 0,
        y: open ? 0 : -6,
        duration: .18,
        ease: 'css-ease'
      });
      tween(env, $('.navbar1_dropdown-chev', dd), {
        rotation: open ? 180 : 0,
        duration: .2,
        ease: 'css-ease'
      });
      if (open) tween(env, panel, {
        left: dd.offsetLeft + list.offsetLeft,
        top: dd.offsetTop +
          list.offsetTop,
        width: list.offsetWidth,
        height: list.offsetHeight,
        opacity: 1,
        duration: .32,
        ease: 'rime-out'
      });
      else if (!dropdowns.some(d => d.classList.contains('is-open'))) tween(env,
        panel, { opacity: 0, duration: .18, ease: 'css-ease' });
    };
    dropdowns.forEach(dd => {
      let leave;
      gsap.set($('.navbar1_dropdown-list', dd), { y: -6 });
      listen(env, dd, 'pointerenter', () => {
        leave?.kill();
        set(dd, true);
      });
      listen(env, dd, 'pointerleave', () => {
        leave = gsap.delayedCall(.14, () => set(dd,
          false));
      });
      listen(env, $('.navbar1_dropdown-toggle', dd), 'click', () => set(dd, !dd.classList
        .contains('is-open')));
      listen(env, dd, 'focusin', e => { if (!dd.contains(e.relatedTarget)) set(dd, true); });
      listen(env, dd, 'focusout', e => {
        if (!dd.contains(e.relatedTarget)) set(dd,
          false);
      });
      listen(env, dd, 'keydown', e => {
        if (e.key === 'Escape') {
          set(dd, false);
          $('.navbar1_dropdown-toggle', dd).focus();
        }
      });
      env.cleanups.push(() => {
        leave?.kill();
        dd.classList.remove('is-open');
      });
    });
    const colors = ['--dot-yellow', '--dot-pink', '--dot-blue'];
    let last = -1;
    $$('.navbar1_dropdown-link:not(.is-prsm)', nav).forEach(link => {
      const on = () => {
        let i;
        do { i = Math.floor(Math.random() * 3); } while (i === last);
        last = i;
        tween(env, link, {
          backgroundColor: cssVar(colors[i], '#ffd46f'),
          duration: .18,
          ease: 'css-ease'
        });
      };
      const off = () => tween(env, link, {
        backgroundColor: 'rgba(0,0,0,0)',
        duration: .18,
        ease: 'css-ease'
      });
      listen(env, link, 'pointerenter', on);
      listen(env, link, 'pointerleave', off);
      listen(env, link, 'focus', on);
      listen(env, link, 'blur', off);
    });
    $$('.navbar1_dropdown-link.is-prsm', nav).forEach(link => {
      const tris = $$('.dd-tri', link),
        clock = { phase: 0 };
      let spin;
      const put = g => tris.forEach(p => p.setAttribute('transform',
        `translate(${g.tx*80} ${g.ty*80}) rotate(${g.angle} 60 58.33)`));
      listen(env, link, 'pointerenter', () => {
        if (env.reduced) return;
        spin?.kill();
        clock.phase = 0;
        spin = gsap.to(clock, {
          phase: 3,
          duration: 4.8,
          repeat: -1,
          ease: 'none',
          onUpdate: () => put(PRSM.gearAt(clock.phase))
        });
      });
      listen(env, link, 'pointerleave', () => {
        spin?.kill();
        if (env.reduced) return;
        const
          g = PRSM.gearAt(clock.phase);
        spin = gsap.to(g, {
          angle: -120 * Math.round(-g.angle / 120),
          tx: 0,
          ty: 0,
          duration: .45,
          ease: 'power2.out',
          onUpdate: () => put(g),
          onComplete: () =>
            tris.forEach(p => p.removeAttribute('transform'))
        });
      });
      env.cleanups.push(() => tris.forEach(p => p.removeAttribute('transform')));
    });
  }

  function animateButtons(env) {
    if (matchMedia('(pointer: coarse)').matches) return;
    $$('.button, .btn').forEach(btn => {
      if (!$('.btn-label', btn)) {
        Object.assign(btn.style, {
          position: btn.style.position || 'relative',
          overflow: 'hidden',
          isolation: 'isolate'
        });
        const label = document.createElement('span'),
          l1 = document.createElement('span');
        label.className = 'btn-label';
        l1.className = 'l1';
        while (btn.firstChild) l1.appendChild(btn.firstChild);
        const l2 = l1.cloneNode(true);
        l2.className = 'l2';
        label.append(l1, l2);
        btn.append(label);
        const fx = document.createElement('span');
        fx.className = 'btn-fx';
        btn.prepend(fx);
      }
      const labels = $$('.l1,.l2', btn),
        fx = $('.btn-fx', btn);
      let circles = [],
        previousColor = '';
      gsap.set(labels, { yPercent: i => i ? 165 : 0 });
      listen(env, btn, 'pointerenter', event => {
        previousColor = btn.style.color;
        btn.style.color = 'var(--dark, #24211d)';
        const b = btn.getBoundingClientRect(),
          x = event.clientX - b.left,
          y = event.clientY - b.top;
        const d = Math.max(Math.hypot(x, y), Math.hypot(b.width - x, y), Math.hypot(x, b
          .height - y), Math.hypot(b.width - x, b.height - y)) * 2.4;
        gsap.killTweensOf(circles);
        fx.replaceChildren();
        circles = ['--dot-pink', '--dot-yellow', '--dot-blue'].sort(() => Math.random() -
          .5).map(name => {
          const c = document.createElement('span');
          c.className = 'c';
          Object.assign(c.style, {
            width: d + 'px',
            height: d + 'px',
            left: x + 'px',
            top: y + 'px',
            background: cssVar(name, '#2cc3e9')
          });
          fx.append(c);
          return c;
        });
        gsap.set(circles, { xPercent: -50, yPercent: -50, scale: 0 });
        tween(env, circles, {
          scale: 1,
          duration: .55,
          stagger: env.reduced ? 0 : .095,
          ease: 'rime-wash'
        });
        tween(env, labels, {
          yPercent: i => i ? 0 : -165,
          duration: .45,
          ease: 'rime-out'
        });
      });
      listen(env, btn, 'pointerleave', () => {
        btn.style.color = previousColor;
        const dead = circles;
        circles = [];
        tween(env, dead, {
          scale: 0,
          duration: .55,
          stagger: env.reduced ? 0 : .035,
          ease: 'rime-wash',
          onComplete: () => dead.forEach(c => c.remove())
        });
        tween(env, labels, {
          yPercent: i => i ? 165 : 0,
          duration: .45,
          ease: 'rime-out'
        });
      });
      env.cleanups.push(() => fx.replaceChildren());
    });
  }

  function animateControlFeedback(env) {
    const links = $('.navbar1_menu-links');
    const opacity = styleTransition(env, [...links.children].filter(el => el.matches(
      '.navbar1_link,.navbar1_dropdown')), ['opacity'], .25);
    listen(env, links, 'pointerover', opacity);
    listen(env, links, 'pointerout', opacity);
    $$('.navbar1_dropdown-link.is-prsm, .footer_link, .faq_toggle, .pillset .opts button')
      .forEach(el => {
        const properties = el.matches('.footer_link') ? ['filter'] : ['backgroundColor',
          'color'
        ];
        const retarget = styleTransition(env, [el], properties, el.matches('.faq_toggle') ? .3 :
          el.matches('.is-prsm') ? .25 : .18);
        const surface = el.closest('.faq_item, .pillset') || el;
        listen(env, surface, 'pointerenter', retarget);
        listen(env, surface, 'pointerleave', retarget);
        listen(env, surface, 'click', retarget);
      });
    $$('.player_button').forEach(button => {
      const retarget = styleTransition(env, [button], ['backgroundColor', 'color',
        'boxShadow'
      ], .35);
      gsap.set(button, { scale: 1 });
      const icon = $('.player_play', button);
      gsap.set(icon, { x: 0, scale: 1 });
      const scale = (size, hover) => {
        retarget();
        tween(env, button, { scale: size, duration: .25, ease: 'rime-back' });
        tween(env, icon, {
          x: hover ? 1 : 0,
          scale: hover ? 1.1 : 1,
          duration: .25,
          ease: 'rime-back'
        });
      };
      listen(env, button, 'pointerenter', () => scale(1.08, true));
      listen(env, button, 'pointerleave', () => scale(1, false));
      listen(env, button, 'pointerdown', () => scale(.97, true));
      listen(env, button, 'pointerup', () => scale(1.08, true));
    });
  }

  function prepareHero() {
    const study = new URLSearchParams(location.search).get('heroStudy');
    hero = Object.hasOwn(PrsmStreamHero.STUDIES, study) ? new PrsmStreamHero($(
      '#hero-c'), { study }) : new PrsmHero($('#hero-c'), PrsmHero.REFRACTION);
    hero.set({ lineY: .4 });
    $('#hero').style.background = hero.s.ground;
    window.__prsm = { hero };
  }
  async function mount() {
    await window.rimeComponentsReady;
    await document.fonts.ready;
    mm = gsap.matchMedia();
    mm.add({
      reduced: '(prefers-reduced-motion: reduce)',
      mobile: '(max-width: 900px)',
      all: 'all'
    }, context => {
      const env = {
        context,
        reduced: context.conditions.reduced,
        mobile: context.conditions
          .mobile,
        scroller: $('#stage'),
        cleanups: []
      };
      active = env;
      animateSmoothScroll(env);
      animateHero(env);
      animateLogoReel(env);
      animateFineTuning(env);
      animateEnterprise(env);
      animateCallFlow(env);
      animateOutcomes(env);
      animateFAQ(env);
      animateBeta(env);
      animateFooter(env);
      animateNavigation(env);
      animateButtons(env);
      animateControlFeedback(env);
      ScrollTrigger.refresh();
      document.documentElement.dataset.motionReady = env.reduced ? 'reduced' : 'gsap';
      return () => {
        for (const cleanup of env.cleanups.reverse()) cleanup();
        if (active ===
          env) active = null;
      };
    });
  }
  window.RimeMotion = {
    prepareHero,
    bindHero(instance) {
      if (!active) return null;
      const env = active;
      let release;
      env.context.add(() => {
        release = bindLoop(env, instance.canvas, dt => {
            instance.tick(
              dt);
            instance.draw();
          }, 0, () => !instance.introRunning && !instance.s
          .streamPaused);
      });
      return release;
    },
    setWordFollows(value) {
      wordFollows = value;
      if (active) active.context.add(() =>
        wearHeroWord(active, true));
    },
    destroy() {
      mm?.revert();
      hero?.resizeObserver?.disconnect();
      const flow = $('prsm-call-flow');
      flow?.resize?.disconnect();
      if (flow?.onResize) window.removeEventListener('resize', flow.onResize);
      delete document.documentElement.dataset.motionReady;
    }
  };
  // First-paint guard belongs to the motion entry point, not an inline page clock.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !location.hash) {
    document.documentElement.classList.add('prsm-entering');
    gsap.delayedCall(8, () => document.documentElement.classList.remove('prsm-entering'));
  }
  document.addEventListener('DOMContentLoaded', () => mount().catch(error => {
    document
      .documentElement.classList.remove('prsm-entering');
    console.error('Prism motion initialization failed', error);
  }), { once: true });
})();
