import type React from "react";
import { cx } from "./cx";

const TONES = {
  default: "",
  ok: "badge-ok",
  danger: "badge-danger",
  warn: "badge-warn",
} as const;

export type BadgeTone = keyof typeof TONES;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "default", className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx("badge", TONES[tone], className)} {...rest}>
      {children}
    </span>
  );
}
