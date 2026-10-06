import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { jsonActions } from "../stores/json-doc";
import { Icon, iconSearch } from "../ui/icons";
import { TOOLS, type ToolId } from "./tools";

interface Command {
  id: string;
  group: string;
  label: string;
  run: () => void;
}

interface CommandPaletteProps {
  onClose: () => void;
  onSelectTool: (id: ToolId) => void;
}

export default function CommandPalette({ onClose, onSelectTool }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const commands = useMemo<Command[]>(() => {
    // Las acciones de JSON siempre llevan a su herramienta para ver el resultado.
    const onJson = (action: () => void) => () => {
      onSelectTool("json");
      action();
    };
    return [
      ...TOOLS.map((tool) => ({
        id: tool.id,
        group: "Ir a",
        label: tool.label,
        run: () => onSelectTool(tool.id),
      })),
      { id: "format", group: "JSON", label: "Formatear", run: onJson(jsonActions.format) },
      { id: "minify", group: "JSON", label: "Minificar", run: onJson(jsonActions.minify) },
      { id: "copy", group: "JSON", label: "Copiar", run: onJson(jsonActions.copy) },
      { id: "load", group: "JSON", label: "Abrir archivo", run: onJson(jsonActions.load) },
      { id: "download", group: "JSON", label: "Descargar", run: onJson(jsonActions.download) },
      { id: "share", group: "JSON", label: "Copiar enlace para compartir", run: onJson(jsonActions.share) },
      { id: "clear", group: "JSON", label: "Limpiar", run: onJson(jsonActions.clear) },
    ];
  }, [onSelectTool]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((command) =>
      `${command.group} ${command.label}`.toLowerCase().includes(needle),
    );
  }, [commands, query]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = (command: Command | undefined) => {
    if (!command) return;
    onClose();
    command.run();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "Enter") run(results[active]);
    else if (e.key === "ArrowDown") setActive((active + 1) % Math.max(results.length, 1));
    else if (e.key === "ArrowUp") setActive((active - 1 + results.length) % Math.max(results.length, 1));
    else return;
    e.preventDefault();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-page/80 p-4 pt-[15vh]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        className="brutal w-full max-w-lg overflow-hidden rounded-xl bg-raised"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2 border-b-2 border-ink px-3">
          <Icon icon={iconSearch} width={16} className="shrink-0 text-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Buscar herramienta o acción…"
            aria-label="Buscar comando"
            className="h-11 w-full bg-transparent text-sm placeholder:text-faint focus:outline-none"
          />
          <kbd>Esc</kbd>
        </div>
        <ul ref={listRef} role="listbox" className="max-h-80 overflow-auto p-1.5">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-faint">Sin resultados</li>
          )}
          {results.map((command, i) => (
            <li
              key={command.id}
              role="option"
              aria-selected={i === active}
              className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-transparent px-3 py-2 text-sm font-semibold aria-selected:border-ink aria-selected:bg-yellow aria-selected:text-onfill"
              onMouseMove={() => setActive(i)}
              onClick={() => run(command)}
            >
              <span className="label w-10 shrink-0 text-[10px] opacity-60">{command.group}</span>
              {command.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
