import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { copyText, decodeBase64, encodeBase64 } from "../lib/browser";
import {
  CHEATS,
  explain,
  type Language,
  LANGUAGES,
  LIBRARY,
  MAX_MATCHES,
  type RegexMatch,
  type RegexRequest,
  type RegexResponse,
  SAMPLE_TEXT,
  toCode,
} from "../lib/regex";
import { EmptyState, ToolHeader } from "../shell/tool-header";
import { Icon, iconCopy, iconLink, iconTrash } from "../ui/icons";
import { Panel } from "../ui/panel";

const FLAGS = [
  { flag: "g", label: "global", title: "Todas las coincidencias, no solo la primera" },
  { flag: "i", label: "sin mayúsc.", title: "Ignora mayúsculas y minúsculas" },
  { flag: "m", label: "multilínea", title: "^ y $ aplican a cada línea" },
  { flag: "s", label: "dotAll", title: "El punto también coincide con saltos de línea" },
  { flag: "u", label: "unicode", title: "Trata el patrón como puntos de código Unicode" },
];

const STORAGE_KEY = "regex_state";
const SHARE_PARAM = "re";
// Si la regex no termina en este tiempo, se da por colgada y se cancela.
const TIMEOUT_MS = 1500;
const DEBOUNCE_MS = 120;

interface Saved {
  pattern: string;
  flags: string;
  text: string;
}

function initialState(): Saved {
  const fallback = { pattern: LIBRARY[0].pattern, flags: LIBRARY[0].flags, text: SAMPLE_TEXT };
  const shared = new URLSearchParams(window.location.search).get(SHARE_PARAM);
  for (const read of [
    () => (shared ? decodeBase64(shared) : null),
    () => localStorage.getItem(STORAGE_KEY),
  ]) {
    try {
      const raw = read();
      if (!raw) continue;
      const saved = JSON.parse(raw) as Partial<Saved>;
      if (typeof saved.pattern === "string" && typeof saved.text === "string") {
        return { pattern: saved.pattern, flags: String(saved.flags ?? ""), text: saved.text };
      }
    } catch {
      // Enlace o dato guardado corrupto: se ignora y se sigue con el siguiente.
    }
  }
  return fallback;
}

type Run =
  | { status: "idle" }
  | { status: "timeout" }
  | { status: "error"; error: string }
  | { status: "ok"; text: string; matches: RegexMatch[]; truncated: boolean; replaced: string };

function createWorker() {
  return new Worker(new URL("./regex-worker.ts", import.meta.url));
}

/** Ejecuta la regex en un worker y lo cancela si tarda demasiado. */
function useRegexRun(pattern: string, flags: string, text: string, replacement: string): Run {
  const [run, setRun] = useState<Run>({ status: "idle" });
  const workerRef = useRef<Worker | null>(null);
  const idRef = useRef(0);
  // Hay una petición enviada al worker que todavía no respondió.
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!pattern) {
      setRun({ status: "idle" });
      return;
    }

    let timeout = 0;
    const debounce = window.setTimeout(() => {
      const id = ++idRef.current;
      const worker = (workerRef.current ??= createWorker());

      worker.onmessage = (event: MessageEvent<RegexResponse>) => {
        const response = event.data;
        if (response.id !== idRef.current) return;
        pendingRef.current = false;
        window.clearTimeout(timeout);
        setRun(
          response.ok
            ? { status: "ok", text, ...response }
            : { status: "error", error: response.error },
        );
      };

      timeout = window.setTimeout(() => {
        // Un worker atascado no se puede interrumpir: se descarta y se crea otro después.
        worker.terminate();
        workerRef.current = null;
        pendingRef.current = false;
        setRun({ status: "timeout" });
      }, TIMEOUT_MS);

      const request: RegexRequest = { id, pattern, flags, text, replacement };
      pendingRef.current = true;
      worker.postMessage(request);
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(debounce);
      window.clearTimeout(timeout);
      // Si quedó una ejecución en curso, su worker sigue ocupado: se reemplaza.
      if (pendingRef.current) {
        workerRef.current?.terminate();
        workerRef.current = null;
        pendingRef.current = false;
      }
    };
  }, [pattern, flags, text, replacement]);

  useEffect(() => () => workerRef.current?.terminate(), []);

  return run;
}

