import { animate } from "motion/react";

// The "Relentlessly Collaborative" word reveal, used by the hero headline and page headings.
// Markup comes from <RevealWords>: each word is a masked .rv-w holding a .rv-in.
//
// Per word: drops in from right above its slot at 20% size, letters scrambling → holds there,
// still scrambling → snaps to full size from its top centre while the letters lock in.
// With `stack`, a word on the next line rests tucked right under the previous small word, gets
// shoved down into its slot when that word jumps, and is forced to grow straight after.

const GLYPHS = "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz0123456789#*+=/<>?";   // mostly lowercase so widths stay close to the real word
const KEEP = /[\s’'.,!?-]/;      // punctuation stays put while the rest scrambles
const SMALL = 0.2;
const EASE_DROP: [number, number, number, number] = [0.3, 0, 0.6, 1];
const EASE_SNAP: [number, number, number, number] = [0.2, 0.9, 0.3, 1];
/** Where words wait before their drop: above the mask, small */
export const REVEAL_PARKED = `translateY(-120%) scale(${SMALL})`;

export type RevealOptions = {
  delay?: number;    // s before the first word
  each?: number;     // s between words starting
  creep?: number;    // s of the slow drop
  hold?: number;     // s held small before the jump
  snap?: number;     // s of the jump to full size
  stack?: boolean;   // tuck each new line's word under the previous one (see above)
  recoil?: number;   // stack: s between being shoved down and growing
};

const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function reveal(root: HTMLElement, opts: RevealOptions = {}) {
  const { delay = 0, each = 0.12, creep = 0.7, hold = 0.3, snap = 0.2, stack = false, recoil = 0.05 } = opts;
  const words = [...root.querySelectorAll<HTMLElement>(".rv-in")];
  let cancelled = false;
  const stops: (() => void)[] = [];
  const finals = words.map((w) => w.dataset.text ?? w.textContent ?? "");

  words.forEach((w) => (w.style.transform = REVEAL_PARKED));
  let prevSnap = -Infinity;
  const ends: number[] = [];

  words.forEach((w, i) => {
    const start = delay + i * each, arrive = start + creep;

    // Where the small word rests: its own slot, or tucked under the previous small word
    let rest = 0;
    const mask = w.parentElement!;
    const box = mask.getBoundingClientRect();
    const prev = i ? words[i - 1].parentElement!.getBoundingClientRect() : null;
    if (stack && prev && box.top > prev.bottom - 1) {
      rest = prev.top + prev.height * SMALL - box.top;                        // px, negative = above the slot
      mask.style.clipPath = `inset(calc(${rest}px - 0.12em) -0.3em -0.3em -0.3em)`;   // open the mask up to it
    }

    const enter = `${rest - box.height * 1.2}px`;                            // fully above the (opened) mask
    let y: string[], scale: number[], at: number[], ease: (typeof EASE_SNAP | "linear")[], snapAt: number;
    if (rest) {
      // drop → wait for the word above to jump → shoved down with it → grows almost straight away
      const push = Math.max(arrive, prevSnap);
      snapAt = push + snap + recoil;
      y = [enter, `${rest}px`, `${rest}px`, "0px", "0px", "0px"];
      scale = [SMALL, SMALL, SMALL, SMALL, SMALL, 1];
      at = [start, arrive, push, push + snap, snapAt, snapAt + snap];
      ease = [EASE_DROP, "linear", EASE_SNAP, "linear", EASE_SNAP];
    } else {
      snapAt = arrive + hold;
      y = [enter, "0px", "0px", "0px"];
      scale = [SMALL, SMALL, SMALL, 1];
      at = [start, arrive, snapAt, snapAt + snap];
      ease = [EASE_DROP, "linear", EASE_SNAP];
    }
    const total = at[at.length - 1] - start;
    const anim = animate(w, { y, scale }, { delay: start, duration: total, times: at.map((t) => (t - start) / total), ease });
    stops.push(() => anim.stop());
    scramble(w, finals[i], snapAt, snap, () => cancelled);
    prevSnap = snapAt;
    ends.push(snapAt + snap);
  });

  const cleanUp = () => {
    words.forEach((w, i) => {
      w.textContent = finals[i];
      w.style.width = "";
      w.style.transform = "";
      w.parentElement!.style.clipPath = "";
    });
  };

  const finished = new Promise<void>((resolve) => {
    const last = Math.max(0, ...ends);
    const t = setTimeout(() => { if (!cancelled) { cleanUp(); resolve(); } }, last * 1000 + 50);
    stops.push(() => clearTimeout(t));
  });

  return {
    finished,
    /** Stop mid-way and show the finished text */
    cancel() {
      cancelled = true;
      stops.forEach((stop) => stop());
      cleanUp();
    },
  };
}

// Letters keep flickering (~16fps) through the drop and the hold, then lock in left to right
// during the snap. Times in s from now.
function scramble(span: HTMLElement, final: string, snapAt: number, snap: number, isCancelled: () => boolean) {
  const n = final.length;
  span.style.width = span.offsetWidth + "px";   // hold the final (unscaled) width so lines don't jump
  const t0 = performance.now();
  let last = 0;
  const render = (locked: number) => {
    let tail = "";
    for (let i = locked; i < n; i++) tail += KEEP.test(final[i]) ? final[i] : glyph();
    span.innerHTML = esc(final.slice(0, locked)) + (tail && `<span class="rv-scr">${esc(tail)}</span>`);
  };
  const frame = (now: number) => {
    if (isCancelled()) return;
    const t = (now - t0) / 1000;
    if (t >= snapAt + snap) { span.textContent = final; return; }
    if (t >= snapAt) render(Math.floor((n * (t - snapAt)) / snap));
    else if (now - last > 60) { last = now; render(0); }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
