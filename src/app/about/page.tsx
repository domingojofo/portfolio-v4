import type { Metadata } from "next";
import Image from "next/image";
import { AboutNav } from "@/components/about/AboutNav";
import { BoardSnap } from "@/components/about/BoardSnap";
import { CountUp } from "@/components/about/CountUp";
import { Ikigai } from "@/components/about/Ikigai";
import { LineRise } from "@/components/about/LineRise";
import { Polaroid } from "@/components/about/Polaroid";
import { TalksCarousel } from "@/components/about/TalksCarousel";
import { RevealHeading } from "@/components/RevealHeading";

export const metadata: Metadata = { title: "About" };

// About — Figma "Portfolio Update 2026" 580:30465. Every block starts on one left edge — a 480px
// column's, centred on the screen — and text stays 480px wide; wider blocks (the stats, the Ikigai
// statement, the talks) run on to the right, and the Ikigai mark sits out in the left margin.
// The page is laid out on the dot board: the dots scroll with it, on a 30px grid whose columns
// meet that left edge (DotGrid, [data-board]), and each block's top lands on a row (BoardSnap).
// The opening headline plays the hero's word reveal on load; the others as they scroll in.

const stat = (n: string, label: string) => (
  <div className="ab-stat"><CountUp value={n} /><span>{label}</span></div>
);
const REVEAL = { each: 0.07, creep: 0.8, hold: 0.25, snap: 0.18, stack: true };

const SWF = "Speaker\n& Workshop Facilitator";   // two lines, as in the Figma
const TALKS = [
  ["Designing for Banks in 2026", SWF],
  ["UX Laurier Designation", SWF],
  ["Digital Society Lab", "Speaker"],
  ["UX Laurier Designation", SWF],
  ["Polygon: In-house UX Research", "Speaker"],
  ["UX Laurier Designation", "Judge"],
  ["UX Istanbul: Web3 Mental Models", "Speaker"],
  ["Lazer Technologies: A Case for Web3 Design", "Guest Speaker"],
  ["Your dApp makes me Anxious, Build & solving for end user", "Podcast Speaker"],
  ["UX Laurier Designation", "Judge"],
  ["Getting into UX/Design in Web3", "Speaker", "https://www.youtube.com/watch?v=iuP1m2pDcaY"],
  ["Kollective Hustle: A journey into design as a Filipino Immigrant", "Speaker"],
  ["Hack The North", "Mentor"],
];

