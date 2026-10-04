import { download, generateCsv, mkConfig } from "export-to-csv";
import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { copyText } from "../lib/browser";
import { formatBytes, type JsonValue, parseJson, toTypescript } from "../lib/json";
import { Divider, EmptyState, ToolHeader } from "../shell/tool-header";
import { Panel } from "../ui/panel";
import { jsonActions, useJsonDoc } from "../stores/json-doc";
import CodeEditor from "../ui/code-editor/code-editor";
import {
  Icon,
  iconBolt,
  iconCollapse,
  iconCopy,
  iconCsv,
  iconDownload,
  iconExpand,
  iconIndent,
  iconLink,
  iconTable,
  iconTrash,
  iconTree,
  iconTypescript,
  iconUpload,
} from "../ui/icons";
import JsonTable from "../ui/json-table";
import JsonTree from "../ui/json-tree";

type View = "tree" | "table" | "types";

const VIEWS: { id: View; label: string; icon: typeof iconTree }[] = [
  { id: "tree", label: "Árbol", icon: iconTree },
  { id: "table", label: "Tabla", icon: iconTable },
  { id: "types", label: "Tipos", icon: iconTypescript },
];

const EXAMPLE = JSON.stringify(
  {
    id: 42,
    name: "Jade",
    active: true,
    homepage: "https://example.com",
    tags: ["json", "jwt", "diff"],
    owner: { login: "dev", email: null },
  },
  null,
  2,
);

function exportCsv(data: JsonValue) {
  const list = Array.isArray(data) ? data : [data];
  const isRows = list.every(
    (row) => typeof row === "object" && row !== null && !Array.isArray(row),
  );
  if (!list.length || !isRows) {
    return toast.error("El CSV necesita un objeto o un arreglo de objetos");
  }
  // export-to-csv solo acepta primitivos: los valores anidados van como JSON.
  const rows = (list as Record<string, JsonValue>[]).map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === "object" && value !== null ? JSON.stringify(value) : value,
      ]),
    ),
  );
  const config = mkConfig({ useKeysAsHeaders: true, filename: "data" });
  download(config)(generateCsv(config)(rows));
}

export default function JsonTool() {
  const value = useJsonDoc((state) => state.value);
  const setValue = useJsonDoc((state) => state.setValue);

  const [view, setView] = useState<View>("tree");
  // Cambiar `generation` remonta el árbol con la nueva profundidad abierta.
  const [tree, setTree] = useState({ openDepth: 2, generation: 0 });

  const deferred = useDeferredValue(value);
  const result = useMemo(() => parseJson(deferred), [deferred]);
  const isEmpty = deferred.trim() === "";

  const types = useMemo(
    () => (result.ok && view === "types" ? toTypescript(result.data) : ""),
    [result, view],
  );

  const setOpenDepth = (openDepth: number) =>
    setTree((prev) => ({ openDepth, generation: prev.generation + 1 }));

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 pb-20">
      <ToolHeader title="JSON" hint="Valida, formatea y explora. Todo se procesa en tu navegador.">
        <button type="button" className="btn btn-primary" onClick={jsonActions.format}>
          <Icon icon={iconIndent} width={14} /> Formatear
        </button>
        <button type="button" className="btn" onClick={jsonActions.minify}>
          <Icon icon={iconBolt} width={14} /> Minificar
        </button>
        <Divider />
        <button type="button" className="btn" onClick={jsonActions.load}>
          <Icon icon={iconUpload} width={14} /> Abrir
        </button>
        <button type="button" className="btn" onClick={jsonActions.download}>
          <Icon icon={iconDownload} width={14} /> Descargar
        </button>
        <button type="button" className="btn" onClick={jsonActions.copy}>
          <Icon icon={iconCopy} width={14} /> Copiar
        </button>
        <button type="button" className="btn" onClick={jsonActions.share}>
          <Icon icon={iconLink} width={14} /> Compartir
        </button>
        <Divider />
        <button
          type="button"
          className="btn btn-ghost btn-danger"
          onClick={jsonActions.clear}
          disabled={!value}
        >
          <Icon icon={iconTrash} width={14} /> Limpiar
        </button>
      </ToolHeader>

      <div className="grid min-h-0 flex-1 grid-rows-2 gap-3 lg:grid-cols-2 lg:grid-rows-1">
        <Panel>
          <div className="panel-header">
            <h2 className="panel-title">Entrada</h2>
            {!isEmpty && (
              <div className="flex items-center gap-1.5">
                <span className="badge hidden sm:inline-flex">
                  {deferred.split("\n").length} líneas · {formatBytes(deferred)}
                </span>
                {result.ok ? (
                  <span className="badge badge-ok">válido</span>
                ) : (
                  <span className="badge badge-danger">inválido</span>
                )}
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor
              value={value}
              onChange={setValue}
              ariaLabel="Editor JSON"
              placeholder="Pega o escribe tu JSON aquí…"
              errorLine={!isEmpty && !result.ok ? result.line : undefined}
              autoFocus
            />
          </div>
          {!isEmpty && !result.ok && (
            <p className="shrink-0 truncate border-t border-danger/20 bg-danger/10 px-4 py-1.5 font-mono text-[11px] text-danger">
              {result.line ? `Ln ${result.line}, Col ${result.column} · ` : ""}
              {result.error}
            </p>
          )}
        </Panel>

        <Panel>
          <div className="panel-header">
            <div role="tablist" className="tabs">
              {VIEWS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={view === id}
                  className="tab"
                  onClick={() => setView(id)}
                >
                  <Icon icon={icon} width={13} /> {label}
                </button>
              ))}
            </div>

            {result.ok && !isEmpty && (
              <div className="flex items-center">
                {view === "tree" && (
                  <>
                    <button
                      type="button"
                      className="icon-btn"
                      title="Expandir todo"
                      aria-label="Expandir todo"
                      onClick={() => setOpenDepth(Number.POSITIVE_INFINITY)}
                    >
                      <Icon icon={iconExpand} width={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      title="Contraer todo"
                      aria-label="Contraer todo"
                      onClick={() => setOpenDepth(1)}
                    >
                      <Icon icon={iconCollapse} width={14} />
                    </button>
                  </>
                )}
                {view === "table" && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => exportCsv(result.data)}
                  >
                    <Icon icon={iconCsv} width={14} /> Exportar CSV
                  </button>
                )}
                {view === "types" && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => copyText(types, "Tipos copiados")}
                  >
                    <Icon icon={iconCopy} width={14} /> Copiar
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {isEmpty ? (
              <EmptyState title="Sin datos todavía">
                <button
                  type="button"
                  className="text-fg underline underline-offset-2 hover:text-white"
                  onClick={() => setValue(EXAMPLE)}
                >
                  Cargar un ejemplo
                </button>{" "}
                o abre un archivo .json
              </EmptyState>
            ) : !result.ok ? (
              <EmptyState title="El JSON no es válido">
                <code className="font-mono text-danger">{result.error}</code>
              </EmptyState>
            ) : view === "tree" ? (
              <div className="p-2">
                <JsonTree key={tree.generation} data={result.data} openDepth={tree.openDepth} />
              </div>
            ) : view === "table" ? (
              <JsonTable data={result.data} />
            ) : (
              <pre className="p-3 font-mono text-xs leading-5 text-fg">{types}</pre>
            )}
          </div>
        </Panel>
      </div>

    </div>
  );
}
