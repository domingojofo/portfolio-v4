"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { INTRO_KEY } from "@/lib/intro";
import { reveal } from "@/lib/reveal";
import { RevealWords, type RevealLine } from "./RevealWords";

const easeOutExpo = "cubic-bezier(.22,1,.36,1)";

// Parallax (all screen sizes): as you scroll, the intro copy drifts down the screen while the project cards'
// cards rise over it. 0.3 = it moves down 0.3px for every 1px scrolled.
const BIO_DRIFT = 0.3;

// Public Sans, with the two italic words in Gelica (Light, then ExtraLight)
const HEADLINE: RevealLine[] = [
  "Shipping Outcomes",
  ["from ", { text: "Thoughtfully", className: "gelica-light" }, " ", { text: "Crafted", className: "gelica-xlight" }],
  "Products and Systems",
];

/** Whether the intro should play on this visit: on "/", once per browser session, motion allowed. */
export function shouldPlayIntro() {
  try {
    return (
      location.pathname === "/" &&
      !sessionStorage.getItem(INTRO_KEY) &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  } catch {
    return false;
  }
}

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  // Layout effect so the intro's starting state is in place before the first client paint
  useLayoutEffect(() => {
    const hero = heroRef.current!;
    const html = document.documentElement;
    if (html.dataset.intro !== "playing") {
      if (!shouldPlayIntro()) return;
      html.dataset.intro = "playing"; // client-side navigation to "/" (hard loads set this inline)
    }

    const title = hero.querySelector<HTMLElement>(".hero-title")!;
    const bio = hero.querySelector<HTMLElement>(".bio")!;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let cancelled = false;
    let words: ReturnType<typeof reveal> | null = null;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(() => { timers.delete(t); if (!cancelled) resolve(); }, ms);
        timers.add(t);
      });

    window.scrollTo({ top: 0, behavior: "instant" });

    const play = async () => {
      // Test preloader (?loader): start once it has finished and begins to dissolve
      if (html.dataset.loader === "on") await new Promise<void>((r) => addEventListener("loader:done", () => r(), { once: true }));
      if (cancelled) return;
      // Wait for the web fonts (display: block), or the words would animate in invisible
      await Promise.race([document.fonts.ready, wait(3000)]);
      if (cancelled) return;
      await wait(300);

      // 1. The headline words drop in small and scrambling; each line's first word tucks under the
      //    line above and gets shoved down when that word jumps (the "Relentlessly Collaborative" reveal)
      words = reveal(title, { each: 0.1, creep: 0.8, hold: 0.3, snap: 0.18, stack: true });
      hero.classList.add("is-running");   // the reveal now holds each word's transform (see globals.css)
      await words.finished;
      if (cancelled) return;

      // 2. The intro copy fades up, then the nav, edge blurs and bottom bar come in
      bio.animate(
        [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }],
        { duration: 600, easing: easeOutExpo, fill: "forwards" }
      );
      await wait(250);
      delete html.dataset.intro;
      try { sessionStorage.setItem(INTRO_KEY, "1"); } catch {}
    };
    play();

    return () => {
      // Navigated away mid-intro: stop and drop the intro state so other pages render normally
      cancelled = true;
      timers.forEach(clearTimeout);
      words?.cancel();
      hero.classList.remove("is-running");
      delete html.dataset.intro;
    };
  }, []);

  // Parallax: move the copy's layer down by the scroll (so it stays put) plus the drift
  useEffect(() => {
    const layer = heroRef.current!.querySelector<HTMLElement>(".bio-drift")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    const apply = () => {
      raf = 0;
      const on = !reduce.matches;
      const y = Math.min(scrollY, innerHeight);
      layer.style.transform = on && y > 0 ? `translate3d(0, ${y * (1 + BIO_DRIFT)}px, 0)` : "";
      // Fade it out as the project cards rise to it, so it never sits on top of them; hidden once
      // the deck fills the screen, so it doesn't drift on into the closing section
      const fade = Math.min(1, Math.max(0, (scrollY - innerHeight * 0.15) / (innerHeight * 0.3)));
      layer.style.opacity = on ? String(1 - fade) : "";
      layer.style.visibility = on && fade >= 1 ? "hidden" : "";
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(apply); };
    apply();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", kick);
      removeEventListener("resize", kick);
    };
  }, []);

  return (
    // Figma "Hero — Final frame (1440)": headline at the top, intro copy above the project cards,
    // whose cards peek up from the bottom (ProjectCards, rendered after the hero)
    <section className="hero" id="hey" ref={heroRef}>
      <h1 className="hero-title" aria-label="Shipping Outcomes from Thoughtfully Crafted Products and Systems">
        <RevealWords lines={HEADLINE} />
      </h1>

      <div className="bio-drift">
        <p className="bio">
          Hey! Kamusta? I’m Jofo Domingo. I collaborate, craft, and ship. A hands-on product design
          leader, specializing in FinTech and AI-driven interfaces.
        </p>
      </div>
    </section>
  );
}
