import { useMemo } from "react";
import type { JsonValue } from "../lib/json";

const MAX_ROWS = 500;

function isRecord(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function Cell({ value }: { value: JsonValue | undefined }) {
  if (value === undefined) return <span className="text-faint">—</span>;
  if (value === null) return <span className="tok-keyword">null</span>;
  if (typeof value === "boolean") return <span className="tok-keyword">{String(value)}</span>;
  if (typeof value === "number") return <span className="tok-number">{value}</span>;
  if (typeof value === "string") return <span>{value}</span>;
  return <span className="text-muted">{JSON.stringify(value)}</span>;
}

export default function JsonTable({ data }: { data: JsonValue }) {
  const { columns, rows } = useMemo<{
    columns: string[];
    rows: Record<string, JsonValue>[];
  }>(() => {
    const list = Array.isArray(data) ? data : [data];
    if (!list.every(isRecord)) {
      return { columns: ["valor"], rows: list.map((item) => ({ valor: item })) };
    }
    // Unión de claves: las filas no tienen por qué compartir la misma forma.
    const keys = new Set<string>();
    for (const row of list) for (const key of Object.keys(row)) keys.add(key);
    return { columns: [...keys], rows: list };
  }, [data]);

  if (rows.length === 0) {
    return <p className="p-6 text-center text-xs text-faint">El arreglo está vacío.</p>;
  }

  return (
    <>
      <table className="w-full border-collapse font-mono text-xs">
        <thead className="sticky top-0 z-10 bg-raised text-left text-muted">
          <tr>
            <th className="w-10 border-b border-line px-2 py-1.5 text-right font-normal text-faint">#</th>
            {columns.map((column) => (
              <th key={column} className="border-b border-l border-line px-2 py-1.5 font-medium whitespace-nowrap">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, MAX_ROWS).map((row, i) => (
            <tr key={i} className="hover:bg-hover/60">
              <td className="border-b border-line px-2 py-1 text-right text-faint">{i + 1}</td>
              {columns.map((column) => (
                <td
                  key={column}
                  className="max-w-80 truncate border-b border-l border-line px-2 py-1"
                  title={typeof row[column] === "object" ? undefined : String(row[column] ?? "")}
                >
                  <Cell value={row[column]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > MAX_ROWS && (
        <p className="p-3 text-center text-xs text-faint">
          Mostrando {MAX_ROWS} de {rows.length} filas.
        </p>
      )}
    </>
  );
}
