import type React from "react";
import { forwardRef } from "react";
import { cx } from "./cx";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...rest }, ref) => (
    <textarea ref={ref} className={cx("textarea brutal-sm rounded-lg", className)} {...rest} />
  ),
);

Textarea.displayName = "Textarea";
