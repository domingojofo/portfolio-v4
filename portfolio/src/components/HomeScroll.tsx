"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Hey and Design are one continuous scroll with two addresses:
//   "/"       → top of the page (the hero)
//   "/design" → the Design section
// Following a link to either address scrolls there; scrolling the page quietly swaps the
// address between the two (history.replaceState), so the nav highlight and refresh stay right.

const sectionFor = (path: string) => (path === "/design" ? "design" : path === "/" ? "hey" : null);

export function HomeScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const syncedPath = useRef<string | null>(null);   // the address our own scroll sync last wrote
  const autoScrolling = useRef(false);              // true while we're scrolling for a link click

  // A link (or first load) points at "/" or "/design" → scroll to that section
  useEffect(() => {
    const from = prevPath.current;
    prevPath.current = pathname;
    const section = sectionFor(pathname);
    if (!section) return;                              // a project modal is open
    if (pathname === syncedPath.current) return;       // we changed the address ourselves while scrolling
    if (from?.startsWith("/design/")) return;          // a project modal just closed — stay put
    syncedPath.current = pathname;

    const firstRender = from === null;
    if (firstRender && section === "hey") return;      // fresh visit to "/": already at the top
    // Wait a frame so this runs after Next's own post-navigation scroll
    requestAnimationFrame(() => {
      autoScrolling.current = true;
      const behavior = firstRender ? "instant" : "smooth";
      if (section === "design") document.getElementById("design")?.scrollIntoView({ behavior });
      else window.scrollTo({ top: 0, behavior });
      const done = () => { autoScrolling.current = false; };
      if (behavior === "instant") done();
      else {
        addEventListener("scrollend", done, { once: true });
        setTimeout(done, 1200); // fallback where scrollend isn't supported
      }
    });
  }, [pathname]);

  // Scrolling swaps the address between "/" and "/design"
  useEffect(() => {
    const design = document.getElementById("design");
    if (!design) return;
    const onScroll = () => {
      if (autoScrolling.current) return;
      if (!sectionFor(location.pathname)) return;      // modal open
      const path = design.getBoundingClientRect().top <= innerHeight * 0.5 ? "/design" : "/";
      if (path !== location.pathname) {
        syncedPath.current = path;
        history.replaceState(null, "", path);
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return <>{children}</>;
}
