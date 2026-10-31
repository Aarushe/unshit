"use client";

import { Fragment, useEffect, useRef, useState } from "react";

type Kind = "i" | "j" | "." | ":" | "…" | "ö" | "ü" | "ä";

// Where each dot sits in its glyph, in ems from the glyph's origin (x right,
// y up), and its size next to a full stop. Read from Geist Serif's outlines.
const DOTS: Record<Kind, [x: number, y: number, size: number][]> = {
  i: [[0.147, 0.662, 0.8]],
  j: [[0.138, 0.662, 0.8]],
  ".": [[0.105, 0.056, 1]],
  ":": [[0.105, 0.473, 1], [0.105, 0.056, 1]],
  "…": [[0.094, 0.056, 1], [0.294, 0.056, 1], [0.494, 0.056, 1]],
  ö: [[0.212, 0.662, 0.8], [0.392, 0.662, 0.8]],
  ü: [[0.195, 0.662, 0.8], [0.375, 0.662, 0.8]],
  ä: [[0.193, 0.662, 0.8], [0.373, 0.662, 0.8]],
};

// What stays in the text once the dots are lifted out of a glyph.
const BARE: Record<Kind, string> = { i: "ı", j: "ȷ", ".": ".", ":": ":", "…": "…", ö: "o", ü: "u", ä: "a" };
// Glyphs that are nothing but dots: kept for their width, drawn invisible.
const GHOST = new Set<string>([".", ":", "…"]);

// A full stop's ink is centred 0.105em right of its origin and 0.056em up.
const STOP_X = 0.105;
const STOP_Y = 0.056;

const INK = [236, 228, 212];
const EMBER = [255, 106, 43];
const ROSE = [255, 79, 123];

const story = [
  "It is the thirty-first of October. The ink is dry, the lamp is lit, and this is, I promise, just a page.",
  "Read it quickly. Do not linger on the little things: the specks, the points, the tiny full stops. They were here before the letters were. They remember being something else.",
  "If one of them moves, it is the light. If all of them move… keep your hand still. Very still. They are only curious; they just want to see who is reading.",
  "Whatever you do, do not press down and hold them. Do not click. And do not, under any circumstances, shake the page.",
];

// Text whose dots are taken out and handed to the overlay. Words don't wrap
// inside, since each dotted glyph carries a marker that would let them.
function Live({ text }: { text: string }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.split(" ").map((word, w) => (
          <Fragment key={w}>
            {w > 0 && " "}
            <span className="whitespace-nowrap">
              {[...word].map((c, i) =>
                c in BARE ? (
                  <span key={i} data-k={c}>
                    <i className="inline-block size-0 align-baseline" />
                    {GHOST.has(c) ? <span className="text-transparent">{BARE[c as Kind]}</span> : BARE[c as Kind]}
                  </span>
                ) : (
                  c
                ),
              )}
            </span>
          </Fragment>
        ))}
      </span>
    </>
  );
}

enum Mode {
  Home,
  Orbit,
  Loose,
  Rest,
  Hop,
}

