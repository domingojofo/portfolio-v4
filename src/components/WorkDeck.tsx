"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/content/projects";
import { pixelCard } from "@/lib/pixelCard";
import { makeBend, setWarp, WARP_HINGE, WARP_PERSPECTIVE } from "@/lib/warp";

// Work deck (after the Melius "use cases" section): a stack of project cards after the hero.
// The front card shows a project preview; the other two wait behind it, evenly spaced, each a
// little smaller and peeking out above — all three are always shown. Scrolling doesn't flip
// through them — clicking does (a tab, or a card peeking out behind): it comes to the front, and
// the cards that were in front of it slide down half their height and fade out (under the project
// tabs), then pixelate back in at the back (a little blurred, sharpening) in the order they left.
// So the stack rotates: from Cash → Trusted Destinations, Cash goes to the back.
// Clicking the front card opens the project. The top of the stack peeks 10vh into the hero,
// packed tight so all three cards show; scrolling down spreads them out to their full spacing.
//
// Order: the front card first. A card's depth is its place in it.
// The floating thumbnails come in one at a time as the deck scrolls in, SAT_STEP apart.
//
// Warp: until the deck fills the screen, the page curls toward you below mid-hero
// (src/lib/warp.ts). The deck drives that from the scroll position — 1 at the top of the page,
// 0 once the deck reaches the top — and rides its cards on the same surface as the dots.

const STEP_Y = 60;       // px each card behind sits higher (at a 982px-wide card) — even steps, deep
                         // enough past the card's padding to show a band of its image…
const STEP_TIGHT = 22;   // …and how tight they start, in the hero (the spacing opens up with the scroll)
const STEP_S = 0.06;     // scale lost per step behind — even steps
const SHOWN = 2;         // cards visible behind the front one
const OUT_MS = 600, IN_MS = 520, IN_GAP = 150;   // slide down + fade out → pixelate back in
const SAT_STEP = 0.06;   // viewport heights of scrolling between one thumbnail appearing and the next
const LEAN = 0.45;       // share of the curl's slope the cards lean by — the full slope is too steep for a card
const MAX_LEAN = 32 * Math.PI / 180;

export function WorkDeck() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [satsIn, setSatsIn] = useState(0);   // how many floating thumbnails have appeared
  const orderRef = useRef(projects.map((_, i) => i));
  const switchRef = useRef<(leaving: number[]) => void>(() => {});
  const busy = useRef(false);

  useEffect(() => {
    const section = sectionRef.current!;
    const stage = section.querySelector<HTMLElement>(".deck-stage")!;
    const deck = section.querySelector<HTMLElement>(".deck-cards")!;
    const cards = [...section.querySelectorAll<HTMLElement>(".deck-card")];
    const tabs = section.querySelector<HTMLElement>(".deck-tabs")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, k = 1, pinAt = 1, step = STEP_Y;
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
        card.style.transform = at(was[n], card.offsetHeight / 2);   // down half its height…
        card.style.opacity = "0";                                    // …fading out (no pixels on the way out)
      });
      place();
      const back = out;   // they return in the order they left
      setTimeout(() => {
        back.forEach((i, n) => {
          const card = cards[i];
          card.style.transition = "none";                    // jump to the back unseen (still faded out)
          leaving.delete(i);
          place();
          void card.offsetHeight;
          card.style.transition = "";
          setTimeout(() => {
            // Pixelate in: the canvas draws its first (coarse, sparse) frame straight away, so the card
            // can turn visible underneath it in the same frame
            card.style.transition = "none";
            const done = pixelCard(card, "in", { duration: IN_MS, blur: 3 });
            card.style.opacity = "";
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
      tabs.style.top = `${cards[0].offsetTop + cards[0].offsetHeight + 20}px`;   // 20px under the front card
      // Thumbnails appear one at a time once the deck is a little way in
      const scrolled = (pinAt - top) / innerHeight;
      setSatsIn(Math.max(0, Math.min(4, Math.floor(scrolled / SAT_STEP) - 1)));
      place();
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const measure = () => {
      pinAt = Math.max(1, section.getBoundingClientRect().top + scrollY);   // scroll position where the deck fills the screen
      k = cards[0].offsetWidth / 982;
      warp(section.getBoundingClientRect().top);   // sets the spacing too
      place();
      kick();
    };

    measure();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);   // the front card grows once its fonts and image load
    ro.observe(cards[0]);
    return () => {
      ro.disconnect();
      clearTimeout(switchTimer);
      cancelAnimationFrame(raf);
      removeEventListener("scroll", kick);
      removeEventListener("resize", measure);
      setWarp(0);   // other pages are flat
    };
  }, []);

  // Bring a card to the front. From the hero (deck not fully in view), scroll down to the deck too.
  const select = (i: number) => {
    const order = orderRef.current;
    if (order[0] === i || busy.current) return;
    const out = order.slice(0, order.indexOf(i));          // the cards in front of it
    orderRef.current = [...order.slice(out.length), ...out];   // rotate: the ones in front go to the back
    setActive(i);
    switchRef.current(out);
    const section = sectionRef.current!;
    if (section.getBoundingClientRect().top > 1) {
      scrollTo({ top: section.getBoundingClientRect().top + scrollY, behavior: "smooth" });
    }
  };

  const gallery = projects[active].gallery ?? [];

  return (
    <section className="deck" ref={sectionRef} aria-label="Selected work">
      <div className="deck-stage">
        <div className="deck-sats" aria-hidden="true">
          {gallery.map((g, i) => (
            <figure className={`deck-sat deck-sat-${i + 1}${i < satsIn ? " is-in" : ""}`} key={`${projects[active].slug}-${i}`}>
              <Image src={g.src} width={g.width} height={g.height} alt={g.alt} sizes="200px" />
              <figcaption>{g.label}</figcaption>
            </figure>
          ))}
        </div>

        <ul className="deck-cards">
          {projects.map((p, i) => (
            <li key={p.slug} className="deck-card">
              {/* The front card opens the project (scroll={false}: the modal shouldn't move the page
                  underneath); a card peeking out behind comes to the front instead */}
              <Link
                href={`/design/${p.slug}`}
                scroll={false}
                className="deck-link"
                aria-label={i === active ? undefined : `Show ${p.title}`}
                onClick={(e) => {
                  if (i === active) return;
                  e.preventDefault();
                  select(i);
                }}
              >
                <span className="deck-img">
                  <Image src={p.cover.src} width={p.cover.width} height={p.cover.height} alt={p.cover.alt}
                    sizes="(max-width: 1023px) calc(100vw - 32px), 982px" loading={i < 3 ? "eager" : "lazy"} />
                </span>
                <span className="deck-text">
                  <span className="deck-title">{p.title}</span>
                  <span className="deck-summary">{p.summary}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Under the front card, outside the warped stack so it stays flat */}
        <nav className="deck-tabs" aria-label="Projects">
          {projects.map((p, i) => (
            <button key={p.slug} type="button" aria-current={i === active || undefined} onClick={() => select(i)}>
              {p.short}
            </button>
          ))}
        </nav>
      </div>

    </section>
  );
}
