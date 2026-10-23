"use client";

import { useEffect, useRef } from "react";

// The footer's cursor hand (Figma 775:35905, "Left hand — detailed uniform cursors"), alive: the
// 75 arrows reaching for the marble finger, drawn on one canvas from two pre-rendered sprites (the
// arrow and its soft shadow), as CursorHand did for the old closing section.
//  - They stream in, left to right, once the footer is uncovered
//  - Cursors near the pointer slide out of its way and turn to point at it, then spring back
// Nothing runs at rest. Reduced motion: a still.
//
// Each cursor: its centre in footer frame px — x from the frame's right edge (the art is laid out
// from there, globals.css .sf-art), y from its top — its heading (degrees, the group's 14.98° tilt
// included) and its size against the arrow below. Taken from the Figma SVG
// (public/images/footer-cursors.svg).
const CURSORS = `-501.6,136.5,25,0.554 -470.0,147.7,27,0.554 -438.7,159.5,31,0.554 -409.2,174.6,34,0.554 -518.9,187.4,82,0.554 -513.5,224.1,109,0.554 -529.2,254.0,122,0.554 -551.6,173.5,114,0.554 -563.4,204.1,126,0.554 -582.4,228.8,134,0.554 -850.6,-58.3,34,0.554 -876.9,-73.5,34,0.554 -905.5,-90.0,34,0.554 -934.1,-106.5,34,0.554 -822.0,-41.9,34,0.554 -793.4,-25.4,34,0.554 -764.8,-8.9,34,0.554 -736.3,7.6,34,0.554 -707.7,24.1,34,0.554 -679.1,40.6,34,0.554 -650.5,57.1,34,0.554 -621.9,73.6,34,0.554 -593.1,89.8,42,0.554 -564.5,106.3,42,0.554 -535.9,122.8,42,0.554 -938.5,-71.0,34,0.554 -910.0,-54.5,34,0.554 -881.4,-38.0,34,0.554 -852.8,-21.5,34,0.554 -824.2,-5.0,34,0.554 -795.6,11.5,34,0.554 -767.0,28.0,34,0.554 -738.5,44.4,34,0.554 -709.9,60.9,34,0.554 -681.3,77.4,34,0.554 -652.7,93.9,34,0.554 -624.1,110.4,34,0.554 -595.3,126.7,42,0.554 -566.7,143.2,42,0.554 -969.3,-50.6,34,0.554 -940.7,-34.2,34,0.554 -912.2,-17.7,34,0.554 -883.6,-1.2,34,0.554 -855.0,15.3,34,0.554 -826.4,31.8,34,0.554 -797.8,48.3,34,0.554 -769.2,64.8,34,0.554 -740.7,81.3,34,0.554 -712.1,97.8,34,0.554 -683.5,114.3,34,0.554 -597.4,163.5,42,0.554 -971.5,-13.8,34,0.554 -942.9,2.7,34,0.554 -914.4,19.2,34,0.554 -885.8,35.7,34,0.554 -857.2,52.1,34,0.554 -828.6,68.6,34,0.554 -800.0,85.1,34,0.554 -1002.3,6.5,34,0.554 -970.1,24.2,34,0.554 -526.9,155.9,39,0.554 -652.8,126.3,34,0.554 -624.2,142.8,34,0.554 -939.5,37.2,34,0.554 -547.3,228.0,94,0.554 -767.3,93.6,34,0.554 -912.4,48.0,34,0.554 -494.0,201.6,94,0.554 -590.9,198.0,112,0.554 -955.8,-91.3,34,0.554 -881.7,60.9,34,0.554 -538.5,204.5,94,0.554 -575.0,178.6,112,0.554 -543.6,149.1,112,0.554 -959.0,-69.4,34,0.554`;
// One arrow, pointing right, centred on its middle (29 long)
const ARROW = "M-9.67 -14L-8.66 -9.74C-7.82 -6.18 -5.16 -3.34 -1.67 -2.27V2.27C-5.16 3.34 -7.82 6.18 -8.66 9.73L-9.67 14L19.33 0Z";
const TILT = (14.98 * Math.PI) / 180;
const SHADOW = { x: -13.5 * Math.sin(TILT), y: 13.5 * Math.cos(TILT), blur: 47, alpha: 0.35 };   // Figma: dy 13.5, blur 23.6, turned with the group
const REACH = 150, PUSH = 26;   // frame px around the pointer that cursors react within; how far the nearest slide
const INTRO_MS = 900, INTRO_SPREAD = 800, INTRO_FROM = 80;   // stream in: each one's duration, the left-to-right stagger, distance
const HAND_W = 719.945;   // the marble hand's box width in frame px (.sf-hand): it gives the scale

type Cursor = { rx: number; ry: number; ra: number; k: number; x: number; y: number; a: number; delay: number };

