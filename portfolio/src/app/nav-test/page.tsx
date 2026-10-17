import { redirect } from "next/navigation";

// Turns on the icon toolbar for this browser and goes to Hey (see navVariantScript in app/layout.tsx).
// /?nav=words switches back to the word nav.
export default function NavTestPage() {
  redirect("/?nav=toolbar");
}
