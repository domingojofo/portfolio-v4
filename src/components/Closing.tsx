import Image from "next/image";
import { ClosingReveal } from "./ClosingReveal";
import { CursorHand } from "./CursorHand";
import { RevealHeading } from "./RevealHeading";

// Below the project cards (whose screen ends with the highlights ticker, Highlights.tsx) — Figma
// "Hero — Final frame (1440)": "Relentlessly" / "Collaborative" in Gelica, which plays the word
// reveal as it scrolls into view, with a marble hand reaching from the right for a hand made of
// cursors (CursorHand) — after Linear's "Create your own agents". Laid out in the frame's px,
// scaled to the width (.closing-art). It's uncovered from under the deck's ticker (ClosingReveal):
// the hands and the words come in together, once a third of it is showing.
export function Closing() {
  return (
    <section className="closing" aria-label="About the work">
      <ClosingReveal>
        <RevealHeading
          as="h2"
          className="giant"
          onView
          viewThreshold={0.3}
          lines={["Relentlessly", "Collaborative"]}
          options={{ each: 0.1, creep: 0.8, hold: 0.3, snap: 0.18, stack: true }}
        />
        <Image className="closing-hand" src="/images/footer-hand.png" width={1670} height={922} alt="" sizes="67vw" />
        <CursorHand />
      </ClosingReveal>
    </section>
  );
}
