"use client";
/* eslint-disable @next/next/no-img-element -- static Figma assets inside a scaled mock screen */

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./elevenlabs.css";

// ElevenLabs — the text-to-speech "Generate" screen (Figma "ElevenLabs Project", Desktop - 16),
// playable like the Trusted Destinations card:
//  - the left nav opens and closes (the toggle top-left); the page re-centres in the space left
//  - Generate / History tabs switch; a voice's play button previews it in the player bar
// The screen is laid out at the frame's 1296×768 and scaled to the card. While nobody has touched
// it, it plays itself — the nav closes and opens, a voice previews — until the first click.

const dir = "/demos/elevenlabs";
const W = 1296;

const voices = [
  { name: "Jennifer", bg: "bg-1", face: "face-1", bgCrop: { h: 108.08, w: 105.45, t: 0 }, tags: ["Conversational", "HQ", "+4 more..."] },
  { name: "Alice", bg: "bg-2", face: "face-2", bgCrop: { h: 135.04, w: 100, t: -12.41 }, tags: ["Narrative & Story", "HQ", "+4 more..."] },
  { name: "Voice Name", bg: "bg-3", face: "face-3", bgCrop: { h: 111.68, w: 100, t: -5.47 }, tags: ["Conversational", "HQ", "+4 more..."] },
];
const DESC = "Middle-aged American man with a deep soothing voice great for narrating stories, audiobooks, news";

// Autoplay script: [ms to wait, action]
const SCRIPT: [number, "close" | "open" | "play0" | "play1" | "stop"][] = [
  [1800, "close"], [1600, "play0"], [2200, "play1"], [2000, "stop"], [900, "open"],
];

