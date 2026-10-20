import type { Project } from "@/content/projects";
import { Cover } from "./Cover";
import { BanksHeroCard } from "./demos/banks/BanksHeroCard";
import { ChippFeaturesCard, ChippHeroCard, ChippRow } from "./demos/chipp/ChippCards";
import { TrustedDestinationsCard } from "./demos/trusted-destinations/TrustedDestinationsCard";
import { VirtualAccountsCard } from "./demos/va-charts/VirtualAccountsCard";
import { VoiceStudioCard } from "./demos/voice-studio/VoiceStudioCard";
import { Marked } from "./Marked";

// Project content — shared by the modal and the full /design/[slug] page. Every project opens with
// the same header (title, role · year, cover, summary); Anchorage and Chipp then show their panels
// (everything that used to be on the Design page).
export function ProjectView({ project, headingId }: { project: Project; headingId?: string }) {
  return (
    <article className="project">
      <h1 id={headingId}>{project.title}</h1>
      {(project.role || project.year) && (
        <div className="project-meta muted">
          {project.role && <span>{project.role}</span>}
          {project.year && <span>{project.year}</span>}
        </div>
      )}
      <Cover cover={project.cover} sizes="(max-width: 1008px) 100vw, 960px" eager />
      <p><Marked text={project.summary} /></p>
      {project.slug === "anchorage" && <AnchorageBody />}
      {project.slug === "chipp" && <ChippBody />}
      {project.slug === "elevenlabs" && (
        <Section title="Voice generation">
          <VoiceStudioCard />
        </Section>
      )}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="project-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

// The playable iOS prototype beside the website's banks hero animation (same height), then the
// virtual accounts chart
function AnchorageBody() {
  return (
    <>
      <Section title="Trusted Destinations">
        <div className="project-row">
          <div><TrustedDestinationsCard /></div>
          <div><BanksHeroCard /></div>
        </div>
      </Section>
      <Section title="Virtual accounts">
        <VirtualAccountsCard />
      </Section>
    </>
  );
}

// Laid out as in the Figma "Ideas" page: the brand board, the mascot photos beside the
// guidelines, then the feature board
function ChippBody() {
  return (
    <>
      <Section title="Brand">
        <ChippHeroCard />
      </Section>
      <Section title="Mascot and guidelines">
        <ChippRow />
      </Section>
      <Section title="Builder">
        <ChippFeaturesCard />
      </Section>
    </>
  );
}
