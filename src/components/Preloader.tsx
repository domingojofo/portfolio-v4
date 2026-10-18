"use client";

import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Test preloader ("text echo"): only runs when the page is opened with ?loader (or /loader-test),
// which sets html[data-loader="on"] before first paint. Lines slide in from the left with a
// ghost trail of fading copies, a counter runs to 100%, then the dark screen dissolves in
// square pixels to reveal the page — and the hero intro starts ("loader:done").
// Only transform and opacity animate (Motion runs them on the compositor via WAAPI); the pixel
// dissolve is one canvas.

const LINES = [
  "You’re in calloused hands",
  "Hold on a second",
  "Working the grain",
  "Rough edges, steady grip",
  "You’re in calloused hands",
];
const LEFTS = [52, 36, 28, 38, 48];   // % of the viewport where each line in a group starts
const GROUPS = 3;
const CLONES = 9;                     // ghost copies behind each line
const CLONE_LAG = 0.028;              // s between copies
const LINE_STAGGER = 0.09;            // s between lines, top to bottom
const SLIDE = 1;                      // s per slide
const expoOut = [0.16, 1, 0.3, 1] as const;

const rows = Array.from({ length: GROUPS }, () => LINES.map((text, i) => ({ text, left: LEFTS[i] })));

export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [count, setCount] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const root = rootRef.current, canvas = canvasRef.current;
    if (html.dataset.loader !== "on" || !root || !canvas) return;

    // The dark backdrop is a canvas so the exit can clear it square by square
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#141414";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const controls: { stop: () => void }[] = [];
    let raf = 0;
    let cancelled = false;

    // 1. Lines + their ghost trails slide in
    const lines = [...root.querySelectorAll<HTMLElement>(".pl-line")];
    lines.forEach((line, i) => {
      const start = i * LINE_STAGGER;
      const from = "translateX(-110vw)";
      controls.push(animate(line.querySelector<HTMLElement>(".pl-real")!, { transform: [from, "translateX(0)"] }, { duration: SLIDE, delay: start, ease: expoOut }));
      line.querySelectorAll<HTMLElement>(".pl-ghost").forEach((ghost, k) => {
        const delay = start + (k + 1) * CLONE_LAG;
        const peak = 0.55 * (1 - k / CLONES);
        controls.push(animate(ghost, { transform: [from, "translateX(0)"], opacity: [peak, peak] }, { duration: SLIDE, delay, ease: expoOut }));
        // Once it lands, the copy fades so only the crisp line remains
        controls.push(animate(ghost, { opacity: 0 }, { duration: 0.35, delay: delay + SLIDE }));
      });
    });

    // 2. Counter runs to 100% as the last ghost lands
    const total = (lines.length - 1) * LINE_STAGGER + CLONES * CLONE_LAG + SLIDE;
    controls.push(animate(0, 100, { duration: total, ease: "linear", onUpdate: (v) => setCount(Math.round(v)) }));

    // 3. Done: tell the page, fade the words, dissolve the backdrop in square pixels
    const finish = setTimeout(() => {
      if (cancelled) return;
      window.dispatchEvent(new Event("loader:done"));
      controls.push(animate(root.querySelector<HTMLElement>(".pl-text")!, { opacity: 0 }, { duration: 0.25 }));

      const size = 32 * dpr;
      const cols = Math.ceil(canvas.width / size), rowsN = Math.ceil(canvas.height / size);
      // Random order, biased top-left → bottom-right so it reads as a sweep, not noise
      const cells = Array.from({ length: cols * rowsN }, (_, n) => {
        const x = n % cols, y = Math.floor(n / cols);
        return { x, y, t: ((x / cols + y / rowsN) / 2) * 0.6 + Math.random() * 0.4 };
      }).sort((a, b) => a.t - b.t);
      const DISSOLVE = 700;
      const t0 = performance.now();
      let done = 0;
      const step = (now: number) => {
        const target = Math.min(cells.length, Math.round(((now - t0) / DISSOLVE) * cells.length));
        for (; done < target; done++) ctx.clearRect(cells[done].x * size, cells[done].y * size, size, size);
        if (done < cells.length) raf = requestAnimationFrame(step);
        else { delete html.dataset.loader; setGone(true); }
      };
      raf = requestAnimationFrame(step);
    }, total * 1000);

    return () => {
      cancelled = true;
      clearTimeout(finish);
      cancelAnimationFrame(raf);
      controls.forEach((c) => c.stop());
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={rootRef} className="preloader" aria-hidden="true">
      <canvas ref={canvasRef} className="pl-canvas" />
      <div className="pl-text">
        {rows.map((group, g) => (
          <div className="pl-group" key={g}>
            {group.map(({ text, left }, i) => (
              <div className="pl-line" key={i} style={{ "--l": left } as React.CSSProperties}>
                {Array.from({ length: CLONES }, (_, k) => <span className="pl-ghost" key={k}>{text}</span>)}
                <span className="pl-real">{text}</span>
              </div>
            ))}
          </div>
        ))}
        <p className="pl-count">▸ {count}%</p>
      </div>
    </div>
  );
}
