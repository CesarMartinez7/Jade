import type React from "react";
import { cx } from "./cx";

export type KbdProps = React.HTMLAttributes<HTMLElement>;

export function Kbd({ className, children, ...rest }: KbdProps) {
  return (
    <kbd className={cx(className)} {...rest}>
      {children}
    </kbd>
  );
}
