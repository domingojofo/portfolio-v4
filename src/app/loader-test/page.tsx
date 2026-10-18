import { redirect } from "next/navigation";

// Plays the test preloader on Hey (see loaderScript in app/layout.tsx).
export default function LoaderTestPage() {
  redirect("/?loader");
}
