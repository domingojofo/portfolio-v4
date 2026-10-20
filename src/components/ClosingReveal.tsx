"use client";

import { useEffect, useRef } from "react";

// The footer's art holds (almost) still while the deck and its ticker scroll up off it, so it looks
// uncovered rather than scrolled in: the art is moved up by how far the footer still has to travel
// (clipped by .closing). REVEAL_HOLD of that travel is cancelled; the rest still moves, a little.
const REVEAL_HOLD = 0.85;

export function ClosingReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const art = ref.current!;
    const box = art.parentElement!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const top = box.getBoundingClientRect().top;
      const end = Math.max(0, innerHeight - box.offsetHeight);   // where its top rests at the page's end
      const left = Math.min(innerHeight - end, Math.max(0, top - end));   // travel still to go
      art.style.transform = `translate3d(0, ${-left * REVEAL_HOLD}px, 0)`;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", kick); removeEventListener("resize", kick); };
  }, []);
  return <div className="closing-art" ref={ref}>{children}</div>;
}
