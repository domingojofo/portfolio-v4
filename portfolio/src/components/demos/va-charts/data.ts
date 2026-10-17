// Sample data for the Virtual accounts charts. The 24hr series are traced from the Figma
// design; the longer ranges are seeded random walks with the same character. Everything is
// deterministic so server and client render the same numbers.

export type Range = "24h" | "7d" | "30d" | "1y";

export const ranges: { id: Range; label: string; past: string }[] = [
  { id: "24h", label: "24hr", past: "past 24h" },
  { id: "7d", label: "7d", past: "past 7d" },
  { id: "30d", label: "30d", past: "past 30d" },
  { id: "1y", label: "1y", past: "past year" },
];

// `at` is where the bucket is plotted — evenly spaced from the range's start to now, so a
// crosshair reads the same moment on both charts
export type Bucket = { at: number; deposits: number; withdrawals: number };
export type RangeData = {
  times: number[];        // balance sample times (ms), oldest first
  balance: number[];      // same length as times
  buckets: Bucket[];      // transaction totals per period
};

const NOW = Date.UTC(2026, 9, 13, 15, 0);   // the moment "now" is pinned to
const BALANCE_NOW = 10_000_000;
const POINTS = 241;                           // every range has the same count so lines can morph
const HOUR = 3_600_000, DAY = 24 * HOUR;

// Balance trace from the design: pixel heights in a 156pt-tall graph (lower = more money)
const figmaBalance = [104.3,105.8,107.3,101.2,106.6,101.9,120.5,114.3,115.1,100.4,103.5,97.3,99.6,99.6,91.1,99.6,95.8,86.5,98.1,98.1,108.9,47.1,40.9,40.2,51.0,48.7,57.9,40.2,42.5,50.2,51.0,50.2,45.6,49.4,44.8,44.0,50.2,49.4,44.8,44.0,41.7,44.0,44.8,41.7,43.2,43.2,47.9,47.1,47.9,49.4,50.2,61.8,62.6,61.8,62.6,50.2,51.0,50.2,43.2,42.5,44.0,53.3,55.6,46.3,47.1,42.5,50.2,49.4,42.5,47.9,49.4,47.9,43.2,42.5,45.6,44.8,28.6,23.9,17.0,34.0,34.8,34.0,44.0,43.2,44.0,55.6,52.5,81.1,73.4,72.6,80.3,74.9,73.4,72.6,73.4,47.9,48.7,47.9,56.4,55.6,56.4,55.6,47.1,48.7,47.1,46.3,46.3,44.8,56.4,55.6,56.4,55.6,56.4,55.6,56.4,55.6,44.8,44.0,44.8,44.0,44.0,43.2,44.0,59.5,61.0,53.3,54.1,59.5,51.0,50.2,44.0,43.2,44.0,44.0,50.2,49.4,46.3,45.6,48.7,13.1,20.9,34.0,48.7,47.9,48.7,47.9,39.4,26.3,27.8,27.0,40.2,54.1,42.5,51.0,56.4,55.6,56.4,55.6,56.4,47.1,47.9,47.1,62.6,47.9,51.7,51.0,48.7,48.7,49.4,55.6,56.4,55.6,52.5,51.7,52.5,44.0,40.9,51.7,52.5,51.7,47.1,46.3,42.5,28.6,29.3,23.9,27.0,27.0,25.5,33.2,30.9,34.8,44.0,49.4,50.2,51.0,60.2,59.5,48.7,37.1,49.4,44.8,45.6,38.6,39.4,38.6,36.3,18.5,7.7,7.0,0.8,0.0,7.7,0.0,13.1,3.9,7.7,7.0,16.2,33.2,37.8,28.6,33.2,51.7,42.5,32.4,33.2,31.7,23.2,25.5,24.7,23.9,24.7,23.9,21.6,0.0,0.8,7.7,8.5,3.1,3.9];

// Transactions from the design: relative heights of each 2-hour bucket
const figmaDeposits = [61, 61, 21.6, 42, 31.7, 126.5, 96, 88, 121.3, 144.6, 135, 140.2];
const figmaWithdrawals = [61, 31.7, 41.7, 31.7, 21.7, 42, 31.7, 21.7, 45.5, 36.5, 115, 18.5];

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (rand: () => number) => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());

