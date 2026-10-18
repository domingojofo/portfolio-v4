// Pixel dissolve for a work-deck card. The card is drawn once into a canvas (background, cover
// image, title and summary); the canvas then steps through coarser blocks while random blocks drop
// out and it fades a little ("out"), or the reverse ("in"). By the end of "out" it's fully gone.
// The work deck only uses "in" (cards fade out without pixels). While it runs the real card is hidden behind the canvas
// (.px-active); after "out" it stays hidden until an "in" brings it back.

const STEPS = [1, 2, 4, 7, 11, 16, 24];   // block size in px, sharp → coarse
const FRAME_MS = 40;                       // ticks at ~25fps, so it reads as stepped, not smooth

const hash = (x: number, y: number) => {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};

type Snap = { src: HTMLCanvasElement; w: number; h: number };
const snaps = new WeakMap<HTMLElement, Snap>();

function snapshot(card: HTMLElement): Snap {
  const w = card.offsetWidth, h = card.offsetHeight;
  const cached = snaps.get(card);
  if (cached && cached.w === w && cached.h === h) return cached;

  const dpr = Math.min(2, devicePixelRatio || 1);
  const src = document.createElement("canvas");
  src.width = w * dpr; src.height = h * dpr;
  const g = src.getContext("2d")!;
  g.scale(dpr, dpr);

  // Card-local coordinates: the card may be scaled (stack depth), so undo that
  const cr = card.getBoundingClientRect(), sc = cr.width / w || 1;
  const local = (r: DOMRect) => ({ x: (r.left - cr.left) / sc, y: (r.top - cr.top) / sc, w: r.width / sc, h: r.height / sc });

  g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--stage").trim() || "#D9D9D2";
  g.fillRect(0, 0, w, h);

  const box = card.querySelector<HTMLElement>(".deck-img");
  const img = box?.querySelector("img");
  if (box) {
    const b = local(box.getBoundingClientRect());
    g.fillStyle = getComputedStyle(box).backgroundColor;
    g.fillRect(b.x, b.y, b.w, b.h);
    if (img && img.complete && img.naturalWidth) {
      // object-fit: cover
      const s = Math.max(b.w / img.naturalWidth, b.h / img.naturalHeight);
      const sw = b.w / s, sh = b.h / s;
      g.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, b.x, b.y, b.w, b.h);
    }
  }

  // Text, word by word at its laid-out position
  card.querySelectorAll<HTMLElement>(".deck-title, .deck-summary").forEach((el) => {
    const cs = getComputedStyle(el);
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    g.fillStyle = cs.color;
    g.textBaseline = "middle";
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      for (const m of node.data.matchAll(/\S+/g)) {
        range.setStart(node, m.index!);
        range.setEnd(node, m.index! + m[0].length);
        const r = range.getClientRects()[0];
        if (!r) continue;
        const l = local(r);
        g.fillText(m[0], l.x, l.y + l.h / 2);
      }
    }
  });

  const snap = { src, w, h };
  snaps.set(card, snap);
  return snap;
}

export function pixelCard(card: HTMLElement, dir: "out" | "in", { duration = 480, blur = 0 } = {}) {
  const { src, w, h } = snapshot(card);
  const dpr = src.width / w;
  let cv = card.querySelector<HTMLCanvasElement>(":scope > .px-canvas");
  if (!cv) {
    cv = document.createElement("canvas");
    cv.className = "px-canvas";
    card.appendChild(cv);
  }
  cv.width = src.width; cv.height = src.height;
  const ctx = cv.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const small = document.createElement("canvas");
  const smx = small.getContext("2d")!;
  card.classList.add("px-active");

  const draw = (q: number) => {   // q: 0 = sharp and whole, 1 = coarsest and gone
    ctx.clearRect(0, 0, w, h);
    const b = STEPS[Math.min(STEPS.length - 1, Math.floor(q * STEPS.length))];
    const drop = Math.min(1, Math.max(0, (q - 0.3) / 0.65));
    if (drop >= 1) return;
    if (b === 1) ctx.drawImage(src, 0, 0, w, h);
    else {
      const gw = Math.ceil(w / b), gh = Math.ceil(h / b);
      small.width = gw; small.height = gh;
      smx.drawImage(src, 0, 0, gw, gh);
      ctx.drawImage(small, 0, 0, gw, gh, 0, 0, gw * b, gh * b);
      if (drop > 0) for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        if (hash(x, y) < drop) ctx.clearRect(x * b, y * b, b, b);
      }
    }
    cv!.style.filter = blur ? `blur(${(blur * q).toFixed(2)}px)` : "";
    cv!.style.opacity = String(1 - q * q * 0.6);   // a small fade on top of the blocks dropping out
  };

  // Draw the starting state straight away, so the card never flashes empty before the first frame;
  // the clock starts on that first frame
  draw(dir === "out" ? 0 : 1);
  return new Promise<void>((done) => {
    let t0 = 0, last = -Infinity;
    const frame = (now: number) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / duration);
      if (now - last >= FRAME_MS || p === 1) {
        last = now;
        draw(dir === "out" ? p : 1 - p);
      }
      if (p < 1) return requestAnimationFrame(frame);
      if (dir === "in") {
        cv!.remove();
        card.classList.remove("px-active");
      }
      done();
    };
    requestAnimationFrame(frame);
  });
}
