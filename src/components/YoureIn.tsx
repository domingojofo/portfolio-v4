"use client";

import { useEffect, useRef } from "react";

// Between the project cards and the closing section, after neutomni.com's "We keep our focus on
// important things": the screen holds still while a gradient rises from the bottom and spreads, and
// the words — set in the paper's own colour — show only where it has reached behind them. Then the
// section scrolls on and uncovers the footer (Closing). --p is how far through it you are (0–1).
export function YoureIn() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = ref.current!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      section.style.setProperty("--p", "1");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = section.getBoundingClientRect();
      // 0 as it comes up the screen, 1 as it's about to scroll away
      const p = Math.min(1, Math.max(0, (innerHeight - r.top) / r.height));
      section.style.setProperty("--p", p.toFixed(4));
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", kick); removeEventListener("resize", kick); };
  }, []);

  return (
    <section className="yi" ref={ref} aria-label="You're in, calloused hands">
      <div className="yi-stage">
        <span className="yi-glow" aria-hidden />
        <h2 className="yi-words">
          <span className="yi-sans">You’re in</span>
          <span className="yi-serif">calloused hands</span>
        </h2>
      </div>
    </section>
  );
}