export default function AboutPage() {
  return (
    <main className="ab">
      <span className="ab-origin" data-board="30" aria-hidden="true" />
      <BoardSnap />
      <AboutNav />

      <section id="story" aria-labelledby="ab-story">
        <div className="ab-intro">
          <div className="ab-col">
            <Polaroid />
            <RevealHeading as="h1" id="ab-story" className="ab-title"
              lines={[["Pixels, People, and a Decade of ", { text: "Curiosity", className: "gelica-xlight" }, "."]]} options={REVEAL} />
            <div className="ab-rise">
              <LineRise className="ab-indent" afterTitle>
                <span className="ab-muted">I didn’t start in design. I started on the retail floor, chatting with strangers and learning how to read between the lines.</span>{" "}
                Fast forward – I’ve conducted over 1,400 UX interviews, led design at startups and scaleups, and helped build everything from AI tools to fintech dashboards.
              </LineRise>
              <div className="ab-stats">
                {stat("6+", "Years of Leadership")}
                {stat("240", "Mentorship Sessions")}
                {stat("72", "Designers Mentored")}
              </div>
            </div>
          </div>
        </div>

        <div className="ab-photo">
          <Image src="/images/about/tracks.jpg" width={2400} height={1325} alt="Jofo standing between railway tracks, overgrown with green" sizes="(max-width: 1448px) calc(100vw - 48px), 1400px" priority />
        </div>
        <LineRise className="ab-col ab-indent ab-after">
          At Anchorage I shaped all fiat experiences, and part-time supported stablecoins. I shipped ACH, virtual accounts, stablecoin
          conversions, and recipients — while building what AI design looks like internally, and playing a mini PM role throughout every project.
        </LineRise>

        <div className="ab-ikigai-sec" data-snap>
          <div className="ab-start ab-ikigai-row">
            <Ikigai />
            <div className="ab-think-wrap">
              <span className="ab-label">My Ikigai</span>
              <LineRise className="ab-think">
                <span className="ab-dim">I found design on a retail floor before I knew what to call it</span>. It’s what I love, what I’m good
                at, and what I think the world needs: <em className="ab-gx ab-gxi">making things more human</em>. That’s a calling, not a
                job, and helping other designers find theirs is why I <em className="ab-gx ab-gxi">lead</em>.
              </LineRise>
            </div>
          </div>
        </div>
      </section>

      <section id="leadership" className="ab-section" aria-labelledby="ab-lead" data-snap>
        <div className="ab-start ab-stack">
          <RevealHeading as="h2" id="ab-lead" className="ab-title" onView
            lines={[["Mentorship, Community, and ", { text: "Paying It Forward", className: "ab-gx" }]]} options={REVEAL} />
          <LineRise className="ab-text ab-indent" afterTitle>Design is a passion I’m eager to share. I find joy in helping others grow by coaching budding designers and the next generation of talent.</LineRise>
          <div className="ab-stats ab-stats-wide">
            {stat("1,200", "User Interviews")}
            {stat("11", "0 → 1 Product Launches")}
            {stat("7", "Teams Led")}
          </div>
        </div>
        <TalksCarousel />
        <div className="ab-start ab-stack" data-snap>
          <LineRise className="ab-text ab-indent">Find me speaking or leading workshops on AI, Web3, user research, personal branding, or breaking into design.</LineRise>
          <ul className="ab-talks">
            {TALKS.map(([title, role, href], i) => (
              <li key={i}>
                {href ? <a href={href} target="_blank" rel="noopener noreferrer">{title}</a> : <span>{title}</span>}
                <span>{role}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="ai" className="ab-section" aria-labelledby="ab-ai" data-snap>
        <div className="ab-start ab-stack ab-ai">
          <RevealHeading as="h2" id="ab-ai" className="ab-title" onView
            lines={[["Tools, Taste, and Keeping ", { text: "People at the Center", className: "ab-gx" }]]} options={REVEAL} />
          <LineRise className="ab-text ab-indent" afterTitle>
            That’s not a reason to avoid it. I truly love what AI can do. It’s taken the tedious work off my plate (synthesizing
            research, drafting specs, spinning up first versions) and given me time back for the parts of design I fell in love with:
            exploring interactions, testing ideas I’d never have had time for, and obsessing over how something feels. I can try ten
            directions in an afternoon instead of defending one for a week. Design is more fun than it’s been in years. But I’ve also
            watched our industry treat “automate everything” as the goal, where every hour saved becomes a reason to do more with fewer
            people. I don’t want to choose between the excitement and the worry, so I’ve been intentional about where AI belongs in my
            process, and about helping my teams find that balance too.
          </LineRise>
          <LineRise className="ab-text">
            As a leader, my job isn’t just to use AI well. It’s to help designers use it to do more of their best work, with more
            confidence, curiosity, and room to explore. Here’s how it shows up in my process, and in how I coach teams through it:
          </LineRise>
          <LineRise className="ab-text ab-indent">
            Still, the best part of design has never been the tools. It’s the conversations: with the people using what we build, with
            clients, and with the engineers, PMs, and teammates figuring it out alongside me. I love talking to people, and that’s where
            the real insight lives. AI can generate options, but it can’t sit across from someone and hear what they actually mean.
            Taste, craft, strategy, leadership, and the joy of making something together are still human work. I use AI to protect more
            of that, not less.
          </LineRise>
        </div>
      </section>
    </main>
  );
}
