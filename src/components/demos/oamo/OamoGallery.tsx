"use client";
/* eslint-disable @next/next/no-img-element -- static Figma assets laid out in frame px */

import { useEffect, useRef, useState } from "react";
import "./oamo-gallery.css";

// OAMO in the project modal — the column on the Figma "Ideas" page (x 21382), rebuilt in code:
//  1. Interviews: one background (Lofoten), the call screenshots switching on it
//  2. Match: "It's a match!", the two avatars, floating orbs
//  3. Profile (left): "Create your profile" bleeding off a Big Sur crop
//     Criteria (right): the requirement list on Torres del Paine, filling itself in on a loop —
//     the cards appear, then tick off one by one until both groups are complete
//  4. The brand board, as is (a 3× export)
// Every tile is laid out in its Figma frame's px and scaled to its width (--u, one frame px).

const dir = "/demos/oamo";

export function OamoGallery() {
  return (
    <div className="ob">
      <Interviews />
      <Match />
      <div className="ob-row">
        <Profile />
        <Criteria />
      </div>
      <figure className="ob-tile ob-board" style={{ "--fw": 390, "--fh": 219.375 } as React.CSSProperties}>
        <img src={`${dir}/brand-board.png`} alt="OAMO brand: Maxeville typography, the 3D links, and the colour palette" />
      </figure>
    </div>
  );
}

// Played only while on screen (and not with reduced motion)
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.3 });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);
  return [ref, on] as const;
}
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. Interviews ---------- */

// Rects (frame px) and crops from the Figma frame, top of the stack first
const CALLS = [
  { src: "call-4.jpg", x: 35.62, y: 27.88, w: 335.51, h: 183.62, alt: "A user interview on a video call: walking through the Oamo profile" },
  { src: "call-1.jpg", x: 26.01, y: 33.65, w: 345.13, h: 177.85, img: { h: 130.94, w: 100.14, l: -0.07, t: 0 }, alt: "A user interview: “use the, yeah, my previous wallet”" },
  { src: "call-2.jpg", x: 55.81, y: 27.88, w: 295.14, h: 183.62, alt: "A user interview with three participants" },
  { src: "call-3.jpg", x: 54.85, y: 27.88, w: 297.06, h: 183.62, img: { h: 116.42, w: 100.1, l: 0, t: -16.48 }, alt: "A group interview on a video call" },
];
const CALL_MS = 3800;

function Interviews() {
  const [ref, inView] = useInView<HTMLElement>();
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!inView || !auto || still()) return;
    const t = setTimeout(() => setI((n) => (n + 1) % CALLS.length), CALL_MS);
    return () => clearTimeout(t);
  }, [i, inView, auto]);
  const go = (n: number) => { setAuto(false); setI((n + CALLS.length) % CALLS.length); };

  return (
    <figure className="ob-tile ob-calls" ref={ref} style={{ "--fw": 398, "--fh": 265.33 } as React.CSSProperties}>
      <img className="ob-bg" src={`${dir}/bg-lofoten.png`} alt="" />
      {CALLS.map((c, n) => (
        <div key={c.src} className="ob-call" data-on={n === i || undefined} aria-hidden={n !== i}
          style={{ "--x": c.x, "--y": c.y, "--w": c.w, "--h": c.h } as React.CSSProperties}>
          <img src={`${dir}/${c.src}`} alt={c.alt} loading="lazy"
            style={c.img ? { position: "absolute", height: `${c.img.h}%`, width: `${c.img.w}%`, left: `${c.img.l}%`, top: `${c.img.t}%` } : undefined} />
        </div>
      ))}
      <figcaption className="ob-calls-ui">
        <span className="ob-cap">60+ user interviews in 2.5 months</span>
        <span className="ob-nav">
          <button type="button" aria-label="Previous interview" onClick={() => go(i - 1)}>‹</button>
          {CALLS.map((c, n) => (
            <button key={c.src} type="button" className="ob-dot" aria-label={`Interview ${n + 1}`} aria-current={n === i || undefined} onClick={() => go(n)} />
          ))}
          <button type="button" aria-label="Next interview" onClick={() => go(i + 1)}>›</button>
        </span>
      </figcaption>
    </figure>
  );
}

/* ---------- 2. Match ---------- */

// Orbs: [left, top, width] in frame px, blurred or not, from the Figma frame
const ORBS: [number, number, number, boolean][] = [
  [87, -6, 52.76, true], [54, 41, 29.93, false], [135.45, 66.87, 14.2, false], [376, 60, 14.2, false],
  [305, 6, 47.18, false], [262, 64, 43.12, true], [-45.66, 68.83, 81.17, false],
];

function Match() {
  return (
    <figure className="ob-tile ob-match" style={{ "--fw": 398, "--fh": 106 } as React.CSSProperties}>
      <div className="ob-match-in">
        {ORBS.map(([x, y, w, blur], n) => (
          <span key={n} className={`ob-orb${blur ? " is-blur" : ""}`}
            style={{ "--x": x, "--y": y, "--w": w, animationDelay: `${-n * 0.9}s` } as React.CSSProperties} />
        ))}
        <p className="ob-match-title" aria-label="It’s a match!">
          <span className="ob-its">IT’S A</span>
          <span className="ob-big">MATCH!</span>
          <span className="ob-echo" aria-hidden><span>MATCH!</span></span>
          <span className="ob-echo is-2" aria-hidden><span>MATCH!</span></span>
        </p>
        <span className="ob-pair" aria-hidden>
          <img className="ob-av ob-av-1" src={`${dir}/avatar-1.png`} alt="" />
          <span className="ob-av ob-av-2"><img src={`${dir}/avatar-2.png`} alt="" /></span>
        </span>
        <p className="ob-match-sub">Get ready to unlock exclusive offers from <b>Origin Protocol</b></p>
      </div>
    </figure>
  );
}

