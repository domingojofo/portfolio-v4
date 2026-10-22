"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/content/projects";
import { setModalOrigin } from "@/lib/modalOrigin";
import { Cover } from "./Cover";

import { pixelCard } from "@/lib/pixelCard";
import { makeBend, setWarp, WARP_HINGE, WARP_PERSPECTIVE } from "@/lib/warp";

// Project cards (after the Melius "use cases" section): a stack of project cards after the hero.
// The front card shows a project preview; the other two wait behind it, evenly spaced, each a
// little smaller and peeking out above — all three are always shown. Scrolling doesn't flip
// through them — clicking does (a tab, or a card peeking out behind): it comes to the front, and
// the cards that were in front of it slide straight down off the screen with an ease-out (under the
// project tabs), then pixelate back in at the back (a little blurred, sharpening) in the order they left.
// So the stack rotates: from Cash → Trusted Destinations, Cash goes to the back.
// The cards show just the project's cover. On wide screens the section is three columns (1inch-
// style): the project on the left (the company, then what I did and the impact), the stack in the
// middle, and on the right the counter (01 02 03 04), which switches projects, and "View project",
// which opens the one in front. Each column keeps to its own width. Narrower than COLS_MIN, the
// project and the controls stack under the cards instead (the iPad / phone layout). The active number counts down while the deck is pinned, then the next project comes
// up. The section holds still for a stretch of scrolling (--pause) so it reads as a pause.
// The top of the stack peeks 10vh into the hero, packed tight so all three cards show; scrolling down spreads them out to their full spacing.
//
// Order: the front card first. A card's depth is its place in it.
// The floating thumbnails come in one at a time as the deck scrolls in, SAT_STEP apart.
//
// Warp: until the deck fills the screen, the page curls toward you below mid-hero
// (src/lib/warp.ts). The deck drives that from the scroll position — 1 at the top of the page,
// 0 once the deck reaches the top — and rides its cards on the same surface as the dots.

const STEP_Y = 40;       // px each card behind sits higher (at a 982px-wide card) — even steps, deep
                         // enough past the card's padding to show a band of its image…
const STEP_TIGHT = 22;   // …and how tight they start, in the hero (the spacing opens up with the scroll)
const STEP_S = 0.06;     // scale lost per step behind — even steps
const SHOWN = projects.length - 1;   // cards visible behind the front one: all of them
const GROUP = 0.95;      // the stack + front card + tabs take up this much of the space between the top bar and the floating nav
const RATIO = 1.12;      // the cover's width to its height (stacked layout)…
const RATIO_COLS = 1.08; // …and in three columns, where the height is set by the company line
const BAR_GAP = 20;      // px between the front card and the bar under it (stacked layout)
const COLS_MIN = 1200;   // px wide from which the section is three columns (matches globals.css)
const COLS_BOTTOM = 24;  // px from the screen's bottom edge to the project and counter (the nav is hidden here)
const HOLD = 8000;       // ms each project stays in front before the counter moves on…
const HOLD_FOR: Record<string, number> = { elevenlabs: 12500 };   // …long enough for its cover's loop
const OUT_MS = 620, IN_MS = 520, IN_GAP = 150;   // slide down and away (ease-in) → pixelate back in
const SAT_STEP = 0.06;   // viewport heights of scrolling between one thumbnail appearing and the next
const LEAN = 0.45;       // share of the curl's slope the cards lean by — the full slope is too steep for a card
const MAX_LEAN = 32 * Math.PI / 180;

