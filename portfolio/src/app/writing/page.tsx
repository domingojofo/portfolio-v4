import type { Metadata } from "next";
import { WritingEntry } from "@/components/WritingEntry";
import { getEntries, getEntry } from "@/content/writing";

export const metadata: Metadata = { title: "Writing" };

// Desktop: opens on the newest entry, with every entry in the sidebar (app/writing/layout.tsx).
// Phone: only the list shows here; the entry is hidden until one is picked.
export default async function WritingPage() {
  const [newest] = await getEntries();
  const entry = newest && (await getEntry(newest.slug));
  if (!entry) return <p className="muted">Nothing here yet.</p>;
  return <WritingEntry Content={entry.Content} meta={entry.meta} />;
}
