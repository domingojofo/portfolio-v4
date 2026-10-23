"use client";

import { useEffect, useRef } from "react";

// The footer sits "behind" the page: as it scrolls up, its contents are moved back down by how far
// it still has to travel, so they hold still on screen while the page lifts off them (clipped by
// .sf). And once a quarter of it is uncovered it's marked .is-in, which plays its way in
// (globals.css: the lines, the buttons, the links, the hand; FooterFlock streams the cursors in).
export function FooterReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const inner = ref.current!;
    const footer = inner.parentElement!;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      footer.classList.add("is-in");
      io.disconnect();
    }, { threshold: 0.25 });
    io.observe(footer);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      footer.classList.add("is-in");
      return () => io.disconnect();
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const top = footer.getBoundingClientRect().top;
      const end = Math.max(0, innerHeight - footer.offsetHeight);   // where its top rests at the page's end
      const left = Math.min(innerHeight - end, Math.max(0, top - end));   // travel still to go
      inner.style.transform = left ? `translate3d(0, ${-left}px, 0)` : "";
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    return () => { io.disconnect(); cancelAnimationFrame(raf); removeEventListener("scroll", kick); removeEventListener("resize", kick); };
  }, []);
  return <div className="sf-inner" ref={ref}>{children}</div>;
}
