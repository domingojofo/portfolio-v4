"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "./anchorage-scene.css";

// Anchorage cover: the Cash management app (built in the portfolio-apps repo, exported to
// /demos/cash-management/) playing its own hands-off tour (?autoplay) over The Creation of Adam —
// it idles, hovers the balances and holdings, filters, scrolls down to the allocation and zooms in
// and out. Nobody can interact with it; the card around it stays clickable.
//  - Wide boxes show it in a browser window rising from the bottom (the app at 1440 × 900)
//  - Narrow ones (phones) show it in a phone, running the app's mobile tour (390 × 844)
// The app asks for its zoom by postMessage ({ type: "cm-zoom", x, y, scale }) and this frame zooms
// its view: a camera move on the window. It plays only while on screen and `live` (the deck passes
// false when it isn't the front card, or a project is open over it).

const APP = "/demos/cash-management/index.html";
const SCREENS = { desktop: { w: 1440, h: 900 }, phone: { w: 390, h: 844 } } as const;
const PHONE_BELOW = 520;   // px wide: below this, the phone
// The tour, or with reduced motion the app as a still (only called once mounted: the iframe waits for `near`)
const appSrc = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? APP : `${APP}?autoplay`);

export function AnchorageScene({ live = true }: { live?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const camRef = useRef<HTMLSpanElement>(null);
  const [mode, setMode] = useState<"desktop" | "phone" | null>(null);
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const scale = useRef(1);

  // Pick the device for the box, and scale the app's screen to the window
  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(([e]) => {
      const m = e.contentRect.width < PHONE_BELOW ? "phone" : "desktop";
      setMode(m);
      const screen = el.querySelector<HTMLElement>(".ans-screen");
      if (screen) {
        scale.current = screen.clientWidth / SCREENS[m].w;
        el.style.setProperty("--ans-s", String(scale.current));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  // Load the app once the card is close to the viewport; play while it's on screen
  useEffect(() => {
    const el = ref.current!;
    const soon = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setNear(true); soon.disconnect(); }
    }, { rootMargin: "300px" });
    const seen = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.15 });
    soon.observe(el);
    seen.observe(el);
    return () => { soon.disconnect(); seen.disconnect(); };
  }, []);

  // Pause and resume the tour
  const play = live && onScreen;
  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage({ type: "cm-demo", play }, "*");
  }, [play, near, mode]);

  // Zoom the view when the app asks
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow || e.data?.type !== "cm-zoom") return;
      const cam = camRef.current;
      if (!cam) return;
      const { x, y, scale: z } = e.data as { x: number; y: number; scale: number };
      cam.style.transformOrigin = `${x * scale.current}px ${y * scale.current}px`;
      cam.style.transform = z === 1 ? "" : `scale(${z})`;
    };
    addEventListener("message", onMessage);
    return () => removeEventListener("message", onMessage);
  }, []);

  const screen = mode ? SCREENS[mode] : null;
  return (
    <span className="ans" ref={ref} data-mode={mode ?? undefined} aria-hidden>
      <Image className="ans-bg" src="/images/anchorage-creation.jpg" alt="" fill sizes="(max-width: 1023px) 100vw, 980px" />
      {screen && (
        <span className={mode === "phone" ? "ans-phone" : "ans-window"}>
          <span className="ans-screen">
            <span className="ans-cam" ref={camRef}>
              {near && (
                <iframe
                  key={mode}
                  ref={frameRef}
                  src={appSrc()}
                  title="Anchorage cash management, touring itself"
                  width={screen.w}
                  height={screen.h}
                  tabIndex={-1}
                  onLoad={() => frameRef.current?.contentWindow?.postMessage({ type: "cm-demo", play }, "*")}
                />
              )}
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
