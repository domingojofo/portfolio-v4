"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { pageIndex, pages } from "@/lib/pages";
import { tick } from "@/lib/tick";

// Floating icon nav (Figma "Navigation" 387:8538): four paper tiles on a navy-tinted glass bar.
//  - The current page's tile is raised (soft drop shadow, light top edge) with an orange dot under it.
//  - Hover / keyboard focus: the tile lifts and brightens, the icon darkens, and a tooltip shows its name.
//  - The menu's tick plays each time the pointer (or ← →) moves to another icon.
// Icons follow the page order, so ← / → step through them left to right.

const icons: Record<string, { icon: string; tooltip: string }> = {
  "/": { icon: "/icons/toolbar/home.svg", tooltip: "Design" },
  "/about": { icon: "/icons/toolbar/story.svg", tooltip: "My story" },
  "/reading": { icon: "/icons/toolbar/work.svg", tooltip: "Reading" },
  "/writing": { icon: "/icons/toolbar/write.svg", tooltip: "Writing" },
};

export function Toolbar() {
  const pathname = usePathname();
  const current = pages[pageIndex(pathname)].href;
  const [hovered, setHovered] = useState<string | null>(null);
  const target = hovered ?? current;

  // Tick when the highlighted icon changes by pointer, focus or ← → (not on load, scroll or touch)
  const lastKey = useRef(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") lastKey.current = performance.now(); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
  const lastTarget = useRef(target);
  const lastHovered = useRef(hovered);
  useEffect(() => {
    const moved = target !== lastTarget.current;
    const byPointer = hovered !== lastHovered.current;
    const byKeys = performance.now() - lastKey.current < 1000;
    lastTarget.current = target;
    lastHovered.current = hovered;
    if (moved && (byPointer || byKeys) && !matchMedia("(hover: none)").matches) tick();
  }, [target, hovered]);

  return (
    <div className="tb">
      <nav className="tb-bar" aria-label="Main" onPointerLeave={() => setHovered(null)}>
        {pages.map(({ href }) => {
          const item = icons[href];
          const isCurrent = href === current;
          return (
            <Link
              key={href}
              href={href}
              className={`tb-item${isCurrent ? " is-selected" : ""}${href === hovered ? " is-hover" : ""}`}
              aria-current={isCurrent ? "page" : undefined}
              aria-label={item.tooltip}
              // Hover states only for a real mouse or keyboard focus — on touch a tap just selects
              onPointerEnter={(e) => { if (e.pointerType === "mouse") setHovered(href); }}
              onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) setHovered(href); }}
              onBlur={() => setHovered(null)}
            >
              <span className="tb-icon" style={{ "--icon": `url(${item.icon})` } as React.CSSProperties} />
              <AnimatePresence>
                {href === hovered && (
                  <motion.span
                    key="tip"
                    className="tb-tooltip"
                    role="tooltip"
                    initial={{ opacity: 0, y: 4, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, y: 4, x: "-50%" }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.tooltip}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
