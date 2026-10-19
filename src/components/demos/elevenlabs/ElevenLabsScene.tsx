"use client";
/* eslint-disable @next/next/no-img-element -- static Figma assets inside a scaled scene */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./elevenlabs-scene.css";

// ElevenLabs cover scene, drawn over the animated GradientField — the generate flow from Figma
// "Portfolio Update 2026" (frames 435:13153 → 435:13213):
//   1. The text box sits alone in the middle; text types itself in and Generate turns on
//   2. Generate is pressed (by the loop, or by the visitor) → it shows a spinner, a skeleton voice
//      card appears above while the text box slides down
//   3. The voice card fades in over the skeleton and starts playing: it takes on colour, the play
//      button becomes pause with a pulse ring; the box now reads "2 left" · Regenerate
//   4. It rests, resets, and loops (only while on screen; reduced motion: the finished state)
// Laid out at the frames' 767×755 and scaled to fit its box.

const dir = "/demos/elevenlabs";
const SHOW_TOP = 22, SHOW_BOTTOM = 725;   // frame px shown, top → bottom
const CX = 383.5;                          // horizontal centre, frame px
const LINE = "Hey! Kamusta? I’m Jofo — turning a few words into a voice that sounds like a person.";
const TYPE_MS = 38;

type Phase = "idle" | "typing" | "ready" | "press" | "loading" | "reveal" | "playing" | "rest" | "reset";

export function ElevenLabsScene() {
  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const go = useRef<(() => void) | null>(null);   // jump straight to "press" (the visitor clicked Generate)

  // Fit the frames' content to the box: by height, never wider than the text box allows
  useLayoutEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      const s = Math.min(height / (SHOW_BOTTOM - SHOW_TOP), width / 720);
      el.style.setProperty("--es", String(s));
      el.style.setProperty("--ex", `${width / 2 - CX * s}px`);
      el.style.setProperty("--ey", `${(height - (SHOW_BOTTOM - SHOW_TOP) * s) / 2 - SHOW_TOP * s}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => { setTyped(LINE.length); setPhase("playing"); });
      return () => cancelAnimationFrame(id);
    }
    let timer: ReturnType<typeof setTimeout> | undefined, n = 0, visible = false, cur: Phase = "idle";
    const set = (p: Phase) => { cur = p; setPhase(p); };
    const at = (ms: number, f: () => void) => { clearTimeout(timer); timer = setTimeout(() => { if (visible) f(); }, ms); };

    const generate = () => {
      set("press");
      at(260, () => {
        set("loading");
        at(1500, () => {
          set("reveal");
          at(450, () => {
            set("playing");
            at(3600, () => {
              set("rest");
              at(1300, () => {
                set("reset");
                at(800, () => { n = 0; setTyped(0); set("idle"); at(700, start); });
              });
            });
          });
        });
      });
    };
    const typeNext = () => {
      n += 1;
      setTyped(n);
      if (n === 1) set("typing");
      if (n < LINE.length) at(TYPE_MS + (LINE[n - 1] === " " ? 28 : 0), typeNext);
      else { set("ready"); at(900, generate); }
    };
    const start = () => typeNext();

    // The visitor can press Generate as soon as there's text
    go.current = () => {
      if (cur !== "typing" && cur !== "ready") return;
      n = LINE.length;
      setTyped(n);
      generate();
    };

    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) at(600, cur === "idle" ? start : cur === "typing" ? typeNext : generate);
      if (!visible) clearTimeout(timer);
    }, { threshold: 0.2 });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(timer); go.current = null; };
  }, []);

  // Clicking Generate inside the project card mustn't open the project
  const onGenerate = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    go.current?.();
  }, []);

  const hasText = typed > 0;
  const after = phase === "loading" || phase === "reveal" || phase === "playing" || phase === "rest";
  const enabled = phase === "ready" || phase === "typing";
  const label = after ? "Regenerate" : "Generate";

  return (
    <div className="els" ref={ref} data-phase={phase} aria-hidden>
      <div className="els-frame">
        {/* Skeleton → voice card */}
        <div className="els-card els-skeleton">
          <div className="els-sk-media" />
          <div className="els-sk-line" style={{ width: 92 }} />
          <div className="els-sk-line" style={{ width: 280 }} />
          <div className="els-sk-line" style={{ width: 210 }} />
          <div className="els-sk-tags"><span /><span /><span /><span /></div>
        </div>
        <div className="els-card els-voice">
          <div className="els-media">
            <div className="els-bg"><img src={`${dir}/blur.png`} alt="" /></div>
            <span className="els-tint" />
            <span className="els-flags">
              <span className="els-flag"><img src={`${dir}/flag-uk.png`} alt="" /></span>
              <span className="els-flag els-flag-sm"><img src={`${dir}/flag-es.png`} alt="" /></span>
            </span>
            <span className="els-listeners"><img src={`${dir}/listeners.png`} alt="" />1.2k</span>
            <img className="els-face" src={`${dir}/face-1.png`} alt="" />
            <span className="els-play">
              <span className="els-ring" />
              {phase === "playing"
                ? <svg width="16" height="16" viewBox="0 0 10 10"><rect x="1.5" y="1" width="2.4" height="8" rx=".8" fill="#fff" /><rect x="6.1" y="1" width="2.4" height="8" rx=".8" fill="#fff" /></svg>
                : <img src={`${dir}/play-c.svg`} alt="" />}
            </span>
          </div>
          <div className="els-meta">
            <p className="els-name">Jennifer</p>
            <p className="els-desc">Middle-aged American woman with a light soothing voice simple back and forth conversatiobooks, new</p>
            <div className="els-tags"><span>Conversational</span><span>HQ</span><span>Female</span><span>+4 more...</span></div>
            <span className="els-use">+ Use</span>
          </div>
        </div>

        {/* Text box: centred, then slides down under the card */}
        <div className="els-input">
          <p className={`els-text${hasText ? " has-text" : ""}`}>
            {hasText ? LINE.slice(0, typed) : "Start typing here or paste any text you want to turn into lifelike speech"}
            {(phase === "typing" || phase === "idle") && <span className="els-caret" />}
          </p>
          <span className="els-count">{typed.toLocaleString("en-US")} / 30,000</span>
          <div className="els-actions">
            <span className="els-left">{after ? "2 left" : "3 left"}</span>
            <span
              className={`els-gen${enabled ? " is-on" : ""}${after ? " is-regen" : ""}`}
              onClick={onGenerate}
            >
              {phase === "press" || phase === "loading" ? <span className="els-spin" /> : null}
              <span>{label}</span>
              <span className="els-free"><img src={`${dir}/leaf.svg`} alt="" />Free</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
