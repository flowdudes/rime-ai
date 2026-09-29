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
/* ==========================================================================
   PRISM SOLO HERO (Interactive 3D Draggable Prism — Standalone)
   ========================================================================== */
(() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  const hex2 = (h) => {
    h = (h || "#000000").replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const toHex = (v) => "#" + v.map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2,
    "0")).join("");
  const multiply = (a, b) => {
    const B = hex2(b);
    return toHex(hex2(a).map((v, i) => (v * B[i]) / 255));
  };

  const C = {
    yellow: "#f0be4d",
    pink: "#f08add",
    aqua: "#1dadc7",
    ink: "#2e2a25",
    paper: "#f0e9dd"
  };
  const MIX = { yellow: "#ffd46f", pink: "#ffa0ff", aqua: "#2cc3e9" };

  const FACES = Object.freeze({
    arrow: C.pink,
    faceBack: C.aqua,
    faceA: C.yellow,
    faceB: "#ffffff"
  });

  const PRSM_SOLO_FACETS = Object.freeze({
    "0:1": multiply(MIX.pink, MIX.aqua),
    "0:2": multiply(MIX.pink, MIX.yellow),
    "0:3": C.pink,
    "1:2": multiply(C.aqua, C.yellow),
    "1:3": C.aqua,
    "2:3": C.yellow,
  });

  /* ---------------- Core Prism Engine ---------------- */
  class PrsmSoloHero {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.g = canvas.getContext("2d");
      this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

      this.s = Object.assign({
        ground: "#2e2a25",
        arrowShape: 0.866,
        soloSize: 1.5,
        soloSpeed: 0.61,
        soloTilt: -42,
        soloDrag: 1.3,
        soloWander: 0.95,
        soloBlend: "Off",
        streamPaused: false,
        ...FACES
      }, opts);

      this.yaw = 0.55;
      this.pitch = 0;
      this.roll = 0;
      this.dragPitch = 0;
      this.dragging = false;
      this.resume = 1;
      this.soloPhase = 0;
      this.artBox = null;

      this.resize();
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(canvas);

      this.bindDragEvents();
    }

    resize() {
      const c = this.canvas;
      this.dpr = Math.min(devicePixelRatio || 1, 2);
      this.W = c.clientWidth || 1;
      this.H = c.clientHeight || 1;
      c.width = Math.floor(this.W * this.dpr);
      c.height = Math.floor(this.H * this.dpr);

      const art = this.canvas.parentElement?.querySelector(".hero-art");
      if (art) {
        const cb = this.canvas.getBoundingClientRect();
        const ab = art.getBoundingClientRect();
        this.artBox = {
          cx: ab.left - cb.left + ab.width / 2,
          cy: ab.top - cb.top + ab.height / 2,
          width: ab.width,
          height: ab.height
        };
      } else {
        this.artBox = { cx: this.W / 2, cy: this.H / 2, width: this.W, height: this.H };
      }

      this.pose();
      this.draw();
    }

    solid(G) {
      const hx = G.hx,
        b = G.base;
      const F = [
        [hx * 2 / 3, 0],
        [-hx / 3, -b / 2],
        [-hx / 3, b / 2]
      ];
      const edge = (Math.hypot(F[0][0] - F[1][0], F[0][1] - F[1][1]) +
        Math.hypot(F[1][0] - F[2][0], F[1][1] - F[2][1]) +
        Math.hypot(F[2][0] - F[0][0], F[2][1] - F[0][1])) / 3;
      const h = edge * 0.8165;
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

    // In geo()
    geo() {
      const box = this.artBox || {
        cx: this.W / 2,
        cy: this.H / 2,
        width: this.W,
        height: this
          .H
      };
      const base = Math.min(box.width, box.height) * 0.67 * (this.s.soloSize ?? 1.25);
      // Add a +40px or +60px buffer to cy so it sits lower
      return { cx: box.cx, cy: box.cy + 40, base, hx: base * this.s.arrowShape };
    }

    project(G) {
      const { V } = this.solid(G);
      const cA = Math.cos(this.yaw),
        sA = Math.sin(this.yaw);
      const cP = Math.cos(this.pitch),
        sP = Math.sin(this.pitch);
      const cR = Math.cos(this.roll || 0),
        sR = Math.sin(this.roll || 0);

      return V.map(([x, y, z]) => {
        const x1 = x * cA + z * sA;
        const z1 = -x * sA + z * cA;
        const x2 = x1;
        const y2 = y * cP - z1 * sP;
        const z2 = y * sP + z1 * cP;
        return [x2 * cR - y2 * sR, x2 * sR + y2 * cR, z2];
      });
    }

    faces(G, includeBack = false) {
      const R = this.project(G || this.geo());
      const cols = [this.s.arrow, this.s.faceBack, this.s.faceA, this.s.faceB];
      return [
        [0, 1, 2],
        [3, 2, 1],
        [0, 3, 1],
        [0, 2, 3]
      ].map((idx, i) => {
        const [a, b, c] = idx.map(k => R[k]);
        const u = b.map((v, idx2) => v - a[idx2]);
        const v = c.map((n, idx2) => n - a[idx2]);
        const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[
          1] * v[0]];
        const ctr = a.map((p, idx2) => (p + b[idx2] + c[idx2]) / 3);
        const outward = n.reduce((sum, p, idx2) => sum + p * ctr[idx2], 0) < 0 ? -1 : 1;
        return { idx, i, front: n[2] * outward > 0, colour: cols[i] };
      }).filter(f => includeBack || f.front);
    }

    facetColor(a, b) {
      return PRSM_SOLO_FACETS[[a.i, b.i].sort((x, y) => x - y).join(":")];
    }

    pose() {
      const t = this.soloPhase || 0;
      const w = this.s.soloWander ?? 0.95;
      this.pitch = (this.s.soloTilt ?? -42) * Math.PI / 180 + (this.dragPitch || 0) +
        w * (0.42 * Math.sin(t * 0.79) + 0.13 * Math.sin(t * 1.37));
      this.roll = w * (0.24 * Math.sin(t * 0.63) + 0.09 * (Math.sin(t * 1.19 + 0.7) - Math.sin(
        0.7)));
    }

    tick(dt) {
      if (this.reduced || this.s.streamPaused || this.dragging) return;
      this.resume = (this.resume ?? 1) + (1 - (this.resume ?? 1)) * (1 - Math.exp(-dt / 0.6));
      const before = this.soloPhase || 0;
      const after = before + dt * this.s.soloSpeed * this.resume;
      const drift = t => 0.16 * Math.sin(t * 0.81) + 0.07 * Math.sin(t * 1.31 + 0.9);

      this.yaw += after - before + (this.s.soloWander ?? 0.95) * (drift(after) - drift(before));
      this.soloPhase = after;
      this.pose();
    }

    drag(dx, dy) {
      this.yaw += dx * 0.006 * this.s.soloDrag;
      this.dragPitch = Math.max(-1.2, Math.min(1.2, (this.dragPitch || 0) + dy * 0.006 * this.s
        .soloDrag));
      this.pose();
      this.draw();
    }

    glass(g, G) {
      g.save();
      g.translate(G.cx, G.cy);
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;

      const faces = this.faces(G, true);
      const path = f => {
        g.beginPath();
        f.idx.forEach((k, j) => (j ? g.lineTo(G.P[k][0], G.P[k][1]) : g.moveTo(G.P[k][0], G.P[
          k][1])));
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
          g.lineWidth = 0.6;
          path(far);
          g.fill();
          g.stroke();
        });
        g.restore();
      });
      g.restore();
    }

    draw() {
      if (!this.W) return;
      const g = this.g;
      const G = this.geo();
      G.P = this.project(G);

      g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
      g.clearRect(0, 0, this.W, this.H);

      this.glass(g, G);

      //Real-time convex hull CSS clip-path to keep outer areas clickable
      if (this.canvas.style) {
        const points = G.P.map(([x, y]) => [G.cx + x, G.cy + y]).sort((a, b) => a[0] - b[0] ||
          a[1] - b[1]);
        const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[
          0]);
        const half = list => {
          const hull = [];
          for (const p of list) {
            while (hull.length > 1 && cross(hull.at(-2), hull.at(-1), p) <= 0) hull.pop();
            hull.push(p);
          }
          return hull.slice(0, -1);
        };
        const hull = [...half(points), ...half([...points].reverse())];
        this.canvas.style.clipPath = "polygon(" + hull.map(([x, y]) => `${x}px ${y}px`).join(
          ",") + ")";
      }
    }

    bindDragEvents() {
      const canvas = this.canvas;
      let pointer = null,
        lastX = 0,
        lastY = 0;

      canvas.tabIndex = 0;
      canvas.style.cursor = "grab";
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label",
        "Rotating 3D Prism. Drag to rotate, use arrow keys to turn, or Space to pause.");

      canvas.addEventListener("pointerdown", event => {
        if (event.button !== 0 || pointer !== null) return;
        pointer = event.pointerId;
        lastX = event.clientX;
        lastY = event.clientY;
        this.dragging = true;
        this.resume = 0;
        canvas.style.cursor = "grabbing";
        canvas.setPointerCapture(pointer);
        canvas.focus({ preventScroll: true });
      });

      canvas.addEventListener("pointermove", event => {
        if (event.pointerId !== pointer) return;
        this.drag(event.clientX - lastX, event.clientY - lastY);
        lastX = event.clientX;
        lastY = event.clientY;
      });

      const release = () => {
        pointer = null;
        this.dragging = false;
        canvas.style.cursor = "grab";
      };

      ["pointerup", "pointercancel", "lostpointercapture"].forEach(type => {
        canvas.addEventListener(type, release);
      });

      canvas.addEventListener("keydown", event => {
        const steps = {
          ArrowLeft: [-18, 0],
          ArrowRight: [18, 0],
          ArrowUp: [0, -18],
          ArrowDown: [0, 18]
        };
        if (steps[event.key]) {
          event.preventDefault();
          this.drag(...steps[event.key]);
        }
        if (event.code === "Space") {
          event.preventDefault();
          this.s.streamPaused = !this.s.streamPaused;
        }
      });
    }

    start() {
      if (this.io) return;
      let last = 0;
      const loop = (now) => {
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
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

  window.PrsmSoloHero = PrsmSoloHero;
})();

