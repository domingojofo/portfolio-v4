/* eslint-disable @next/next/no-img-element -- photos in a moving strip, sized by CSS */

// Leadership photos (Figma 597:32365): white-framed prints, each a little tilted as in the frame,
// drifting across the full width in a seamless loop (the list is doubled). Hover pauses the strip
// and straightens the print under the cursor. Reduced motion: a still strip you can scroll.
const PHOTOS = [
  { src: "talk-1", r: 0, alt: "Chipp brand guidelines presentation — the team on a video call, Thank you slide" },
  { src: "talk-2", r: 4, alt: "Getting into Web3: UX/Design — panel with Andrew Breuer, Jofo Domingo and Ben Hsiah" },
  { src: "talk-3", r: -3, alt: "Presenting a flip chart at a workshop" },
  { src: "talk-4", r: -2, alt: "A mentee waving on a video call" },
  { src: "talk-5", r: 3, alt: "Keynote at UX Istanbul: The UX Designer's Guide to Web3 Mental Models" },
  { src: "talk-6", r: 2, alt: "A case for Web3 Design — talk at Lazer Technologies" },
  { src: "talk-7", r: -4, alt: "A remote workshop, everyone on camera" },
  { src: "talk-8", r: 1, alt: "Kollective Hustle mentorship program, Spring 2021" },
];

export function TalksCarousel() {
  const card = (p: (typeof PHOTOS)[number], i: number, dup: boolean) => (
    <li key={`${dup ? "b" : "a"}${i}`} className="ab-print" style={{ "--r": `${p.r}deg` } as React.CSSProperties} aria-hidden={dup || undefined}>
      <img src={`/images/about/${p.src}.jpg`} alt={dup ? "" : p.alt} loading="lazy" />
    </li>
  );
  return (
    <div className="ab-carousel" role="region" aria-label="Talks, workshops and mentoring">
      <ul className="ab-carousel-track">
        {PHOTOS.map((p, i) => card(p, i, false))}
        {PHOTOS.map((p, i) => card(p, i, true))}
      </ul>
    </div>
  );
}
