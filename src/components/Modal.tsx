"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

// Project modal (after aaronchartrand.me): almost full screen — a rounded sheet with a light stroke,
// a small gap to the screen edge — with an icon close button in the nav's tile style. The content
// keeps our single column and scrolls inside the sheet. Closing goes back in history, so Back,
// Esc, the gap around the sheet and the close button all return to the page exactly where you were.
export function Modal({ children, labelledBy }: { children: React.ReactNode; labelledBy: string }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => router.back(), [router]);

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
    <motion.div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        ref={panelRef}
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="modal-close" onClick={close} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <div className="modal-scroll">
          <div className="modal-body">{children}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
