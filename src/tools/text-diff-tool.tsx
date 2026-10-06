import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { type DiffLine, diffLines } from "../lib/text-diff";
import CountUp from "../reactbits/CountUp";
import { EmptyState, ToolHeader } from "../shell/tool-header";
import { Panel } from "../ui/panel";
import { Icon, iconDiff, iconTrash } from "../ui/icons";

const STORAGE_KEYS = {
  original: "textdiff_original",
  compare: "textdiff_compare",
};

const normalizeSpaces = (line: string) => line.trim().replace(/\s+/g, " ");

function usePersisted(key: string) {
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? "");
  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Texto demasiado grande para localStorage: se mantiene solo en memoria.
    }
  }, [key, value]);
  return [value, setValue] as const;
}

function Side({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Panel>
      <div className="panel-header">
        <h2 className="panel-title">{title}</h2>
        <span className="font-mono text-[11px] font-bold">
          {value ? `${value.split("\n").length} líneas` : ""}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Texto ${title}`}
        placeholder="Pega el texto aquí…"
        spellCheck={false}
        className="textarea min-h-0 flex-1"
      />
    </Panel>
  );
}

const ROW: Record<DiffLine["kind"], { sign: string; row: string; mark: string }> = {
  same: { sign: " ", row: "text-muted", mark: "" },
  add: { sign: "+", row: "bg-accent/10 text-fg", mark: "bg-accent/35" },
  del: { sign: "−", row: "bg-danger/10 text-fg", mark: "bg-danger/35" },
};

function Line({ line }: { line: DiffLine }) {
  const style = ROW[line.kind];
  const [start, end] = line.mark ?? [0, 0];
  return (
    <tr className={style.row}>
      <td className="w-10 border-r border-line px-2 text-right text-faint select-none">{line.oldNo}</td>
      <td className="w-10 border-r border-line px-2 text-right text-faint select-none">{line.newNo}</td>
      <td className="w-6 text-center text-faint select-none">{style.sign}</td>
      <td className="pr-3 break-all whitespace-pre-wrap">
        {line.mark && end > start ? (
          <>
            {line.text.slice(0, start)}
            <span className={style.mark}>{line.text.slice(start, end)}</span>
            {line.text.slice(end)}
          </>
        ) : (
          line.text
        )}
      </td>
    </tr>
  );
}

export default function TextDiffTool() {
  const [original, setOriginal] = usePersisted(STORAGE_KEYS.original);
  const [compare, setCompare] = usePersisted(STORAGE_KEYS.compare);
  const [ignoreSpaces, setIgnoreSpaces] = useState(false);
  const [onlyChanges, setOnlyChanges] = useState(false);

  const deferredOriginal = useDeferredValue(original);
  const deferredCompare = useDeferredValue(compare);

  const lines = useMemo(
    () => diffLines(deferredOriginal, deferredCompare, ignoreSpaces ? normalizeSpaces : undefined),
    [deferredOriginal, deferredCompare, ignoreSpaces],
  );

  const added = lines.filter((line) => line.kind === "add").length;
  const removed = lines.filter((line) => line.kind === "del").length;
  const hasInput = original !== "" || compare !== "";
  const visible = onlyChanges ? lines.filter((line) => line.kind !== "same") : lines;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ToolHeader no="03" title="Comparar texto" hint="Diff línea a línea con resaltado del fragmento que cambió.">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            className="accent-accent"
            checked={ignoreSpaces}
            onChange={(e) => setIgnoreSpaces(e.target.checked)}
          />
          Ignorar espacios
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            className="accent-accent"
            checked={onlyChanges}
            onChange={(e) => setOnlyChanges(e.target.checked)}
          />
          Solo cambios
        </label>
        <button
          type="button"
          className="btn"
          disabled={!hasInput}
          onClick={() => {
            setOriginal(compare);
            setCompare(original);
          }}
        >
          <Icon icon={iconDiff} width={14} /> Intercambiar
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-danger"
          disabled={!hasInput}
          onClick={() => {
            setOriginal("");
            setCompare("");
          }}
        >
          <Icon icon={iconTrash} width={14} /> Limpiar
        </button>
      </ToolHeader>

      <div className="grid min-h-0 flex-1 grid-rows-[1fr_1fr_1fr] gap-4 pr-1 pb-1 md:grid-cols-2 md:grid-rows-[2fr_3fr]">
        <Side title="Original" value={original} onChange={setOriginal} />
        <Side title="Modificado" value={compare} onChange={setCompare} />

        <Panel className="md:col-span-2">
          <div className="panel-header">
            <h2 className="panel-title">Diferencias</h2>
            {hasInput && (
              <div className="flex items-center gap-1.5">
                <span className="badge badge-ok">+<CountUp to={added} duration={0.4} /></span>
                <span className="badge badge-danger">−<CountUp to={removed} duration={0.4} /></span>
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {!hasInput ? (
              <EmptyState title="Pega texto en ambos lados para compararlo" />
            ) : added + removed === 0 ? (
              <EmptyState title="Los textos son idénticos" />
            ) : (
              <table className="w-full border-collapse font-mono text-xs leading-5">
                <tbody>
                  {visible.map((line, i) => (
                    <Line key={i} line={line} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
