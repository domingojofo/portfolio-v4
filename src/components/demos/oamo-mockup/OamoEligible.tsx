"use client";
/* eslint-disable @next/next/no-img-element -- static Figma assets inside a scaled scene */

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/content/projects";
import "./oamo-eligible.css";

// OAMO deck card: the Figment brand pass (Figma "Portfolio Update 2026", 510:12089 — one ticket,
// three states) over the bounce loop. A hand cursor comes in and clicks "Check eligibility"; the
// button turns into the loader, then "Eligible ✓" — it rests, and loops. Hands-off; the card around
// it stays clickable. The ticket is laid out at its Figma 554 × 900 and scaled to fit the box.
// Plays only while on screen and `live`; reduced motion shows the eligible state.

const DIR = "/demos/oamo-pass";
const TW = 554, TH = 900;
type Phase = "idle" | "move" | "hover" | "press" | "loading" | "eligible" | "leave" | "reset";
const SCRIPT: [Phase, number][] = [
  ["idle", 1000], ["move", 1000], ["hover", 500], ["press", 200], ["loading", 1600], ["eligible", 800], ["leave", 2600], ["reset", 800],
];

export function OamoEligible({ cover, live = true, eager = false }: { cover: Project["cover"]; live?: boolean; eager?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [step, setStep] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      const s = Math.min(width / (TW * 1.6), (height * 0.84) / TH);
      el.style.setProperty("--s", String(s));
      el.style.setProperty("--x", `${(width - TW * s) / 2}px`);
      el.style.setProperty("--y", `${(height - TH * s) / 2}px`);
    });
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    const id = requestAnimationFrame(() => setStill(matchMedia("(prefers-reduced-motion: reduce)").matches));
    return () => { ro.disconnect(); io.disconnect(); cancelAnimationFrame(id); };
  }, []);

  const run = live && onScreen && !still;
  useEffect(() => {
    if (!run) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % SCRIPT.length), SCRIPT[step][1]);
    return () => clearTimeout(t);
  }, [run, step]);

  useEffect(() => {
    const v = ref.current!.querySelector("video");
    if (!v) return;
    if (run) v.play().catch(() => {});
    else v.pause();
  }, [run]);

  const phase: Phase = still ? "eligible" : SCRIPT[step][0];
  return (
    <span className="oe" ref={ref} data-phase={phase}>
      {cover.video && (
        <video className="oe-bg" src={cover.video} poster={cover.src} muted loop playsInline preload={eager ? "auto" : "metadata"} aria-hidden />
      )}
      <span className="oe-frame" aria-hidden>
        <span className="oe-ticket">
          <span className="oe-top">
            <span className="oe-art"><img src={`${DIR}/ticket-art.jpg`} alt="" /></span>
            <span className="oe-brandmark">
              <span className="oe-logo"><img src={`${DIR}/ticket-logo.png`} alt="" /></span>
              <span className="oe-brandname">Figment <img src={`${DIR}/verified.svg`} alt="" /></span>
            </span>
            <span className="oe-title">
              <span className="oe-pass">Figment brand pass</span>
              <span className="oe-name">ETH Holders</span>
            </span>
            <span className="oe-btn">
              <span className="oe-btn-check">Check eligibility</span>
              <span className="oe-btn-load"><Loader /></span>
              <span className="oe-btn-ok">Eligible <img src={`${DIR}/check.svg`} alt="" /></span>
            </span>
          </span>
          <span className="oe-cut" />
          <span className="oe-bottom">
            <span className="oe-inc">
              <span className="oe-inc-label">INCLUDED</span>
              <span className="oe-inc-name">GIVEAWAY</span>
            </span>
            <span className="oe-amt"><img src={`${DIR}/ticket-coin.png`} alt="" />15</span>
          </span>
        </span>
        <span className="oe-cursor">
          <span className="oe-ripple" />
          <HandCursor />
        </span>
      </span>
    </span>
  );
}

// The Loader icon (eight ticks, fading round)
function Loader() {
  return (
    <svg className="oe-loader" viewBox="0 0 32 32" width="32" height="32">
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="14.75" y="3" width="2.5" height="7" rx="1.25" fill="#d9d9d9"
          transform={`rotate(${i * 45} 16 16)`} style={{ opacity: 0.25 + (i / 8) * 0.75 }} />
      ))}
    </svg>
  );
}

// The pointing hand (link cursor), white with a dark outline
function HandCursor() {
  return (
    <svg width="28" height="30" viewBox="0 0 28 30" fill="none">
      <path d="M9.3 2.6c1.1 0 2 .9 2 2v8.1l.6-.1c.3-1 1.2-1.6 2.2-1.6 1 0 1.8.6 2.1 1.4.4-.6 1.1-1 1.9-1 1.1 0 2 .8 2.2 1.8.4-.3.9-.5 1.4-.5 1.2 0 2.2 1 2.2 2.2v6c0 4.2-3 7.6-7.6 7.6h-1.7c-2.4 0-4.4-1-5.9-2.9l-4.6-6c-.7-.9-.5-2.3.4-3 .9-.7 2.2-.6 3 .3l1.8 2V4.6c0-1.1.9-2 2-2Z"
        fill="#fff" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M12 19v4M15.6 19v4M19.2 19v4" stroke="#111" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
