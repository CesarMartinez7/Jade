import { useMemo } from "react";
import { Table, type TableColumn } from "../jade";
import type { JsonValue } from "../lib/json";

const MAX_ROWS = 500;
const INDEX_KEY = "__row_index__";

type Row = Record<string, JsonValue>;

function isRecord(value: JsonValue): value is Row {
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
    columns: TableColumn<Row>[];
    rows: Row[];
  }>(() => {
    const list = Array.isArray(data) ? data : [data];
    if (!list.every(isRecord)) {
      return {
        columns: [{ key: "valor", header: "valor", render: (row) => <Cell value={row.valor} /> }],
        rows: list.map((item) => ({ valor: item })),
      };
    }
    // Unión de claves: las filas no tienen por qué compartir la misma forma.
    const keys = new Set<string>();
    for (const row of list) for (const key of Object.keys(row)) keys.add(key);
    return {
      columns: [
        {
          key: INDEX_KEY,
          header: "#",
          align: "right",
          className: "font-mono text-faint",
          render: (_row, index) => index + 1,
        },
        ...[...keys].map((key) => ({
          key,
          header: key,
          sortable: true,
          className: "max-w-80 truncate font-mono",
          render: (row: Row) => <Cell value={row[key]} />,
        })),
      ],
      rows: list as Row[],
    };
  }, [data]);

  if (rows.length === 0) {
    return <p className="p-6 text-center text-xs text-faint">El arreglo está vacío.</p>;
  }

  return (
    <div className="p-3">
      <Table
        className="w-full"
        columns={columns}
        rows={rows.slice(0, MAX_ROWS)}
        rowKey={(_row, index) => index}
        tone="yellow"
        striped
        compact
        empty="Sin filas"
      />
      {rows.length > MAX_ROWS && (
        <p className="p-3 text-center text-xs text-faint">
          Mostrando {MAX_ROWS} de {rows.length} filas.
        </p>
      )}
    </div>
  );
}
