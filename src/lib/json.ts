export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ParseResult =
  | { ok: true; data: JsonValue }
  | { ok: false; error: string; line?: number; column?: number };

/** Parsea JSON y, si falla, intenta ubicar el error en línea/columna. */
export function parseJson(text: string): ParseResult {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    const lineCol = /line (\d+) column (\d+)/.exec(error);
    if (lineCol) {
      return { ok: false, error, line: +lineCol[1], column: +lineCol[2] };
    }
    const position = /position (\d+)/.exec(error);
    if (position) {
      const before = text.slice(0, +position[1]).split("\n");
      return {
        ok: false,
        error,
        line: before.length,
        column: before[before.length - 1].length + 1,
      };
    }
    return { ok: false, error };
  }
}

export function formatBytes(text: string): string {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

function tsType(value: JsonValue, indent: number): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "unknown[]";
    const types = [...new Set(value.map((item) => tsType(item, indent)))];
    return types.length === 1 ? `${types[0]}[]` : `(${types.join(" | ")})[]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "Record<string, unknown>";
    const pad = "  ".repeat(indent + 1);
    const lines = entries.map(([key, val]) => {
      const name = IDENTIFIER.test(key) ? key : JSON.stringify(key);
      return `${pad}${name}: ${tsType(val, indent + 1)};`;
    });
    return `{\n${lines.join("\n")}\n${"  ".repeat(indent)}}`;
  }
  return typeof value;
}

/** Genera una definición de tipos TypeScript a partir de un valor JSON. */
export function toTypescript(value: JsonValue, name = "Root"): string {
  const type = tsType(value, 0);
  return type.startsWith("{") && type.endsWith("}")
    ? `interface ${name} ${type}`
    : `type ${name} = ${type};`;
}

/** Ruta estilo JS para un nodo: `$.users[0].name`. */
export function childPath(parent: string, key: string | number): string {
  if (typeof key === "number") return `${parent}[${key}]`;
  return IDENTIFIER.test(key)
    ? `${parent}.${key}`
    : `${parent}[${JSON.stringify(key)}]`;
}
