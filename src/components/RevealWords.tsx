// Markup for the word reveal (src/lib/reveal.ts): every word becomes a masked .rv-w holding a
// .rv-in, with the spaces between kept as real text so the heading still wraps and reads normally.
// Each item in `lines` is its own line: a plain string, or a list of segments where a segment can
// carry a className (e.g. a different typeface for a couple of words).

type Segment = string | { text: string; className?: string };
export type RevealLine = Segment | Segment[];

const segments = (line: RevealLine) => (Array.isArray(line) ? line : [line]);
const segText = (s: Segment) => (typeof s === "string" ? s : s.text);

/** The lines as plain text, for aria-label */
export const lineText = (lines: RevealLine[]) =>
  lines.map((l) => segments(l).map(segText).join("")).join(" ").replace(/\s+/g, " ").trim();

function Words({ text }: { text: string }) {
  // Keep leading/trailing spaces (they separate segments) as plain text
  return text.split(/(\s+)/).map((part, j) =>
    !part ? null : /^\s+$/.test(part) ? " " : (
      <span className="rv-w" key={j}>
        <span className="rv-in" data-text={part}>{part}</span>
      </span>
    )
  );
}

export function RevealWords({ lines }: { lines: RevealLine[] }) {
  return lines.map((line, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {segments(line).map((seg, k) =>
        typeof seg === "string"
          ? <Words key={k} text={seg} />
          : <span key={k} className={seg.className}><Words text={seg.text} /></span>
      )}
    </span>
  ));
}
