import { cx } from "./cx";

export interface SpinnerProps {
  size?: number;
  label?: string;
  className?: string;
}

export function Spinner({ size = 20, label, className }: SpinnerProps) {
  return (
    <span className={cx("inline-flex items-center gap-2", className)} role="status">
      <span
        aria-hidden="true"
        className="animate-spin rounded-full border-2 border-ink border-t-transparent"
        style={{ width: size, height: size }}
      />
      {label ? <span className="text-xs font-semibold text-muted">{label}</span> : null}
    </span>
  );
}