type Dot = {
  el: SVGTextElement;
  size: number;
  leader: number; // the other eye of an umlaut, which this one blinks with
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ox: number; // springy offset from home
  oy: number;
  vox: number;
  voy: number;
  gx: number; // glance toward the cursor
  gy: number;
  mode: Mode;
  fear: number;
  fond: number;
  free: number; // how much bigger it is once off the page
  rot: number;
  blinkAt: number;
  nextBlink: number;
  openAt: number;
  joinAt: number;
  knockAt: number;
  rank: number;
  bin: number;
  level: number;
  wait: number;
  hop: { x0: number; y0: number; cx: number; cy: number; t: number; dur: number };
  wave: number;
  nb: number[];
  e: number;
  fill: string;
  t: string;
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function Seance() {
  const root = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const article = useRef<HTMLElement>(null);
  const reveal = useRef<HTMLParagraphElement>(null);
  const meter = useRef<HTMLSpanElement>(null);
  const meterGlyph = useRef<HTMLSpanElement>(null);
  const meterWord = useRef<HTMLSpanElement>(null);
  const sound = useRef(true);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    const main = root.current!;
    const layer = svg.current!;
    const page = article.current!;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SVGNS = "http://www.w3.org/2000/svg";

    const dots: Dot[] = [];
    let W = 0;
    let H = 0;
    let floor = 0;
    const BIN = 9;
    let stack: number[] = [];

    const p = { x: -1e4, y: -1e4, vx: 0, vy: 0, t: 0, inside: false, down: false, downAt: 0, still: 0, lastSignX: 0 };
    let T = 0;
    let seance = false;
    let shake = 0;
    let shakeUntil = 0;
    let wobble = 0;
    const waves: { x: number; y: number; t0: number; id: number }[] = [];
    let waveId = 0;
    let liked = false;

    // Small wooden clicks for landings, made on the spot.
    let audio: AudioContext | null = null;
    let lastTick = 0;
    const tick = (freq: number, vol: number) => {
      if (!audio || !sound.current) return;
      const now = audio.currentTime;
      if (now - lastTick < 0.022) return;
      lastTick = now;
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(freq, now);
      o.frequency.exponentialRampToValueAtTime(freq * 0.55, now + 0.07);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(vol, now + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      o.connect(g).connect(audio.destination);
      o.start(now);
      o.stop(now + 0.09);
    };

    // Finds every dot's home on the page, creating the dots the first time.
    function measure() {
      const box = main.getBoundingClientRect();
      W = box.width;
      H = main.scrollHeight;
      layer.setAttribute("width", String(W));
      layer.setAttribute("height", String(H));
      layer.setAttribute("viewBox", `0 0 ${W} ${H}`);
      stack = new Array(Math.ceil(W / BIN) + 1).fill(0);

      let n = 0;
      const first = dots.length === 0;
      main.querySelectorAll<HTMLElement>("[data-k]").forEach((host) => {
        const kind = host.dataset.k as Kind;
        const mark = host.firstElementChild!.getBoundingClientRect();
        const fs = parseFloat(getComputedStyle(host).fontSize);
        const specs = DOTS[kind];
        const leaderIndex = n;
        specs.forEach(([ex, ey, k], j) => {
          const hx = mark.left - box.left + ex * fs;
          const hy = mark.top - box.top - ey * fs;
          const size = fs * k;
          if (first) {
            const el = document.createElementNS(SVGNS, "text") as SVGTextElement;
            el.textContent = ".";
            layer.appendChild(el);
            dots.push({
              el,
              size,
              leader: specs.length === 2 && kind !== ":" && j === 1 ? leaderIndex : -1,
              hx,
              hy,
              x: hx,
              y: hy,
              vx: 0,
              vy: 0,
              ox: 0,
              oy: 0,
              vox: 0,
              voy: 0,
              gx: 0,
              gy: 0,
              mode: Mode.Home,
              fear: 0,
              fond: 0,
              free: 1,
              rot: 0,
              blinkAt: -1,
              nextBlink: rand(3, 14),
              openAt: 0,
              joinAt: 0,
              knockAt: Infinity,
              rank: 0,
              bin: 0,
              level: 0,
              wait: 0,
              hop: { x0: 0, y0: 0, cx: 0, cy: 0, t: 0, dur: 1 },
              wave: -1,
              nb: [],
              e: -1,
              fill: "",
              t: "",
            });
          }
          const d = dots[n];
          d.hx = hx;
          d.hy = hy;
          d.size = size;
          d.el.setAttribute("font-size", String(size));
          d.el.setAttribute("x", String(-STOP_X * size));
          d.el.setAttribute("y", String(STOP_Y * size));
          n++;
        });
      });

      // Dots that read first open their eyes first.
      if (first) dots.forEach((d, i) => (d.openAt = 0.5 + i * 0.006 + Math.random() * 0.15));

      // Neighbours carry fear and fondness across the page.
      for (const d of dots) {
        d.nb = [];
        dots.forEach((o, j) => {
          if (o !== d && Math.hypot(o.hx - d.hx, (o.hy - d.hy) * 0.8) < 130) d.nb.push(j);
        });
      }
      // Anything lying on the old floor falls to the new one.
      for (const d of dots) if (d.mode === Mode.Rest) d.mode = Mode.Loose;
    }

    function unstack(d: Dot) {
      stack[d.bin] = Math.min(stack[d.bin], d.level);
      for (const o of dots) if (o !== d && o.mode === Mode.Rest && o.bin === d.bin && o.level > d.level) o.mode = Mode.Loose;
    }

    function release(d: Dot, vx: number, vy: number) {
      if (d.mode === Mode.Rest) unstack(d);
      if (d.mode === Mode.Home) {
        d.x = d.hx + d.ox + d.gx;
        d.y = d.hy + d.oy + d.gy;
      }
      d.mode = Mode.Loose;
      d.vx = vx;
      d.vy = vy;
    }

    function land(d: Dot) {
      let b = clamp(Math.round(d.x / BIN), 0, stack.length - 1);
      // Slide off taller piles, like sand.
      for (let i = 0; i < 40; i++) {
        const l = b > 0 ? stack[b - 1] : Infinity;
        const r = b < stack.length - 1 ? stack[b + 1] : Infinity;
        if (stack[b] > Math.min(l, r) + 1) b += l <= r ? -1 : 1;
        else break;
      }
      d.bin = b;
      d.level = stack[b]++;
      d.mode = Mode.Rest;
      d.x = b * BIN;
      d.y = floor - BIN * (d.level + 0.5);
      d.vx = d.vy = 0;
      d.wait = T + rand(1.2, 6);
    }

    function startSeance() {
      seance = true;
      const order = dots
        .map((d, i) => ({ i, dist: Math.hypot((d.mode === Mode.Home ? d.hx : d.x) - p.x, (d.mode === Mode.Home ? d.hy : d.y) - p.y) }))
        .sort((a, b) => a.dist - b.dist);
      order.forEach(({ i, dist }, rank) => {
        const d = dots[i];
        d.rank = rank;
        d.joinAt = T + dist / 1500 + Math.random() * 0.08;
      });
    }

    function endSeance() {
      seance = false;
      for (const d of dots) {
        d.joinAt = Infinity;
        if (d.mode !== Mode.Orbit) continue;
        const dx = d.x - p.x;
        const dy = d.y - p.y;
        const r = Math.hypot(dx, dy) || 1;
        release(d, d.vx + p.vx * 0.5 + (dx / r) * rand(150, 450), d.vy + p.vy * 0.5 + (dy / r) * rand(150, 450) - 250);
      }
    }

    // How big a dot grows once it's off the page, capped for the headline's.
    const big = (d: Dot) => Math.min(2.6, 15 / (d.size * 0.14));

    function frame(dt: number) {
      T += dt;
      // The ground is the bottom of the screen, just above the footer.
      floor = Math.min(H, window.scrollY + window.innerHeight) - 52;
      const sp = Math.hypot(p.vx, p.vy);
      p.vx *= Math.exp(-dt * 9);
      p.vy *= Math.exp(-dt * 9);
      p.still = p.inside && sp < 50 && !p.down ? p.still + dt : 0;
      shake = Math.max(0, shake - dt * 2.2);
      wobble *= Math.exp(-dt * 3.5);

      if (p.down && !seance && T - p.downAt > 0.22) startSeance();

      const fear0 = dots.map((d) => d.fear);
      const fond0 = dots.map((d) => d.fond);
      let sumE = 0;
      let liking = 0;
      let homes = 0;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        if (seance && d.mode !== Mode.Orbit && T >= d.joinAt) {
          if (d.mode === Mode.Rest) unstack(d);
          if (d.mode === Mode.Home) {
            d.x = d.hx + d.ox + d.gx;
            d.y = d.hy + d.oy + d.gy;
            d.vx = d.vy = 0;
          }
          d.mode = Mode.Orbit;
        }
        if (d.mode === Mode.Home && T >= d.knockAt) {
          d.knockAt = Infinity;
          release(d, rand(-160, 160) + p.vx * 0.15, rand(-420, -60));
          d.fear = 1;
        }

        let nbFear = 0;
        let nbFond = 0;
        for (const j of d.nb) {
          if (fear0[j] > nbFear) nbFear = fear0[j];
          if (fond0[j] > nbFond) nbFond = fond0[j];
        }

        if (d.mode === Mode.Home) {
          homes++;
          const hx = d.hx;
          const hy = d.hy;
          const dist = Math.hypot(hx - p.x, hy - p.y);

          // Fear: from a fast cursor nearby, then passed along to neighbours.
          if (p.inside) d.fear = Math.max(d.fear, clamp((sp - 250) / 1300) * clamp(1 - dist / 160));
          if (nbFear * 0.88 > d.fear) d.fear += (nbFear * 0.88 - d.fear) * Math.min(1, dt * 7);
          d.fear = Math.max(0, d.fear - dt * 0.45);

          // Fondness: from a cursor that stays still, then passed along slowly.
          if (p.still > 0.7 && dist < 170) d.fond += dt * 1.3 * (1 - dist / 170);
          if (d.fear < 0.25 && nbFond * 0.998 > d.fond) d.fond += (nbFond * 0.998 - d.fond) * dt * 2.2;
          d.fond = clamp(d.fond - dt * 0.03 - d.fear * dt * 4);

          // A click's shockwave throws them up as it passes.
          for (const w of waves) {
            if (d.wave >= w.id) continue;
            const wd = Math.hypot(hx - w.x, hy - w.y);
            if (wd > (T - w.t0) * 1100) continue;
            d.wave = w.id;
            const k = clamp(1 - wd / 1300);
            d.fear = Math.max(d.fear, 0.95 * k);
            d.voy -= 300 * k;
            d.vox += ((hx - w.x) / (wd || 1)) * 90 * k;
          }

          d.vox += (-320 * d.ox - 15 * d.vox) * dt;
          d.voy += (-320 * d.oy - 15 * d.voy) * dt;
          d.ox += d.vox * dt;
          d.oy += d.voy * dt;

          // Every dot glances at the cursor, the eyes of an umlaut most of all.
          let tx = 0;
          let ty = 0;
          if (p.inside && dist > 1) {
            const g = (d.leader >= 0 || dots[i + 1]?.leader === i ? 3.2 : 1.6) * clamp(dist / 60);
            tx = ((p.x - hx) / dist) * g;
            ty = ((p.y - hy) / dist) * g;
          }
          d.gx += (tx - d.gx) * Math.min(1, dt * 10);
          d.gy += (ty - d.gy) * Math.min(1, dt * 10);

          const shiver = calm ? 0 : d.fear * d.fear * 1.4;
          d.x = hx + d.ox + d.gx + (Math.random() - 0.5) * shiver;
          d.y = hy + d.oy + d.gy + (Math.random() - 0.5) * shiver;
          d.free += (1 - d.free) * Math.min(1, dt * 8);
          d.rot += (0 - d.rot) * Math.min(1, dt * 8);
          if (d.fond > 0.6) liking++;
        } else if (d.mode === Mode.Orbit) {
          // A sunflower spiral around the cursor, inner rings turning faster.
          const r = (16 + 7.5 * Math.sqrt(d.rank + 1)) * (1 + 0.05 * Math.sin(T * 3 + d.rank * 0.15));
          const a = d.rank * 2.39996 + T * (2.6 / (1 + r / 55));
          const tx = p.x + Math.cos(a) * r;
          const ty = p.y + Math.sin(a) * r;
          d.vx += ((tx - d.x) * 70 - d.vx * 9) * dt;
          d.vy += ((ty - d.y) * 70 - d.vy * 9) * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.fear += (1 - d.fear) * Math.min(1, dt * 3);
          d.fond = Math.max(0, d.fond - dt * 0.02);
          d.free += (big(d) - d.free) * Math.min(1, dt * 5);
          aim(d, dt);
        } else if (d.mode === Mode.Loose) {
          d.vy += 2200 * dt;
          d.vx *= Math.exp(-dt * 0.5);
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          if (d.x < 8) {
            d.x = 8;
            d.vx = Math.abs(d.vx) * 0.5;
          } else if (d.x > W - 8) {
            d.x = W - 8;
            d.vx = -Math.abs(d.vx) * 0.5;
          }
          const b = clamp(Math.round(d.x / BIN), 0, stack.length - 1);
          const ground = floor - BIN * (stack[b] + 0.5);
          if (d.y >= ground && d.vy > 0) {
            if (d.vy > 380) {
              d.y = ground;
              d.vy *= -0.3;
              d.vx *= 0.7;
              tick(rand(260, 420), 0.035);
            } else {
              land(d);
              tick(rand(380, 560), 0.025);
            }
          }
          d.fear += (1 - d.fear) * Math.min(1, dt * 4);
          d.free += (big(d) - d.free) * Math.min(1, dt * 5);
          aim(d, dt);
        } else if (d.mode === Mode.Rest) {
          d.y = floor - BIN * (d.level + 0.5);
          d.fear = Math.max(0, d.fear - dt * 0.5);
          d.rot += (0 - d.rot) * Math.min(1, dt * 6);
          d.free += (big(d) - d.free) * Math.min(1, dt * 5);
          // A fast cursor through the pile scatters it.
          if (p.inside && sp > 220 && Math.hypot(d.x - p.x, d.y - p.y) < 34) {
            release(d, p.vx * 0.55 + rand(-60, 60), Math.min(-200, p.vy * 0.55) - rand(100, 300));
          } else if (T >= d.wait && !seance) {
            // Only the top of a pile leaves; the rest wait their turn.
            if (d.level === stack[d.bin] - 1) {
              unstack(d);
              d.mode = Mode.Hop;
              const h = d.hop;
              h.x0 = d.x;
              h.y0 = d.y;
              h.cx = (d.x + d.hx) / 2 + rand(-60, 60);
              h.cy = Math.min(d.y, d.hy) - rand(110, 260);
              h.t = 0;
              h.dur = 0.55 + Math.hypot(d.hx - d.x, d.hy - d.y) / 1700;
              tick(rand(700, 900), 0.012);
            } else d.wait = T + rand(0.2, 1.2);
          }
        } else if (d.mode === Mode.Hop) {
          const h = d.hop;
          h.t = Math.min(1, h.t + dt / h.dur);
          const t = h.t;
          const u = 1 - t;
          d.x = u * u * h.x0 + 2 * u * t * h.cx + t * t * d.hx;
          d.y = u * u * h.y0 + 2 * u * t * h.cy + t * t * d.hy;
          d.rot = t * 360;
          d.fear = Math.max(0, d.fear - dt);
          d.free = big(d) + (1 - big(d)) * smooth(0.55, 1, t);
          if (t >= 1) {
            d.mode = Mode.Home;
            d.ox = d.oy = d.vox = 0;
            d.voy = 140;
            d.rot = 0;
            d.free = 1;
            tick(rand(1100, 1500), 0.02);
          }
        }

        // Shape and colour: fear runs round → square → triangle, fondness goes to heart.
        const love = smooth(0.35, 0.85, d.fond);
        const e = Math.round(d.fear * 50 * (1 - love) + 100 * love);
        if (e !== d.e) {
          d.e = e;
          d.el.style.fontVariationSettings = `'ELSH' ${e}`;
        }
        sumE += e;
        const c = mix(mix(INK, EMBER, d.fear * (1 - love)), ROSE, love).map((v) => Math.round(v / 6) * 6);
        const fill = `rgb(${c[0]},${c[1]},${c[2]})`;
        if (fill !== d.fill) {
          d.fill = fill;
          d.el.style.fill = fill;
        }

        // Blinks, pairs of eyes together, plus the first opening on load.
        if (d.leader >= 0) d.blinkAt = dots[d.leader].blinkAt;
        else if (T >= d.nextBlink) {
          d.blinkAt = T;
          d.nextBlink = T + rand(3, 14);
        }
        let by = 1;
        const bt = T - d.blinkAt;
        if (d.blinkAt >= 0 && bt >= 0 && bt < 0.18) by = 1 - 0.92 * Math.sin((Math.PI * bt) / 0.18);
        const open = clamp((T - d.openAt) / 0.3);
        by *= open < 1 ? smooth(0, 1, open) : 1;

        const s = d.free;
        const t = `translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) rotate(${d.rot.toFixed(1)}) scale(${s.toFixed(3)} ${(s * by).toFixed(3)})`;
        if (t !== d.t) {
          d.t = t;
          d.el.setAttribute("transform", t);
        }
      }

      for (let i = waves.length - 1; i >= 0; i--) if ((T - waves[i].t0) * 1100 > 2600) waves.splice(i, 1);

      // The page itself: static glyphs (! ?) follow the crowd's mood.
      const mood = dots.length ? sumE / dots.length : 0;
      page.style.fontVariationSettings = `'ELSH' ${Math.round(mood)}`;
      page.style.transform =
        wobble > 0.01 && !calm
          ? `rotate(${(Math.sin(T * 38) * wobble * 1.1).toFixed(2)}deg) translateX(${(Math.sin(T * 47) * wobble * 6).toFixed(1)}px)`
          : "";

      const nowLiked = homes > dots.length * 0.9 && liking > dots.length * (liked ? 0.4 : 0.8);
      if (nowLiked !== liked) {
        liked = nowLiked;
        reveal.current?.toggleAttribute("data-shown", liked);
      }

      if (meter.current && Math.floor(T * 8) !== Math.floor((T - dt) * 8)) {
        meter.current.textContent = String(Math.round(mood)).padStart(3, " ");
        meterGlyph.current!.style.fontVariationSettings = `'ELSH' ${Math.round(mood)}`;
        meterWord.current!.textContent = mood < 12 ? "calm" : mood < 32 ? "uneasy" : mood < 62 ? "afraid" : "fond";
      }
    }

    // Triangles point the way they're flying; hearts stay upright.
    function aim(d: Dot, dt: number) {
      const love = smooth(0.35, 0.85, d.fond);
      const target = love > 0.5 ? 0 : (Math.atan2(d.vy, d.vx) * 180) / Math.PI + 90;
      let diff = ((target - d.rot + 540) % 360) - 180;
      if (Math.hypot(d.vx, d.vy) < 40 && love <= 0.5) diff = 0;
      d.rot += diff * Math.min(1, dt * 12);
    }

    const local = (e: PointerEvent) => {
      const box = main.getBoundingClientRect();
      return [e.clientX - box.left, e.clientY - box.top];
    };

    const onMove = (e: PointerEvent) => {
      const [x, y] = local(e);
      const now = performance.now() / 1000;
      const dtm = Math.max(0.004, now - p.t);
      if (p.inside && p.t) {
        const ivx = (x - p.x) / dtm;
        const ivy = (y - p.y) / dtm;
        p.vx += (ivx - p.vx) * 0.5;
        p.vy += (ivy - p.vy) * 0.5;
        // Shaking: quick reversals of direction.
        const sign = Math.abs(p.vx) > 900 ? Math.sign(p.vx) : 0;
        if (sign && p.lastSignX && sign !== p.lastSignX) shake += 1;
        if (sign) p.lastSignX = sign;
        if (shake >= 4 && T > shakeUntil) {
          shake = 0;
          shakeUntil = T + 1.4;
          wobble = 1;
          for (const d of dots) if (d.mode === Mode.Home) d.knockAt = T + Math.random() * 0.35;
          tick(160, 0.05);
        }
      }
      p.x = x;
      p.y = y;
      p.t = now;
      p.inside = true;
    };

    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest("button, a")) return;
      if (!audio) {
        try {
          audio = new AudioContext();
        } catch {}
      }
      void audio?.resume();
      onMove(e);
      p.down = true;
      p.downAt = T;
    };

    const onUp = () => {
      if (!p.down) return;
      p.down = false;
      if (seance) endSeance();
      else {
        waves.push({ x: p.x, y: p.y, t0: T, id: ++waveId });
        // A click on the pile is a fountain.
        for (const d of dots) {
          if (d.mode !== Mode.Rest) continue;
          const dist = Math.hypot(d.x - p.x, d.y - p.y);
          if (dist < 90) release(d, (d.x - p.x) * 6 + rand(-80, 80), -rand(500, 1000) * (1 - dist / 120));
        }
        tick(220, 0.04);
      }
    };

    const onLeave = () => {
      p.inside = false;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.repeat) return;
      // Every dot blinks, in a wave across the page.
      for (const d of dots) if (d.leader < 0) d.nextBlink = T + d.hx / 1400;
    };

    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      const dt = last ? Math.min(0.033, (now - last) / 1000) : 0;
      last = now;
      if (dots.length) frame(dt);
      raf = requestAnimationFrame(loop);
    };

    let ready = false;
    void document.fonts.ready.then(() => {
      ready = true;
      measure();
      raf = requestAnimationFrame(loop);
    });
    const ro = new ResizeObserver(() => ready && measure());
    ro.observe(main);

    main.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      main.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("keydown", onKey);
      for (const d of dots) d.el.remove();
    };
  }, []);

  return (
    <main
      ref={root}
      className="relative flex min-h-dvh touch-none flex-col overflow-hidden bg-[#0c0a08] text-[#ece4d4] select-none [-webkit-touch-callout:none]"
      style={{ fontFamily: "var(--font-geist-serif), serif" }}
    >
      <style>{`html,body{background:#0c0a08}[data-reveal]{opacity:0;transform:translateY(.4em);transition:opacity 1.2s,transform 1.2s}[data-reveal][data-shown]{opacity:1;transform:none}`}</style>

      <article ref={article} className="mx-auto w-full max-w-[40rem] flex-1 px-5 pt-[9vh] pb-36 sm:px-8">
        <p className="mb-8 font-mono text-[0.6875rem] tracking-[0.18em] text-[#ece4d4]/40 uppercase">
          October 31 · a page, nothing more
        </p>
        <h1 className="text-[clamp(2.6rem,8vw,5.75rem)]/[0.98] tracking-[-0.035em] text-balance">
          <Live text="Do not look at the dots." />
        </h1>
        <div className="mt-[0.9em] space-y-[0.85em] text-[clamp(1.0625rem,1.75vw,1.4375rem)]/[1.45] text-pretty text-[#ece4d4]/85">
          {story.map((s, i) => (
            <p key={i}>
              <Live text={s} />
            </p>
          ))}
          <p className="pt-2 text-right text-[0.85em] text-[#ece4d4]/55">
            <Live text="— Ms. Höllenbürger, archivist" />
          </p>
        </div>
      </article>

      <p
        ref={reveal}
        data-reveal
        className="pointer-events-none fixed inset-x-0 bottom-[68px] text-center text-[clamp(1.5rem,3vw,2.25rem)] tracking-[-0.02em] text-[#ff4f7b]"
        style={{ fontVariationSettings: "'ELSH' 100" }}
      >
        Fine. They like you.
      </p>

      <footer className="fixed inset-x-0 bottom-0 flex h-[52px] bg-[#0c0a08] items-center justify-between gap-4 border-t border-[#ece4d4]/12 px-5 font-mono text-[0.6875rem] text-[#ece4d4]/45 sm:px-8">
        <span className="flex items-center gap-3">
          <span ref={meterGlyph} className="font-[family-name:var(--font-geist-serif)] text-[1.75rem] leading-none text-[#ece4d4]">
            i
          </span>
          <span>
            Geist Serif · ELSH <span ref={meter} className="text-[#ece4d4]/80">{"  0"}</span> ·{" "}
            <span ref={meterWord}>calm</span>
          </span>
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          {[0, 25, 50, 100].map((v) => (
            <span
              key={v}
              className="font-[family-name:var(--font-geist-serif)] text-[1.75rem] leading-none text-[#ece4d4]/70"
              style={{ fontVariationSettings: `'ELSH' ${v}` }}
            >
              i
            </span>
          ))}
        </span>
        <button
          type="button"
          onClick={() => {
            sound.current = !sound.current;
            setSoundOn(sound.current);
          }}
          className="cursor-pointer hover:text-[#ece4d4]/80"
        >
          sound {soundOn ? "on" : "off"}
        </button>
      </footer>

      <svg ref={svg} aria-hidden className="pointer-events-none absolute top-0 left-0 overflow-visible" />
    </main>
  );
}
