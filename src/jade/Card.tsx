import type React from "react";
import { cx } from "./cx";

export type CardTone = "yellow" | "lilac" | "pink" | "mint";

const HEADER_TONES: Record<CardTone, string> = {
  yellow: "bg-yellow",
  lilac: "bg-lilac",
  pink: "bg-pink",
  mint: "bg-mint",
};

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("brutal overflow-hidden rounded-xl bg-bg", className)} {...rest}>
      {children}
    </div>
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
}

export function CardHeader({ tone = "yellow", className, children, ...rest }: CardHeaderProps) {
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-2 border-b-2 border-ink px-4 py-2 text-onfill",
        HEADER_TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("p-4", className)} {...rest}>
      {children}
    </div>
  );
}