export function ElevenLabsCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<"generate" | "history">("generate");
  const [playing, setPlaying] = useState<number | null>(null);
  const [auto, setAuto] = useState(true);

  // Fit the 1296px-wide screen to the card
  useLayoutEffect(() => {
    const card = cardRef.current!;
    const ro = new ResizeObserver(([e]) => card.style.setProperty("--el-s", String(e.contentRect.width / W)));
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  // Autoplay while untouched and on screen (not with reduced motion)
  useEffect(() => {
    if (!auto || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = cardRef.current!;
    let step = 0, timer: ReturnType<typeof setTimeout> | undefined, visible = false;
    const run = () => {
      const [ms, act] = SCRIPT[step];
      timer = setTimeout(() => {
        if (act === "close") setOpen(false);
        else if (act === "open") setOpen(true);
        else if (act === "stop") setPlaying(null);
        else setPlaying(act === "play0" ? 0 : 1);
        step = (step + 1) % SCRIPT.length;
        if (visible) run();
      }, ms);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      clearTimeout(timer);
      if (visible) run();
    }, { threshold: 0.4 });
    io.observe(card);
    return () => { io.disconnect(); clearTimeout(timer); };
  }, [auto]);

  // The first real click or key press hands control to the visitor
  const takeOver = () => { if (auto) setAuto(false); };

  return (
    <div className="el-card" ref={cardRef} onClickCapture={takeOver} onKeyDownCapture={takeOver}>
      <div className="el-screen" data-open={open || undefined} aria-label="ElevenLabs voice generator — interactive prototype" role="group">
        {/* Soft waves behind everything */}
        <div className="el-waves" aria-hidden><img src={`${dir}/waves.png`} alt="" /></div>

        {/* Main area: everything centred in the space right of the nav */}
        <div className="el-main">
          <div className="el-tabs" role="tablist">
            {(["generate", "history"] as const).map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                {t === "generate" ? "Generate" : "History"}
              </button>
            ))}
          </div>

          {tab === "generate" ? (
            <div className="el-col">
              <div className="el-head">
                <p className="el-title">Create the right voice for your project</p>
                <p className="el-sub">Enter or upload text or audio, then hear it delivered in a different voice with full control over tone, style, and delivery.</p>
              </div>

              <div className="el-input">
                <p className="el-placeholder">Start typing here or paste any text you want to turn into lifelike speech</p>
                <button type="button" className="el-btn el-settings">Settings</button>
                <span className="el-credits">0 / 30,000</span>
                <button type="button" className="el-btn el-generate" disabled>Generate speech</button>
              </div>

              <div className="el-voices">
                <div className="el-voices-head">
                  <p>Trending voices on Eleven Labs</p>
                  <span className="el-discover">Discover more voices</span>
                </div>
                <div className="el-voice-row">
                  {voices.map((v, i) => (
                    <div className="el-voice" key={v.name}>
                      <div className="el-voice-media">
                        <div className="el-voice-bg"><img src={`${dir}/${v.bg}.png`} alt="" style={{ height: `${v.bgCrop.h}%`, width: `${v.bgCrop.w}%`, top: `${v.bgCrop.t}%` }} /></div>
                        <div className="el-voice-blur"><img src={`${dir}/blur.png`} alt="" /></div>
                        <img className="el-voice-face" src={`${dir}/${v.face}.png`} alt="" />
                        <span className="el-flags" aria-hidden>
                          <span className="el-flag"><img src={`${dir}/flag-uk.png`} alt="" /></span>
                          <span className="el-flag el-flag-sm"><img src={`${dir}/flag-es.png`} alt="" /></span>
                        </span>
                        <span className="el-listeners"><img src={`${dir}/listeners.png`} alt="" />1.2k</span>
                        <button type="button" className="el-play" aria-label={`${playing === i ? "Pause" : "Play"} ${v.name}`} aria-pressed={playing === i}
                          onClick={() => setPlaying(playing === i ? null : i)}>
                          {playing === i ? <PauseIcon /> : <img src={`${dir}/play.svg`} alt="" />}
                        </button>
                      </div>
                      <div className="el-voice-meta">
                        <p className="el-voice-name">{v.name}</p>
                        <p className="el-voice-desc">{DESC}</p>
                        <div className="el-tags">{v.tags.map((t) => <span key={t}>{t}</span>)}</div>
                        <span className="el-use">+ Use</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="el-history">
              <p className="el-title">No history yet</p>
              <p className="el-sub">Speech you generate shows up here, so you can play it back or download it later.</p>
              <button type="button" className="el-btn el-dark" onClick={() => setTab("generate")}>Generate speech</button>
            </div>
          )}

          <div className="el-player" data-on={playing !== null || undefined}>
            <img className="el-player-bg" src={`${dir}/player.png`} alt="" />
            <span className="el-player-cover" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={playing ?? "none"} className="el-player-title"
                initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.18 }}>
                {playing === null ? "Play sound first" : `${voices[playing].name} — preview`}
              </motion.p>
            </AnimatePresence>
            {playing !== null && <span className="el-progress" key={playing} />}
            <span className="el-btn el-use-project">Use for project</span>
            <button type="button" className="el-player-play" aria-label={playing === null ? "Play" : "Pause"}
              onClick={() => setPlaying(playing === null ? 0 : null)}>
              {playing === null ? <img src={`${dir}/play-lg.svg`} alt="" /> : <PauseIcon big />}
            </button>
          </div>
        </div>

        {/* Left nav — opens and closes */}
        <nav className="el-nav" aria-label="ElevenLabs">
          <div className="el-logo" aria-hidden><img src={`${dir}/logo-row.png`} alt="" /></div>
          <button type="button" className="el-toggle" aria-label={open ? "Close sidebar" : "Open sidebar"} aria-expanded={open}
            onClick={() => setOpen(!open)}>
            <SidebarIcon />
          </button>
          <div className="el-create-wrap">
            <button type="button" className="el-create"><span className="el-plus">+</span><span className="el-label"> Create</span></button>
          </div>
          <button type="button" className="el-home"><HomeIcon /><span className="el-label">Home</span></button>
          <p className="el-section el-label">EXPLORE</p>
          <div className="el-items" aria-hidden><img src={`${dir}/nav-items.png`} alt="" /></div>
          <div className="el-items el-items-2" aria-hidden><img src={`${dir}/nav-items.png`} alt="" /></div>
          {/* Collapsed: hide the section headers baked into the screenshot */}
          <span className="el-mask" style={{ top: 214 }} aria-hidden />
          <span className="el-mask" style={{ top: 393 }} aria-hidden />
          <span className="el-mask el-rail-mask" aria-hidden />
          <span className="el-mask el-rail-mask-2" aria-hidden />
        </nav>
      </div>

      <div className="el-card-ui">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={auto ? "auto" : "you"} className="el-pill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <span className="el-pill-dot" />
            <span>{auto ? "Playing" : "Interactive"}<span className="el-pill-long">{auto ? " — click to try it yourself" : " — open and close the sidebar"}</span></span>
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

function SidebarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1.25" y="1.75" width="11.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.25 1.75v10.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 6.2 7 2l5 4.2V12a.5.5 0 0 1-.5.5H8.6V9H5.4v3.5H2.5A.5.5 0 0 1 2 12V6.2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function PauseIcon({ big = false }: { big?: boolean }) {
  const s = big ? 16 : 10;
  return (
    <svg width={s} height={s} viewBox="0 0 10 10" aria-hidden>
      <rect x="1.5" y="1" width="2.4" height="8" rx=".8" fill="#fff" />
      <rect x="6.1" y="1" width="2.4" height="8" rx=".8" fill="#fff" />
    </svg>
  );
}
