import type React from "react";
import { forwardRef } from "react";
import { cx } from "./cx";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...rest }, ref) => (
  <input ref={ref} className={cx("input", className)} {...rest} />
));

Input.displayName = "Input";