export function ProjectCards() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [satsIn, setSatsIn] = useState(0);   // how many floating thumbnails have appeared
  const [satFor, setSatFor] = useState<number | null>(0);   // whose thumbnails are showing (null mid-switch)
  const satTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(satTimer.current), []);
  // A small random nudge per thumbnail, re-rolled whenever a project comes to the front (rolled on
  // the client only, after mount, so server and client HTML match)
  const [jitter, setJitter] = useState<{ x: number; y: number }[]>([]);
  const rollJitter = () => {
    const r = (n: number) => Math.round((Math.random() * 2 - 1) * n);
    setJitter(Array.from({ length: 4 }, () => ({ x: r(28), y: r(22) })));
  };
  useEffect(() => {
    const raf = requestAnimationFrame(rollJitter);
    return () => cancelAnimationFrame(raf);
  }, []);
  const orderRef = useRef(projects.map((_, i) => i));
  const switchRef = useRef<(leaving: number[]) => void>(() => {});
  const busy = useRef(false);
  const [pinned, setPinned] = useState(false);   // the deck fills the screen (the counter runs)
  const home = usePathname() === "/";            // a project open over the page pauses it

  useEffect(() => {
    const section = sectionRef.current!;
    const stage = section.querySelector<HTMLElement>(".deck-stage")!;
    const deck = section.querySelector<HTMLElement>(".deck-cards")!;
    const cards = [...section.querySelectorAll<HTMLElement>(".deck-card")];
    const bar = section.querySelector<HTMLElement>(".deck-bar")!;
    const controls = bar.querySelector<HTMLElement>(".deck-controls")!;
    const ticker = section.querySelector<HTMLElement>(".marquee");   // the highlights ticker (hidden for now)
    const tickH = () => (ticker ? ticker.offsetHeight / 2 : 0);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, k = 1, pinAt = 1, step = STEP_Y, colsTop = 0;
    const leaving = new Set<number>();   // cards mid slide-out: place() leaves them alone
    const at = (d: number, slide = 0) => `translate3d(-50%, ${-step * d * k + slide}px, 0) scale(${1 - STEP_S * d})`;

    // Stack spacing for a warp amount: tight at the top of the page, full once the deck fills the screen.
    // The front card sits two steps below the stack's top edge, so that edge (the peek) stays put.
    const spacing = (w: number) => {
      step = STEP_Y - (STEP_Y - STEP_TIGHT) * w;
      section.style.setProperty("--stack-y", `${step * SHOWN * k}px`);
    };

    // Ride the cards on the curled surface. CSS can't bend an element, so the stack lies on the
    // surface's tangent at its top edge — how deep and how steep the curve is there change as you
    // scroll. The stage is the 3D viewer (origins in stage px).
    const warp = (top: number) => {
      const w = reduce ? 0 : Math.min(1, Math.max(0, top / pinAt));
      setWarp(w);
      spacing(w);
      const H = innerHeight, bend = makeBend(w, H);
      if (!bend) {
        stage.style.perspective = deck.style.transform = "";
        return;
      }
      const hinge = H * WARP_HINGE;
      const stageTop = stage.getBoundingClientRect().top;   // the stage reaches above the section (--lift)
      // Anchor: the top edge of the stack (the furthest card shown), in stage px — the edge that peeks
      const anchor = cards[0].offsetTop - step * SHOWN * k;
      const u = stageTop + anchor - hinge;                  // …how far below the hinge it sits
      if (u <= 0) {
        stage.style.perspective = deck.style.transform = "";
        return;
      }
      const p = bend(u);
      stage.style.perspective = `${H * WARP_PERSPECTIVE}px`;
      stage.style.perspectiveOrigin = `50% ${hinge - stageTop}px`;
      deck.style.transformOrigin = `50% ${anchor}px`;
      // Bring the stack forward to the surface's depth there and lean it with the curl (its bottom
      // comes toward you), stretched sideways with the bottom's flare (desktop). Its top edge is
      // kept where it peeks on the flat page — the depth would otherwise shift it along the line
      // to the vanishing point.
      const scale = (H * WARP_PERSPECTIVE) / (H * WARP_PERSPECTIVE + p.depth);
      const lean = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, p.angle * LEAN));
      deck.style.transform = `translate3d(0, ${u / scale - u}px, ${-p.depth}px) rotateX(${-lean}rad) scaleX(${p.widen})`;
    };

    const place = () => {
      const order = orderRef.current;
      cards.forEach((card, i) => {
        if (leaving.has(i)) return;
        const d = order.indexOf(i);
        card.style.transform = at(d);
        card.style.zIndex = String(cards.length - d);
        card.inert = false;   // the front card opens its project; the peeking ones come to the front
      });
    };

    // Swap: the picked card and the ones behind it move up (CSS transition); the ones that were in
    // front slide down and pixelate out, then reappear at the back and pixelate in, in project order
    let switchTimer: ReturnType<typeof setTimeout>;
    switchRef.current = (out) => {
      deck.classList.add("is-switching");
      clearTimeout(switchTimer);
      switchTimer = setTimeout(() => deck.classList.remove("is-switching"), OUT_MS + IN_MS + IN_GAP * out.length + 200);
      if (reduce) { place(); busy.current = false; return; }
      busy.current = true;
      const was = out.map((_, n) => n);   // they were the front cards, in this order
      out.forEach((i, n) => {
        leaving.add(i);
        const card = cards[i];
        card.inert = true;
        card.style.zIndex = String(cards.length + 1);
        // Straight down and off the bottom of the screen with an ease-in (starts gently, then
        // speeds away) — no fade, no pixels
        card.style.transition = `transform ${OUT_MS}ms cubic-bezier(.55, 0, .75, .3)`;
        card.style.transform = at(was[n], innerHeight);
      });
      place();
      const back = out;   // they return in the order they left
      setTimeout(() => {
        back.forEach((i, n) => {
          const card = cards[i];
          card.style.transition = "none";                    // jump to the back unseen
          card.style.visibility = "hidden";
          void card.offsetHeight;
          leaving.delete(i);
          place();
          void card.offsetHeight;
          card.style.transition = "";
          setTimeout(() => {
            // Pixelate in: the canvas draws its first (coarse, sparse) frame straight away, so the card
            // can turn visible underneath it in the same frame
            card.style.transition = "none";
            const done = pixelCard(card, "in", { duration: IN_MS, blur: 3 });
            card.style.visibility = "";
            void card.offsetHeight;
            card.style.transition = "";
            done.then(() => {
              if (n === back.length - 1) busy.current = false;
            });
          }, n * IN_GAP);
        });
      }, OUT_MS);
    };

    const tick = () => {
      raf = 0;
      const top = section.getBoundingClientRect().top;
      warp(top);
      // Just under the front card; in three columns, beside it, level with its bottom edge
      const cardBottom = cards[0].offsetTop + cards[0].offsetHeight;
      // (three columns: at the bottom of the screen, the project text ending level with the counter's row)
      bar.style.top = `${innerWidth >= COLS_MIN ? stage.offsetHeight - tickH() - COLS_BOTTOM - bar.offsetHeight : cardBottom + BAR_GAP}px`;
      bar.dataset.placed = "";
      // The counter runs while the deck fills the screen (through the pause), not from the hero
      const bottom = section.getBoundingClientRect().bottom;
      setPinned(top <= 1 && bottom > innerHeight * 0.6);
      // While the deck fills the screen, the bottom nav and LinkedIn/CV step away (globals.css)
      document.documentElement.classList.toggle("deck-focus", top <= innerHeight * 0.15 && bottom > innerHeight * 0.55);
      document.documentElement.classList.toggle("deck-reached", top <= innerHeight * 0.15);   // the ticker shows from here on
      // Thumbnails appear one at a time once the deck is a little way in
      const scrolled = (pinAt - top) / innerHeight;
      setSatsIn(Math.max(0, Math.min(4, Math.floor(scrolled / SAT_STEP) - 1)));
      place();
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    // Size the group — the cards stacked behind, the front card and the bar under it — to 95% of
    // the free space between the top bar and the floating nav, centred in it, on every screen. The card keeps its 5:4 image where the width allows (desktop);
    // where it's capped by the screen width (phones), the image gets taller instead.
    const size = () => {
      const card = cards[0], img = card.querySelector<HTMLElement>(".deck-img")!;
      const W = innerWidth, { top, bottom } = freeSpace(), H = bottom - top;
      const rest = card.offsetHeight - img.offsetHeight;     // the card's padding
      const pad = (card.offsetWidth - img.offsetWidth) / 2;
      const cols = W >= COLS_MIN;
      const below = cols ? controls.offsetHeight : BAR_GAP + bar.offsetHeight;
      const ratio = cols ? RATIO_COLS : RATIO;
      const maxW = W < 1024 ? W - 32 : cols ? Math.min(W * 0.42, 720) : Math.min(W * 0.6, 680);
      let w = card.offsetWidth, imgH = 0;
      for (let n = 0; n < 4; n++) {                          // stack depth grows with the width: settle it
        imgH = GROUP * H - STEP_Y * SHOWN * (w / 982) - rest - below;
        w = Math.min(maxW, imgH * ratio + pad * 2);
        imgH = Math.min(imgH, (w - pad * 2) / ratio);   // capped by the width: keep the shape (shorter, not taller)
      }
      if (cols) {
        // Three columns: the stack starts just under the top bar and the front card runs down to
        // the bottom of the company line (logo + name) in the left column
        const co = bar.querySelector<HTMLElement>(".deck-co");
        const barTop = stage.offsetHeight - tickH() - COLS_BOTTOM - bar.offsetHeight;
        const coBottom = barTop + (co ? co.offsetTop + co.offsetHeight : 0) - (stage.offsetHeight - viewH());   // on screen
        colsTop = top + 6;
        for (let n = 0; n < 4; n++) {
          imgH = coBottom - (colsTop + STEP_Y * SHOWN * (w / 982));
          w = Math.min(maxW, imgH * ratio);
        }
      }
      section.style.setProperty("--card-w", `${Math.round(w)}px`);
      section.style.setProperty("--img-h", `${Math.max(120, Math.round(imgH))}px`);
      section.dataset.sized = "";
    };

    // The screen height the deck is pinned to: 100svh, the height with the browser's toolbars
    // showing (the stage's CSS). innerHeight grows when iOS Safari's toolbar collapses on scroll,
    // which would put the bar below the pinned stage, cut off.
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;left:0;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
    document.body.append(probe);
    const viewH = () => Math.min(innerHeight, probe.offsetHeight || innerHeight);

    // The free space: below the top bar's content, above the highlights ticker (the bottom nav and
    // LinkedIn/CV are hidden while the deck fills the screen)
    const freeSpace = () => {
      const bar = document.querySelector(".nav-inner")?.getBoundingClientRect();
      return { top: bar ? bar.bottom : 0, bottom: viewH() - tickH() - 8 };
    };

    const measure = () => {
      size();
      k = cards[0].offsetWidth / 982;
      // The group sits centred in the free space. The hero peek follows from this too.
      const { top, bottom } = freeSpace();
      const group = STEP_Y * SHOWN * k + cards[0].offsetHeight + BAR_GAP + bar.offsetHeight;
      const stackTop = innerWidth >= COLS_MIN ? colsTop : Math.max(8, top + (bottom - top - group) / 2);
      section.style.setProperty("--stack-top", `${stackTop}px`);
      pinAt = Math.max(1, section.getBoundingClientRect().top + scrollY);   // scroll position where the deck fills the screen
      warp(section.getBoundingClientRect().top);   // sets the spacing too
      place();
      kick();
    };

    // The cards lean toward the cursor (desktop): the side nearest it tips up toward you
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    let tiltRaf = 0;
    const tiltStep = () => {
      tilt.x += (tilt.tx - tilt.x) * 0.12;
      tilt.y += (tilt.ty - tilt.y) * 0.12;
      section.style.setProperty("--tilt-x", tilt.x.toFixed(3));
      section.style.setProperty("--tilt-y", tilt.y.toFixed(3));
      tiltRaf = Math.abs(tilt.tx - tilt.x) + Math.abs(tilt.ty - tilt.y) > 0.002 ? requestAnimationFrame(tiltStep) : 0;
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduce) return;
      const r = cards[orderRef.current[0]].getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      tilt.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
      tilt.ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)));
      if (!tiltRaf) tiltRaf = requestAnimationFrame(tiltStep);
    };
    const onLeave = () => { tilt.tx = 0; tilt.ty = 0; if (!tiltRaf) tiltRaf = requestAnimationFrame(tiltStep); };
    addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    measure();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);   // the front card grows once its fonts and image load
    ro.observe(cards[0]);
    ro.observe(bar);   // the summary can wrap differently per project
    return () => {
      probe.remove();
      ro.disconnect();
      clearTimeout(switchTimer);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(tiltRaf);
      removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      removeEventListener("scroll", kick);
      removeEventListener("resize", measure);
      setWarp(0);   // other pages are flat
      document.documentElement.classList.remove("deck-focus", "deck-reached");
    };
  }, []);

  // Bring a card to the front. From the hero (deck not fully in view), scroll down to the deck too.
  const select = (i: number, follow = true) => {
    const order = orderRef.current;
    if (order[0] === i || busy.current) return;
    const out = order.slice(0, order.indexOf(i));          // the cards in front of it
    orderRef.current = [...order.slice(out.length), ...out];   // rotate: the ones in front go to the back
    setActive(i);
    // The new project's thumbnails wait until the outgoing card has fully left; the old ones go now
    setSatFor(null);
    clearTimeout(satTimer.current);
    const instant = matchMedia("(prefers-reduced-motion: reduce)").matches || out.length === 0;
    satTimer.current = setTimeout(() => { rollJitter(); setSatFor(i); }, instant ? 0 : OUT_MS);
    switchRef.current(out);
    const section = sectionRef.current!;
    if (follow && section.getBoundingClientRect().top > 1) {
      scrollTo({ top: section.getBoundingClientRect().top + scrollY, behavior: "smooth" });
    }
  };

  // The countdown: the active number's line fills over its hold, then the next project comes up.
  // It's a CSS animation, so pausing it (offscreen, a project open, the tab hidden) keeps its place.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  const running = pinned && home && !hidden;
  const next = () => {
    if (busy.current) { setTimeout(next, 300); return; }   // a switch is still landing
    select((active + 1) % projects.length, false);
  };
  const p = projects[active];

  const gallery = satFor === null ? [] : projects[satFor].gallery ?? [];

  return (
    <section className="deck" ref={sectionRef} aria-label="Projects">
      <div className="deck-stage">
        <div className="deck-sats" aria-hidden="true">
          {gallery.map((g, i) => (
            <figure
              className={`deck-sat deck-sat-${i + 1}${i < satsIn ? " is-in" : ""}`}
              key={`${projects[satFor ?? active].slug}-${i}`}
              style={jitter[i] ? ({ "--jx": `${jitter[i].x}px`, "--jy": `${jitter[i].y}px` } as React.CSSProperties) : undefined}
            >
              <Image src={g.src} width={g.width} height={g.height} alt={g.alt} sizes="200px" unoptimized={g.src.endsWith(".svg")} />
              <figcaption>{g.label}</figcaption>
            </figure>
          ))}
        </div>

        <ul className="deck-cards">
          {projects.map((q, i) => (
            <li key={q.slug} className="deck-card">
              {/* Just the cover. The front one opens the project (scroll={false}: the modal shouldn't
                  move the page underneath); a card peeking out behind comes to the front instead */}
              <Link
                href={`/design/${q.slug}`}
                scroll={false}
                className="deck-link"
                aria-label={i === active ? `Open ${q.title}` : `Show ${q.title}`}
                onClick={(e) => {
                  if (i === active) { setModalOrigin(e.currentTarget.querySelector(".deck-img")); return; }   // the modal grows out of this card
                  e.preventDefault();
                  select(i);
                }}
              >
                <span className="deck-img">
                  <Cover cover={q.cover} sizes="(max-width: 1023px) calc(100vw - 32px), 982px" eager={i < 3} live={home && i === active} deck />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Under the front card, outside the warped stack so it stays flat: the project on the left;
            the counter and "Open project" on the right */}
        <div className="deck-bar">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={p.slug} className="deck-about"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              <p className="deck-co">
                {p.logo
                  // eslint-disable-next-line @next/next/no-img-element -- static wordmark, in its own colours
                  ? <img className="deck-logo" src={p.logo.src} width={p.logo.width} height={p.logo.height} alt={p.title} />
                  : p.title}
              </p>
              {/* Gelica has no "#": the "(#4)" aside is set in Public Sans ExtraLight, as in the Figma */}
              <p className="deck-story">
                {p.summary.split(/(\(#\d+\))/).map((t, n) => (n % 2 ? <span key={n} className="deck-aside">{t}</span> : t))}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="deck-controls">
            <nav className="deck-count" aria-label="Projects">
              {projects.map((q, i) => (
                <button key={q.slug} type="button" aria-label={q.title} aria-current={i === active || undefined}
                  onClick={() => select(i, false)}>
                  {String(i + 1).padStart(2, "0")}
                  {/* The countdown (1inch-style): the number fills with ink from the top over its hold */}
                  {i === active && (
                    <span className="deck-timer" key={q.slug} data-run={running || undefined} aria-hidden="true"
                      style={{ animationDuration: `${HOLD_FOR[q.slug] ?? HOLD}ms` }} onAnimationEnd={next}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <Link href={`/design/${p.slug}`} scroll={false} className="deck-open"
              onClick={() => setModalOrigin(sectionRef.current?.querySelectorAll(".deck-img")[active] ?? null)}>View project</Link>
          </div>
        </div>

      </div>

      {/* The highlights ticker (Highlights.tsx) is hidden for now; it went here, after the stage */}
    </section>
  );
}
