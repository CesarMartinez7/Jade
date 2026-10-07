import type React from "react";
import { Icon } from "../ui/icons";
import { cx } from "./cx";

type IconName = React.ComponentProps<typeof Icon>["icon"];

const TONES = {
  info: { text: "text-info", bg: "bg-info/10" },
  ok: { text: "text-accent", bg: "bg-accent/10" },
  warn: { text: "text-warn", bg: "bg-warn/10" },
  danger: { text: "text-danger", bg: "bg-danger/10" },
} as const;

export type AlertTone = keyof typeof TONES;

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  title?: string;
  icon?: IconName;
}

export function Alert({ tone = "info", title, icon, className, children, ...rest }: AlertProps) {
  const style = TONES[tone];
  return (
    <div
      role="alert"
      className={cx("brutal-sm flex items-start gap-3 rounded-lg p-3", style.bg, className)}
      {...rest}
    >
      {icon ? (
        <span className={cx("mt-0.5 shrink-0", style.text)}>
          <Icon icon={icon} width={18} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        {title ? <p className={cx("label", style.text)}>{title}</p> : null}
        {children ? <div className="text-xs font-medium text-fg">{children}</div> : null}
      </div>
    </div>
  );
}
