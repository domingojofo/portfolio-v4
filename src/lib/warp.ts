// How warped the page's lower half is: 1 = fully warped (top of the home page), 0 = flat. The work
// deck sets it from the scroll position; the dot grid and the deck's cards both read it.
// Everything outside (bottom blur, toolbar, ← → hint, LinkedIn/CV) is fixed UI and never warps.
//
// The warp is a curl out: above the hinge line (mid-hero) the page is flat; below it the page
// curls toward you more and more down to the bottom edge, so the bottom is magnified — bigger
// dots, rows spreading apart, cards leaning out at you. Scrolling eases the curl back flat.

/** The hinge line where the curl starts, as a fraction of the viewport height */
export const WARP_HINGE = 0.5;
/** How far the bottom edge comes toward you at full warp, in viewport heights (0.35 ≈ 1.5× size) */
export const WARP_DEPTH = 0.35;
/** Perspective distance, in viewport heights (must stay larger than WARP_DEPTH) */
export const WARP_PERSPECTIVE = 1.1;
/** Desktop only: extra sideways flare at the bottom edge on top of the curl (0.3 = 30% wider) */
export const WARP_FLARE = 0.3;
const isDesktop = () => typeof window !== "undefined" && matchMedia("(min-width: 1024px)").matches;

let value = 0;
const listeners = new Set<(w: number) => void>();

export const getWarp = () => value;

export function setWarp(w: number) {
  if (w === value) return;
  value = w;
  listeners.forEach((f) => f(w));
}

export function onWarp(f: (w: number) => void) {
  listeners.add(f);
  return () => { listeners.delete(f); };
}

const ease = (w: number) => w * w * (3 - 2 * w);

export type Bend = (u: number) => { drop: number; depth: number; angle: number; widen: number };

/**
 * The curled surface for a warp amount (null when flat). Maps a point `u` px below the hinge on
 * the flat page to where it sits: `drop` px below the hinge, `depth` px into the screen (negative
 * = toward you), and the surface's `angle` there (negative = its lower side comes toward you).
 * `widen` is the extra sideways stretch there (desktop: the bottom flares wider).
 * Depth grows with the square of the distance: zero slope at the hinge, so the join is smooth.
 * Below the screen it keeps curling but is capped short of the viewer.
 */
export function makeBend(w: number, viewportH: number): Bend | null {
  const e = ease(w);
  if (!e) return null;
  const span = viewportH * (1 - WARP_HINGE);       // hinge → bottom of the screen
  const D = viewportH * WARP_DEPTH * e;
  const nearest = viewportH * WARP_PERSPECTIVE * 0.8;
  const flare = isDesktop() ? WARP_FLARE * e : 0;
  return (u) => {
    if (u <= 0) return { drop: u, depth: 0, angle: 0, widen: 1 };
    const t = u / span;
    return {
      drop: u,
      depth: -Math.min(nearest, D * t * t),
      angle: -Math.atan((2 * D * t) / span),
      widen: 1 + flare * Math.min(1.5, t * t),
    };
  };
}
