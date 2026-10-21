"use client";

import { useEffect, useRef } from "react";

// The closing section's left hand (Figma "Left hand — spaced uniform cursors"): 59 navy arrow
// cursors laid out as a hand reaching for the photo's finger, after Linear's "Create your own
// agents" hero. Drawn on one canvas, from two pre-rendered sprites (the arrow, and its soft
// shadow), so a frame is ~120 drawImage calls.
//  - It streams in, left to right, the first time it scrolls into view
//  - Cursors near the pointer slide out of its way and turn to point at it, then spring back
// Nothing runs at rest: the loop only ticks while something is moving. Reduced motion: a still.
//
// Positions are the Figma frame's px (1440 wide, the ticker above it left out), scaled to fit
// (.closing-art), with the meeting point (the marble finger, MEET) at the middle of the screen. The
// cursor rows carry on to the left edge, so the stream always runs off the page.

// Each cursor's centre and heading in the SVG's own space (x, y, degrees)
const CURSORS = `739.1,78.1,-9 783.1,69.9,-7 827.0,62.6,-3 871.0,60.4,0 752.6,146.8,48 783.6,184.7,75 785.7,229.5,88 706.0,151.6,80 713.0,194.5,92 707.7,235.6,100 206.0,85.4,0 165.5,85.3,0 121.5,85.3,0 77.5,85.3,0 250.0,85.3,0 294.0,85.3,0 338.0,85.3,0 382.0,85.3,0 426.0,85.3,0 470.0,85.3,0 514.0,85.3,0 558.0,85.3,0 602.1,84.7,8 646.1,84.7,8 690.1,84.7,8 96.0,129.3,0 140.0,129.3,0 184.0,129.3,0 228.0,129.3,0 272.0,129.3,0 316.0,129.3,0 360.0,129.3,0 404.0,129.3,0 448.0,129.3,0 492.0,129.3,0 536.0,129.3,0 580.0,129.3,0 624.1,128.7,8 668.1,128.7,8 74.0,173.3,0 118.0,173.3,0 162.0,173.3,0 206.0,173.3,0 250.0,173.3,0 294.0,173.3,0 338.0,173.3,0 382.0,173.3,0 426.0,173.3,0 470.0,173.3,0 514.0,173.3,0 646.1,172.7,8 96.0,217.3,0 140.0,217.3,0 184.0,217.3,0 228.0,217.3,0 272.0,217.3,0 316.0,217.3,0 360.0,217.3,0 74.0,261.4,0`;
// One arrow, pointing right, centred on its middle (the Figma cursor's path)
const ARROW = "M-9.67 -14L-8.66 -9.74C-7.82 -6.18 -5.16 -3.34 -1.67 -2.27V2.27C-5.16 3.34 -7.82 6.18 -8.66 9.73L-9.67 14L19.33 0Z";

const H = 1094;   // the frame's height (it's 1440 wide)
const MEET = 678;           // frame x of the marble hand's fingertip — kept at the screen's centre (globals.css)
const TILT = (15 * Math.PI) / 180;              // the group is turned 15° in the frame
const ORIGIN = { x: 238.564, y: 505.491 };      // …about this point (frame px)
const SVG_CENTRE = { x: 477.352, y: 160.85 };   // the SVG point that lands there
const SHADOW = { x: -18 * Math.sin(TILT), y: 18 * Math.cos(TILT), blur: 63, alpha: 0.35 };   // drop shadow, dy 18, turned with the group
const REACH = 170;   // frame px around the pointer that cursors react within
const PUSH = 30;     // how far the nearest ones slide away
const INTRO_MS = 900, INTRO_SPREAD = 750, INTRO_FROM = 70;   // stream in: each one's duration, the left-to-right stagger, distance

type Cursor = { rx: number; ry: number; ra: number; x: number; y: number; a: number; delay: number };
const STEP = 44;   // the cursor rows' spacing (SVG px)

