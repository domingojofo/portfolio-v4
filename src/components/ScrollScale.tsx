"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

// Scroll-linked zoom (after jasonsbmoc.com): a panel is a little smaller as it enters from the
// bottom, reaches full size through the middle of the screen, and shrinks again as it leaves.
const MIN = 0.86;   // scale at the screen edges

export function ScrollScale({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // 0 = the panel's top touches the bottom of the screen, 1 = its bottom leaves the top
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const raw = useTransform(scrollYProgress, [0, 0.38, 0.62, 1], [MIN, 1, 1, MIN]);
  const scale = useSpring(raw, { stiffness: 260, damping: 40, mass: 0.4 });   // smooths out jumpy touch scrolling

  return (
    <motion.div ref={ref} className="scroll-scale" style={reduce ? undefined : { scale }}>
      {children}
    </motion.div>
  );
}