/* ==========================================================================
   SOLO PRISM PAGE BOOTSTRAPPER
   ========================================================================== */
(() => {
  const canvas = document.getElementById("hero-c");
  const heroEl = document.getElementById("hero");
  if (!canvas || !heroEl) return;

  const boot = () => {
    if (!window.PrsmSoloHero) return setTimeout(boot, 30);

    // Enforce dark theme
    heroEl.style.backgroundColor = "#2e2a25";
    heroEl.style.color = "#f0e9dd";

    // Clean up any lingering intro classes
    document.documentElement.classList.remove("prsm-entering");

    const hero = new window.PrsmSoloHero(canvas);
    window.__prsm = { hero };

    hero.start();

    // Responsive layout
    const layout = () => {
      const h = heroEl.clientHeight || 1;
      const prism = 0.25 * h;
      heroEl.style.setProperty("--hero-copy-top", Math.round(226 + prism + 60) + "px");
    };
    new ResizeObserver(layout).observe(heroEl);
    layout();

    // Text metric alignment
    const h1El = heroEl.querySelector("h1");
    const wrapEl = heroEl.querySelector(".hero_text-wrap");
    if (h1El && wrapEl) {
      const align = () => {
        const d = (parseFloat(getComputedStyle(h1El).fontSize) || 96) * 0.15;
        wrapEl.style.setProperty("--hero-sub-top", Math.round(d) + "px");
      };
      new ResizeObserver(align).observe(h1El);
      align();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
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
