import { Closing } from "@/components/Closing";
import { Hero } from "@/components/Hero";
import { ProjectCards } from "@/components/ProjectCards";
import { YoureIn } from "@/components/YoureIn";

// Hey: the hero, the project cards (its cards peek up into the hero), the "You're in" reveal, then the closing section
export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProjectCards />
      <YoureIn />
      <Closing />
    </main>
  );
}
