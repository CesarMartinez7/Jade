import type React from "react";
import { cx } from "./cx";

export type DividerProps = React.HTMLAttributes<HTMLSpanElement>;

export function Divider({ className, ...rest }: DividerProps) {
  return (
    <span
      aria-hidden="true"
      className={cx("mx-0.5 h-5 w-0.5 shrink-0 rounded-full bg-ink", className)}
      {...rest}
    />
  );
}
