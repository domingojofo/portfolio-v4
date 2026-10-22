import { getProject } from "@/content/projects";
import { ProjectStory } from "../../ProjectStory";
import { ChippAwardCard, ChippFeaturesCard, ChippHeroCard, ChippRow } from "./ChippCards";

// Chipp's story: the intro, then two highlights — brand, then product
export function ChippStory({ headingId }: { headingId?: string }) {
  return (
    <ProjectStory
      project={getProject("chipp")!}
      headingId={headingId}
      lead="I started at Chipp as a design consultant reshaping the brand, then joined as employee #4 and grew into Head of Design."
      body={[
        "Chipp lets small and medium businesses build their own AI agents without writing code. I started by giving it a voice and a face, then moved into the product, designing the initial interface and creating the agent studio where people build their agents.",
        "Along the way I built a Discord community with the team, where we worked closely with our clients: doing customer support, getting UX research done, and helping them adopt the product.",
        "With all our work, we unlocked the team’s $2M seed round, with the brand and the product doing much of the talking.",
      ]}
      role={["Design strategy", "Brand strategy and identity", "Mascot and illustration system", "Brand guidelines", "Website design", "Product design", "UX research", "Interaction design", "The AI agent studio", "Design system"]}
      cover={<ChippHeroCard />}
      parts={[
        {
          id: "chipp-brand", nav: "Brand design", label: "Highlight",
          lead: "Reshaping the brand to make AI feel friendly, and winning an award for it",
          body: [
            "AI felt intimidating to the business owners we were building for, so the brand had to do the opposite: warm, a little playful, and plain-spoken. I redefined the strategy, then rebuilt the identity around it, a yellow mascot with a range of moods, stickers that carry the voice, and a palette that holds it all together.",
            "The playbook turned it into something the whole team could use, from the product to the pitch deck, and the brand went on to win at the 2025 RGD Branding Awards.",
          ],
          work: [<ChippAwardCard key="a" />, <ChippRow key="r" />, <ChippFeaturesCard key="f" />],
        },
        {
          id: "chipp-product", nav: "Product design", label: "Highlight",
          lead: "The AI agent studio",
          body: ["As Head of Design I led the product: the studio where a business sets up its agent, connects it to the tools it already uses, shares it anywhere, and sees how it’s doing. The goal was for someone with no technical background to go from an idea to a working agent in an afternoon."],
        },
      ]}
    />
  );
}
