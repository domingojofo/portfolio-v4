"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from "react";

// Body text that slides up into place, line by line: every word sits in its own mask and rises
// from just below it, all at once, so each line comes up as a piece. It starts when the text
// scrolls into view — or, with `afterTitle`, once the section's heading (.ab-title, a RevealHeading)
// has finished its word reveal. Markup inside (spans for colour or a typeface) is kept.
// Reduced motion: shown as is.

function wrap(node: React.ReactNode, key = "w"): React.ReactNode {
  if (typeof node === "string") {
    return node.split(/(\s+)/).map((part, i) =>
      !part ? null : /^\s+$/.test(part) ? " " : (
        <span className="lr-w" key={`${key}-${i}`}><span className="lr-in">{part}</span></span>
      ),
    );
  }
  if (isValidElement<{ children?: React.ReactNode }>(node)) {
    return cloneElement(node, undefined, Children.map(node.props.children, (c, i) => wrap(c, `${key}-${i}`)));
  }
  return node;
}

export function LineRise({ as: Tag = "p", className = "", afterTitle = false, children, ...rest }:
  { as?: "p" | "div"; className?: string; afterTitle?: boolean; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { requestAnimationFrame(() => setOn(true)); return; }
    let title: HTMLElement | null = null;
    if (afterTitle) {
      const box = el.closest("section, .ab-intro") ?? el.parentElement;
      title = box?.querySelector<HTMLElement>(".ab-title") ?? null;
    }
    let seen = false, titled = !title || "revealed" in title.dataset;
    const go = () => { if (seen && titled) setOn(true); };
    const onTitle = () => { titled = true; go(); };
    title?.addEventListener("rv:done", onTitle);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { seen = true; io.disconnect(); go(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => { io.disconnect(); title?.removeEventListener("rv:done", onTitle); };
  }, [afterTitle]);

  return (
    // @ts-expect-error -- the ref fits either tag
    <Tag ref={ref} className={`lr ${className}`.trim()} data-in={on || undefined} {...rest}>
      {Children.map(children, (c, i) => wrap(c, `r${i}`))}
    </Tag>
  );
}
