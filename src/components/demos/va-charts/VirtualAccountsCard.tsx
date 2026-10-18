"use client";
/* eslint-disable @next/next/no-img-element -- static Figma icon */

import { animate, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { AreaChart } from "./AreaChart";
import {
  bucketLabel, compact, data, dollarParts, pointLabel, ranges, signedChange, type Range,
} from "./data";
import "./va-charts.css";

// Anchorage Virtual accounts — wallet FBO balance and transaction activity, recreated from
// the exploration file as live charts. Each chart has its own crosshair; the range menu
// re-scopes both. Until someone hovers, a slow "ghost hover" sweeps across both charts
// together, so the card shows what it does on its own.

const PLOT_H = 132;
const BLUE = "#5580f6";
const GRAY = "#cacbce";

export function VirtualAccountsCard() {
  const [range, setRange] = useState<Range>("24h");
  const [scrubB, setScrubB] = useState<number | null>(null);   // balance crosshair, 0–1
  const [scrubT, setScrubT] = useState<number | null>(null);   // transactions crosshair, 0–1
  const [auto, setAuto] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [balanceShown, setBalanceShown] = useState(data["24h"].balance);
  const shownRef = useRef(balanceShown);
  const reduce = useReducedMotion();
  const [balanceRef, balanceW] = useWidth();
  const [txRef, txW] = useWidth();
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const playing = auto && !reduce;

  const d = data[range];
  const meta = ranges.find((r) => r.id === range)!;

  // Morph the balance line into the new range's shape
  useEffect(() => {
    const from = shownRef.current, to = data[range].balance;
    const controls = animate(0, 1, {
      duration: reduce ? 0 : 0.7,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: (p) => {
        const next = from.map((v, i) => v + (to[i] - v) * p);
        shownRef.current = next;
        setBalanceShown(next);
      },
    });
    return () => controls.stop();
  }, [range, reduce]);

  // Ghost hover: sweep both charts together on a loop — only while the card is on screen, and
  // never again once a real visitor hovers or taps
  useEffect(() => {
    const card = cardRef.current;
    if (!playing || !card) return;
    let ctrl: AbortController | null = null;

    const play = async (signal: AbortSignal) => {
      const sleep = (ms: number) => new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, ms);
        signal.addEventListener("abort", () => { clearTimeout(t); reject(signal.reason); }, { once: true });
      });
      const sweep = (set: (v: number) => void, from: number, to: number, seconds: number) =>
        new Promise<void>((resolve, reject) => {
          const c = animate(from, to, { duration: seconds, ease: "easeInOut", onUpdate: set, onComplete: resolve });
          signal.addEventListener("abort", () => { c.stop(); reject(signal.reason); }, { once: true });
        });
      const both = (v: number) => { setScrubB(v); setScrubT(v); };
      for (;;) {
        await sleep(900);
        await sweep(both, 0.08, 0.95, 7);
        await sleep(900); setScrubB(null); setScrubT(null);
        await sleep(1400);
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !ctrl) {
        ctrl = new AbortController();
        play(ctrl.signal).catch(() => {});
      } else if (!entry.isIntersecting && ctrl) {
        ctrl.abort(); ctrl = null;
        setScrubB(null); setScrubT(null);
      }
    }, { threshold: 0.5 });
    io.observe(card);
    return () => { io.disconnect(); ctrl?.abort(); };
  }, [playing]);

  // The first real hover, tap or focus ends the ghost hover for good
  const takeOver = (e: { isTrusted: boolean }) => {
    if (!playing || !e.isTrusted) return;
    setAuto(false);
    setScrubB(null); setScrubT(null);
  };

  // Close the range menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: globalThis.PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  // ---- Balance readout ----
  const bi = scrubB === null ? d.balance.length - 1 : Math.round(scrubB * (d.balance.length - 1));
  const balance = d.balance[bi];
  const { int, cents } = dollarParts(balance);
  const balanceSub = scrubB === null
    ? signedChange(d.balance[0], balance)
    : `${signedChange(d.balance[0], balance)} · ${pointLabel(range, d.times[bi])}`;
  const lo = Math.min(...balanceShown), hi = Math.max(...balanceShown);
  const balanceDomain: [number, number] = [lo - (hi - lo) * 0.3, hi];

  // ---- Transactions readout ----
  const ti = scrubT === null ? null : Math.round(scrubT * (d.buckets.length - 1));
  const deposits = ti === null ? d.buckets.reduce((s, b) => s + b.deposits, 0) : d.buckets[ti].deposits;
  const withdrawals = ti === null ? d.buckets.reduce((s, b) => s + b.withdrawals, 0) : d.buckets[ti].withdrawals;
  const txMax = Math.max(...d.buckets.flatMap((b) => [b.deposits, b.withdrawals]));
  // Stable per range, so the chart's paths are only rebuilt when the data changes
  const balanceSeries = useMemo(() => [{ id: "balance", label: "Balance", values: balanceShown, stroke: BLUE, fill: BLUE }], [balanceShown]);
  const txSeries = useMemo(() => [
    { id: "deposits", label: "Deposits", values: data[range].buckets.map((b) => b.deposits), stroke: BLUE, fill: BLUE },
    { id: "withdrawals", label: "Withdrawals", values: data[range].buckets.map((b) => b.withdrawals), stroke: GRAY, fill: "#aaacb1" },
  ], [range]);

  // ---- Scrubbing: each chart on its own — pointer over its plot, or arrow keys when focused ----
  const plotProps = (count: number, label: string, scrub: number | null, setScrub: (v: number | null) => void) => {
    const onMove = (e: PointerEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      setScrub(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    };
    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      const step = 1 / (count - 1);
      const at = scrub ?? 1;
      const go = (f: number) => { e.preventDefault(); setScrub(Math.min(1, Math.max(0, Math.round(f / step) * step))); };
      if (e.key === "ArrowLeft") go(at - step * (e.shiftKey ? 10 : 1));
      else if (e.key === "ArrowRight") go(at + step * (e.shiftKey ? 10 : 1));
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(1);
      else if (e.key === "Escape") setScrub(null);
    };
    return {
      className: "va-plot",
      tabIndex: 0,
      role: "group" as const,
      "aria-label": `${label}. Use left and right arrow keys to read values.`,
      onPointerMove: onMove,
      onPointerDown: onMove,
      onPointerLeave: () => setScrub(null),
      onKeyDown,
      onBlur: () => setScrub(null),
    };
  };

  return (
    <div className="va-card" ref={cardRef}>
      {/* A small dithered image, shown as-is and scaled with hard pixel edges */}
      <Image src="/images/virtual-accounts-bg.png" alt="" fill unoptimized className="va-card-bg" />
      <div
        className="va-widget"
        onPointerEnter={takeOver}
        onPointerDown={takeOver}
        onFocusCapture={takeOver}
      >
        {/* Total wallet FBO balance */}
        <section className="va-panel va-panel-balance" aria-label="Total wallet FBO balance">
          <div className="va-legend">
            <span className="va-title">
              Total wallet FBO balance
              <img src="/demos/va-charts/info-circle.svg" alt="" width={16} height={16} title="Combined balance of all virtual account wallets" />
            </span>
            <div className="va-menu" ref={menuRef}>
              <button type="button" className="va-range" aria-haspopup="listbox" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
                {meta.label}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M4.5 6.5 8 10l3.5-3.5" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {menuOpen && (
                <ul className="va-options" role="listbox" aria-label="Time range">
                  {ranges.map((r) => (
                    <li key={r.id} role="option" aria-selected={r.id === range}>
                      <button type="button" onClick={() => { setRange(r.id); setMenuOpen(false); setScrubB(null); setScrubT(null); }}>
                        {r.label}
                        {r.id === range && (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                            <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="va-header" aria-live="polite" aria-atomic="true">
            <p className="va-value">
              <span className="va-unit">$</span>
              <span className="va-big">{int}</span>
              <span className="va-unit">.{cents}</span>
            </p>
            <p className="va-sub">{balanceSub}</p>
          </div>
          <div ref={balanceRef} {...plotProps(d.balance.length, "Total wallet FBO balance chart", scrubB, setScrubB)}>
            <AreaChart
              width={balanceW}
              height={PLOT_H}
              series={balanceSeries}
              domain={balanceDomain}
              scrub={scrubB}
              live
            />
          </div>
        </section>

        {/* Transactions activity */}
        <section className="va-panel va-panel-tx" aria-label="Transactions activity">
          <div className="va-legend va-legend-tx">
            <span className="va-title">
              Transactions activity
              <img src="/demos/va-charts/info-circle.svg" alt="" width={16} height={16} title="Deposits and withdrawals across virtual accounts" />
            </span>
          </div>
          <div className="va-totals" aria-live="polite" aria-atomic="true">
            <div>
              <p className="va-big">{compact(deposits)}</p>
              <p className="va-key"><span style={{ background: BLUE }} />Total deposits</p>
            </div>
            <div>
              <p className="va-big">{compact(withdrawals)}</p>
              <p className="va-key"><span style={{ background: GRAY }} />Total withdrawals</p>
            </div>
            {/* while hovering, the period these totals cover, on the same line as their keys */}
            {ti !== null && <p className="va-period">{bucketLabel(range, d.buckets[ti])}</p>}
          </div>
          <div ref={txRef} {...plotProps(d.buckets.length, "Transactions activity chart", scrubT, setScrubT)}>
            <AreaChart
              width={txW}
              height={PLOT_H}
              series={txSeries}
              domain={[0, txMax * 1.05]}
              scrub={scrubT}
              reveal={range}
            />
          </div>
        </section>
      </div>

      {/* The same numbers without hovering */}
      <table className="va-sr-only">
        <caption>Transactions activity, {meta.past}</caption>
        <thead><tr><th scope="col">Period</th><th scope="col">Deposits</th><th scope="col">Withdrawals</th><th scope="col">Balance at end</th></tr></thead>
        <tbody>
          {d.buckets.map((b, i) => (
            <tr key={b.at}>
              <th scope="row">{bucketLabel(range, b)}</th>
              <td>{compact(b.deposits)}</td>
              <td>{compact(b.withdrawals)}</td>
              <td>${dollarParts(d.balance[Math.round(((i + 1) / d.buckets.length) * (d.balance.length - 1))]).int}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}
