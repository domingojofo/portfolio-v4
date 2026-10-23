import { Hero } from "@/components/Hero";
import { ProjectCards } from "@/components/ProjectCards";
import { SiteFooter } from "@/components/SiteFooter";
import { YoureIn } from "@/components/YoureIn";

// Hey: the hero, the project cards (its cards peek up into the hero), the "You're in" reveal, then the footer (the old closing section, Closing.tsx, is out for now)
export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProjectCards />
      <YoureIn />
      <SiteFooter />
    </main>
  );
}
