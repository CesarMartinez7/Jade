import { cx } from "./cx";

const TONES = {
  mint: "bg-mint",
  yellow: "bg-yellow",
  pink: "bg-pink",
  lilac: "bg-lilac",
} as const;

export type ProgressTone = keyof typeof TONES;

export interface ProgressProps {
  value: number;
  max?: number;
  tone?: ProgressTone;
  className?: string;
}

export function Progress({ value, max = 100, tone = "mint", className }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cx("brutal-sm h-4 w-full overflow-hidden rounded-full bg-bg", className)}
    >
      <div
        className={cx("h-full border-r-2 border-ink transition-[width] duration-300", TONES[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
