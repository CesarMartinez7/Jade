import type React from "react";
import { cx } from "./cx";

export interface ShinyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  speed?: number;
}

export function ShinyText({ speed = 3, className, style, children, ...rest }: ShinyTextProps) {
  return (
    <span
      className={cx("shiny-text", className)}
      style={{ animationDuration: `${speed}s`, ...style }}
      {...rest}
    >
      {children}
    </span>
  );
}
