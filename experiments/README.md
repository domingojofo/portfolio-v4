# Experiments

Standalone HTML prototypes, kept for reference. Open them directly in a browser (or serve this
folder with `python3 -m http.server 8000`). They aren't part of the Next.js build.

- `hero-tunnel.html` — tunnel carousel hero: image cards on a curved wall, bottom-aligned on one
  baseline, infinite scroll. Its headline reveal now lives in the app as `src/lib/reveal.ts`;
  the carousel isn't in the app yet. Swap images in the `WORK` list; `?final` skips the intro.
- `hero-v3-static.html` — the v3 hero ("Relentlessly Collaborative" typing + grid lines).
