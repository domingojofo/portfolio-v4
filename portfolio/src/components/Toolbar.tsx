"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { pageIndex, pages } from "@/lib/pages";
import { tick } from "@/lib/tick";
import { useNavHidden } from "./Nav";

// Icon toolbar (Figma "Toolbar" frames) — the nav being tested in place of the word nav.
// Shown only in toolbar mode (html.nav-toolbar, switched on by visiting /nav-test).
//  - The current page is an orange keycap with its label.
//  - Hover: four corner brackets frame the item, the arrow glides above it, a tooltip shows its name.
//  - Click: navigates; the new item becomes the keycap and its label slides in from the left.
//  - Mobile: scrolling down fades the arrow away (the label stays); it comes back on the next page switch.
// Icons follow the page order, so ← / → step through them left to right.

const icons: Record<string, { icon: string; label: string; tooltip: string }> = {
  "/": { icon: "/icons/toolbar/home.svg", label: "hey", tooltip: "Hey" },
  "/design": { icon: "/icons/toolbar/terminal.svg", label: "design", tooltip: "Design" },
  "/about": { icon: "/icons/toolbar/story.svg", label: "my story", tooltip: "My story" },
  "/reading": { icon: "/icons/toolbar/work.svg", label: "reading", tooltip: "Reading" },
  "/writing": { icon: "/icons/toolbar/write.svg", label: "writing", tooltip: "Writing" },
};

// Testing: keep the current page's label even while scrolling. Set to true to fold it away
// when the visitor scrolls down (it comes back on the next page switch).
const FOLD_LABEL_ON_SCROLL = false;

const spring = { type: "spring", stiffness: 520, damping: 38, mass: 0.7 } as const;
const ease = [0.22, 1, 0.36, 1] as const;

export function Toolbar() {
  const pathname = usePathname();
  const current = pages[pageIndex(pathname)].href;
  const scrolledDown = useNavHidden(pathname);   // true once the visitor scrolls down
  const labelHidden = FOLD_LABEL_ON_SCROLL && scrolledDown;
  // Mobile: the floating arrow fades down out of the way once the visitor scrolls down,
  // and comes back on the next page switch (or back at the top)
  const isMobile = useIsMobile();
  const arrowHidden = isMobile && scrolledDown;
  const [hovered, setHovered] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const barRef = useRef<HTMLDivElement>(null);
  const [arrowX, setArrowX] = useState<number | null>(null);

  // The arrow sits above the hovered item, or the current one when nothing is hovered
  const target = hovered ?? current;

  // The menu's tick each time the visitor moves the arrow to another icon (hover, focus, ← →).
  // Silent when the page changes by scrolling (Hey ↔ Design swap the address as you scroll),
  // on first load, and on touch (the arrow just follows the tapped page).
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
    const byPointer = hovered !== lastHovered.current;            // hover/focus moved, or the pointer left the bar
    const byKeys = performance.now() - lastKey.current < 1000;    // ← → switched the page
    lastTarget.current = target;
    lastHovered.current = hovered;
    if (moved && (byPointer || byKeys) && !matchMedia("(hover: none)").matches) tick();
  }, [target, hovered]);
  useEffect(() => {
    const measure = () => {
      const el = itemRefs.current[target], bar = barRef.current;
      if (!el || !bar) return;
      const a = el.getBoundingClientRect(), b = bar.getBoundingClientRect();
      setArrowX(a.left - b.left + a.width / 2);
    };
    measure();
    // The current keycap changes width as its label opens/folds — keep the arrow centred on it
    const ro = new ResizeObserver(measure);
    Object.values(itemRefs.current).forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [target]);

  return (
    <div className="tb" ref={barRef}>
      {arrowX !== null && (
        <motion.span
          className="tb-arrow"
          aria-hidden="true"
          initial={false}
          animate={{ x: arrowX - 20, y: arrowHidden ? 10 : 0, opacity: arrowHidden ? 0 : 1 }}   // the arrow asset is 40px wide with its shadow
          transition={{ x: spring, y: { duration: 0.35, ease }, opacity: { duration: 0.25, ease } }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static Figma asset */}
          <img src="/icons/toolbar/arrow.svg" width={39.8234} height={40.1742} alt="" />
        </motion.span>
      )}

      <nav className="tb-bar" aria-label="Main" onPointerLeave={() => setHovered(null)}>
        {pages.map(({ href }) => {
          const item = icons[href];
          const isCurrent = href === current;
          return (
            // No layout animation here on purpose: on a page change it measured the icons across the
            // jump to the top and slid them in from below. The label's own width animation already
            // eases the neighbouring icons aside.
            <Link
              key={href}
              href={href}
              ref={(el) => { itemRefs.current[href] = el; }}
              className={`tb-item${isCurrent ? " is-selected" : ""}`}
              aria-current={isCurrent ? "page" : undefined}
              aria-label={item.tooltip}
              // Hover states only for a real mouse or keyboard focus — on touch a tap just selects
              onPointerEnter={(e) => { if (e.pointerType === "mouse") setHovered(href); }}
              onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) setHovered(href); }}
              onBlur={() => setHovered(null)}
            >
              <span className="tb-icon" style={{ "--icon": `url(${item.icon})` } as React.CSSProperties} />
              <AnimatePresence initial={false}>
                {isCurrent && !labelHidden && (
                  <motion.span
                    key="label"
                    className="tb-label"
                    initial={{ width: 0 }}
                    animate={{ width: "auto" }}
                    exit={{ width: 0 }}
                    transition={{ duration: 0.35, ease }}
                  >
                    {/* the text slides in from the left as the keycap opens */}
                    <motion.span
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -10, opacity: 0 }}
                      transition={{ duration: 0.3, ease, delay: 0.05 }}
                    >
                      {item.label}
                    </motion.span>
                  </motion.span>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {href === hovered && !isCurrent && (
                  <motion.span
                    key="brackets"
                    className="tb-brackets"
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 1.25 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.15 }}
                    transition={{ duration: 0.18, ease }}
                  >
                    <i /><i /><i /><i />
                  </motion.span>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {href === hovered && (
                  <motion.span
                    key="tip"
                    className="tb-tooltip"
                    role="tooltip"
                    initial={{ opacity: 0, y: -4, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, y: -4, x: "-50%" }}
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

// Same breakpoint as the mobile layout in globals.css
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(max-width: 1023px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mobile;
}
