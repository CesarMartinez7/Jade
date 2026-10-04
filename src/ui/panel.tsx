import type React from "react";
import SpotlightCard from "../reactbits/SpotlightCard";

interface PanelProps {
  className?: string;
  children: React.ReactNode;
}

/** Panel de vidrio con el foco de luz de React Bits siguiendo al cursor. */
export function Panel({ className = "", children }: PanelProps) {
  return (
    <SpotlightCard className={`panel ${className}`} spotlightColor="rgba(255, 255, 255, 0.06)">
      {children}
    </SpotlightCard>
  );
}
