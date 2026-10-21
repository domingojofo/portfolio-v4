"use client";

import { useEffect, useRef } from "react";
import { IKIGAI, IKIGAI_H, IKIGAI_LABEL, IKIGAI_W } from "./ikigai-data";

// The Ikigai mark — four circles of cursor arrows (the same pointer shape as the home page's cursor
// hand). It builds as the section scrolls in: every arrow starts scattered (off to the side, turned,
// faded) and glides into its place, the rings filling in one after another, fully built once the
// section is in view. Scroll-linked, so scrolling back up takes it apart again. Reduced motion: built.

// A fixed scatter per arrow (seeded, so server and client agree)
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const N = IKIGAI.length;
const SCATTER = IKIGAI.map((_, i) => ({
  dx: (rand(i, 1) - 0.5) * 260, dy: (rand(i, 2) - 0.3) * 220, r: (rand(i, 3) - 0.5) * 220, at: (i / N) * 0.6 + rand(i, 4) * 0.12,
}));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export function Ikigai() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current!;
    const paths = [...svg.querySelectorAll<SVGPathElement>("path")];
    const label = svg.querySelector<SVGTextElement>("text");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, last = -1;
    const update = () => {
      raf = 0;
      const r = svg.getBoundingClientRect();
      // 0 as its top enters the bottom of the screen → 1 once its middle reaches 55% down
      const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.45 + r.height / 2)));
      if (Math.abs(p - last) < 0.001) return;
      last = p;
      paths.forEach((el, i) => {
        const s = SCATTER[i];
        const t = ease(Math.min(1, Math.max(0, (p - s.at) / 0.28)));
        const k = 1 - t;
        el.style.transform = k < 0.001 ? "" : `translate(${s.dx * k}px, ${s.dy * k}px) rotate(${s.r * k}deg)`;
        el.style.opacity = String(t);
      });
      // "DESIGN" settles in last, once the rings have come together
      if (label) label.style.opacity = String(Math.min(1, Math.max(0, (p - 0.82) / 0.18)));
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", kick); removeEventListener("resize", kick); };
  }, []);

  return (
    <svg ref={ref} className="ab-ikigai" viewBox={`0 0 ${IKIGAI_W} ${IKIGAI_H}`} width={IKIGAI_W} height={IKIGAI_H}
      role="img" aria-label="Ikigai: what I love, what I'm good at, what the world needs and what I can be paid for — four overlapping circles">
      {IKIGAI.map(([, d], i) => <path key={i} d={d} />)}
      <text className="ab-ikigai-label" x={IKIGAI_LABEL.x} y={IKIGAI_LABEL.y + 12}>DESIGN</text>
    </svg>
  );
}
