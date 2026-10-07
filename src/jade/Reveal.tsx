import type React from "react";
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
  className?: string;
}

export function Reveal({ children, delay = 0, y = 16, once = true, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  const hidden = { opacity: 0, y };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduced ? false : hidden}
      animate={inView || reduced ? { opacity: 1, y: 0 } : hidden}
      transition={{ duration: 0.45, delay, ease: [0.2, 0.9, 0.3, 1] as const }}
    >
      {children}
    </motion.div>
  );
}
