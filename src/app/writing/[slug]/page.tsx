import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WritingEntry } from "@/components/WritingEntry";
import { getEntry, getEntrySlugs } from "@/content/writing";

// One page per entry, from src/content/writing/[slug].mdx
export default async function EntryPage({ params }: PageProps<"/writing/[slug]">) {
  const { slug } = await params;
  const entry = await getEntry(slug);
  if (!entry) notFound();
  return <WritingEntry Content={entry.Content} meta={entry.meta} />;
}

export function generateStaticParams() {
  return getEntrySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/writing/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getEntry(slug);
  return { title: entry?.meta.title, description: entry?.meta.summary };
}
