import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="page">
      <h1>About</h1>
      <p>Placeholder — a longer version of the intro: background, how you work, experience.</p>
    </main>
  );
}
