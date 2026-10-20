"use client";

import { useLayoutEffect, useRef } from "react";
import { reveal, type RevealOptions } from "@/lib/reveal";
import { lineText, RevealWords, type RevealLine } from "./RevealWords";

// A heading that plays the word reveal every time it mounts (e.g. each visit to /design), or —
// with `onView` — the first time it scrolls into view.
// It renders with .rv-pending so the words start parked out of sight — no flash of the finished
// text before the effect runs. Reduced motion (and no JS, see layout.tsx) shows it as is.
export function RevealHeading({
  as: Tag = "h1", lines, options, onView = false, viewThreshold = 0.35, ...rest
}: { as?: "h1" | "h2" | "p"; lines: RevealLine[]; options?: RevealOptions; onView?: boolean; viewThreshold?: number } & React.HTMLAttributes<HTMLHeadingElement>) {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = ref.current!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.remove("rv-pending");
      return;
    }
    let r: ReturnType<typeof reveal> | null = null;
    const play = () => {
      r = reveal(el, options);
      el.classList.remove("rv-pending");   // reveal() has parked each word inline by now
    };
    if (!onView) {
      play();
      return () => r?.cancel();
    }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      play();
    }, { threshold: viewThreshold });
    io.observe(el);
    return () => { io.disconnect(); r?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- plays once per mount
  }, []);

  return (
    // aria-label: screen readers get the real words, never the scrambled glyphs
    <Tag ref={ref} aria-label={lineText(lines)} {...rest} className={`${rest.className ?? ""} rv-pending`.trim()}>
      <RevealWords lines={lines} />
    </Tag>
  );
}
