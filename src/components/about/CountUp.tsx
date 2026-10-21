"use client";

import { useLayoutEffect, useRef } from "react";

// A stat that counts up from 0 the first time it's on screen: the opening stats on load (after the
// copy has risen in), the later ones as they scroll in. The server render, no-JS and screen readers
// get the real value; a hidden copy of it holds the width so the row doesn't shift while counting.
// Reduced motion: no count.
const DURATION = 1400;
const AFTER_LOAD = 900;   // let .ab-rise land before the first count starts

export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current!;
    const m = /^(\D*)(\d[\d,]*)(.*)$/.exec(value);
    if (!m || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [, pre, digits, post] = m;
    const target = Number(digits.replace(/,/g, ""));
    const fmt = (n: number) => `${pre}${digits.includes(",") ? n.toLocaleString("en-US") : n}${post}`;
    el.textContent = fmt(0);   // before first paint, so the final value never flashes

    const mounted = performance.now();
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = Math.max(performance.now(), mounted + AFTER_LOAD);
      const tick = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - start) / DURATION));
        el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);

  return (
    <span className="ab-num">
      <span className="ab-num-ghost" aria-hidden="true">{value}</span>
      <span className="ab-num-live" aria-hidden="true" ref={ref}>{value}</span>
      <span className="ab-sr">{value}</span>
    </span>
  );
}
