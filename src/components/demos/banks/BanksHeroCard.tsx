"use client";
/* eslint-disable @next/next/no-img-element -- static SVG background */

import { useEffect, useRef } from "react";
import "./banks-hero.css";

// Anchorage "Who we serve — Banks" hero animation (Lottie, 505×347) on its gradient card.
// The player loads only when the card nears the viewport, and pauses while it's off screen.
export function BanksHeroCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current, stage = stageRef.current;
    if (!card || !stage) return;
    let anim: import("lottie-web").AnimationItem | undefined;
    let visible = false;
    let cancelled = false;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const start = async () => {
      const { default: lottie } = await import("lottie-web/build/player/lottie_light");
      if (cancelled) return;
      anim = lottie.loadAnimation({
        container: stage,
        renderer: "svg",
        loop: true,
        autoplay: false,
        path: "/demos/banks/banks-hero.json",
        rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
      anim.addEventListener("DOMLoaded", () => {
        if (still) anim?.goToAndStop(anim.totalFrames - 1, true);   // reduced motion: the finished frame
        else if (visible) anim?.play();
      });
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !anim) start();
      if (!anim || still) return;
      if (visible) anim.play();
      else anim.pause();
    }, { rootMargin: "200px" });
    io.observe(card);

    return () => {
      cancelled = true;
      io.disconnect();
      anim?.destroy();
    };
  }, []);

  return (
    <div className="banks-card" ref={cardRef}>
      <img className="banks-card-bg" src="/demos/banks/banks-bg.svg" alt="" />
      <div className="banks-card-stage" ref={stageRef} role="img" aria-label="Animated Anchorage banking illustration" />
    </div>
  );
}
