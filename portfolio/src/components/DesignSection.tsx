import Image from "next/image";
import Link from "next/link";
import { projects } from "@/content/projects";
import { ScrollScale } from "./ScrollScale";
import { Ticker } from "./Ticker";
import { BanksHeroCard } from "./demos/banks/BanksHeroCard";
import { ChippFeaturesCard, ChippHeroCard, ChippRow } from "./demos/chipp/ChippCards";
import { TrustedDestinationsCard } from "./demos/trusted-destinations/TrustedDestinationsCard";
import { VirtualAccountsCard } from "./demos/va-charts/VirtualAccountsCard";

export function DesignSection() {
  return (
    // Rises over the pinned hero as you scroll; the carousel is its top edge, peeking up
    // from the bottom of the first screen
    <section className="design" id="design" aria-labelledby="design-title">
      <Ticker />
      <div className="design-inner">
        <h2 id="design-title">Impactful products crafted with care and collaboration</h2>
        <ul className="project-list">
          <CompanyIntro {...companies.anchorage} />
          {projects.map((p, i) => (
            <li key={p.slug}>
              {/* scroll={false}: opening the project modal shouldn't move the page underneath */}
              <ScrollScale>
                <Link className="project-card" href={`/design/${p.slug}`} scroll={false}>
                  <Image src={p.cover.src} width={p.cover.width} height={p.cover.height} alt={p.cover.alt} sizes="(max-width: 1536px) calc(100vw - 96px), 1440px"
                    loading={i === 0 ? "eager" : "lazy"} /* first image is on screen when /design opens */ />
                </Link>
              </ScrollScale>
            </li>
          ))}
          {/* Anchorage pieces shown in place rather than linking to a case study: the playable iOS
              prototype beside the website's banks hero animation, both at the same height */}
          <li>
            <ScrollScale>
              <div className="project-row">
                <div>
                  <TrustedDestinationsCard />
                </div>
                <div>
                  <BanksHeroCard />
                </div>
              </div>
            </ScrollScale>
          </li>
          <li>
            <ScrollScale>
              <VirtualAccountsCard />
            </ScrollScale>
          </li>

          {/* Chipp — laid out as in the Figma "Ideas" page: the brand board, the mascot photos
              beside the guidelines, then the feature board */}
          <CompanyIntro {...companies.chipp} />
          <li>
            <ScrollScale>
              <ChippHeroCard />
            </ScrollScale>
          </li>
          <li>
            <ScrollScale>
              <ChippRow />
            </ScrollScale>
          </li>
          <li>
            <ScrollScale>
              <ChippFeaturesCard />
            </ScrollScale>
          </li>
        </ul>
      </div>
    </section>
  );
}

// Placeholder copy until the real write-ups are in
const companies = {
  anchorage: {
    name: "Anchorage Digital",
    meta: "Staff Product Designer · 2022 — Now",
    summary:
      "Placeholder — a couple of sentences on Anchorage, the problems your team owned, and what changed because of the work: the products shipped, the teams you partnered with, the outcomes.",
  },
  chipp: {
    name: "Chipp",
    meta: "Product Designer · 2024",
    summary:
      "Placeholder — what Chipp is (a no-code platform for building AI apps), the role you played, and the highlights: the brand and mascot system, the builder, and how it all came together.",
  },
};

function CompanyIntro({ name, meta, summary }: { name: string; meta: string; summary: string }) {
  return (
    <li className="company-intro">
      <div>
        <h3 className="company-name">{name}</h3>
        <p className="company-meta muted">{meta}</p>
      </div>
      <p className="company-summary">{summary}</p>
    </li>
  );
}
