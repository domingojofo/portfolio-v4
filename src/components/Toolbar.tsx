"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { pageIndex, pages } from "@/lib/pages";
import { tick } from "@/lib/tick";

// Floating icon nav (Figma "Navigation" 387:8538): four paper tiles on a navy-tinted glass bar.
//  - The current page's tile is raised (soft drop shadow, light top edge) with an orange dot under it.
//  - Hover / keyboard focus: the tile lifts and brightens, the icon darkens, and a tooltip shows its name.
//  - The menu's tick plays each time the pointer (or ← →) moves to another icon.
// Icons follow the page order, so ← / → step through them left to right.
//  - The links tile at the right end (Figma 395:8561): LinkedIn and the CV slide up above it; a
//    click away, Escape or a second click slides them back down.
// On Hey the bar waits off screen until the first scroll, then slides up; it steps down again while
// the project cards fill the screen (ProjectCards, html.deck-focus) and at the footer.

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
  const [linksOpen, setLinksOpen] = useState(false);
  const linksRef = useRef<HTMLDivElement>(null);

  // Links: close on a click outside or Escape
  useEffect(() => {
    if (!linksOpen) return;
    const onDown = (e: PointerEvent) => { if (!linksRef.current?.contains(e.target as Node)) setLinksOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLinksOpen(false); };
    addEventListener("pointerdown", onDown);
    addEventListener("keydown", onKey);
    return () => { removeEventListener("pointerdown", onDown); removeEventListener("keydown", onKey); };
  }, [linksOpen]);

  // Away once the footer is in view (any page), and on Hey until the first scroll too
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const check = () => {
      raf = 0;
      const footer = document.querySelector(".closing, .sf")?.getBoundingClientRect();
      const atFooter = !!footer && footer.top < innerHeight * 0.5;
      root.classList.toggle("nav-away", (pathname === "/" && scrollY < 8) || atFooter);
      if (atFooter) setLinksOpen(false);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", kick); removeEventListener("resize", kick); root.classList.remove("nav-away"); };
  }, [pathname]);

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

        <div className="tb-links" ref={linksRef} data-open={linksOpen || undefined}>
          <div className="tb-pop" inert={!linksOpen}>
            <a className="tb-item tb-pop-item" href={site.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
              style={{ "--i": 1 } as React.CSSProperties}>
              <span className="tb-icon tb-icon-sm" style={{ "--icon": "url(/icons/toolbar/linkedin.svg)" } as React.CSSProperties} />
            </a>
            <a className="tb-item tb-pop-item" href={site.cv} target="_blank" rel="noopener noreferrer" aria-label="CV"
              style={{ "--i": 0 } as React.CSSProperties}>
              <span className="tb-cv" aria-hidden="true" />
            </a>
          </div>
          <button
            type="button"
            className={`tb-item tb-links-btn${linksOpen ? " is-open" : ""}${hovered === "links" ? " is-hover" : ""}`}
            aria-label="Links"
            aria-expanded={linksOpen}
            onClick={() => setLinksOpen((o) => !o)}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") setHovered("links"); }}
            onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) setHovered("links"); }}
            onBlur={() => setHovered(null)}
          >
            <span className="tb-icon tb-icon-link" style={{ "--icon": "url(/icons/toolbar/link.svg)" } as React.CSSProperties} />
            <AnimatePresence>
              {hovered === "links" && !linksOpen && (
                <motion.span key="tip" className="tb-tooltip" role="tooltip"
                  initial={{ opacity: 0, y: 4, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 4, x: "-50%" }}
                  transition={{ duration: 0.15 }}>
                  Links
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>
    </div>
  );
}
