// The highlights ticker: a dark band along the bottom of the project cards' screen (ProjectCards),
// peeking up under the work. Two identical groups slide left by one group's width (seamless loop),
// with the orange sparkle marks between items.

const highlights = ["6 Years of Leadership", "1400 User Interviews", "300 Mentorship Sessions", "15 0 → 1 Product Launches"];
// public/icons/sparkles/sparkle-1…6.svg, in the Figma frame's order between items
const SPARKLE_ORDER = [1, 2, 2, 2, 3, 4, 5, 6];

export function Highlights() {
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
    <div className="marquee" aria-label="Highlights">
      <div className="marquee-track">
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
