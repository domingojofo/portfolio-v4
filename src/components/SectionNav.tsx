"use client";

import { useEffect, useRef } from "react";

// Section nav (after robwinters.github.io/portfolio): a column of short ticks at the left edge, one
// per section. The one you're in grows long and fills as you read through it; the ones you've passed
// darken. Hover and a frosted panel opens behind the names, which slide in one after another;
// arriving in a new section shows its name for a moment on its own. Desktop only.
// Each section runs from where its top meets the reading line (40% down) to the next one. It follows
// whichever scrolls the page: the window, or — inside the project modal — the modal's own scroller.

export function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const ref = useRef<HTMLElement>(null);
  const ids = sections.map((s) => s.id).join(",");
  useEffect(() => {
    const nav = ref.current!;
    const box = nav.closest<HTMLElement>(".modal-scroll");   // null: the window scrolls
    const links = [...nav.querySelectorAll<HTMLAnchorElement>("a")];
    const els = ids.split(",").map((id) => document.getElementById(id));
    const viewH = () => (box ? box.clientHeight : innerHeight);
    const pos = () => (box ? box.scrollTop : scrollY);
    const top = () => (box ? box.getBoundingClientRect().top : 0);
    let starts: number[] = [], current = -1, queued = false;
    let hideName: ReturnType<typeof setTimeout> | undefined;
    const measure = () => {
      starts = els.map((s) => (s ? s.getBoundingClientRect().top - top() + pos() - viewH() * 0.4 : 0));
      starts[0] = 0;
    };
    const update = () => {
      queued = false;
      const y = pos(), end = (box ? box.scrollHeight : document.documentElement.scrollHeight) - viewH();
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
    // In the modal, a click scrolls the modal (the browser's own jump would scroll the page behind)
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a");
      const el = a && document.getElementById(a.hash.slice(1));
      if (!box || !el) return;
      e.preventDefault();
      box.scrollTo({ top: el.getBoundingClientRect().top - top() + box.scrollTop - 24, behavior: "smooth" });
    };
    remeasure();
    const scroller: EventTarget = box ?? window;
    scroller.addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", remeasure);
    nav.addEventListener("click", onClick);
    const ro = new ResizeObserver(remeasure);
    ro.observe(box?.firstElementChild ?? document.body);
    return () => {
      scroller.removeEventListener("scroll", queue);
      removeEventListener("resize", remeasure);
      nav.removeEventListener("click", onClick);
      ro.disconnect();
      clearTimeout(hideName);
    };
  }, [ids]);

  return (
    <nav className="page-nav" ref={ref} aria-label="Sections">
      {sections.map((s, i) => (
        <a key={s.id} href={`#${s.id}`} style={{ "--i": i } as React.CSSProperties}>
          <span className="tick"><span className="fill" /></span>
          <span className="pn-name">{s.label}</span>
        </a>
      ))}
    </nav>
  );
}