/* ---------- 3a. Profile ---------- */

function Profile() {
  return (
    <figure className="ob-tile ob-profile" style={{ "--fw": 239, "--fh": 191 } as React.CSSProperties}>
      <img className="ob-bg ob-bg-bigsur" src={`${dir}/bg-big-sur.png`} alt="" />
      <div className="ob-pcard">
        <span className="ob-pbanner"><img src={`${dir}/profile-banner.jpg`} alt="" /></span>
        <div className="ob-pbody">
          <p className="ob-welcome">WELCOME TO <img src={`${dir}/oamo-wordmark.png`} alt="Oamo" /></p>
          <p className="ob-ptitle">Create your profile</p>
          <p className="ob-ptext">
            Your Oamo Profile combines and secures all your online activity, allowing you to match with your favorite
            brands and unlock exclusive offers. <b>Learn more</b>
          </p>
          <p className="ob-agree"><span className="ob-check" aria-hidden />I agree to the <u>terms &amp; conditions</u></p>
          <span className="ob-go">Let’s go</span>
          <p className="ob-time"><span aria-hidden>◷</span> It takes up to 2 minutes to create your profile</p>
        </div>
      </div>
    </figure>
  );
}

/* ---------- 3b. Criteria (animated) ---------- */

const ITEMS = [
  { text: "At least 1 message on Uniswap’s Discord", group: 0, pass: true },
  { text: "Has deposited 5000 USDC to Celsius", group: 0, pass: true },
  { text: "Over 5 transactions on OpenSea over last 30 days", group: 0, pass: false },
  { text: "At least 1 message on SuperRare’s Discord", group: 1, pass: true },
];
// The loop: cards come in, then each is checked in order, hold on "Eligible", reset
const APPEAR_MS = 260, CHECK_MS = 900, HOLD_MS = 2600;

function Criteria() {
  const [ref, inView] = useInView<HTMLElement>();
  const [step, setStep] = useState(0);   // 0..N cards in, then N+1..2N checks done
  const N = ITEMS.length;

  useEffect(() => {
    if (still()) {   // reduced motion: the finished list
      const id = requestAnimationFrame(() => setStep(2 * N));
      return () => cancelAnimationFrame(id);
    }
    if (!inView) return;
    const ms = step === 0 ? 500 : step < N ? APPEAR_MS : step < 2 * N ? CHECK_MS : HOLD_MS;
    const t = setTimeout(() => setStep((s) => (s >= 2 * N ? 0 : s + 1)), ms);
    return () => clearTimeout(t);
  }, [inView, step, N]);

  const shown = Math.min(step, N), checked = Math.max(0, step - N);
  const done = (n: number) => n < checked;
  const passed = (g: number) => ITEMS.filter((it, n) => it.group === g && it.pass && done(n)).length;
  const g0 = passed(0), g1 = passed(1);
  const g0ok = g0 >= 1, g1ok = g1 >= 1;   // "at least one" of three / "ALL" of one
  const all = (g0ok ? 1 : 0) + (g1ok ? 1 : 0);

  const card = (n: number) => {
    const it = ITEMS[n];
    const state = done(n) ? (it.pass ? "pass" : "fail") : "wait";
    return (
      <div key={n} className="ob-ccard" data-in={n < shown || undefined} data-state={state}>
        <span>
          <span className="ob-ctext">{it.text}</span>
          <span className="ob-con">On <i aria-hidden>◆</i> Ethereum</span>
        </span>
        <span className="ob-mark">
          {state === "pass" && <svg viewBox="0 0 10 10" aria-label="Done"><path d="M2 5.2 4.2 7.3 8 3" /></svg>}
          {state === "fail" && <svg viewBox="0 0 10 10" aria-label="Not met"><path d="M3 3l4 4M7 3 3 7" /></svg>}
          {state === "wait" && n < shown && <span className="ob-spin" />}
        </span>
      </div>
    );
  };

  return (
    <figure className="ob-tile ob-criteria" ref={ref} data-complete={all === 2 || undefined}
      style={{ "--fw": 139, "--fh": 191 } as React.CSSProperties}>
      <img className="ob-bg ob-bg-torres" src={`${dir}/bg-torres.png`} alt="" />
      <div className="ob-cview">
        <p className="ob-chead"><span className="ob-pill" data-ok={all === 2 || undefined}>{all}/2</span> Criteria Requirement</p>
        <p className="ob-cgroup">
          <span className="ob-pill" data-ok={g0ok || undefined}>{g0}/3</span>
          Completed <em>at least one</em> of the following
        </p>
        <div className="ob-clist">{[0, 1, 2].map(card)}</div>
        <p className="ob-cgroup">
          <span className="ob-pill" data-ok={g1ok || undefined}>{g1}/1</span>
          Completed <em>ALL</em> of the following
        </p>
        <div className="ob-clist">{card(3)}</div>
      </div>
      <span className="ob-cdone" aria-hidden>Eligible ✓</span>
    </figure>
  );
}