// Deben coincidir exactamente entre el fondo resaltado y el textarea.
const LAYER =
  "absolute inset-0 m-0 size-full overflow-y-scroll border-0 p-4 font-mono text-xs leading-5 break-words whitespace-pre-wrap";

/** Textarea con las coincidencias resaltadas en una capa de fondo. */
function HighlightedInput({
  value,
  onChange,
  matches,
}: {
  value: string;
  onChange: (value: string) => void;
  matches: RegexMatch[];
}) {
  const backdropRef = useRef<HTMLPreElement>(null);

  const parts = useMemo(() => {
    const nodes: React.ReactNode[] = [];
    let last = 0;
    let shown = 0;
    for (const match of matches) {
      if (match.text === "" || match.index < last) continue;
      nodes.push(value.slice(last, match.index));
      nodes.push(
        // Alterna color para distinguir coincidencias contiguas.
        <mark key={match.index} className={`rounded-sm text-transparent ${shown++ % 2 ? "bg-pink/50" : "bg-yellow/60"}`}>
          {match.text}
        </mark>,
      );
      last = match.index + match.text.length;
    }
    nodes.push(value.slice(last));
    return nodes;
  }, [value, matches]);

  return (
    <div className="relative min-h-0 flex-1">
      <pre ref={backdropRef} aria-hidden="true" className={`${LAYER} pointer-events-none text-transparent`}>
        {parts}
        {"\n"}
      </pre>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => {
          if (backdropRef.current) backdropRef.current.scrollTop = e.currentTarget.scrollTop;
        }}
        aria-label="Texto de prueba"
        placeholder="Pega aquí el texto contra el que quieres probar…"
        spellCheck={false}
        className={`${LAYER} resize-none bg-transparent text-fg placeholder:text-faint focus:outline-none`}
      />
    </div>
  );
}

type View = "explain" | "groups" | "replace" | "code";
type Drawer = "library" | "cheats" | null;

const VIEWS: { id: View; label: string }[] = [
  { id: "explain", label: "Explicación" },
  { id: "groups", label: "Grupos" },
  { id: "replace", label: "Reemplazar" },
  { id: "code", label: "Código" },
];

