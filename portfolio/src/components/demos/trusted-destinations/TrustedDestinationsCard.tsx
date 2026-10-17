"use client";
/* eslint-disable @next/next/no-img-element -- static Figma assets inside a scaled mock screen */

import Image from "next/image";
import { AnimatePresence, MotionConfig, animate, motion, useReducedMotion, type PanInfo } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { inter } from "../inter";
import { Illustration, themed, type Theme } from "./Illustration";
import { ShareSheet } from "./ShareSheet";
import "./trusted-destinations.css";

// Anchorage iOS — adding a fiat trusted destination. Fiat destinations can only be created on
// the web dashboard, so the app hands the user off to their computer. Playable flow:
//
//   list → intro ─ "already logged in" ──────────────→ share → sheet → done
//               └─ "login to dashboard" → scanner ──↗
//
// The phone is laid out at iPhone points (375×812 screen) and scaled to the card.

type Step = "list" | "intro" | "scanner" | "share" | "sheet" | "done";

const dir = "/demos/trusted-destinations";

// iPhone 17 body height in points (the mockup's 2642px at 3×, with the 375×812 screen inside),
// and its height as a fraction of the card (top is 15.4% in CSS). The background photo has a
// phone baked in; the live one is drawn over it, slightly larger so the old one never peeks out.
const BODY_H = 846.79;

// Titanium antenna bands from the mockup, in points: [left, top, width, height]
const antennas = [
  [0, 755.8, 5.77, 5.13], [84.3, 840.4, 5.13, 5.77], [404.5, 85.6, 5.77, 5.13],
  [0, 85.6, 5.77, 5.13], [326.6, 0, 5.13, 5.77], [404.5, 755.4, 5.77, 5.13],
];
const PHONE_HEIGHT = 0.814;

const DRAWER_H = { intro: 446, share: 476 };
const SCAN_MS = 2400;

// Autoplay: while nobody has touched the card, a fingertip taps through the whole flow on a
// loop. The first real click or key press hands control to the visitor.
const tapEase = [0.32, 0.72, 0, 1] as const;

// Light mode is built but hidden for now — flip to show the Light/Dark switch on the card
const SHOW_THEME_SWITCH = false;

const destinations = [
  { name: "Jamie Diamond", bank: "Bank of America", account: "9809823498" },
  { name: "Max Welkoff", bank: "Bank of New York Mellon", account: "0924802342" },
];

const sheetSpring = { type: "spring", stiffness: 420, damping: 40 } as const;
const fade = { duration: 0.22 };

