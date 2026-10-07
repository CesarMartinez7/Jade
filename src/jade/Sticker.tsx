import type React from "react";
import { cx } from "./cx";

export type StickerProps = React.HTMLAttributes<HTMLSpanElement>;

export function Sticker({ className, children, ...rest }: StickerProps) {
  return (
    <span className={cx("sticker rounded-lg px-2.5 py-1 text-xs", className)} {...rest}>
      {children}
    </span>
  );
}
