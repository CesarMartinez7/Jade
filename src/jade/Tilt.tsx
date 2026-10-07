import type React from "react";
import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { cx } from "./cx";

export interface TiltProps {
  children: React.ReactNode;
  max?: number;
  className?: string;
}

export function Tilt({ children, max = 12, className }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rawRx = useMotionValue(0);
  const rawRy = useMotionValue(0);
  const rotateX = useSpring(rawRx, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(rawRy, { stiffness: 200, damping: 20 });
  const reduced = useReducedMotion();

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (reduced || !el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rawRy.set((px - 0.5) * 2 * max);
    rawRx.set(-(py - 0.5) * 2 * max);
  };

  const reset = () => {
    rawRx.set(0);
    rawRy.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={cx("inline-block", className)}
      style={{ perspective: 800 }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
        {children}
      </motion.div>
    </motion.div>
  );
}
