import { memo, useState } from "react";
import { copyText } from "../lib/browser";
import { childPath, type JsonValue } from "../lib/json";
import { Icon, iconChevronDown, iconChevronRight, iconCopy } from "./icons";

const PAGE = 200;
const LONG_STRING = 140;

interface NodeProps {
  name?: string | number;
  value: JsonValue;
  path: string;
  depth: number;
  /** Los nodos con profundidad menor a este valor empiezan abiertos. */
  openDepth: number;
}

function Primitive({ value }: { value: Exclude<JsonValue, object> | null }) {
  const [expanded, setExpanded] = useState(false);

  if (value === null) return <span className="tok-keyword">null</span>;
  if (typeof value === "boolean") return <span className="tok-keyword">{String(value)}</span>;
  if (typeof value === "number") return <span className="tok-number">{value}</span>;

  if (/^https?:\/\//.test(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="tok-string underline decoration-line-strong underline-offset-2 hover:decoration-fg"
      >
        &quot;{value}&quot;
      </a>
    );
  }

  if (value.length > LONG_STRING && !expanded) {
    return (
      <span className="tok-string">
        &quot;{value.slice(0, LONG_STRING)}
        <button
          type="button"
          className="mx-1 bg-hover px-1 text-[10px] text-muted hover:text-fg"
          onClick={() => setExpanded(true)}
        >
          +{value.length - LONG_STRING}
        </button>
        &quot;
      </span>
    );
  }

  return <span className="tok-string">&quot;{value}&quot;</span>;
}

const Node = memo(({ name, value, path, depth, openDepth }: NodeProps) => {
  const isContainer = typeof value === "object" && value !== null;
  const [open, setOpen] = useState(depth < openDepth);
  const [limit, setLimit] = useState(PAGE);

  const indent = { paddingLeft: depth * 16 + 4 };

  const label = name !== undefined && (
    <>
      <button
        type="button"
        title={`Copiar ruta: ${path}`}
        className={typeof name === "number" ? "text-faint hover:text-fg" : "tok-key hover:underline"}
        onClick={() => copyText(path, "Ruta copiada")}
      >
        {typeof name === "number" ? name : `"${name}"`}
      </button>
      <span className="tok-punct mr-1.5">:</span>
    </>
  );

  const copyButton = (
    <button
      type="button"
      title="Copiar valor"
      aria-label="Copiar valor"
      className="ml-2 inline-flex align-middle text-faint opacity-0 group-hover/row:opacity-100 hover:text-fg focus-visible:opacity-100"
      onClick={() =>
        copyText(typeof value === "string" ? value : JSON.stringify(value, null, 2), "Valor copiado")
      }
    >
      <Icon icon={iconCopy} width={12} />
    </button>
  );

  if (!isContainer) {
    return (
      <div className="group/row pr-2 hover:bg-hover/60" style={indent}>
        <span className="inline-block w-4" />
        {label}
        <Primitive value={value} />
        {copyButton}
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries: [string | number, JsonValue][] = isArray
    ? value.map((item, i) => [i, item])
    : Object.entries(value);
  const [openBracket, closeBracket] = isArray ? "[]" : "{}";
  const summary = `${entries.length} ${isArray ? "elementos" : "claves"}`;

  return (
    <div>
      <div className="group/row pr-2 hover:bg-hover/60" style={indent}>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Contraer" : "Expandir"}
          className="inline-flex w-4 justify-center align-middle text-faint hover:text-fg"
          onClick={() => setOpen(!open)}
        >
          <Icon icon={open ? iconChevronDown : iconChevronRight} width={12} />
        </button>
        {label}
        <span className="tok-punct">{openBracket}</span>
        {!open && (
          <>
            <button
              type="button"
              className="mx-1 text-faint hover:text-fg"
              onClick={() => setOpen(true)}
            >
              {entries.length ? "…" : ""}
            </button>
            <span className="tok-punct">{closeBracket}</span>
          </>
        )}
        <span className="ml-2 text-[10px] text-faint">{summary}</span>
        {copyButton}
      </div>

      {open && (
        <>
          {entries.slice(0, limit).map(([key, child]) => (
            <Node
              key={key}
              name={key}
              value={child}
              path={childPath(path, key)}
              depth={depth + 1}
              openDepth={openDepth}
            />
          ))}
          {entries.length > limit && (
            <button
              type="button"
              className="my-0.5 bg-hover px-2 text-[11px] text-muted hover:text-fg"
              style={{ marginLeft: (depth + 1) * 16 + 20 }}
              onClick={() => setLimit(limit + PAGE)}
            >
              Mostrar {Math.min(PAGE, entries.length - limit)} más ({entries.length - limit} restantes)
            </button>
          )}
          <div style={indent}>
            <span className="tok-punct ml-4">{closeBracket}</span>
          </div>
        </>
      )}
    </div>
  );
});

interface JsonTreeProps {
  data: JsonValue;
  /** Profundidad abierta inicial; cambia junto con `key` para expandir/contraer todo. */
  openDepth?: number;
}

export default function JsonTree({ data, openDepth = 2 }: JsonTreeProps) {
  return (
    <div className="font-mono text-xs leading-5 break-all whitespace-pre-wrap">
      <Node value={data} path="$" depth={0} openDepth={openDepth} />
    </div>
  );
}
