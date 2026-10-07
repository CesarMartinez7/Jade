import type React from "react";
import { Icon } from "../ui/icons";
import { cx } from "./cx";

type IconName = React.ComponentProps<typeof Icon>["icon"];

const VARIANTS = {
  default: "btn",
  primary: "btn btn-primary",
  ghost: "btn btn-ghost",
  danger: "btn btn-ghost btn-danger",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: IconName;
  iconWidth?: number;
  block?: boolean;
}

export function Button({
  variant = "default",
  icon,
  iconWidth = 14,
  block = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cx(VARIANTS[variant], block && "w-full justify-between", className)}
      {...rest}
    >
      {icon ? <Icon icon={icon} width={iconWidth} /> : null}
      {children}
    </button>
  );
}
