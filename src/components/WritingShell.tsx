"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { EntryMeta } from "@/content/writing";

const PHONE = "(max-width: 640px)";
const FADE_MS = 280;   // matches the .writing-sidebar transition in globals.css

// Writing page frame. Desktop / iPad: sidebar of every entry beside the open entry; Esc or the
// "Esc · Hide sidebar" chip fades the sidebar out and centres the entry, and again to bring it back.
// Phone: /writing is the list on its own, /writing/[slug] is the entry on its own with a back link.
export function WritingShell({ entries, children }: {
  entries: (EntryMeta & { dateLabel: string })[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const slug = pathname.split("/")[2];
  const active = slug ?? entries[0]?.slug;   // /writing shows the newest entry

  // open: sidebar visible. gone: removed from the layout once the fade-out ends, so the entry centres.
  const [open, setOpen] = useState(true);
  const [gone, setGone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function toggle() {
    clearTimeout(timer.current);
    if (open) {
      setOpen(false);
      timer.current = setTimeout(() => setGone(true), FADE_MS);
    } else {
      setGone(false);
      // Back in the layout first, then fade in on a later frame so the transition runs
      requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
    }
  }

  // Esc toggles the sidebar (not on phones, where there's no sidebar to hide)
  const toggleRef = useRef(toggle);
  useEffect(() => { toggleRef.current = toggle; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (matchMedia(PHONE).matches) return;
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest("input, textarea, select, [contenteditable]")) return;               // typing
      if (document.querySelector(".page-menu-button[aria-expanded=true]")) return;          // Esc closes the page menu
      if (document.querySelector("[role=dialog]:not([hidden])")?.getClientRects().length) return;
      toggleRef.current();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  // Shrinking to phone width always shows the list again
  useEffect(() => {
    const mq = matchMedia(PHONE);
    const onChange = () => {
      if (!mq.matches) return;
      clearTimeout(timer.current);
      setOpen(true);
      setGone(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Each entry opens at the top. Done on click (not on every path change) so browser Back
  // still restores where you were in the list.
  const toTop = () => window.scrollTo({ top: 0, behavior: "instant" });

  return (
    <div className="writing" data-view={slug ? "entry" : "index"} data-open={open} data-gone={gone}>
      <button
        className="writing-toggle"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="writing-sidebar"
      >
        <kbd>Esc</kbd>
        <span>{open ? "Hide sidebar" : "Show sidebar"}</span>
      </button>

      <nav id="writing-sidebar" className="writing-sidebar" aria-label="All writing" inert={!open}>
        <h1 className="writing-heading">Writing</h1>
        <ul className="writing-list">
          {entries.map((e) => (
            <li key={e.slug}>
              <Link
                className="writing-item"
                href={`/writing/${e.slug}`}
                scroll={false}
                onClick={toTop}
                aria-current={e.slug === active ? "page" : undefined}
              >
                <span className="writing-arrow" aria-hidden="true">▶︎</span>
                <span>
                  <span className="writing-item-title">{e.title}</span>
                  <span className="writing-item-meta">
                    <time dateTime={e.date}>{e.dateLabel}</time>
                    <span>{e.wordCount} words</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <main className="writing-main">
        <Link className="writing-back" href="/writing" scroll={false} onClick={toTop}>◀︎ All writing</Link>
        {children}
      </main>
    </div>
  );
}
