import { Closing } from "@/components/Closing";
import { Hero } from "@/components/Hero";
import { ProjectCards } from "@/components/ProjectCards";

// Hey: the hero, the project cards (its cards peek up into the hero), then the closing section
export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProjectCards />
      <Closing />
    </main>
  );
}
