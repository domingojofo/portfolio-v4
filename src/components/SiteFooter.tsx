import Image from "next/image";
import Link from "next/link";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { FooterFlock } from "./FooterFlock";
import { FooterReveal } from "./FooterReveal";
import { Highlights } from "./Highlights";

// The footer (Figma 775:35903, "test frame", 1570 × 684): "Time to collaborate & ship" with
// the two ways to reach me, the link columns, the marble hand and the cursor hand reaching for it
// at an angle, and the highlights ticker along the very bottom. The art is laid out in the frame's
// px from its right edge and scaled with the width (--u); the text keeps its own sizes.
// The Projects column lists whatever is live (content/projects.ts, hidden ones left out).
// It's uncovered from behind the page and plays its way in (FooterReveal); the cursors are alive
// (FooterFlock).

const EMAIL = "domingodisenyo@gmail.com";
const CALENDAR = "https://calendar.app.google/NuNooSQ9YXjBcWNTA";

export function SiteFooter() {
  return (
    <footer className="sf">
      <FooterReveal>
        <div className="sf-main">
          <div className="sf-art" aria-hidden>
            <span className="sf-hand">
              <Image src="/images/footer-hand-angled.png" width={3024} height={1964} alt="" sizes="(max-width: 1023px) 80vw, 1300px" />
            </span>
            <FooterFlock />
          </div>

          <div className="sf-pitch">
            <h2 className="sf-title">
              <span className="sf-line">Time to</span>
              <span className="sf-line"><em>collaborate</em> &amp; <em>ship</em></span>
            </h2>
            <div className="sf-ctas">
              <a className="sf-btn is-solid" href={CALENDAR} target="_blank" rel="noreferrer">Book a call</a>
              <a className="sf-btn" href={`mailto:${EMAIL}`}>Send an email</a>
            </div>
          </div>

          <nav className="sf-cols" aria-label="Footer">
            <div className="sf-col">
              <p className="sf-label">Reach me</p>
              <ul>
                <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
                <li><a href={CALENDAR} target="_blank" rel="noreferrer">Calendar</a></li>
                <li><a href={site.linkedin} target="_blank" rel="noreferrer">/in/domingojose/</a></li>
              </ul>
            </div>
            <div className="sf-col">
              <p className="sf-label">Navigate to</p>
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/about">My story</Link></li>
                <li><span className="sf-soon">Reading <small>Coming soon</small></span></li>
                <li><span className="sf-soon">Writing <small>Coming soon</small></span></li>
              </ul>
            </div>
            <div className="sf-col">
              <p className="sf-label">Projects</p>
              <ul>
                {projects.map((p) => (
                  <li key={p.slug}><Link href={`/design/${p.slug}`} scroll={false}>{p.title}</Link></li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
        <Highlights />
      </FooterReveal>
    </footer>
  );
}
