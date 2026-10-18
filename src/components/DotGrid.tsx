"use client";

import { useEffect, useRef } from "react";
import { getWarp, makeBend, onWarp, WARP_HINGE, WARP_PERSPECTIVE } from "@/lib/warp";

// Dot-grid background. The canvas draws every dot:
//  - Warp (home page, src/lib/warp.ts): above mid-hero the grid is flat; below it the page curls
//    toward you, so the rows grow and spread apart toward the bottom edge.
//    Scrolling unrolls it back to the plain grid.
//  - Hover (mouse only): dots near the cursor darken and grow, with a short fading trail.
// It only draws when something changes (pointer, trail, scroll warp, resize). The CSS dots on
// .dot-grid are the no-JS fallback and are switched off once the canvas is live.

const GAP = 28;          // px between dots (must match --dot-gap in globals.css)
const RADIUS = 150;      // px around the cursor that light up
const BASE = 1;          // px dot radius at rest
const PEAK = 1.9;        // px dot radius right under the cursor
const FADE = 0.9;        // per-frame decay of the trail (lower = shorter trail)
const ALPHA = 0.12;      // resting dot opacity
const FLOOR_ALPHA = 0.16; // extra opacity at full warp, at the bottom of the screen…
const FLOOR_SIZE = 0.5;  // …and extra dot size (×); both fade in as a gradient from the top
const INK = "15, 33, 50";
const BUCKETS = 12;      // dots are batched into this many opacity levels, one fill each
const REVEAL = 0.3;      // home page: no dots above the headline's last line; they fade in over this
                         // share of the viewport height below it…
const HIDE = 0.12;       // …and fade out over this share just above the closing section (Closing.tsx),
                         // which has no dots all the way down

export function DotGrid() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const hover = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d")!;
    canvas.parentElement!.classList.add("is-live");
    let W = 0, H = 0, cols = 0, rows = 0;
    let heat = new Float32Array(0);        // 0…1 per dot
    let mx = -1e4, my = -1e4, raf = 0, last = 0;
    const paths = Array.from({ length: BUCKETS }, () => new Path2D());

    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil((W * 3) / GAP) | 1;   // odd, centred: the floor is wider than the screen so it still fills it near the horizon
      rows = Math.ceil((H * 4) / GAP);     // the bent part runs on well past the bottom of the screen
      heat = new Float32Array(cols * rows);
      kick();
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(3, (now - (last || now)) / 16.67);   // frames elapsed, so the fade is frame-rate independent
      last = now;
      const decay = reduce ? 0 : Math.pow(FADE, dt);
      const w = getWarp(), bend = makeBend(w, H);
      // While warped the dots read stronger toward the bottom (a top→bottom gradient), easing back
      // to the plain grid as the curl flattens
      const P = H * WARP_PERSPECTIVE, hinge = H * WARP_HINGE, cx = W / 2;
      // Where the dots start (home page): the headline's bottom edge, which scrolls up with the page
      const title = document.querySelector(".hero-title");
      const revealAt = title ? title.getBoundingClientRect().bottom : -Infinity, revealLen = H * REVEAL;
      const closing = document.querySelector(".closing");
      const hideAt = closing ? closing.getBoundingClientRect().top : Infinity, hideLen = H * HIDE;
      for (let b = 0; b < BUCKETS; b++) paths[b] = new Path2D();
      let active = false;

      // Rows run top to bottom. Above the hinge they're the flat page; a dot u px below it lands
      // on the bent surface (src/lib/warp.ts) and projects toward the hinge's vanishing point.
      for (let r = 0; r < rows; r++) {
        const yFlat = r * GAP + GAP / 2;
        const u = yFlat - hinge;
        const p = bend && u > 0 ? bend(u) : null;
        const s = p ? P / (P + p.depth) : 1;      // perspective scale
        const y = p ? hinge + p.drop * s : yFlat;
        if (y > H + GAP) break;                    // further rows are below the screen
        const r0 = (y - revealAt) / revealLen;          // 0 at the headline's bottom → 1 below it
        if (r0 <= 0) continue;
        const h0 = (hideAt - y) / hideLen;              // 1 above the closing section → 0 at its top
        if (h0 <= 0) break;                             // rows further down are all in it
        const r1 = Math.min(r0, h0);
        const reveal = r1 >= 1 ? 1 : r1 * r1 * (3 - 2 * r1);
        const fog = (p ? Math.min(1, s * 1.25) : 1) * reveal;   // pushed-away rows fade; so do rows near the headline
        const g = w * Math.pow(Math.min(1, Math.max(0, y / H)), 1.3);
        const dotAlpha = ALPHA + FLOOR_ALPHA * g, dotSize = 1 + FLOOR_SIZE * g;
        const widen = p ? p.widen : 1;
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = cx + (c - (cols >> 1)) * GAP * s * widen;
          if (x < -GAP || x > W + GAP) continue;
          let h = heat[i] * decay;
          if (hover) {
            const dist = Math.hypot(x - mx, y - my);
            if (dist < RADIUS) h = Math.max(h, Math.pow(1 - dist / RADIUS, 1.6));
          }
          heat[i] = h < 0.01 ? 0 : h;
          if (heat[i]) active = true;
          const rad = (BASE * dotSize + (PEAK - BASE) * heat[i]) * s;
          if (rad < 0.25) continue;
          const alpha = Math.min(0.67, (dotAlpha + heat[i] * 0.55) * fog);
          const b = Math.min(BUCKETS - 1, Math.round((alpha / 0.67) * (BUCKETS - 1)));
          paths[b].moveTo(x + rad, y);
          paths[b].arc(x, y, rad, 0, Math.PI * 2);
        }
      }

      ctx.clearRect(0, 0, W, H);
      for (let b = 0; b < BUCKETS; b++) {
        ctx.fillStyle = `rgba(${INK}, ${((b / (BUCKETS - 1)) * 0.67).toFixed(3)})`;
        ctx.fill(paths[b]);
      }
      if (active) kick();
      else last = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const onMove = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; kick(); };
    const onLeave = () => { mx = my = -1e4; kick(); };
    resize();
    const offWarp = onWarp(kick);
    addEventListener("scroll", kick, { passive: true });   // the headline / closing section edges move with the page
    addEventListener("resize", resize);
    if (hover) {
      addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      offWarp();
      removeEventListener("scroll", kick);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="dot-grid" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
