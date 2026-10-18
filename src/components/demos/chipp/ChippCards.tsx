"use client";
/* eslint-disable @next/next/no-img-element -- static SVG layers from the Figma file */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "./chipp.css";

// Chipp panels, laid out as in the Figma "Ideas" page (node 238:6323 and the cards below it).
// Each one plays a short, quiet entrance the first time it reaches the middle of the screen — then stays still.

// `near`: within a screen or so of the viewport (start loading). `shown`: its top edge has reached
// the middle of the screen, so it fills at least half the viewport (works for panels of any height).
function useReveal<T extends Element>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const nearIo = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); nearIo.disconnect(); } }, { rootMargin: "100% 0px" });
    const shownIo = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); shownIo.disconnect(); } }, { rootMargin: "0px 0px -50% 0px" });
    nearIo.observe(el);
    shownIo.observe(el);
    return () => { nearIo.disconnect(); shownIo.disconnect(); };
  }, []);
  return { ref, near, shown };
}

// 1440×782 brand board: swatches, form fields, stickers and the builder UI. The SVG (≈100KB
// gzipped) is fetched when the panel nears the screen and inlined so its layers can animate:
// swatch columns rise, stickers pop in one by one, the builder slides up, the UI card and
// button sheet float in last.
export function ChippHeroCard() {
  const { ref, near, shown } = useReveal<HTMLDivElement>();
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    if (!near || svg) return;
    let cancelled = false;
    fetch("/demos/chipp/hero.svg").then((r) => r.text()).then((t) => { if (!cancelled) setSvg(t); }).catch(() => {});
    return () => { cancelled = true; };
  }, [near, svg]);

  return (
    <div ref={ref} className={`chipp-card chipp-hero${svg ? " is-ready" : ""}${shown && svg ? " is-in" : ""}`}
      role="img" aria-label="Chipp brand board: colour swatches, form fields, stickers and the app builder">
      {svg && <div className="chipp-hero-art" dangerouslySetInnerHTML={{ __html: svg }} />}
      <img className="chipp-float chipp-float--buttons" src="/demos/chipp/buttons.svg" width={431} height={152} alt="" />
      <img className="chipp-float chipp-float--card" src="/demos/chipp/card.svg" width={320} height={320} alt="" />
    </div>
  );
}

const mascots = [
  [
    { src: "welcoming", w: 134, h: 136 },
    { src: "intrigued", w: 127.47, h: 137.243 },
    { src: "curious", w: 129.17, h: 137.243 },
  ],
  [
    { src: "happy", w: 127.47, h: 137.243 },
    { src: "giggly", w: 115.998, h: 134.694 },
    { src: "nervous", w: 116.423, h: 134.694 },
  ],
];

// Two 581×292 photos with three mascots each; the mascots hop up into place in turn
function MascotPhoto({ photo, alt, position, set }: { photo: string; alt: string; position: string; set: number }) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`chipp-card chipp-photo${shown ? " is-in" : ""}`}>
      <Image src={photo} alt={alt} fill sizes="(max-width: 1023px) 100vw, 600px" style={{ objectPosition: position }} />
      <div className="chipp-mascots" aria-hidden="true">
        {mascots[set].map((m, i) => (
          <img key={m.src} src={`/demos/chipp/${m.src}.svg`} width={m.w} height={m.h} alt=""
            style={{ "--i": i, width: `calc(${m.w} / 581 * 100cqw)` } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}

// The two photos stacked beside the brand guidelines overview (Figma: 581 + 859 across)
export function ChippRow() {
  const { ref: brandRef, shown: brandShown } = useReveal<HTMLDivElement>();
  return (
    <div className="chipp-row">
      <div className="chipp-stack">
        <MascotPhoto photo="/demos/chipp/tuscany.png" alt="Three Chipp mascots in front of rolling Tuscan hills" position="50% 100%" set={0} />
        <MascotPhoto photo="/demos/chipp/park.jpg" alt="Three Chipp mascots in a park" position="50% 9%" set={1} />
      </div>
      <div ref={brandRef} className={`chipp-card chipp-brand${brandShown ? " is-in" : ""}`}>
        <Image src="/demos/chipp/brand-guidelines.png" alt="Chipp brand guidelines: overview, logo, voice, typography, colour and illustration pages"
          fill sizes="(max-width: 1023px) 100vw, 860px" />
      </div>
    </div>
  );
}

// 1050×572 feature board (usage insights, actions, model picker, branding…)
export function ChippFeaturesCard() {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`chipp-card chipp-features${shown ? " is-in" : ""}`}>
      <Image src="/demos/chipp/features.png" width={3150} height={1716}
        alt="Chipp feature cards: usage insights, team access, actions, model switching, branding and sharing"
        sizes="(max-width: 1536px) calc(100vw - 96px), 1440px" />
    </div>
  );
}
