"use client";

import { motion } from "motion/react";
import { useId, useMemo } from "react";

// A lean SVG area chart in the spirit of Coinbase CDS: linear segments, a soft gradient
// fill, and a scrubber that snaps to the nearest point. One y-scale for every series.

export type Series = { id: string; values: number[]; stroke: string; fill: string; label: string };

const TOP = 4;                      // keeps the stroke at the series' peak inside the box
const GRID = [28.5, 80.5];          // the design's dashed rules, in a 132pt-tall plot

export function AreaChart({
  width, height, series, domain, scrub, reveal, live,
}: {
  width: number;
  height: number;
  series: Series[];
  domain: [number, number];
  scrub: number | null;             // 0–1 across the time axis; null when nobody is hovering
  reveal?: string;                  // changing it redraws the chart left to right
  live?: boolean;                   // pulse on the latest point of the first series
}) {
  const uid = useId().replace(/:/g, "");
  const [lo, hi] = domain;
  const n = series[0].values.length;
  const x = (i: number) => 1 + (i / (n - 1)) * (width - 2);
  const y = (v: number) => TOP + (1 - (v - lo) / (hi - lo || 1)) * (height - TOP);

  // Path strings depend only on data and size — a moving crosshair re-renders without rebuilding them
  const paths = useMemo(() => {
    const px = (i: number) => 1 + (i / (n - 1)) * (width - 2);
    const py = (v: number) => TOP + (1 - (v - lo) / (hi - lo || 1)) * (height - TOP);
    return series.map((s) => {
      const line = s.values.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(2)} ${py(v).toFixed(2)}`).join("");
      return { id: s.id, line, area: `${line}L${px(n - 1).toFixed(2)} ${height}L${px(0).toFixed(2)} ${height}Z` };
    });
  }, [series, width, height, lo, hi, n]);

  if (width <= 0) return <svg width="100%" height={height} aria-hidden />;

  const index = scrub === null ? null : Math.round(scrub * (n - 1));
  const sx = index === null ? 0 : x(index);
  const last = series[0].values[n - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="va-svg" aria-hidden>
      <defs>
        {series.map((s) => (
          <linearGradient key={s.id} id={`${uid}-${s.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor={s.fill} stopOpacity=".3" />
            <stop offset="1" stopColor={s.fill} stopOpacity="0" />
          </linearGradient>
        ))}
        <clipPath id={`${uid}-reveal`}>
          <motion.rect
            key={reveal}
            x="0" y="-8" height={height + 16}
            initial={{ width: reveal ? 0 : width }}
            animate={{ width }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          />
        </clipPath>
      </defs>

      {GRID.map((g) => (
        <line key={g} x1="0" x2={width} y1={g} y2={g} className="va-grid" />
      ))}

      <g clipPath={`url(#${uid}-reveal)`}>
        {paths.map((p) => <path key={p.id} d={p.area} fill={`url(#${uid}-${p.id})`} />)}
        {paths.map((p, i) => (
          <path key={p.id} d={p.line} fill="none" stroke={series[i].stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </g>

      {index !== null && (
        <>
          {/* everything after the scrubber steps back */}
          <rect x={sx} y="0" width={Math.max(0, width - sx)} height={height} className="va-dim" />
          <line x1={sx} x2={sx} y1="0" y2={height} className="va-hairline" />
          {series.map((s) => (
            <circle key={s.id} cx={sx} cy={y(s.values[index])} r="4" fill={s.stroke} className="va-dot" />
          ))}
        </>
      )}

      {live && index === null && (
        <g transform={`translate(${x(n - 1)} ${y(last)})`}>
          <circle r="4" fill={series[0].stroke} className="va-pulse" />
          <circle r="4" fill={series[0].stroke} className="va-dot" />
        </g>
      )}
    </svg>
  );
}
