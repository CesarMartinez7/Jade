import type React from "react";
import GradientText from "../reactbits/GradientText";
import ShinyText from "../reactbits/ShinyText";
import { Logo } from "../ui/logo";

interface ToolHeaderProps {
  title: string;
  hint: string;
  children?: React.ReactNode;
}

export function ToolHeader({ title, hint, children }: ToolHeaderProps) {
  return (
    <header className="glass flex min-h-13 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-2">
      <div className="mr-auto flex min-w-0 items-center gap-2.5">
        <Logo size={18} className="shrink-0" />
        <GradientText
          className="text-sm font-semibold tracking-tight"
          colors={["#ffffff", "#8f8f8f", "#ffffff"]}
          animationSpeed={6}
        >
          Jade
        </GradientText>
        <span className="text-faint" aria-hidden="true">
          /
        </span>
        <h1 className="text-sm font-medium whitespace-nowrap">{title}</h1>
        <span className="ml-2 hidden min-w-0 truncate text-xs lg:block">
        <ShinyText
          text={hint}
          speed={4}
          color="#707070"
          shineColor="#ededed"
        />
        </span>
      </div>

      {children && <div className="flex flex-wrap items-center gap-1.5">{children}</div>}

    </header>
  );
}

export function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-line-strong" aria-hidden="true" />;
}

interface EmptyStateProps {
  title: string;
  children?: React.ReactNode;
}

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 p-6 text-center">
      <ShinyText text={title} speed={3} color="#8f8f8f" shineColor="#ffffff" className="text-sm" />
      {children && <div className="text-xs text-faint">{children}</div>}
    </div>
  );
}
