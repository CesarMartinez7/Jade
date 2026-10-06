import { create } from "jsondiffpatch";
import { useDeferredValue, useMemo, useState } from "react";
import { childPath, parseJson } from "../lib/json";
import CountUp from "../reactbits/CountUp";
import { EmptyState, ToolHeader } from "../shell/tool-header";
import { Panel } from "../ui/panel";
import CodeEditor from "../ui/code-editor/code-editor";
import { Icon, iconDiff, iconTrash } from "../ui/icons";

type Kind = "added" | "removed" | "changed" | "moved";

interface Change {
  path: string;
  kind: Kind;
  before?: unknown;
  after?: unknown;
}

const differ = create({
  // Empareja objetos dentro de arreglos por id cuando existe; si no, por posición.
  objectHash: (item, index) => {
    const record = item as Record<string, unknown>;
    return String(record.id ?? record._id ?? record.key ?? `$$index:${index}`);
  },
});

/** Convierte el delta de jsondiffpatch en una lista plana de cambios con ruta. */
function flatten(delta: unknown, path: string, out: Change[]) {
  if (Array.isArray(delta)) {
    if (delta.length === 1) out.push({ path, kind: "added", after: delta[0] });
    else if (delta.length === 2) out.push({ path, kind: "changed", before: delta[0], after: delta[1] });
    else if (delta[2] === 0) out.push({ path, kind: "removed", before: delta[0] });
    else if (delta[2] === 3) out.push({ path, kind: "moved", after: `→ índice ${delta[1]}` });
    return;
  }
  const record = delta as Record<string, unknown>;
  const isArray = record._t === "a";
  for (const [key, child] of Object.entries(record)) {
    if (key === "_t") continue;
    // En arreglos, "_3" refiere al índice original y "3" al nuevo.
    const segment = isArray ? Number(key.replace("_", "")) : key;
    flatten(child, childPath(path, segment), out);
  }
}

const KIND: Record<Kind, { sign: string; label: string; row: string; text: string }> = {
  added: { sign: "+", label: "añadido", row: "bg-accent/5", text: "text-accent" },
  removed: { sign: "−", label: "eliminado", row: "bg-danger/5", text: "text-danger" },
  changed: { sign: "~", label: "modificado", row: "", text: "text-warn" },
  moved: { sign: "↕", label: "movido", row: "", text: "text-info" },
};

function Value({ value, className }: { value: unknown; className: string }) {
  const text = typeof value === "string" && value.startsWith("→") ? value : JSON.stringify(value);
  return (
    <code className={`block truncate ${className}`} title={text}>
      {text}
    </code>
  );
}

function Side({
  title,
  value,
  onChange,
  valid,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  valid: boolean;
}) {
  return (
    <Panel>
      <div className="panel-header">
        <h2 className="panel-title">{title}</h2>
        {value.trim() !== "" && !valid && <span className="badge badge-danger">inválido</span>}
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor
          value={value}
          onChange={onChange}
          ariaLabel={`JSON ${title}`}
          placeholder="Pega un JSON…"
        />
      </div>
    </Panel>
  );
}

export default function JsonDiffTool() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  const deferredLeft = useDeferredValue(left);
  const deferredRight = useDeferredValue(right);

  const parsedLeft = useMemo(() => parseJson(deferredLeft), [deferredLeft]);
  const parsedRight = useMemo(() => parseJson(deferredRight), [deferredRight]);

  const changes = useMemo(() => {
    if (!parsedLeft.ok || !parsedRight.ok) return null;
    const out: Change[] = [];
    const delta = differ.diff(parsedLeft.data, parsedRight.data);
    if (delta) flatten(delta, "$", out);
    return out;
  }, [parsedLeft, parsedRight]);

  const count = (kind: Kind) => changes?.filter((change) => change.kind === kind).length ?? 0;
  const hasInput = left !== "" || right !== "";

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ToolHeader no="02" title="Comparar JSON" hint="Diferencias estructurales, ignorando orden de claves y formato.">
        <button
          type="button"
          className="btn"
          disabled={!hasInput}
          onClick={() => {
            setLeft(right);
            setRight(left);
          }}
        >
          <Icon icon={iconDiff} width={14} /> Intercambiar
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-danger"
          disabled={!hasInput}
          onClick={() => {
            setLeft("");
            setRight("");
          }}
        >
          <Icon icon={iconTrash} width={14} /> Limpiar
        </button>
      </ToolHeader>

      <div className="grid min-h-0 flex-1 grid-rows-[1fr_1fr_1fr] gap-4 pr-1 pb-1 md:grid-cols-2 md:grid-rows-[3fr_2fr]">
        <Side title="Original" value={left} onChange={setLeft} valid={parsedLeft.ok} />
        <Side title="Modificado" value={right} onChange={setRight} valid={parsedRight.ok} />

        <Panel className="md:col-span-2">
          <div className="panel-header">
            <h2 className="panel-title">Diferencias</h2>
            {changes && (
              <div className="flex items-center gap-1.5">
                <span className="badge badge-ok">+<CountUp to={count("added")} duration={0.4} /></span>
                <span className="badge badge-danger">−<CountUp to={count("removed")} duration={0.4} /></span>
                <span className="badge badge-warn">~<CountUp to={count("changed") + count("moved")} duration={0.4} /></span>
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {!changes ? (
              <EmptyState title="Pega un JSON válido en ambos lados para ver las diferencias" />
            ) : changes.length === 0 ? (
              <EmptyState title="Los dos documentos son equivalentes" />
            ) : (
              <ul className="font-mono text-xs">
                {changes.map((change, i) => {
                  const kind = KIND[change.kind];
                  return (
                    <li
                      key={i}
                      className={`grid grid-cols-[1.5rem_minmax(0,2fr)_minmax(0,3fr)] items-start gap-2 border-b border-line px-3 py-1.5 ${kind.row}`}
                    >
                      <span className={`text-center font-bold ${kind.text}`} title={kind.label}>
                        {kind.sign}
                      </span>
                      <span className="truncate text-fg" title={change.path}>
                        {change.path}
                      </span>
                      <div className="min-w-0">
                        {change.before !== undefined && (
                          <Value value={change.before} className="text-danger/90" />
                        )}
                        {change.after !== undefined && (
                          <Value
                            value={change.after}
                            className={change.kind === "moved" ? "text-info" : "text-accent/90"}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