export function FooterFlock() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const art = canvas.parentElement!;                         // .sf-art: the footer's box
    const footer = art.closest<HTMLElement>(".sf")!;
    const hand = art.querySelector<HTMLElement>(".sf-hand")!;
    const ctx = canvas.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cos = Math.cos(TILT), sin = Math.sin(TILT);

    const cursors: Cursor[] = CURSORS.split(" ").map((c) => {
      const [x, y, deg, k] = c.split(",").map(Number);
      return { rx: x, ry: y, ra: (deg * Math.PI) / 180, k, x, y, a: (deg * Math.PI) / 180, delay: 0 };
    });
    const minX = Math.min(...cursors.map((c) => c.rx)), spanX = Math.max(...cursors.map((c) => c.rx)) - minX;
    cursors.forEach((c) => (c.delay = ((c.rx - minX) / spanX) * INTRO_SPREAD));

    let u = 1, w = 0, d = 1;   // css px per frame px; the box's width (css px); canvas px per css px
    let body: HTMLCanvasElement, shadow: HTMLCanvasElement;
    const arrow = new Path2D(ARROW);
    const K = 0.554;   // the cursors' size (they're all one size): sprites drawn at it

    const sprites = () => {
      const s = u * d * K;
      // The arrow: navy, with the light-blue inner stroke
      body = document.createElement("canvas");
      const bw = Math.ceil(48 * s);
      body.width = body.height = bw;
      const b = body.getContext("2d")!;
      b.setTransform(s, 0, 0, s, bw / 2, bw / 2);
      b.fillStyle = "#1D344A";
      b.fill(arrow);
      b.save();
      b.clip(arrow);
      b.lineWidth = 1.52 * 2 / K;
      b.lineJoin = "round";
      b.strokeStyle = "#B5D5F4";
      b.stroke(arrow);
      b.restore();
      // Its shadow: the shape drawn far off-canvas, so only its blurred shadow lands here
      shadow = document.createElement("canvas");
      const sw = Math.ceil((SHADOW.blur * 2) * u * d + 48 * s);
      shadow.width = shadow.height = sw;
      const h = shadow.getContext("2d")!;
      h.shadowColor = `rgba(0,0,0,${SHADOW.alpha})`;
      h.shadowBlur = SHADOW.blur * u * d;
      h.shadowOffsetX = 10000;
      h.setTransform(s, 0, 0, s, sw / 2 - 10000, sw / 2);
      h.fill(arrow);
    };

    const size = () => {
      if (!art.isConnected || !art.clientWidth || !hand.offsetWidth) return;
      u = hand.offsetWidth / HAND_W;
      w = art.clientWidth;
      d = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(w * d);
      canvas.height = Math.ceil(art.clientHeight * d);
      sprites();
      draw(performance.now());
    };

    let introStart: number | null = reduce ? -1e9 : null;
    const intro = (c: Cursor, now: number) => {
      if (introStart === null) return 0;
      const t = Math.min(1, Math.max(0, (now - introStart - c.delay) / INTRO_MS));
      return 1 - Math.pow(1 - t, 3);
    };

    const draw = (now: number) => {
      if (!shadow) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const sw = shadow.width, bw = body.width;
      for (const c of cursors) {
        const p = intro(c, now);
        if (p <= 0) continue;
        const back = (1 - p) * INTRO_FROM;   // slides in along the group's line
        const x = (w + (c.x - back * cos) * u) * d, y = (c.y - back * sin) * u * d;
        ctx.globalAlpha = p;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(shadow, x + SHADOW.x * u * d - sw / 2, y + SHADOW.y * u * d - sw / 2);
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
          const dx = c.rx - pointer.x, dy = c.ry - pointer.y, dist = Math.hypot(dx, dy);
          if (dist < REACH) {
            const f = (1 - dist / REACH) ** 2;
            tx += (dx / (dist || 1)) * PUSH * f;
            ty += (dy / (dist || 1)) * PUSH * f;
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
    ro.observe(art);
    ro.observe(hand);
    if (reduce) return () => ro.disconnect();

    // In: once the footer is a third uncovered (SiteFooter adds .is-in for the rest of it too)
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || introStart !== null) return;
      introStart = performance.now() + 250;   // just after the hand starts coming in
      kick();
      io.disconnect();
    }, { threshold: 0.3 });
    io.observe(footer);

    const onMove = (e: PointerEvent) => {
      const r = art.getBoundingClientRect();
      pointer = { x: (e.clientX - r.left - w) / u, y: (e.clientY - r.top) / u };
      kick();
    };
    const onLeave = () => { pointer = null; kick(); };
    footer.addEventListener("pointermove", onMove, { passive: true });
    footer.addEventListener("pointerleave", onLeave);
    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
      footer.removeEventListener("pointermove", onMove);
      footer.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="sf-flock" aria-hidden="true" />;
}