export function TrustedDestinationsCard() {
  const [step, setStep] = useState<Step>("list");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [auto, setAuto] = useState(true);
  // No autoplay for people who'd rather not have things move on their own
  const reduceMotion = useReducedMotion();
  const playing = auto && !reduceMotion;
  const cardRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const fingerRef = useRef<HTMLSpanElement>(null);

  // Fit the phone to the card. Until this runs the scale is 0 and the photo's phone shows.
  useLayoutEffect(() => {
    const card = cardRef.current, phone = phoneRef.current;
    if (!card || !phone) return;
    const ro = new ResizeObserver(([entry]) => {
      phone.style.setProperty("--td-scale", String((entry.contentRect.height * PHONE_HEIGHT) / BODY_H));
    });
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  // The fake camera "finds" the code after a moment
  useEffect(() => {
    if (step !== "scanner") return;
    const t = setTimeout(() => setStep("share"), SCAN_MS);
    return () => clearTimeout(t);
  }, [step]);

  // Run the demo loop while the card is on screen; stop and reset when it scrolls away
  useEffect(() => {
    const card = cardRef.current, finger = fingerRef.current;
    if (!playing || !card || !finger) return;
    let ctrl: AbortController | null = null;

    const play = async (signal: AbortSignal) => {
      const sleep = (ms: number) => new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, ms);
        signal.addEventListener("abort", () => { clearTimeout(t); reject(signal.reason); }, { once: true });
      });
      // Glide the fingertip to a button, press, and fire that button's action
      const tap = async (name: string, action: () => void) => {
        const target = card.querySelector<HTMLElement>(`[data-tap="${name}"]`);
        if (target) {
          const c = card.getBoundingClientRect(), t = target.getBoundingClientRect();
          const x = t.left - c.left + t.width / 2, y = t.top - c.top + t.height / 2;
          animate(finger, { x: x + 40, y: y + 90, opacity: 0, scale: 1 }, { duration: 0 });   // just off the target
          animate(finger, { x, y, opacity: 1 }, { duration: 0.75, ease: tapEase });
          await sleep(820);
          animate(finger, { scale: 0.72 }, { duration: 0.12 });
          await sleep(130);
          finger.classList.remove("is-tapping"); void finger.offsetWidth; finger.classList.add("is-tapping");
        }
        action();
        animate(finger, { scale: 1 }, { duration: 0.3 });
        animate(finger, { opacity: 0 }, { duration: 0.35, delay: 0.35 });   // lift off
      };

      for (;;) {
        setStep("list"); setQuery("");
        await sleep(1300);
        await tap("add", () => setStep("intro"));
        await sleep(1900);                       // camera pushes in, drawer settles
        await tap("login", () => setStep("scanner"));
        await sleep(SCAN_MS + 1300);             // scan, then back to the drawer
        await tap("share", () => setStep("sheet"));
        await sleep(1600);
        await tap("send", () => setStep("done"));
        await sleep(1700);
        await tap("done", () => setStep("list"));
        await sleep(1400);
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !ctrl) {
        ctrl = new AbortController();
        play(ctrl.signal).catch(() => {});
      } else if (!entry.isIntersecting && ctrl) {
        ctrl.abort(); ctrl = null;
        setStep("list");
        animate(finger, { opacity: 0 }, { duration: 0.2 });
      }
    }, { threshold: 0.5 });
    io.observe(card);
    return () => {
      io.disconnect();
      ctrl?.abort();
      animate(finger, { opacity: 0, scale: 1 }, { duration: 0.25 });
    };
  }, [playing]);

  // A real click or key press anywhere on the card ends the demo. Clicks (not pointerdown)
  // so a phone scroll that starts on the card doesn't count.
  const takeOver = (e: { isTrusted: boolean }) => { if (playing && e.isTrusted) setAuto(false); };

  const drawer = step === "intro" ? "intro" : step === "share" || step === "sheet" || step === "done" ? "share" : null;
  const overlay = drawer !== null || step === "scanner";
  const closeDrawer = () => setStep("list");

  const onDrawerDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 60 || info.velocity.y > 500) closeDrawer();
  };

  const q = query.trim().toLowerCase();
  const shown = destinations.filter((d) => !q || `${d.name} ${d.bank} ${d.account}`.toLowerCase().includes(q));

  return (
    <MotionConfig reducedMotion="user">
      <div className={`td-card ${inter.variable}`} ref={cardRef} onClickCapture={takeOver} onKeyDownCapture={takeOver}>
        {/* During the demo the "camera" pushes in on the phone's lower half, where the action is */}
        <div className="td-camera" data-focus={playing && drawer !== null}>
        <Image src="/images/trusted-destinations-bg.jpg" alt="" fill sizes="(max-width: 1088px) 100vw, 1040px" className="td-card-bg" />

        <div className="td-phone" ref={phoneRef} data-theme={theme}>
          {/* iPhone 17 frame: titanium edge, then the black bezel the screen sits in */}
          <span className="td-edge td-edge-dark" />
          <span className="td-edge td-edge-primary" />
          <span className="td-edge td-edge-highlight" />
          <span className="td-edge td-edge-reflect" />
          {antennas.map(([left, top, width, height], i) => (
            <span key={i} className="td-antenna" style={{ left, top, width, height }} />
          ))}

          <div className="td-screen" data-step={step}>
            {/* Trusted destinations list — always underneath */}
            <div className="td-list" inert={overlay}>
              <StatusBar theme={theme} />
              <div className="td-nav">
                <img className="td-nav-leading" src={`${dir}/${themed("chevron-left.svg", theme)}`} alt="" />
                <p className="td-nav-title">Trusted destinations</p>
                <img className="td-nav-trailing" src={`${dir}/${themed("info.svg", theme)}`} alt="" />
              </div>
              <div className="td-divider" />

              <div className="td-content">
                <div className="td-toggle" role="group" aria-label="Destination type">
                  <span className="td-toggle-btn">Crypto</span>
                  <span className="td-toggle-btn is-selected" aria-current="true">Fiat</span>
                </div>
                <label className="td-search">
                  <input
                    type="search"
                    placeholder="Search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search trusted destinations"
                  />
                  <img src={`${dir}/${themed("search.svg", theme)}`} alt="" />
                </label>
                <p className="td-subheader">
                  {shown.length} trusted destination{shown.length === 1 ? "" : "s"}
                </p>
                <ul className="td-cards">
                  {shown.map((d) => (
                    <li key={d.account} className="td-dest">
                      <p className="td-dest-name">{d.name}</p>
                      <p className="td-dest-meta"><b>{d.bank}</b> | {d.account}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="td-fixed">
                <button type="button" className="td-btn td-btn-primary" data-tap="add" onClick={() => setStep("intro")}>
                  Add fiat trusted destination
                </button>
              </div>
            </div>

            {/* Drawer backdrop */}
            <AnimatePresence>
              {drawer && (
                <motion.button
                  key="backdrop"
                  type="button"
                  className="td-backdrop"
                  aria-label="Close"
                  tabIndex={-1}
                  onClick={step === "sheet" ? undefined : closeDrawer}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}
                />
              )}
            </AnimatePresence>

            {/* Bottom drawer: the intro, then the share-link state */}
            <AnimatePresence>
              {drawer && (
                <motion.div
                  key="drawer"
                  className="td-drawer"
                  role="dialog"
                  aria-label="Add fiat trusted destination"
                  initial={{ y: "100%", height: DRAWER_H[drawer] }}
                  animate={{ y: 0, height: DRAWER_H[drawer] }}
                  exit={{ y: "100%" }}
                  transition={sheetSpring}
                  drag={step === "sheet" ? false : "y"}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0.04, bottom: 0.7 }}
                  onDragEnd={onDrawerDragEnd}
                  inert={step === "sheet"}
                >
                  <div className="td-drawer-header"><span className="td-drawer-handle" /></div>
                  <AnimatePresence mode="wait" initial={false}>
                    {drawer === "intro" ? (
                      <motion.div key="intro" className="td-drawer-body is-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <Illustration variant="login" theme={theme} />
                        <div className="td-page">
                          <p className="td-page-title">Add fiat trusted destination</p>
                          <p className="td-page-desc">To add a fiat trusted destination, log in to the web dashboard on your computer</p>
                        </div>
                        <div className="td-stack">
                          <button type="button" className="td-btn td-btn-neutral" onClick={() => setStep("share")}>I’m already logged in</button>
                          <button type="button" className="td-btn td-btn-primary" data-tap="login" onClick={() => setStep("scanner")}>Login to dashboard</button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="share" className="td-drawer-body is-share" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <Illustration variant="connected" theme={theme} />
                        <div className="td-page">
                          <p className="td-page-title">Add fiat trusted destination</p>
                          <p className="td-page-desc">
                            Open this link on your computer to finish. Once logged in, go to <b>Settings</b>, select{" "}
                            <b>Add trusted destination</b>, and then choose <b>fiat</b>.
                          </p>
                        </div>
                        <div className="td-stack">
                          <button type="button" className="td-btn td-btn-neutral" data-tap="done" onClick={closeDrawer}>
                            {step === "done" ? "Done" : "Dismiss"}
                          </button>
                          <button type="button" className="td-btn td-btn-primary" data-tap="share" onClick={() => setStep("sheet")}>
                            <img src={`${dir}/share.svg`} alt="" width={24} height={24} />
                            <span className="td-btn-text">Share link to computer</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="td-drawer-home" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* System share sheet, over the drawer */}
            <AnimatePresence>
              {step === "sheet" && (
                <motion.div key="sheet-dim" className="td-sheet-dim" onClick={() => setStep("done")}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade} />
              )}
              {step === "sheet" && (
                <motion.div
                  key="sheet"
                  className="td-sheet-wrap"
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={sheetSpring}
                  drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.04, bottom: 0.7 }}
                  onDragEnd={(_, info) => { if (info.offset.y > 60 || info.velocity.y > 500) setStep("done"); }}
                >
                  <ShareSheet onSend={() => setStep("done")} onClose={() => setStep("done")} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* QR code scanner — full-screen modal */}
            <AnimatePresence>
              {step === "scanner" && (
                <motion.div
                  key="scanner"
                  className="td-scanner"
                  role="dialog"
                  aria-label="QR code scanner"
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={sheetSpring}
                >
                  <div className="td-scanner-camera" />
                  <div className="td-scanner-top">
                    <StatusBar theme="dark" />
                    <div className="td-nav td-nav-scanner">
                      <p className="td-nav-title">QR code scanner</p>
                      <button type="button" className="td-nav-trailing" onClick={() => setStep("intro")} aria-label="Close scanner">
                        <img src={`${dir}/close.svg`} alt="" />
                      </button>
                    </div>
                  </div>
                  <button type="button" className="td-scanner-target" onClick={() => setStep("share")} aria-label="Scan code">
                    <img className="td-scanner-qr" src={`${dir}/qr.png`} alt="" />
                    <img className="td-scanner-frame" src={`${dir}/qr-frame.svg`} alt="" />
                    <motion.span
                      className="td-scanner-line"
                      initial={{ top: "8%" }} animate={{ top: ["8%", "92%", "8%"] }}
                      transition={{ duration: SCAN_MS / 1000, ease: "easeInOut" }}
                    />
                  </button>
                  <div className="td-scanner-card">
                    <p className="td-scanner-title">Scan your code</p>
                    <p className="td-scanner-desc">Use the QR code to enroll securely in a new organization</p>
                    <button type="button" className="td-scanner-more">Learn more</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <span className="td-home" aria-hidden />
          </div>
          <Island />
        </div>
        </div>
        <div className="td-vignette" data-on={playing && drawer !== null} aria-hidden />
        <span className="td-finger" ref={fingerRef} aria-hidden />

        <div className="td-card-ui">
          {SHOW_THEME_SWITCH && (
            <div className="td-pill td-theme" role="radiogroup" aria-label="App appearance">
              {(["light", "dark"] as const).map((t) => (
                <button key={t} type="button" role="radio" aria-checked={theme === t} onClick={() => setTheme(t)}>
                  {t === "light" ? "Light" : "Dark"}
                </button>
              ))}
            </div>
          )}
          <AnimatePresence initial={false} mode="popLayout">
            {playing ? (
              <motion.span key="demo" className="td-pill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <span className="td-pill-dot" />
                <span>Playing<span className="td-pill-long"> — click to try it yourself</span></span>
              </motion.span>
            ) : step === "list" ? (
              <motion.span key="hint" className="td-pill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <span className="td-pill-dot" />
                <span>Interactive<span className="td-pill-long"> — tap through the flow</span></span>
              </motion.span>
            ) : (
              <motion.button key="restart" type="button" className="td-pill" onClick={() => { setStep("list"); setQuery(""); setAuto(true); }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Restart
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

// Dynamic Island, built at the mockup's own pixel size (370×108 at 3×) and scaled into points
function Island() {
  return (
    <div className="td-island" aria-hidden>
      <span className="td-lens td-lens-1">
        <span className="td-glint" style={{ left: 11, top: 12.86, width: 7.429, height: 22.286 }}><img src={`${dir}/glint-1.svg`} alt="" /></span>
        <span className="td-glint is-flipped" style={{ left: 29.57, top: 12.86, width: 7.429, height: 22.286 }}><img src={`${dir}/glint-2.svg`} alt="" /></span>
      </span>
      <span className="td-lens td-lens-2">
        <span className="td-lens-core">
          <span className="td-glint" style={{ left: 7.02, top: 9.36, width: 9.36, height: 28.08 }}><img src={`${dir}/glint-3.svg`} alt="" /></span>
          <span className="td-glint is-flipped" style={{ left: 30.42, top: 9.36, width: 9.36, height: 28.08 }}><img src={`${dir}/glint-4.svg`} alt="" /></span>
        </span>
      </span>
    </div>
  );
}

function StatusBar({ theme }: { theme: Theme }) {
  return (
    <div className="td-status" aria-hidden>
      <span className="td-status-time">9:41</span>
      <img className="td-status-signal" src={`${dir}/${themed("signal.svg", theme)}`} alt="" />
      <img className="td-status-wifi" src={`${dir}/${themed("wifi.svg", theme)}`} alt="" />
      <span className="td-status-battery"><img src={`${dir}/${themed("battery.svg", theme)}`} alt="" /></span>
    </div>
  );
}
