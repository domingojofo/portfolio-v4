import { DesignSection } from "@/components/DesignSection";
import { Hero } from "@/components/Hero";
import { HomeScroll } from "@/components/HomeScroll";

// "/" and "/design" share this layout, so moving between them never remounts the page —
// HomeScroll just scrolls to the matching section.
export default function HomeLayout({ children }: LayoutProps<"/">) {
  return (
    <HomeScroll>
      <Hero />
      <DesignSection />
      {children}
    </HomeScroll>
  );
}
