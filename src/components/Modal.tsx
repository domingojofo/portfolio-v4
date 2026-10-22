"use client";

import { animate } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { takeModalOrigin } from "@/lib/modalOrigin";

// Project modal (after aaronchartrand.me): almost full screen — a rounded sheet with a light stroke,
// a small gap to the screen edge — with an icon close button in the nav's tile style. The content
// keeps our single column and scrolls inside the sheet. Closing goes back in history, so Back,
// Esc, the gap around the sheet and the close button all return to the page exactly where you were.
//
// Opening grows the sheet out of the card you clicked, as Aaron's does: the sheet starts as a
// transform that lays it exactly over the card's box (translated to its corner and scaled down to
// its size, origin top-left), then a spring (stiffness 380, damping 40) releases it to full size.
// Its content waits until the sheet has landed, then fades up, so nothing is seen squashed.
// Opened without a card (a direct link, the menu), it rises in as before.
// Closing plays it backwards: the content fades, then the sheet springs back down into the card
// (re-measured, wherever it is now) while the backdrop clears, and only then do we go back. Without
// a card it sinks and fades out.
// The transform that lays the full sheet exactly over a card's box (origin top-left)
function toCard(r: DOMRect) {
  const gap = innerWidth < 1024 ? 8 : 16;   // .modal-backdrop's padding
  const W = innerWidth - gap * 2, H = innerHeight - gap * 2;
  return { x: r.left - gap, y: r.top - gap, scaleX: r.width / W, scaleY: r.height / H };
}
const OPEN = { type: "spring", stiffness: 380, damping: 40, mass: 1 } as const;
const SHUT = { type: "spring", stiffness: 420, damping: 42, mass: 1 } as const;

// The animations are run imperatively from a layout effect rather than through `initial`: Next keeps
// this modal mounted (hidden) between visits to the same project, so each showing must reset and
// replay them itself — effects re-run every time it's shown, `initial` only on the very first.
export function Modal({ children, labelledBy }: { children: React.ReactNode; labelledBy: string }) {
  const router = useRouter();
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const originEl = useRef<Element | null>(null);
  const closing = useRef(false);

  useLayoutEffect(() => {
    const panel = panelRef.current!, backdrop = backdropRef.current!;
    closing.current = false;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const o = takeModalOrigin();
    originEl.current = o && !reduce ? o.el : null;
    animate(backdrop, { opacity: [0, 1] }, { duration: reduce ? 0 : 0.25 });
    if (o && !reduce) {
      const t = toCard(o.rect);
      panel.style.transformOrigin = "top left";
      delete panel.dataset.landed;   // content waits for the sheet to land
      animate(panel, { x: [t.x, 0], y: [t.y, 0], scaleX: [t.scaleX, 1], scaleY: [t.scaleY, 1], opacity: 1 }, OPEN)
        .then(() => { if (!closing.current) panel.dataset.landed = ""; });
    } else {
      panel.style.transformOrigin = "";
      panel.dataset.landed = "";
      animate(panel, { opacity: [0, 1], y: [reduce ? 0 : 24, 0], x: 0, scaleX: 1, scaleY: 1, scale: [reduce ? 1 : 0.985, 1] },
        { duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] });
    }
  }, []);

  // Closing plays the opening backwards: the content fades, the sheet springs back down into the card
  // (re-measured, wherever it is now) while the backdrop clears — then we go back. Without a card it
  // sinks and fades out.
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const panel = panelRef.current, backdrop = backdropRef.current;
    if (!panel || !backdrop || matchMedia("(prefers-reduced-motion: reduce)").matches) { router.back(); return; }
    delete panel.dataset.landed;
    const el = originEl.current;
    const r = el && el.isConnected ? el.getBoundingClientRect() : null;
    const sheet = r && r.width > 0
      ? (panel.style.transformOrigin = "top left",
        animate(panel, { ...toCard(r) }, { ...SHUT, delay: 0.06 }).then(() => animate(panel, { opacity: 0 }, { duration: 0.12 })))
      : animate(panel, { opacity: 0, y: 16, scale: 0.985 }, { duration: 0.22, ease: [0.4, 0, 1, 1] });
    const fade = animate(backdrop, { opacity: 0 }, { duration: 0.3, delay: 0.08 });
    Promise.all([sheet, fade]).then(() => router.back());
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    addEventListener("keydown", onKey);
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";                  // lock the page behind the modal
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });   // open at the top, not scrolled
    panelRef.current?.querySelector(".modal-scroll")?.scrollTo({ top: 0 });
    return () => {
      removeEventListener("keydown", onKey);
      html.style.overflow = prevOverflow;
      prevFocus?.focus({ preventScroll: true });
    };
  }, [close]);

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        ref={panelRef}
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        <button className="modal-close" onClick={close} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <div className="modal-scroll">
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}
