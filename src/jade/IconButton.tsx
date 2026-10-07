import type React from "react";
import { Icon } from "../ui/icons";
import { cx } from "./cx";

type IconName = React.ComponentProps<typeof Icon>["icon"];

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  iconWidth?: number;
}

export function IconButton({ icon, label, iconWidth = 14, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={rest.title ?? label}
      className={cx("icon-btn", className)}
      {...rest}
    >
      <Icon icon={icon} width={iconWidth} />
    </button>
  );
}
