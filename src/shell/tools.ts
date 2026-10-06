import { lazy } from "react";
import { iconBraces, iconDiff, iconFileDiff, iconKey, iconRegex } from "../ui/icons";

export const TOOLS = [
  {
    id: "json",
    label: "JSON",
    description: "Validar, formatear y explorar",
    icon: iconBraces,
    component: lazy(() => import("../tools/json-tool")),
  },
  {
    id: "json-diff",
    label: "Comparar JSON",
    description: "Diferencias estructurales",
    icon: iconDiff,
    component: lazy(() => import("../tools/json-diff-tool")),
  },
  {
    id: "text-diff",
    label: "Comparar texto",
    description: "Diff línea a línea",
    icon: iconFileDiff,
    component: lazy(() => import("../tools/text-diff-tool")),
  },
  {
    id: "jwt",
    label: "JWT",
    description: "Decodificar tokens",
    icon: iconKey,
    component: lazy(() => import("../tools/jwt-tool")),
  },
  {
    id: "regex",
    label: "Regex",
    description: "Probar expresiones regulares",
    icon: iconRegex,
    component: lazy(() => import("../tools/regex-tool")),
  },
] as const;

export type ToolId = (typeof TOOLS)[number]["id"];

export function toolFromHash(): ToolId {
  const hash = window.location.hash.slice(1);
  return TOOLS.find((tool) => tool.id === hash)?.id ?? "json";
}
