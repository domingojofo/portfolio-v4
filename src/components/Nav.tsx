"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { INTRO_KEY } from "@/lib/intro";
import { pageIndex, pages } from "@/lib/pages";
import { useMenu } from "./CommandMenu";
import { EdgeFx } from "./EdgeBlur";
import { SocialLinks } from "./SocialLinks";

// Step to the previous / next page in nav order (← / → keys)
function usePageStep() {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback((step: -1 | 1) => {
    const next = pageIndex(pathname) + step;
    if (next < 0 || next >= pages.length) return false;
    router.push(pages[next].href);
    return true;
  }, [pathname, router]);
}

function useArrowKeyNav(go: (step: -1 | 1) => boolean) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return; // keep browser shortcuts
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest("input, textarea, select, [contenteditable]")) return;       // typing
      if (document.querySelector("[role=dialog]:not([hidden])")?.getClientRects().length) return; // modal open
      if (go(e.key === "ArrowRight" ? 1 : -1)) e.preventDefault();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [go]);
}

// Clicking the logo reloads Hey from the top and replays the intro.
// Modified clicks (new tab / window) keep the normal link behaviour.
export function replayIntro(e: React.MouseEvent<HTMLAnchorElement>) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  try { sessionStorage.removeItem(INTRO_KEY); } catch {}
  history.scrollRestoration = "manual";   // don't restore the old scroll position on reload
  if (location.pathname === "/") location.reload();
  // A real reload is the point here, not a client-side navigation
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  else location.assign("/");
}

const SCROLL_KEYS = new Set(["ArrowDown", "PageDown", " ", "End"]);

// The nav steps aside only when the visitor scrolls down themselves (wheel, trackpad, swipe,
// scroll keys). It comes back on every page switch and at the top of the page. Scrolls the
// site does on its own (opening /design at its section, smooth-scrolling after a link) don't hide it.
export function useNavHidden(pathname: string, threshold = 24) {
  const [hidden, setHidden] = useState(false);

  // A new page always shows the nav
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setHidden(false);
  }

  useEffect(() => {
    let wantsDown = false;                   // the visitor just asked to scroll down
    let intentTimer: ReturnType<typeof setTimeout>;
    const intendDown = () => {
      wantsDown = true;
      clearTimeout(intentTimer);
      intentTimer = setTimeout(() => (wantsDown = false), 250);
    };

    const onScroll = () => {
      const down = scrollY > threshold;
      document.documentElement.classList.toggle("is-scrolled", down);   // page-wide hook (e.g. the top bar sliding into the margins)
      if (!down) setHidden(false);
      else if (wantsDown) setHidden(true);
    };
    const onWheel = (e: WheelEvent) => { if (e.deltaY > 0) intendDown(); };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => { if (e.touches[0].clientY < touchY - 4) intendDown(); };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (SCROLL_KEYS.has(e.key) && !el?.closest("input, textarea, select, button, [contenteditable]")) intendDown();
    };

    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("wheel", onWheel, { passive: true });
    addEventListener("touchstart", onTouchStart, { passive: true });
    addEventListener("touchmove", onTouchMove, { passive: true });
    addEventListener("keydown", onKey);
    return () => {
      clearTimeout(intentTimer);
      removeEventListener("scroll", onScroll);
      removeEventListener("wheel", onWheel);
      removeEventListener("touchstart", onTouchStart);
      removeEventListener("touchmove", onTouchMove);
      removeEventListener("keydown", onKey);
    };
  }, [threshold]);

  return hidden;
}

// The ← → hint steps away while scrolling down and comes back as soon as you scroll up
function useHintHidden(threshold = 24) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = scrollY;
    const onScroll = () => {
      const y = scrollY;
      if (y <= threshold) setHidden(false);
      else if (y > last + 2) setHidden(true);
      else if (y < last - 2) setHidden(false);
      last = y;
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, [threshold]);
  return hidden;
}

