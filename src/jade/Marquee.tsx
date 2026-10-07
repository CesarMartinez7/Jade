import type React from "react";
import { cx } from "./cx";

export interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  className?: string;
}

export function Marquee({
  children,
  speed = 20,
  reverse = false,
  pauseOnHover = true,
  className,
}: MarqueeProps) {
  return (
    <div className={cx("marquee relative flex overflow-hidden", className)}>
      <div
        className="marquee-track flex w-max shrink-0"
        style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
        data-reverse={reverse}
        data-pause={pauseOnHover}
      >
        <div className="flex shrink-0 items-center gap-4 pr-4">{children}</div>
        <div className="flex shrink-0 items-center gap-4 pr-4" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
