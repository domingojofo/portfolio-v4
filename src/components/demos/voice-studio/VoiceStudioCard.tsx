"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { GradientField } from "../../GradientField";
import "./voice-studio.css";

// Voice Studio — the full text-to-speech flow, built in the portfolio-apps repo and exported to
// /demos/voice-studio/. It runs its own autoplay (?autoplay): a cursor types a line, generates it,
// plays it, then browses Explore; the first click inside hands control to the visitor.
// Here it sits in a browser frame over the warped gradient, with a new palette on every visit.

const APP = "/demos/voice-studio/index.html?autoplay";  // Next serves public files by exact path (no folder index)
const APP_W = 1512;
const APP_H = 945;

// Random palettes shaped like the reference ones: deep, bright and pale tones on one side of the
// wheel, then a contrasting accent and a deep accent.
const TONES = [
  { hue: 0, s: 0.7, l: 0.42 },
  { hue: 1, s: 0.82, l: 0.6 },
  { hue: 2, s: 0.75, l: 0.8 },
  { hue: 3, s: 0.52, l: 0.56 },
  { hue: 4, s: 0.48, l: 0.38 },
];

function hslToHex(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

function randomPalette() {
  const base = Math.random() * 360;
  const step = 14 + Math.random() * 22;
  const accent = base + 140 + Math.random() * 80;
  const hues = [base, base + step, base + step * 2, accent, accent + 25];
  return TONES.map(({ hue, s, l }) => {
    const h = (hues[hue] + 360) % 360;
    // Greens read as neon at full saturation; mute them
    return hslToHex(h, h > 70 && h < 170 ? s * 0.6 : s, l);
  });
}

// One palette per page load, rolled on the client only (the server renders none, so hydration
// matches; the gradient then fades in with the client's colours)
let palette: string[] | null = null;
const getPalette = () => (palette ??= randomPalette());
const noSubscribe = () => () => {};

export function VoiceStudioCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const colors = useSyncExternalStore(noSubscribe, getPalette, () => null);
  const [near, setNear] = useState(false);

  // Scale the laptop-sized app to the frame
  useEffect(() => {
    const screen = screenRef.current!;
    const ro = new ResizeObserver(([e]) => screen.style.setProperty("--vs-s", String(e.contentRect.width / APP_W)));
    ro.observe(screen);
    return () => ro.disconnect();
  }, []);

  // Only load the app once the card is close to the viewport
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setNear(true);
        io.disconnect();
      }
    }, { rootMargin: "300px" });
    io.observe(cardRef.current!);
    return () => io.disconnect();
  }, []);

  return (
    <div className="vs-card" ref={cardRef}>
      {colors && <GradientField colors={colors} />}
      <div className="vs-window">
        <div className="vs-chrome" aria-hidden>
          <span /><span /><span />
          <span className="vs-url">voice studio</span>
        </div>
        <div className="vs-screen" ref={screenRef}>
          {near && (
            <iframe
              src={APP}
              title="Voice Studio: text-to-speech flow, playing itself until you click"
              width={APP_W}
              height={APP_H}
              loading="lazy"
            />
          )}
        </div>
      </div>
    </div>
  );
}
