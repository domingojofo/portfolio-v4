import type { Metadata } from "next";
import { books } from "@/content/reading";

export const metadata: Metadata = { title: "Reading" };

// One page, built from src/content/reading.ts
export default function ReadingPage() {
  return (
    <main className="page">
      <h1>Reading</h1>
      <ul className="list">
        {books.map((b) => (
          <li key={b.title}>
            <div className="row">
              <div>
                <div className="list-title">{b.title}</div>
                <div className="muted">{b.author}{b.note ? ` — ${b.note}` : ""}</div>
              </div>
              <span className="muted">{b.status === "reading" ? "Reading" : "Read"}</span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
