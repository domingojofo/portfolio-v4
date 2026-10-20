// Text with **marked** parts, which are set in <strong> (styled as a highlight, not bold)
export function Marked({ text }: { text: string }) {
  return <>{text.split(/\*\*(.+?)\*\*/).map((t, n) => (n % 2 ? <strong key={n}>{t}</strong> : t))}</>;
}
