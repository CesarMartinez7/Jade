import { cx } from "./cx";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onChange, label, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "brutal-sm relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-mint" : "bg-bg",
        className,
      )}
    >
      <span
        className={cx(
          "absolute size-4 rounded-full border-2 border-ink transition-all",
          checked ? "left-[22px] bg-white" : "left-0.5 bg-bg",
        )}
      />
    </button>
  );
}
