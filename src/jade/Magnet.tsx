import type React from "react";
import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { cx } from "./cx";

export interface MagnetProps {
  children: React.ReactNode;
  radius?: number;
  strength?: number;
  className?: string;
}

export function Magnet({ children, radius = 140, strength = 0.4, className }: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 200, damping: 15, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 200, damping: 15, mass: 0.4 });
  const reduced = useReducedMotion();

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (reduced || !el) return;
    const rect = el.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < radius) {
      rawX.set(dx * strength);
      rawY.set(dy * strength);
    } else {
      rawX.set(0);
      rawY.set(0);
    }
  };

  const reset = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={cx("inline-flex", className)}
      style={{ x, y }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      {children}
    </motion.div>
  );
}
