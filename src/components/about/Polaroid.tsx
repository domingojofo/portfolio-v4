"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

// The polaroid over the opening (Figma 590:32299): white border, tilted 7°. It drops in on load,
// then leans toward the pointer — drifting a little after it and tilting in 3D, eased so it glides
// rather than snaps. The offset rides on --px / --py (−1…1 across the screen). Touch screens and
// reduced motion: it just sits at its tilt.
export function Polaroid() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (matchMedia("(prefers-reduced-motion: reduce), (hover: none)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const tick = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.setProperty("--px", x.toFixed(4));
      el.style.setProperty("--py", y.toFixed(4));
      raf = Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    addEventListener("pointermove", onMove, { passive: true });
    return () => { removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="ab-polaroid">
      <div className="ab-polaroid-card" ref={ref}>
        <Image src="/images/about/polaroid.jpg" width={900} height={675} sizes="173px" alt="Jofo smiling by a river at sunset" priority />
      </div>
    </div>
  );
}
