import type { Metadata } from "next";
import { DesignSection } from "@/components/DesignSection";

export const metadata: Metadata = { title: "Design" };

// Design — its own page (in v3 it was the second half of the home scroll)
export default function DesignPage() {
  return (
    <main>
      <DesignSection />
    </main>
  );
}