// A random walk pinned to start and end values (a Brownian bridge), with a few step jumps
// like the large deposits in the design
function walk(seed: number, start: number, end: number, vol: number) {
  const rand = mulberry32(seed);
  const n = POINTS - 1;
  const w = [0];
  for (let i = 1; i <= n; i++) {
    const jump = rand() < 0.02 ? (rand() - 0.35) * 14 : 0;
    w.push(w[i - 1] + gauss(rand) + jump);
  }
  return w.map((v, i) => start + ((end - start) * i) / n + (v - (w[n] * i) / n) * vol);
}

function buckets(count: number, span: number, make: (i: number) => [number, number]): Bucket[] {
  return Array.from({ length: count }, (_, i) => {
    const [deposits, withdrawals] = make(i);
    return { at: NOW - span + (span * i) / (count - 1), deposits, withdrawals };
  });
}

function generated(seed: number, span: number, startBalance: number, vol: number, count: number, depositMean: number): RangeData {
  const rand = mulberry32(seed * 7 + 1);
  return {
    times: Array.from({ length: POINTS }, (_, i) => NOW - span + (span * i) / (POINTS - 1)),
    balance: walk(seed, startBalance, BALANCE_NOW, vol),
    buckets: buckets(count, span, (i) => {
      const trend = 0.75 + (0.5 * i) / count;
      return [depositMean * trend * (0.45 + rand() * 1.1), depositMean * 0.38 * (0.35 + rand() * 1.3)];
    }),
  };
}

const PER_POINT = 12_000;   // dollars per design pixel, so 24h ends at $10M
const DEPOSIT_UNIT = 1_200_000 / figmaDeposits.reduce((a, b) => a + b, 0);

export const data: Record<Range, RangeData> = {
  "24h": {
    times: Array.from({ length: POINTS }, (_, i) => NOW - DAY + (DAY * i) / (POINTS - 1)),
    balance: figmaBalance.map((y) => BALANCE_NOW - (y - figmaBalance[POINTS - 1]) * PER_POINT),
    // one dollar scale for both series — withdrawals keep their drawn height relative to deposits
    buckets: buckets(12, DAY, (i) => [figmaDeposits[i] * DEPOSIT_UNIT, figmaWithdrawals[i] * DEPOSIT_UNIT * 0.8]),
  },
  "7d": generated(7, 7 * DAY, 8_400_000, 52_000, 7, 640_000),
  "30d": generated(30, 30 * DAY, 7_100_000, 95_000, 30, 520_000),
  "1y": generated(365, 365 * DAY, 3_900_000, 240_000, 12, 14_000_000),
};

// ---------- Formatting ----------
const usd = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function dollarParts(v: number) {
  const [int, cents] = usd.format(Math.abs(v)).split(".");
  return { int, cents };
}

export function signedChange(from: number, to: number) {
  const diff = to - from;
  const sign = diff < 0 ? "-" : "+";
  return `${sign}$${usd.format(Math.abs(diff))} (${sign}${Math.abs((diff / from) * 100).toFixed(2)}%)`;
}

export function compact(v: number) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1).replace(/\.0$/, "")}m`;
  if (v >= 1e3) return `$${Math.round(v / 1e3)}k`;
  return `$${Math.round(v)}`;
}

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...o });
const day = fmt({ month: "short", day: "numeric" });
const month = fmt({ month: "short", year: "numeric" });
const time = fmt({ hour: "numeric", minute: "2-digit" });
const hour = fmt({ hour: "numeric" });
// Date and time are formatted separately and joined: combined date+time patterns differ between
// ICU versions ("Oct 12 at 3 PM" in Node vs "Oct 12, 3 PM" in Safari), which broke hydration.
const dateTime = (t: number) => `${day.format(t)}, ${time.format(t)}`;
const dayHour = (t: number) => `${day.format(t)}, ${hour.format(t)}`;

export function pointLabel(range: Range, t: number) {
  return range === "24h" || range === "7d" ? dateTime(t) : day.format(t);
}

export function bucketLabel(range: Range, b: Bucket) {
  if (range === "24h") return dayHour(b.at);
  if (range === "1y") return month.format(b.at);
  return day.format(b.at);
}
