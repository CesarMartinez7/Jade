import type React from "react";
import { memo, useDeferredValue, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Icon, iconReplace, iconX } from "../icons";
import { escapeHtml, highlightJson } from "./highlight";

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "json" | "text";
  placeholder?: string;
  /** Línea (1-based) a marcar como error. */
  errorLine?: number;
  ariaLabel?: string;
  autoFocus?: boolean;
}

// Deben coincidir con las clases `text-xs leading-5 p-3` de las capas.
const LINE_HEIGHT = 20;
const PADDING = 12;
const LAYER = "p-3 font-mono text-xs leading-5 whitespace-pre";

const CodeEditor = ({
  value,
  onChange,
  language = "json",
  placeholder,
  errorLine,
  ariaLabel,
  autoFocus,
}: CodeEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLPreElement>(null);

  const [replaceOpen, setReplaceOpen] = useState(false);
  const [find, setFind] = useState("");
  const [replacement, setReplacement] = useState("");

  // El resaltado es lo costoso: se difiere para no bloquear la escritura.
  const deferred = useDeferredValue(value);

  const html = useMemo(
    // El salto final evita que la última línea vacía colapse.
    () => (language === "json" ? highlightJson(deferred) : escapeHtml(deferred)) + "\n",
    [deferred, language],
  );

  const lineNumbers = useMemo(() => {
    const count = deferred.split("\n").length;
    return Array.from({ length: count }, (_, i) => i + 1).join("\n");
  }, [deferred]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (highlightRef.current) {
      highlightRef.current.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`;
    }
    if (gutterRef.current) {
      gutterRef.current.style.transform = `translateY(${-scrollTop}px)`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const mod = e.ctrlKey || e.metaKey;

    if (e.key === "Tab" && !e.shiftKey && !mod) {
      e.preventDefault();
      // execCommand conserva el historial de deshacer del navegador.
      if (!document.execCommand("insertText", false, "  ")) {
        el.setRangeText("  ", el.selectionStart, el.selectionEnd, "end");
        onChange(el.value);
      }
      return;
    }

    if (mod && (e.key.toLowerCase() === "h" || e.key.toLowerCase() === "b")) {
      e.preventDefault();
      setReplaceOpen((open) => !open);
    }
  };

  const replace = (all: boolean) => {
    if (!find) return toast.error("Ingresa un valor a buscar");
    if (!value.includes(find)) return toast.error("No se encontró el valor");
    onChange(all ? value.replaceAll(find, replacement) : value.replace(find, replacement));
  };

  const closeReplace = () => {
    setReplaceOpen(false);
    textareaRef.current?.focus();
  };

  const matches = find ? value.split(find).length - 1 : 0;

  return (
    <div className="group relative flex h-full min-h-0">
      {/* Números de línea */}
      <div className="shrink-0 overflow-hidden border-r border-line select-none">
        <pre
          ref={gutterRef}
          aria-hidden="true"
          className="min-w-10 px-2 py-3 text-right font-mono text-xs leading-5 text-faint"
        >
          {lineNumbers}
        </pre>
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden">
        {/* Capa de resaltado: se desplaza con transform siguiendo al textarea */}
        <div ref={highlightRef} aria-hidden="true" className="pointer-events-none absolute inset-0">
          {errorLine !== undefined && (
            <div
              className="absolute left-0 w-[10000px] border-l-2 border-danger bg-danger/10"
              style={{ top: PADDING + (errorLine - 1) * LINE_HEIGHT, height: LINE_HEIGHT }}
            />
          )}
          <pre className={LAYER} dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoFocus={autoFocus}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className={`${LAYER} absolute inset-0 size-full resize-none overflow-auto bg-transparent text-transparent caret-fg outline-none placeholder:text-faint`}
        />
      </div>

      {replaceOpen ? (
        <div className="absolute top-2 right-4 z-10 flex w-64 flex-col gap-1.5 brutal rounded-lg bg-raised p-2">
          <div className="flex items-center gap-1">
            <input
              autoFocus
              className="input"
              placeholder="Buscar"
              value={find}
              onChange={(e) => setFind(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && closeReplace()}
            />
            <button type="button" className="icon-btn" onClick={closeReplace} aria-label="Cerrar">
              <Icon icon={iconX} width={14} />
            </button>
          </div>
          <input
            className="input"
            placeholder="Reemplazar con"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && closeReplace()}
          />
          <div className="flex items-center gap-1.5">
            <span className="mr-auto font-mono text-[11px] text-faint">
              {matches} {matches === 1 ? "coincidencia" : "coincidencias"}
            </span>
            <button type="button" className="btn" onClick={() => replace(false)}>
              Primera
            </button>
            <button type="button" className="btn btn-primary" onClick={() => replace(true)}>
              Todas
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          title="Buscar y reemplazar (Ctrl+H)"
          aria-label="Buscar y reemplazar"
          className="icon-btn absolute top-2 right-4 z-10 border border-line bg-raised opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
          onClick={() => setReplaceOpen(true)}
        >
          <Icon icon={iconReplace} width={14} />
        </button>
      )}
    </div>
  );
};

export default memo(CodeEditor);
