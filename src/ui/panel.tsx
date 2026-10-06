import type React from "react";

interface PanelProps {
  className?: string;
  children: React.ReactNode;
}

export function Panel({ className = "", children }: PanelProps) {
  return <section className={`panel ${className}`}>{children}</section>;
}
