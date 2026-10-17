"use client";

import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { site } from "@/content/site";
import { pageIndex, pages } from "@/lib/pages";
import { tick } from "@/lib/tick";

// Command menu (ported from portfolio-v2): ⌘K / Ctrl+K anywhere, the desktop Menu button,
// or the mobile page button. Desktop: a panel that grows out of the Menu button.
// Phones/tablets: a bottom sheet you can drag down to close. Click sound on open,
// a soft tick while moving through items. ⌘J opens the CV.

type Item = { id: string; label: string; group: "Go to" | "Links"; href: string; external?: boolean; hint?: string };

const MenuContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null);

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used inside <MenuProvider>");
  return ctx;
}

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // ⌘K toggles the menu, ⌘J opens the CV — anywhere on the site
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
      if (document.documentElement.dataset.intro === "playing") return;
      const key = e.key.toLowerCase();
      if (key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (key === "j") {
        e.preventDefault();
        setOpen(false);
        window.open(site.cv, "_blank", "noopener");
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ open, setOpen }), [open]);
  return (
    <MenuContext.Provider value={value}>
      {children}
      <CommandMenu />
    </MenuContext.Provider>
  );
}

// ---------- Sounds (the tick lives in lib/tick, shared with the toolbar) ----------
function useSounds() {
  const click = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/audio/click.mp3");
    audio.preload = "auto";
    audio.volume = 0.6;
    click.current = audio;
  }, []);

  const playClick = useCallback(() => {
    const audio = click.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  return { playClick, tick };
}

// Phones and tablets get the bottom sheet (same breakpoint as the mobile layout)
function useIsSheet() {
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(max-width: 1023px), (hover: none) and (pointer: coarse)");
    const sync = () => setSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return sheet;
}

const easeOut = [0.22, 1, 0.36, 1] as const;
const sheetEase = [0.32, 0.72, 0, 1] as const;

function CommandMenu() {
  const { open, setOpen } = useMenu();
  const router = useRouter();
  const pathname = usePathname();
  const isSheet = useIsSheet();
  const { playClick, tick } = useSounds();
  const dragControls = useDragControls();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActiveState] = useState(0);
  const activeRef = useRef(0);   // latest selection, so rapid key presses each move one step
  const setActive = (i: number) => { activeRef.current = i; setActiveState(i); };

  const current = pages[pageIndex(pathname)].href;
  const items: Item[] = useMemo(() => [
    ...pages.map((p) => ({ id: p.href, label: p.label, group: "Go to" as const, href: p.href })),
    { id: "linkedin", label: "LinkedIn", group: "Links", href: site.linkedin, external: true },
    { id: "cv", label: "CV", group: "Links", href: site.cv, external: true, hint: "⌘J" },
  ], []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  // Opening: reset search, click sound, lock scroll, focus. Closing: unlock, restore focus.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setActiveState(0);
    }
  }
  useEffect(() => {
    if (!open) return;
    activeRef.current = 0;
    returnFocus.current = document.activeElement as HTMLElement | null;
    playClick();
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    requestAnimationFrame(() => (isSheet ? listRef.current : inputRef.current)?.focus({ preventScroll: true }));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      removeEventListener("keydown", onKey);
      returnFocus.current?.focus({ preventScroll: true });
    };
  }, [open, isSheet, playClick, close]);

  const select = (i: number) => {
    if (!visible.length) return;
    const next = (i + visible.length) % visible.length;
    if (next !== activeRef.current) tick();
    setActive(next);
    document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" });
  };

  const run = (item: Item | undefined) => {
    if (!item) return;
    close();
    if (item.external) window.open(item.href, "_blank", "noopener");
    else if (item.href !== current) router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); select(activeRef.current + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); select(activeRef.current - 1); }
    else if (e.key === "Enter") { e.preventDefault(); run(visible[activeRef.current]); }
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) close();
  };

  // Desktop panel grows out of the Menu button (top right); the sheet slides up from the bottom
  const panelMotion = isSheet
    ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" }, transition: { duration: 0.45, ease: sheetEase } }
    : {
        initial: { opacity: 0, scale: 0.92, y: -12, filter: "blur(4px)" },
        animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 0.96, y: -8, filter: "blur(2px)" },
        transition: { duration: 0.28, ease: easeOut },
      };

  const groups = (["Go to", "Links"] as const)
    .map((g) => ({ name: g, items: visible.filter((i) => i.group === g) }))
    .filter((g) => g.items.length);

  return (
    <AnimatePresence>
      {open && (
        <div className="cmdk-root" key="cmdk">
          <motion.div
            className="cmdk-backdrop"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            className={`cmdk ${isSheet ? "cmdk--sheet" : "cmdk--panel"}`}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            onKeyDown={onKeyDown}
            {...panelMotion}
            {...(isSheet && {
              drag: "y" as const,
              dragControls,
              dragListener: false,
              dragConstraints: { top: 0, bottom: 0 },
              dragElastic: { top: 0, bottom: 0.6 },
              onDragEnd,
            })}
          >
            {isSheet && <div className="cmdk-grab" aria-hidden="true" onPointerDown={(e) => dragControls.start(e)} />}
            <div className="cmdk-input-row">
              <input
                ref={inputRef}
                className="cmdk-input"
                type="text"
                placeholder="Search…"
                autoComplete="off"
                spellCheck={false}
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={visible.length ? `${listId}-${active}` : undefined}
                aria-label="Search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              />
            </div>
            <div className="cmdk-list" id={listId} role="listbox" aria-label="Suggestions" tabIndex={-1} ref={listRef}>
              {groups.map((g) => (
                <div className="cmdk-group" role="presentation" key={g.name}>
                  <div className="cmdk-heading" aria-hidden="true">{g.name}</div>
                  {g.items.map((item) => {
                    const i = visible.indexOf(item);
                    return (
                      <motion.div
                        key={item.id}
                        id={`${listId}-${i}`}
                        className="cmdk-item"
                        role="option"
                        aria-selected={i === active}
                        aria-current={item.href === current ? "page" : undefined}
                        onMouseMove={() => select(i)}
                        onClick={() => run(item)}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.025, duration: 0.25, ease: easeOut }}
                      >
                        <span>{item.label}</span>
                        <small>{item.href === current ? "You're here" : item.hint ?? (item.external ? "↗" : "")}</small>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
              {!visible.length && <div className="cmdk-empty">No results</div>}
            </div>
            <div className="cmdk-footer" aria-hidden="true">
              <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span>Go <kbd>↵</kbd></span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
