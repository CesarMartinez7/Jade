import type React from "react";
import { cx } from "./cx";

export type PanelTone = "yellow" | "lilac" | "pink" | "mint";

const TONES: Record<PanelTone, string> = {
  yellow: "var(--color-yellow)",
  lilac: "var(--color-lilac)",
  pink: "var(--color-pink)",
  mint: "var(--color-mint)",
};

export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  tone?: PanelTone;
}

export function Panel({ tone, className, style, children, ...rest }: PanelProps) {
  const toneStyle = tone ? ({ "--tone": TONES[tone] } as React.CSSProperties) : undefined;
  return (
    <section className={cx("panel", className)} style={{ ...toneStyle, ...style }} {...rest}>
      {children}
    </section>
  );
}

export function PanelHeader({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("panel-header", className)} {...rest}>
      {children}
    </div>
  );
}

export function PanelTitle({ className, children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cx("panel-title", className)} {...rest}>
      {children}
    </h2>
  );
}

export function PanelBody({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("min-h-0 flex-1 overflow-auto", className)} {...rest}>
      {children}
    </div>
  );
}
