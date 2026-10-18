import { Closing } from "@/components/Closing";
import { Hero } from "@/components/Hero";
import { WorkDeck } from "@/components/WorkDeck";

// Hey: the hero, the work deck (its cards peek up into the hero), then the closing section
export default function HomePage() {
  return (
    <main>
      <Hero />
      <WorkDeck />
      <Closing />
    </main>
  );
}
