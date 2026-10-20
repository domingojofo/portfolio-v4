"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/content/projects";
import "./oamo-mockup.css";

// OAMO cover: the bounce loop fills the box, with the MacBook and iPhone from the Interview
// Presentation Figma (slide "Slide 16:9 - 238") on top — the Oamo landing page on both. The slide
// is laid out at its 1920 × 1080 and anchored to the bottom of the box (the devices run off it, as
// in the slide). The video plays only while on screen and `live`; reduced motion keeps its poster.

const DIR = "/demos/oamo-hero";

export function OamoScene({ cover, live = true, eager = false }: { cover: Project["cover"]; live?: boolean; eager?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "100px" });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = ref.current!.querySelector("video");
    if (!v) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (live && onScreen && !still) v.play().catch(() => {});
    else v.pause();
  }, [live, onScreen]);

  return (
    <span className="om" ref={ref}>
      {cover.video && (
        <video className="om-bg" src={cover.video} poster={cover.src} muted loop playsInline
          preload={eager ? "auto" : "metadata"} aria-hidden />
      )}
      <span className="om-slide" aria-hidden>
        <Image className="om-mac" src={`${DIR}/oamo-macbook-v2.png`} width={2835} height={1373} alt=""
          sizes="(max-width: 1023px) 120vw, 1100px" priority={eager} />
        <Image className="om-phone" src={`${DIR}/oamo-iphone-v2.png`} width={1080} height={1173} alt=""
          sizes="(max-width: 1023px) 45vw, 420px" priority={eager} />
      </span>
    </span>
  );
}
