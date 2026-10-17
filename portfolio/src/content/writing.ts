import fs from "node:fs";
import path from "node:path";

// Writing entries are the .mdx files in src/content/writing. Each exports `metadata`.

export type EntryMeta = { slug: string; title: string; date: string; summary?: string; wordCount: number };

const dir = path.join(process.cwd(), "src/content/writing");

export function getEntrySlugs() {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export async function getEntry(slug: string) {
  if (!getEntrySlugs().includes(slug)) return null;
  const mod = await import(`@/content/writing/${slug}.mdx`);
  return { Content: mod.default, meta: { slug, wordCount: countWords(slug), ...mod.metadata } as EntryMeta };
}

// Words in the entry body — the source minus its `metadata` export
function countWords(slug: string) {
  const source = fs.readFileSync(path.join(dir, `${slug}.mdx`), "utf8");
  const body = source.replace(/^export const metadata = \{[\s\S]*?\};?/m, "");
  return body.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export async function getEntries() {
  const entries = await Promise.all(getEntrySlugs().map(getEntry));
  return entries
    .filter((e) => e !== null)
    .map((e) => e.meta)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
