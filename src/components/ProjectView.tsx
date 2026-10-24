import type { Project } from "@/content/projects";
import { BanksHeroCard } from "./demos/banks/BanksHeroCard";
import { ChippStory } from "./demos/chipp/ChippStory";
import { OamoGallery } from "./demos/oamo/OamoGallery";
import { TrustedDestinationsCard } from "./demos/trusted-destinations/TrustedDestinationsCard";
import { VirtualAccountsCard } from "./demos/va-charts/VirtualAccountsCard";
import { VoiceStudioCard } from "./demos/voice-studio/VoiceStudioCard";
import { ProjectStory } from "./ProjectStory";

// Project content — shared by the modal and the full /design/[slug] page. Every project uses the
// same story layout (ProjectStory). Chipp has its full story; the others carry their one-line
// summary as the lead until theirs are written, and their existing work as the parts.
const plain = (s: string) => s.replace(/\*\*/g, "");

export function ProjectView({ project, headingId }: { project: Project; headingId?: string }) {
  if (project.slug === "chipp") return <ChippStory headingId={headingId} />;
  const base = { project, headingId, lead: plain(project.summary) };

  if (project.slug === "anchorage") {
    return (
      <ProjectStory {...base} parts={[
        {
          id: "anchorage-td", nav: "Trusted Destinations",   // just the work under the cover: no text
          work: [
            <div key="td" className="project-row">
              <div><TrustedDestinationsCard /></div>
              <div><BanksHeroCard /></div>
            </div>,
          ],
        },
        { id: "anchorage-va", nav: "Virtual accounts", work: [<VirtualAccountsCard key="va" />] },
      ]} />
    );
  }
  if (project.slug === "oamo") {
    return <ProjectStory {...base} parts={[{ id: "oamo-product", nav: "Product", label: "Product", work: [<OamoGallery key="g" />] }]} />;
  }
  if (project.slug === "elevenlabs") {
    return <ProjectStory {...base} parts={[{ id: "elevenlabs-voice", nav: "Voice generation", label: "Voice generation", work: [<VoiceStudioCard key="v" />] }]} />;
  }
  return <ProjectStory {...base} parts={[]} />;
}
