import type React from "react";
import { cx } from "./cx";

export interface FieldProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  label: string;
  hint?: string;
}

export function Field({ label, hint, className, children, ...rest }: FieldProps) {
  return (
    <label className={cx("flex min-w-0 flex-col gap-1.5", className)} {...rest}>
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="text-[11px] font-medium text-faint">{hint}</span> : null}
    </label>
  );
}