export default function RegexTool() {
  const [initial] = useState(initialState);
  const [pattern, setPattern] = useState(initial.pattern);
  const [flags, setFlags] = useState(initial.flags);
  const [text, setText] = useState(initial.text);
  const [replacement, setReplacement] = useState("[$&]");
  const [view, setView] = useState<View>("explain");
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [language, setLanguage] = useState<Language>("javascript");
  const patternRef = useRef<HTMLInputElement>(null);

  const run = useRegexRun(pattern, flags, text, replacement);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pattern, flags, text }));
    } catch {
      // Texto demasiado grande para localStorage: se mantiene solo en memoria.
    }
  }, [pattern, flags, text]);

  const pieces = useMemo(() => explain(pattern, flags), [pattern, flags]);
  const code = useMemo(() => toCode(pattern, flags, language), [pattern, flags, language]);

  // Las coincidencias solo valen para el texto con el que se calcularon.
  const matches = run.status === "ok" && run.text === text ? run.matches : [];
  const invalid = run.status === "error" || run.status === "timeout";

  const toggleFlag = (flag: string) =>
    setFlags((prev) => (prev.includes(flag) ? prev.replace(flag, "") : prev + flag));

  const insertCheat = (snippet: string) => {
    const input = patternRef.current;
    const start = input?.selectionStart ?? pattern.length;
    const end = input?.selectionEnd ?? pattern.length;
    setPattern(pattern.slice(0, start) + snippet + pattern.slice(end));
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  const share = () => {
    const url = new URL(window.location.href);
    url.searchParams.set(SHARE_PARAM, encodeBase64(JSON.stringify({ pattern, flags, text })));
    url.hash = "regex";
    copyText(url.toString(), "Enlace copiado");
  };

  const copyTarget = view === "replace" && run.status === "ok" ? run.replaced : view === "code" ? code : null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ToolHeader no="05" title="Regex" hint="Prueba expresiones regulares de JavaScript con resultado al instante.">
        <button
          type="button"
          className="btn"
          aria-pressed={drawer === "library"}
          onClick={() => setDrawer(drawer === "library" ? null : "library")}
        >
          Ejemplos
        </button>
        <button
          type="button"
          className="btn"
          aria-pressed={drawer === "cheats"}
          onClick={() => setDrawer(drawer === "cheats" ? null : "cheats")}
        >
          Chuleta
        </button>
        <button type="button" className="btn" onClick={share} disabled={!pattern}>
          <Icon icon={iconLink} width={14} /> Compartir
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-danger"
          disabled={!pattern && !text}
          onClick={() => {
            setPattern("");
            setText("");
          }}
        >
          <Icon icon={iconTrash} width={14} /> Limpiar
        </button>
      </ToolHeader>

      <div className="brutal mr-1 shrink-0 rounded-xl bg-bg">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
          <label className="flex min-w-48 flex-1 items-center gap-1 font-mono text-sm">
            <span className="text-lg font-bold text-faint" aria-hidden="true">
              /
            </span>
            <input
              ref={patternRef}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              aria-label="Expresión regular"
              aria-invalid={invalid}
              placeholder="patrón"
              spellCheck={false}
              autoFocus
              className="h-8 min-w-0 flex-1 bg-transparent font-bold placeholder:font-normal placeholder:text-faint focus:outline-none"
            />
            <span className="text-lg font-bold text-faint" aria-hidden="true">
              /{flags}
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-1">
            {FLAGS.map(({ flag, label, title }) => (
              <button
                key={flag}
                type="button"
                title={title}
                aria-pressed={flags.includes(flag)}
                className="rounded-md border-2 border-ink px-2 py-0.5 text-[11px] font-bold transition-colors hover:bg-hover aria-pressed:bg-fg aria-pressed:text-bg"
                onClick={() => toggleFlag(flag)}
              >
                <span className="font-mono">{flag}</span> {label}
              </button>
            ))}
          </div>

          {run.status === "ok" && (
            <span className={`badge ${matches.length ? "badge-ok" : ""}`}>
              {run.truncated ? `${MAX_MATCHES}+` : run.matches.length}{" "}
              {run.matches.length === 1 ? "coincidencia" : "coincidencias"}
            </span>
          )}
          {run.status === "error" && <span className="badge badge-danger">patrón inválido</span>}
          {run.status === "timeout" && <span className="badge badge-danger">tardó demasiado</span>}
        </div>

        {drawer && (
          <div className="flex flex-wrap gap-1.5 border-t-2 border-ink p-2">
            {drawer === "library"
              ? LIBRARY.map((example) => (
                  <button
                    key={example.label}
                    type="button"
                    title={example.pattern}
                    className="rounded-md border-2 border-ink bg-lilac px-2 py-0.5 text-[11px] font-bold text-onfill hover:bg-yellow"
                    onClick={() => {
                      setPattern(example.pattern);
                      setFlags(example.flags);
                      setText(SAMPLE_TEXT);
                    }}
                  >
                    {example.label}
                  </button>
                ))
              : CHEATS.map((cheat) => (
                  <button
                    key={cheat.insert}
                    type="button"
                    title={`Insertar ${cheat.insert}`}
                    className="flex items-center gap-1.5 rounded-md border-2 border-ink px-2 py-0.5 text-[11px] hover:bg-hover"
                    onClick={() => insertCheat(cheat.insert)}
                  >
                    <code className="font-mono font-bold">{cheat.insert}</code>
                    <span className="text-muted">{cheat.desc}</span>
                  </button>
                ))}
          </div>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-2 gap-4 pr-1 pb-1 lg:grid-cols-2 lg:grid-rows-1">
        <Panel>
          <div className="panel-header">
            <h2 className="panel-title">Texto de prueba</h2>
            <span className="font-mono text-[11px] font-bold">{text.length} caracteres</span>
          </div>
          <HighlightedInput value={text} onChange={setText} matches={matches} />
        </Panel>

        <Panel>
          <div className="panel-header">
            <div role="tablist" className="tabs">
              {VIEWS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={view === id}
                  className="tab"
                  onClick={() => setView(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {copyTarget !== null && (
              <button
                type="button"
                className="icon-btn"
                title="Copiar"
                aria-label="Copiar"
                onClick={() => copyText(copyTarget)}
              >
                <Icon icon={iconCopy} width={14} />
              </button>
            )}
          </div>

          {view === "replace" && (
            <div className="flex shrink-0 items-center gap-2 border-b-2 border-ink p-2">
              <span className="label shrink-0 pl-1">Por</span>
              <input
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                aria-label="Texto de reemplazo"
                placeholder="$& es la coincidencia; $1 o $<nombre>, un grupo"
                spellCheck={false}
                className="input"
              />
            </div>
          )}

          {view === "code" && (
            <div role="tablist" className="flex shrink-0 gap-1 border-b-2 border-ink p-2">
              {LANGUAGES.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={language === id}
                  className="rounded-md border-2 border-ink px-2 py-0.5 text-[11px] font-bold hover:bg-hover aria-selected:bg-fg aria-selected:text-bg"
                  onClick={() => setLanguage(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-auto">
            {!pattern ? (
              <EmptyState title="Escribe un patrón para empezar">
                o abre <b>Ejemplos</b> para cargar uno
              </EmptyState>
            ) : run.status === "error" ? (
              <EmptyState title="El patrón no es válido">
                <code className="font-mono text-danger">{run.error}</code>
              </EmptyState>
            ) : run.status === "timeout" ? (
              <EmptyState title="El patrón tardó demasiado">
                Se canceló para no congelar la página. Suele pasar con repeticiones anidadas como{" "}
                <code className="font-mono">(a+)+</code>.
              </EmptyState>
            ) : view === "explain" ? (
              <ol className="text-xs">
                {pieces.map((piece, i) => (
                  <li
                    key={i}
                    className="flex items-baseline gap-3 border-b border-line py-1.5 pr-4"
                    style={{ paddingLeft: 16 + piece.depth * 18 }}
                  >
                    <code className="shrink-0 rounded-md border-2 border-ink bg-yellow px-1.5 font-mono font-bold text-onfill">
                      {piece.text}
                    </code>
                    <span className="min-w-0 break-words">{piece.desc}</span>
                  </li>
                ))}
              </ol>
            ) : view === "code" ? (
              <pre className="p-4 font-mono text-xs leading-5 break-words whitespace-pre-wrap">{code}</pre>
            ) : run.status !== "ok" ? (
              <EmptyState title="Calculando…" />
            ) : view === "replace" ? (
              <pre className="p-4 font-mono text-xs leading-5 break-words whitespace-pre-wrap">
                {run.replaced}
              </pre>
            ) : run.matches.length === 0 ? (
              <EmptyState title="Sin coincidencias" />
            ) : (
              <ol className="font-mono text-xs">
                {run.matches.map((match, i) => (
                  <li key={i} className="border-b border-line px-4 py-2">
                    <div className="flex items-baseline gap-3">
                      <span className="w-6 shrink-0 font-bold text-faint">{i + 1}</span>
                      <span className="min-w-0 font-bold break-all">{match.text || "(vacía)"}</span>
                      <span className="ml-auto shrink-0 text-faint">pos. {match.index}</span>
                    </div>
                    {match.groups.map((group, g) => (
                      <div key={g} className="mt-1 flex items-baseline gap-3 pl-9">
                        <span className="tok-key shrink-0">{group.name}</span>
                        <span className="min-w-0 break-all text-muted">
                          {group.value ?? <span className="text-faint">sin capturar</span>}
                        </span>
                      </div>
                    ))}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
