import { RevealHeading } from "./RevealHeading";
import { Wall } from "./Wall";

// Below the project cards — Figma "Hero — Final frame (1440)", lower part:
//  1. Text wall (Wall.tsx) — six rows of faint "CALLOUSED HANDS"; letters near the cursor darken
//  2. Ticker — "5 Years of Leadership" in Gelica, with the orange sparkle marks between items
//  3. Text wall — six more rows
//  4. Giant "Relentless / Collaboration" in Gelica — plays the word reveal as it scrolls into view

// Placeholder copy from the Figma frame — swap for the real highlights
const highlights = ["5 Years of Leadership"];
// public/icons/sparkles/sparkle-1…6.svg, in the frame's order between items
const SPARKLE_ORDER = [1, 2, 2, 2, 3, 4, 5, 6];

export function Closing() {
  const group = (hidden: boolean) => (
    <ul className="marquee-group" aria-hidden={hidden || undefined}>
      {SPARKLE_ORDER.map((s, i) => (
        <li key={i}>
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
          <img className="marquee-sep" src={`/icons/sparkles/sparkle-${s}.svg`} alt="" width={20} height={18} />
          <span>{highlights[i % highlights.length]}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="closing" aria-label="About the work">
      <Wall />
      <div className="marquee" aria-label="Highlights">
        <div className="marquee-track">
          {group(false)}
          {group(true)}
        </div>
      </div>
      <Wall />

      <RevealHeading
        as="h2"
        className="giant"
        onView
        lines={["Relentless", "Collaboration"]}
        options={{ each: 0.1, creep: 0.8, hold: 0.3, snap: 0.18, stack: true }}
      />
    </section>
  );
}
