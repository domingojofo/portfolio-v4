"use client";

import { useEffect } from "react";

// Lines About's blocks up on the dot board: each [data-snap] block gets just enough extra top
// margin for its top edge to land on a row of dots (the board's origin is the [data-board] element,
// every `gap` px). Only the spacing between blocks changes — the text inside flows as normal, and
// the page scrolls freely.
export function BoardSnap() {
  useEffect(() => {
    const origin = document.querySelector<HTMLElement>("[data-board]");
    if (!origin) return;
    const gap = Number(origin.dataset.board) || 30;
    let raf = 0;
    const snap = () => {
      raf = 0;
      const blocks = [...document.querySelectorAll<HTMLElement>("[data-snap]")];
      blocks.forEach((b) => (b.style.marginTop = ""));
      for (const b of blocks) {
        const base = parseFloat(getComputedStyle(b).marginTop) || 0;
        const off = b.getBoundingClientRect().top - origin.getBoundingClientRect().top;
        const extra = ((gap - (Math.round(off) % gap)) % gap + gap) % gap;
        if (extra) b.style.marginTop = `${base + extra}px`;
      }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(snap); };
    snap();
    const ro = new ResizeObserver(kick);
    document.querySelectorAll<HTMLElement>("[data-snap]").forEach((b) => ro.observe(b));
    addEventListener("resize", kick);
    document.fonts?.ready.then(kick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener("resize", kick); };
  }, []);
  return null;
}
