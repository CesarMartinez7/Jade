import type React from "react";
import { createContext, useContext } from "react";
import { Icon } from "../ui/icons";
import { cx } from "./cx";

type IconName = React.ComponentProps<typeof Icon>["icon"];

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

export function Tabs({ value, onChange, className, children, ...rest }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div role="tablist" className={cx("tabs", className)} {...rest}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: IconName;
  iconWidth?: number;
}

export function Tab({ value, icon, iconWidth = 13, className, children, ...rest }: TabProps) {
  const ctx = useContext(TabsContext);
  const selected = ctx?.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={cx("tab", className)}
      onClick={() => ctx?.onChange(value)}
      {...rest}
    >
      {icon ? <Icon icon={icon} width={iconWidth} /> : null}
      {children}
    </button>
  );
}