// Live New York time, HH:MM:SS (24h). Rendered after mount so server and client HTML match.
const nycTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
});
function NycClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(new Date());
      timer = setTimeout(tick, 1000 - (Date.now() % 1000));   // land on each new second (the minute flips on time)
    };
    tick();
    return () => clearTimeout(timer);
  }, []);
  return (
    <time className="clock" dateTime={now?.toISOString()} aria-label="Local time in New York">
      {now ? nycTime.format(now) : "\u00A0"}
    </time>
  );
}

const ease = [0.22, 1, 0.36, 1] as const;
const STAGGER = 0.05;

// Top: the blur strip with the logo + name (→ Hey, replays the intro) on the left; location and
// live time on the right. Stays put while scrolling.
// Bottom: the ← → hint on the left, the floating icon toolbar centred (Toolbar.tsx), LinkedIn/CV
// on the right.
// Word-nav mode (?nav=words): page links centred; once you scroll they drop away one after
// another and the Menu button (⌘K) rises into their place. On mobile/iPad the bottom bar
// (MobileBar) takes over in that mode.
export function Nav() {
  const pathname = usePathname();
  const current = pageIndex(pathname);
  const scrolled = useNavHidden(pathname);   // true → links + hint step aside, Menu button shows
  const { open, setOpen } = useMenu();
  const go = usePageStep();
  const hintHidden = useHintHidden();
  useArrowKeyNav(go);
  const links = pages.slice(1);

  return (
    <>
      <header className="edge-blur edge-blur--top">
        <EdgeFx />
        <div className="nav-inner">
          <Link className="logo" href="/" aria-label="Jofo Domingo — Design" onClick={replayIntro}>
            <Logo />
            <span className="logo-name">Jofo Domingo</span>
          </Link>
          <p className="locale">
            <span>Brooklyn</span>
            <span className="locale-icon" aria-hidden="true" />
            <NycClock />
          </p>
        </div>
      </header>

      <SocialLinks className="social-corner" />

      <nav className="dock" aria-label="Main">
        <motion.div
          className="nav-hint"
          initial={false}
          animate={hintHidden ? { y: 24, opacity: 0 } : { y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease }}
          inert={hintHidden}
        >
          <button type="button" className="keycap" aria-label="Previous page" onClick={() => go(-1)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
            <img src="/icons/key-left.svg" width={20} height={20} alt="" />
          </button>
          <button type="button" className="keycap" aria-label="Next page" onClick={() => go(1)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
            <img src="/icons/key-right.svg" width={20} height={20} alt="" />
          </button>
          <span>To navigate</span>
        </motion.div>

        <ul className="dock-links" inert={scrolled}>
          {links.map(({ href, label }, i) => (
            <motion.li
              key={href}
              initial={false}
              animate={scrolled ? { y: 48, opacity: 0 } : { y: 0, opacity: 1 }}
              // drop away left to right; come back right to left
              transition={{ duration: 0.4, ease, delay: STAGGER * (scrolled ? i : links.length - 1 - i) }}
            >
              <Link href={href} aria-current={current === i + 1 ? "page" : undefined}>{label}</Link>
            </motion.li>
          ))}
        </ul>

        <motion.button
          type="button"
          className="menu-trigger"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-keyshortcuts="Meta+K Control+K"
          onClick={() => setOpen(true)}
          initial={false}
          animate={scrolled ? { y: 0, opacity: 1 } : { y: 48, opacity: 0 }}   // rises into the links' place
          whileHover={{ y: 2, transition: { duration: 0.12 } }}   // key presses down as its thick bottom edge thins
          whileTap={{ y: 3, scale: 0.97, transition: { duration: 0.08 } }}
          transition={{ duration: 0.45, ease, delay: scrolled ? STAGGER * links.length : 0 }}
          style={{ x: "-50%" }}
          inert={!scrolled}
        >
          Menu
          <span className="menu-trigger-key" aria-hidden="true">⌘K</span>
        </motion.button>
      </nav>
    </>
  );
}

function Logo() {
  return (
    <svg width="32" height="14" viewBox="0 0 32 14" fill="none" aria-hidden="true">
      <path d="M14.913 13.3913V0.608696C14.913 0.272522 14.6405 0 14.3043 0H8.52174C8.18557 0 7.91304 0.272523 7.91304 0.608697V10.3478C7.91304 10.684 7.64052 10.9565 7.30435 10.9565H7C6.66383 10.9565 6.3913 10.684 6.3913 10.3478V6.69565C6.3913 6.35948 6.11878 6.08696 5.78261 6.08696H0.608696C0.272522 6.08696 0 6.35948 0 6.69565V13.3913C0 13.7275 0.272522 14 0.608695 14H14.3043C14.6405 14 14.913 13.7275 14.913 13.3913Z" fill="#F8651B" />
      <path d="M23.4346 14H17.9564C17.6202 14 17.3477 13.7275 17.3477 13.3913V0.608696C17.3477 0.272522 17.6202 0 17.9564 0H30.739C31.0751 0 31.3477 0.272523 31.3477 0.608696V2.73913C31.3477 3.0753 31.0751 3.34783 30.739 3.34783H24.9564C24.6202 3.34783 24.3477 3.62035 24.3477 3.95652C24.3477 4.2927 24.6202 4.56522 24.9564 4.56522H30.739C31.0751 4.56522 31.3477 4.83774 31.3477 5.17391V7.6087C31.3477 7.94487 31.0751 8.21739 30.739 8.21739H24.652C24.3158 8.21739 24.0433 8.48991 24.0433 8.82609V13.3913C24.0433 13.7275 23.7708 14 23.4346 14Z" fill="#F8651B" />
      <use href="#logo-stroke0" fill="#F8651B" />
      <mask id="logo-stroke1" maskUnits="userSpaceOnUse" x="-0.364484" y="-0.781188" width="8.01526" height="8.01526" fill="black">
        <rect fill="white" x="-0.364484" y="-0.781188" width="8.01526" height="8.01526" />
        <use href="#logo-stroke0" />
      </mask>
      <path d="M2.71484 0.554688L2.59019 1.11595C2.46035 1.70059 2.58825 2.31285 2.94128 2.79663L2.81259 3.06235C2.21414 3.08534 1.65449 3.36462 1.2763 3.829L0.913246 4.27481L5.66702 4.28069L2.71484 0.554688Z" strokeWidth="1.0312" strokeLinecap="round" strokeLinejoin="round" stroke="#F8651B" mask="url(#logo-stroke1)" />
      <use href="#logo-stroke2" fill="#F8651B" />
      <mask id="logo-stroke3" maskUnits="userSpaceOnUse" x="23.7474" y="6.76601" width="8.01458" height="8.01458" fill="black">
        <rect fill="white" x="23.7474" y="6.76601" width="8.01458" height="8.01458" />
        <use href="#logo-stroke2" />
      </mask>
      <path d="M28.6836 13.4448L28.8081 12.8835C28.9378 12.2989 28.8098 11.6866 28.4566 11.2029L28.5852 10.9372C29.1837 10.9141 29.7433 10.6346 30.1213 10.1702L30.4843 9.72427L25.7305 9.71954L28.6836 13.4448Z" strokeWidth="1.0312" strokeLinecap="round" strokeLinejoin="round" stroke="#F8651B" mask="url(#logo-stroke3)" />
      <defs>
        <path id="logo-stroke0" d="M2.59019 1.11595L2.71484 0.554688L5.66702 4.28069L0.913246 4.27481L1.2763 3.829C1.65449 3.36462 2.21414 3.08534 2.81259 3.06235L2.94128 2.79663C2.58825 2.31285 2.46035 1.70059 2.59019 1.11595Z" />
        <path id="logo-stroke2" d="M28.8081 12.8835L28.6836 13.4448L25.7305 9.71954L30.4843 9.72427L30.1213 10.1702C29.7433 10.6346 29.1837 10.9141 28.5852 10.9372L28.4566 11.2029C28.8098 11.6866 28.9378 12.2989 28.8081 12.8835Z" />
      </defs>
    </svg>
  );
}
