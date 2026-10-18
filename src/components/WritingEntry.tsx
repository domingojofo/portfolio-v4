import { formatDate, type EntryMeta } from "@/content/writing";

// One writing entry: title, date, body. Used by /writing (newest entry) and /writing/[slug].
export function WritingEntry({ Content, meta }: { Content: React.ComponentType; meta: EntryMeta }) {
  return (
    <article className="writing-entry">
      <h1>{meta.title}</h1>
      <p className="writing-entry-meta muted">
        <time dateTime={meta.date}>{formatDate(meta.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{meta.wordCount} words</span>
      </p>
      <div className="writing-prose"><Content /></div>
    </article>
  );
}
