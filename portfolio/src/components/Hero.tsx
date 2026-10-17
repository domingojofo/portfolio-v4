"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { INTRO_KEY } from "@/lib/intro";

// ---------- Timing (ms, from when typing starts) ----------
const TYPE_END = 1500;      // both words finish typing — and both highlights land — here
const W2_START = 500;       // "Collaborative" starts typing (overlaps "Relentlessly")
const HL1_START = 250;      // highlight sweeps trail their word slightly
const HL2_START = 650;
const IMAGE_STAGGER = 180;
const IMAGE_DURATION = 550;

const ease = "cubic-bezier(.65,0,.35,1)";
const easeOutQuad = "cubic-bezier(.5,1,.89,1)"; // matches the typing curve
const easeOutExpo = "cubic-bezier(.22,1,.36,1)";

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

// Scroll parallax while the Design section rises over the pinned hero:
// the intro copy drifts up (in px per px scrolled). Desktop only — on mobile it stays put
// under its grid rule.
const BIO_DRIFT = -0.35;

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return desktop;
}

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const isDesktop = useIsDesktop();
  const { scrollY } = useScroll();
  // Clamp to the first screen — after that the hero is fully covered
  const covered = (y: number) => Math.min(y, typeof window === "undefined" ? 0 : innerHeight);
  const bioY = useTransform(scrollY, (y) => (reduceMotion || !isDesktop ? 0 : covered(y) * BIO_DRIFT));

  // Layout effect so the intro's starting state is in place before the first client paint
  useLayoutEffect(() => {
    const hero = heroRef.current!;
    const html = document.documentElement;
    if (html.dataset.intro !== "playing") {
      if (!shouldPlayIntro()) return;
      html.dataset.intro = "playing"; // client-side navigation to "/" (hard loads set this inline)
    }

    const timers = new Set<ReturnType<typeof setTimeout>>();
    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(() => { timers.delete(t); if (!cancelled) resolve(); }, ms);
        timers.add(t);
      });

    const stage = hero.querySelector<HTMLElement>(".stage")!;
    const lines = [...hero.querySelectorAll<HTMLElement>(".ln")];
    const cells = [...hero.querySelectorAll<HTMLElement>(".cell")];
    const bio = hero.querySelector<HTMLElement>(".bio")!;
    const w1 = hero.querySelector<HTMLElement>(".w-1")!;
    const w2 = hero.querySelector<HTMLElement>(".w-2")!;
    const c1 = hero.querySelector<HTMLElement>(".c-1")!;
    const c2 = hero.querySelector<HTMLElement>(".c-2")!;
    const txt = (w: HTMLElement) => w.querySelector<HTMLElement>(".txt")!;
    const fullText = new Map([[w1, txt(w1).textContent ?? ""], [w2, txt(w2).textContent ?? ""]]);

    // Each word has its own caret, sitting at the right edge of its text, centred on its row
    const moveCaret = (word: HTMLElement, caret: HTMLElement) => {
      const t = txt(word);
      const typed = t.parentElement!;
      const x = word.offsetLeft + typed.offsetLeft + t.offsetLeft + t.offsetWidth;
      const y = word.offsetTop + word.offsetHeight / 2 - caret.offsetHeight / 2;
      caret.style.transform = `translate(${x}px, ${y}px)`;
    };
    const hideCaret = (caret: HTMLElement) => {
      caret.classList.remove("blink");
      caret.style.opacity = "0";
    };

    // Types a word over `duration` ms with an ease-out: quick at first, settling into the last letters.
    // Letter i lands where an easeOutQuad curve reaches i/n, so the final letter lands exactly at `duration`.
    const type = (word: HTMLElement, caret: HTMLElement, duration: number) => {
      const full = fullText.get(word)!, n = full.length;
      caret.style.opacity = "1";
      caret.classList.remove("blink");
      return Promise.all(
        Array.from({ length: n }, (_, k) =>
          wait(duration * (1 - Math.sqrt(1 - (k + 1) / n))).then(() => {
            txt(word).textContent = full.slice(0, k + 1);
            moveCaret(word, caret);
          })
        )
      );
    };

    // Highlights stretch across the word box, which only grows as letters are typed,
    // so a sweep can trail the caret but never overtake it.
    const sweep = (word: HTMLElement, delay: number, endAt: number) =>
      word.querySelector<HTMLElement>(".bg")!.animate(
        [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
        { delay, duration: endAt - delay, easing: easeOutQuad, fill: "forwards" }
      );

    // Starting state: empty words, caret blinking where "Relentlessly" begins
    window.scrollTo({ top: 0, behavior: "instant" });
    txt(w1).textContent = "";
    txt(w2).textContent = "";
    moveCaret(w1, c1);
    moveCaret(w2, c2);
    hideCaret(c2);
    c1.style.opacity = "1";
    c1.classList.add("blink");
    hero.classList.add("is-running");

    const play = async () => {
      // Test preloader (?loader): start once it has finished and begins to dissolve
      if (html.dataset.loader === "on") await new Promise<void>((r) => addEventListener("loader:done", () => r(), { once: true }));
      if (cancelled) return;
      await wait(500);

      // 1. Zoom out from the caret while typing begins
      stage.animate([{ transform: "scale(3.4)" }, { transform: "scale(1)" }], { duration: 1100, easing: ease, fill: "forwards" });

      // 2. Grid lines draw in, staggered
      lines.forEach((ln, i) => {
        const axis = ln.classList.contains("h") ? "X" : "Y";
        ln.animate(
          [{ transform: `scale${axis}(0)` }, { transform: `scale${axis}(1)` }],
          { duration: 1100, delay: 350 + i * 70, easing: ease, fill: "forwards" }
        );
      });

      // 3. Both words type with an ease-out and finish together; highlights trail and land at the same moment
      const typing1 = type(w1, c1, TYPE_END).then(() => hideCaret(c1));
      const typing2 = wait(W2_START).then(() => type(w2, c2, TYPE_END - W2_START));
      sweep(w1, HL1_START, TYPE_END);
      sweep(w2, HL2_START, TYPE_END);
      await Promise.all([typing1, typing2]);
      c2.classList.add("blink");

      // 4. Images wipe in one after another, then the intro copy fades up
      await wait(150);
      hideCaret(c2);
      cells.forEach((el, i) => {
        el.animate(
          [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }],
          { duration: IMAGE_DURATION, delay: i * IMAGE_STAGGER, easing: ease, fill: "forwards" }
        );
      });
      bio.animate(
        [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }],
        { duration: 600, delay: IMAGE_STAGGER * 2, easing: easeOutExpo, fill: "forwards" }
      );

      // 5. Just after the last image lands, the nav (top strip), bottom blur and ticker come in
      await wait(IMAGE_STAGGER * (cells.length - 1) + IMAGE_DURATION - 50);
      delete html.dataset.intro;
      try { sessionStorage.setItem(INTRO_KEY, "1"); } catch {}
    };
    play();

    return () => {
      // Navigated away mid-intro: stop timers and drop the intro state so other pages render normally
      cancelled = true;
      timers.forEach(clearTimeout);
      delete html.dataset.intro;
      hero.classList.remove("is-running");
      txt(w1).textContent = fullText.get(w1)!;
      txt(w2).textContent = fullText.get(w2)!;
    };
  }, []);

  return (
    <section className="hero" id="hey" aria-label="Relentlessly Collaborative" ref={heroRef}>
      <div className="stage">
        <div className="ln h from-start y0" />
        <div className="ln h from-end y1" />
        <div className="ln h from-start y2" />
        <div className="ln h from-end y3" />
        <div className="ln v from-start x1" />
        <div className="ln v from-end x2" />
        <div className="ln v from-end x3" />
        <div className="ln v from-start x4" />

        {/* Placeholder images — swap the files in public/images */}
        <div className="cell cell-1"><Image src="/images/hero-1.jpg" alt="" fill sizes="8vw" loading="eager" /></div>
        <div className="cell cell-2"><Image src="/images/hero-2.jpg" alt="" fill sizes="18vw" loading="eager" /></div>
        <div className="cell cell-3"><Image src="/images/hero-3.jpg" alt="" fill sizes="12vw" loading="eager" /></div>

        <Word className="w-1" text="Relentlessly" />
        <Word className="w-2" text="Collaborative" />
        <div className="caret c-1" />
        <div className="caret c-2" />
      </div>

      <motion.div className="bio-layer" style={{ y: bioY }}>
        <div className="bio">
          <p>
            Hey! Kamusta? I’m{" "}
            <span className="name serif" tabIndex={0}>
              Jofo!
              <Image className="name-photo" src="/images/jofo.png" alt="Photo of Jofo" width={112} height={112} />
            </span>
            <br />
            A hands-on product design leader, specializing{" "}
            <br className="br-wide" />
            in FinTech and AI-driven interfaces.
          </p>
          <p>
            Currently, I’m a staff product designer at
            <br />
            <span className="company">
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
              <img src="/icons/anchorage-mark.svg" width={16} height={16} alt="" />
              <span className="serif">Anchorage</span>
            </span>{" "}
            where I lead fiat experiences and{" "}
            <br className="br-wide" />
            shape how our design process evolves with AI.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

// .ghost holds the word's final size; .typed is what animates (see "Words" in globals.css)
function Word({ className, text }: { className: string; text: string }) {
  return (
    <div className={`word ${className}`}>
      <span className="ghost" aria-hidden="true">{text}</span>
      <span className="typed"><span className="bg" /><span className="txt">{text}</span></span>
    </div>
  );
}