export function CursorHand() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const section = canvas.parentElement!;
    const ctx = canvas.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cos = Math.cos(TILT), sin = Math.sin(TILT);

    // Rest positions in frame px; `left` is how far (frame px) the rows must reach past the frame's left edge
    const SVG = CURSORS.split(" ").map((c) => c.split(",").map(Number));
    let cursors: Cursor[] = [];
    const box = { x: 0, y: 0, r: 0, b: 0 };
    const build = (left: number) => {
      if (!Number.isFinite(left)) return;
      const pts = SVG.slice();
      // Carry each straight row (heading 0) on to the left, one step at a time
      const rows = new Map<number, number>();
      for (const [x, y, deg] of SVG) if (deg === 0 && x < 300) rows.set(Math.round(y), Math.min(rows.get(Math.round(y)) ?? x, x));
      for (const [y, x0] of rows) {
        for (let x = x0 - STEP; ; x -= STEP) {
          const fx = ORIGIN.x + (x - SVG_CENTRE.x) * cos - (y - SVG_CENTRE.y) * sin;
          if (fx < -left - 40) break;
          pts.push([x, y, 0]);
        }
      }
      cursors = pts.map(([sx, sy, deg]) => {
        const qx = sx - SVG_CENTRE.x, qy = sy - SVG_CENTRE.y;
        const rx = ORIGIN.x + qx * cos - qy * sin, ry = ORIGIN.y + qx * sin + qy * cos;
        const ra = (deg * Math.PI) / 180 + TILT;
        return { rx, ry, ra, x: rx, y: ry, a: ra, delay: 0 };
      });
      const xs = cursors.map((c) => c.rx), ys = cursors.map((c) => c.ry);
      const PAD = 110;   // room for the shadow, the push and the intro
      Object.assign(box, { x: Math.min(...xs) - PAD - INTRO_FROM, y: Math.min(...ys) - PAD, r: Math.max(...xs) + PAD, b: Math.max(...ys) + PAD });
      const minX = Math.min(...xs), spanX = Math.max(...xs) - minX;
      cursors.forEach((c) => (c.delay = ((c.rx - minX) / spanX) * INTRO_SPREAD));
    };

    let k = 1, s = 1, ox = 0;   // canvas px per frame px; css px per frame px; where the frame's left edge sits (css px)
    let body: HTMLCanvasElement, shadow: HTMLCanvasElement;
    const arrow = new Path2D(ARROW);

    const sprites = () => {
      // The arrow: navy, with the light-blue inner stroke
      body = document.createElement("canvas");
      const bw = Math.ceil(48 * k);
      body.width = body.height = bw;
      const b = body.getContext("2d")!;
      b.setTransform(k, 0, 0, k, bw / 2, bw / 2);
      b.fillStyle = "#1D344A";
      b.fill(arrow);
      b.save();
      b.clip(arrow);
      b.lineWidth = 2.7;
      b.lineJoin = "round";
      b.strokeStyle = "#B5D5F4";
      b.stroke(arrow);
      b.restore();
      // Its shadow: the shape drawn far off-canvas, so only its blurred shadow lands here
      shadow = document.createElement("canvas");
      const sw = Math.ceil((SHADOW.blur * 2 + 48) * k);
      shadow.width = shadow.height = sw;
      const h = shadow.getContext("2d")!;
      h.shadowColor = `rgba(0,0,0,${SHADOW.alpha})`;
      h.shadowBlur = SHADOW.blur * k;
      h.shadowOffsetX = 10000;
      h.setTransform(k, 0, 0, k, sw / 2 - 10000, sw / 2);
      h.fill(arrow);
    };

    const size = () => {
      // Leaving the page detaches the section and the observer reports it at 0×0. A zero scale would
      // make build()'s reach infinite and its row loop never end (the page froze on navigation).
      if (!section.isConnected || !section.clientWidth || !section.clientHeight) return;
      s = section.clientHeight / H;
      ox = section.clientWidth / 2 - MEET * s;
      build(ox / s);
      k = s * Math.min(devicePixelRatio || 1, 2);
      Object.assign(canvas.style, {
        left: `${ox + box.x * s}px`, top: `${box.y * s}px`,
        width: `${(box.r - box.x) * s}px`, height: `${(box.b - box.y) * s}px`,
      });
      canvas.width = Math.ceil((box.r - box.x) * k);
      canvas.height = Math.ceil((box.b - box.y) * k);
      sprites();
      draw(introStart === null ? 0 : performance.now());
    };

    // Intro: null until it scrolls into view; then cursors fade and slide in along the group's line
    let introStart: number | null = reduce ? -1e9 : null;
    const intro = (c: Cursor, now: number) => {
      if (introStart === null) return 0;
      const t = Math.min(1, Math.max(0, (now - introStart - c.delay) / INTRO_MS));
      return 1 - Math.pow(1 - t, 3);
    };

    const draw = (now: number) => {
      if (!shadow) return;   // not sized yet
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const sw = shadow.width, bw = body.width;
      for (const c of cursors) {
        const p = intro(c, now);
        if (p <= 0) continue;
        const back = (1 - p) * INTRO_FROM;
        const x = (c.x - back * cos - box.x) * k, y = (c.y - back * sin - box.y) * k;
        ctx.globalAlpha = p;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(shadow, x + SHADOW.x * k - sw / 2, y + SHADOW.y * k - sw / 2);
        const ca = Math.cos(c.a), sa = Math.sin(c.a);
        ctx.setTransform(ca, sa, -sa, ca, x, y);
        ctx.drawImage(body, -bw / 2, -bw / 2);
      }
      ctx.globalAlpha = 1;
    };

    // Hover: each cursor eases toward its target — rest, or pushed off and turned to the pointer
    let pointer: { x: number; y: number } | null = null;
    let raf = 0, last = 0;
    const turn = (from: number, to: number) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from));
    const tick = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      const ease = 1 - Math.exp(-dt / 90);
      let moving = introStart !== null && now - introStart < INTRO_MS + INTRO_SPREAD;
      for (const c of cursors) {
        let tx = c.rx, ty = c.ry, ta = c.ra;
        if (pointer) {
          const dx = c.rx - pointer.x, dy = c.ry - pointer.y, d = Math.hypot(dx, dy);
          if (d < REACH) {
            const f = (1 - d / REACH) ** 2;
            tx += (dx / (d || 1)) * PUSH * f;
            ty += (dy / (d || 1)) * PUSH * f;
            ta = turn(c.ra, c.ra + (turn(c.ra, Math.atan2(-dy, -dx)) - c.ra) * Math.min(1, f * 1.6));
          }
        }
        c.x += (tx - c.x) * ease;
        c.y += (ty - c.y) * ease;
        c.a += (turn(c.a, ta) - c.a) * ease;
        if (Math.abs(tx - c.x) > 0.05 || Math.abs(ty - c.y) > 0.05 || Math.abs(ta - c.a) > 0.002) moving = true;
      }
      draw(now);
      raf = moving || pointer ? requestAnimationFrame(tick) : 0;
      if (!raf) last = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const ro = new ResizeObserver(size);
    ro.observe(section);
    if (reduce) return () => ro.disconnect();

    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || introStart !== null) return;
      introStart = performance.now();
      section.classList.add("is-in");
      kick();
      io.disconnect();
    }, { threshold: 0.3 });   // once a third of the footer is uncovered (before the words)
    io.observe(section);

    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      pointer = { x: (e.clientX - r.left - ox) / s, y: (e.clientY - r.top) / s };
      kick();
    };
    const onLeave = () => { pointer = null; kick(); };
    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave);
    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="closing-cursors" aria-hidden="true" />;
}
