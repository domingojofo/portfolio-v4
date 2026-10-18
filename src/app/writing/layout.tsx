import { WritingShell } from "@/components/WritingShell";
import { formatDate, getEntries } from "@/content/writing";

// Sidebar of every entry + the open entry. The layout persists across entries,
// so the sidebar keeps its scroll position and shown / hidden state.
export default async function WritingLayout({ children }: LayoutProps<"/writing">) {
  const entries = await getEntries();
  return (
    <WritingShell entries={entries.map((e) => ({ ...e, dateLabel: formatDate(e.date) }))}>
      {children}
    </WritingShell>
  );
}
