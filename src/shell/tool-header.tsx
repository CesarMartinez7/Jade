import type React from "react";

interface ToolHeaderProps {
  /** Número de la herramienta en el índice, p. ej. "01". */
  no: string;
  title: string;
  hint: string;
  children?: React.ReactNode;
}

export function ToolHeader({ no, title, hint, children }: ToolHeaderProps) {
  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3">
      <div className="mr-auto flex min-w-0 items-center gap-3">
        <span className="sticker size-9 shrink-0 rounded-full font-mono text-xs">{no}</span>
        <div className="min-w-0">
          <h1 className="text-[30px] leading-none font-extrabold tracking-tight whitespace-nowrap">
            {title}
          </h1>
          <p className="mt-1 hidden truncate text-xs font-medium opacity-70 2xl:block">{hint}</p>
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function Divider() {
  return <span className="mx-0.5 h-5 w-0.5 rounded-full bg-ink" aria-hidden="true" />;
}

interface EmptyStateProps {
  title: string;
  children?: React.ReactNode;
}

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="dotted flex h-full min-h-32 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="sticker rounded-lg px-3 py-1.5 text-sm">{title}</p>
      {children && <div className="rounded-md bg-bg px-2 py-0.5 text-xs text-muted">{children}</div>}
    </div>
  );
}
