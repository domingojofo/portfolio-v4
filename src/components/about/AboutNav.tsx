"use client";

import { useEffect, useRef } from "react";

// Section nav for About (after robwinters.github.io/portfolio): a column of short ticks at the left
// edge, one per section. The one you're in grows long and fills as you read through it; the ones
// you've passed darken. Hover and a frosted panel opens behind the names, which slide in one after
// another; arriving in a new section shows its name for a moment on its own. Desktop only.
// Each section runs from where its top meets the reading line (40% down the screen) to the next one.

const SECTIONS = [
  { id: "story", label: "My story" },
  { id: "leadership", label: "Leadership" },
  { id: "ai", label: "On AI" },
];

export function AboutNav() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current!;
    const links = [...nav.querySelectorAll<HTMLAnchorElement>("a")];
    const sections = SECTIONS.map((s) => document.getElementById(s.id));
    let starts: number[] = [], current = -1, queued = false;
    let hideName: ReturnType<typeof setTimeout> | undefined;
    const measure = () => {
      starts = sections.map((s) => (s ? s.getBoundingClientRect().top + scrollY - innerHeight * 0.4 : 0));
      starts[0] = 0;
    };
    const update = () => {
      queued = false;
      const y = scrollY, end = document.documentElement.scrollHeight - innerHeight;
      let now = 0;
      starts.forEach((s, i) => { if (y >= s) now = i; });
      links.forEach((a, i) => {
        const from = starts[i], to = i + 1 < starts.length ? starts[i + 1] : end;
        a.style.setProperty("--progress", Math.min(1, Math.max(0, (y - from) / Math.max(1, to - from))).toFixed(4));
        a.classList.toggle("is-active", i === now);
        a.classList.toggle("is-past", i < now);
        if (i === now) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
      if (now !== current) {
        if (current !== -1) {
          nav.classList.add("is-announcing");
          clearTimeout(hideName);
          hideName = setTimeout(() => nav.classList.remove("is-announcing"), 1400);
        }
        current = now;
      }
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    const remeasure = () => { measure(); queue(); };
    remeasure();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", remeasure);
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);
    return () => { removeEventListener("scroll", queue); removeEventListener("resize", remeasure); ro.disconnect(); clearTimeout(hideName); };
  }, []);

  return (
    <nav className="page-nav" ref={ref} aria-label="Sections">
      {SECTIONS.map((s, i) => (
        <a key={s.id} href={`#${s.id}`} style={{ "--i": i } as React.CSSProperties}>
          <span className="tick"><span className="fill" /></span>
          <span className="pn-name">{s.label}</span>
        </a>
      ))}
    </nav>
  );
}
