import { SectionNav } from "../SectionNav";

// About's section nav (SectionNav)
export function AboutNav() {
  return <SectionNav sections={[{ id: "story", label: "My story" }, { id: "leadership", label: "Leadership" }, { id: "ai", label: "On AI" }]} />;
}
