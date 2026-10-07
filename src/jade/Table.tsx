import type React from "react";
import { useMemo, useState } from "react";
import { cx } from "./cx";

export type TableTone = "yellow" | "lilac" | "pink" | "mint";

const HEADER_TONES: Record<TableTone, string> = {
  yellow: "bg-yellow",
  lilac: "bg-lilac",
  pink: "bg-pink",
  mint: "bg-mint",
};

const ALIGN = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export interface TableColumn<Row> {
  /** Identificador de la columna; por defecto también es el campo que se muestra. */
  key: string;
  header: React.ReactNode;
  align?: keyof typeof ALIGN;
  /** Clases extra para las celdas de la columna (ancho, fuente mono…). */
  className?: string;
  /** Contenido de la celda. Si se omite, se muestra `row[key]`. */
  render?: (row: Row, index: number) => React.ReactNode;
  /** Permite ordenar al hacer clic en la cabecera. */
  sortable?: boolean;
  /** Valor por el que se ordena. Si se omite, se usa `row[key]`. */
  sortValue?: (row: Row) => string | number;
}

export interface TableProps<Row> extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  columns: TableColumn<Row>[];
  rows: Row[];
  /** Clave estable de cada fila. Por defecto, su posición. */
  rowKey?: (row: Row, index: number) => React.Key;
  tone?: TableTone;
  /** Alterna el fondo de las filas pares. */
  striped?: boolean;
  /** Filas más bajas, para tablas densas. */
  compact?: boolean;
  /** Altura máxima del cuerpo; al superarla hace scroll con la cabecera fija. */
  maxHeight?: number | string;
  /** Lo que se muestra cuando no hay filas. */
  empty?: React.ReactNode;
  onRowClick?: (row: Row, index: number) => void;
}

type Sort = { key: string; direction: "asc" | "desc" } | null;

function field<Row>(row: Row, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

export function Table<Row>({
  columns,
  rows,
  rowKey,
  tone = "yellow",
  striped,
  compact,
  maxHeight,
  empty = "Sin datos",
  onRowClick,
  className,
  ...rest
}: TableProps<Row>) {
  const [sort, setSort] = useState<Sort>(null);

  const sorted = useMemo(() => {
    const column = sort && columns.find((candidate) => candidate.key === sort.key);
    if (!sort || !column) return rows;
    const value = (row: Row) => column.sortValue?.(row) ?? (field(row, column.key) as string | number);
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const [x, y] = [value(a), value(b)];
      if (typeof x === "number" && typeof y === "number") return (x - y) * factor;
      return String(x ?? "").localeCompare(String(y ?? ""), undefined, { numeric: true }) * factor;
    });
  }, [rows, columns, sort]);

  // Clic en la cabecera: ascendente → descendente → sin orden.
  const toggleSort = (key: string) =>
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "asc" };
      return current.direction === "asc" ? { key, direction: "desc" } : null;
    });

  const cell = compact ? "px-3 py-1.5" : "px-4 py-2.5";

  return (
    <div
      className={cx("brutal overflow-auto rounded-xl bg-bg", className)}
      style={{ maxHeight }}
      {...rest}
    >
      <table className="w-full border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            {columns.map((column) => {
              const direction = sort?.key === column.key ? sort.direction : undefined;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    direction ? (direction === "asc" ? "ascending" : "descending") : undefined
                  }
                  className={cx(
                    "label sticky top-0 z-10 border-b-2 border-ink whitespace-nowrap text-onfill",
                    HEADER_TONES[tone],
                    ALIGN[column.align ?? "left"],
                    cell,
                    column.className,
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className="label inline-flex items-center gap-1.5 hover:underline"
                      onClick={() => toggleSort(column.key)}
                    >
                      {column.header}
                      <span aria-hidden="true" className={cx("text-[9px]", !direction && "opacity-35")}>
                        {direction === "desc" ? "▼" : "▲"}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="dotted px-4 py-8 text-center font-semibold text-muted">
                {empty}
              </td>
            </tr>
          ) : (
            sorted.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row, index) : index}
                className={cx(
                  "transition-colors hover:bg-hover",
                  striped && "even:bg-panel",
                  onRowClick && "cursor-pointer",
                )}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cx(
                      "border-b border-line font-medium",
                      index === sorted.length - 1 && "border-b-0",
                      ALIGN[column.align ?? "left"],
                      cell,
                      column.className,
                    )}
                  >
                    {column.render
                      ? column.render(row, index)
                      : (field(row, column.key) as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
