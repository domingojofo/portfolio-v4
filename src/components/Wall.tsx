"use client";

import { useEffect, useRef } from "react";

// Text wall: faint rows of "CALLOUSED HANDS", one span per letter. Letters inside a circle around
// the pointer darken — fully at the centre, easing out to the edge — and fade back after it moves on.
// Letter centres are measured once (and on resize / scroll); a move only touches the letters
// that are, or just were, inside the circle.

const ROWS = 6, COLS = 15, TEXT = "Calloused hands";
const RADIUS = 110;   // px
const BASE = 0.4;     // resting ink opacity

export function Wall() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wall = ref.current!;
    const letters = [...wall.querySelectorAll<HTMLElement>(".wl")];
    let pos: { x: number; y: number }[] = [];
    let lit = new Set<number>();
    let mx = -1e4, my = -1e4, raf = 0, stale = true;

    const measure = () => {
      pos = letters.map((l) => {
        const r = l.getBoundingClientRect();
        return { x: r.left + r.width / 2 + scrollX, y: r.top + r.height / 2 + scrollY };
      });
      stale = false;
    };
    const frame = () => {
      raf = 0;
      if (stale) measure();
      const px = mx + scrollX, py = my + scrollY;
      const next = new Set<number>();
      pos.forEach((p, i) => {
        const dx = p.x - px, dy = p.y - py;
        if (Math.abs(dx) > RADIUS || Math.abs(dy) > RADIUS) return;
        const d = Math.hypot(dx, dy);
        if (d >= RADIUS) return;
        const t = 1 - d / RADIUS, k = t * t * (3 - 2 * t);
        letters[i].style.color = `rgb(29 52 74 / ${(BASE + (1 - BASE) * k).toFixed(3)})`;
        next.add(i);
      });
      lit.forEach((i) => { if (!next.has(i)) letters[i].style.color = ""; });   // fades back (CSS transition)
      lit = next;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    // Listen on the window (the wall sits under fixed layers that can swallow element events) and
    // only work while the pointer is near the wall
    const onMove = (e: PointerEvent) => {
      const r = wall.getBoundingClientRect();
      const near = e.clientY > r.top - RADIUS && e.clientY < r.bottom + RADIUS;
      if (!near && !lit.size) return;
      mx = near ? e.clientX : -1e4; my = near ? e.clientY : -1e4;
      kick();
    };
    const onLeave = () => { mx = my = -1e4; kick(); };
    const onResize = () => { stale = true; };

    addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="wall" aria-hidden="true" ref={ref}>
      {Array.from({ length: ROWS }, (_, r) => (
        <p className="wall-row" key={r}>
          {Array.from({ length: COLS }, (_, c) => (
            <span className="wall-item" key={c}>
              {[...TEXT].map((ch, k) => <span className="wl" key={k}>{ch}</span>)}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
