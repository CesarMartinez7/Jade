export type CronFieldKey = "minute" | "hour" | "day" | "month" | "dow";

export interface CronField {
  key: CronFieldKey;
  label: string;
  short: string;
  range: string;
  min: number;
  max: number;
  atom: string;
  step: string;
  names?: Record<string, number>;
}

const MINUTE = "(?:[1-5]?\\d)";
const HOUR = "(?:[01]?\\d|2[0-3])";
const DAY = "(?:[1-9]|[12]\\d|3[01])";
const MONTH = "(?:[1-9]|1[0-2])";
const DOW = "[0-7]";
const MONTH_NAMES = "(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)";
const DOW_NAMES = "(?:MON|TUE|WED|THU|FRI|SAT|SUN)";

export const MONTH_MAP: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

export const DOW_MAP: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

export const FIELDS: CronField[] = [
  { key: "minute", label: "Minuto", short: "min", range: "0-59", min: 0, max: 59, atom: MINUTE, step: MINUTE },
  { key: "hour", label: "Hora", short: "h", range: "0-23", min: 0, max: 23, atom: HOUR, step: HOUR },
  { key: "day", label: "Día del mes", short: "día", range: "1-31", min: 1, max: 31, atom: DAY, step: DAY },
  { key: "month", label: "Mes", short: "mes", range: "1-12 o ENE-DIC", min: 1, max: 12, atom: `(?:${MONTH}|${MONTH_NAMES})`, step: MONTH, names: MONTH_MAP },
  { key: "dow", label: "Día de semana", short: "día", range: "0-7 o LUN-DOM", min: 0, max: 7, atom: `(?:${DOW}|${DOW_NAMES})`, step: DOW, names: DOW_MAP },
];

const token = (atom: string, step: string) => `(?:\\*|${atom}(?:-${atom})?)(?:/${step})?`;
const list = (atom: string, step: string) => `(?:${token(atom, step)}(?:,${token(atom, step)})*)`;

const PATTERN = "(?:\\*|(\\d+)(?:-(\\d+))?)(?:/(\\d+))?";

export const CRON_REGEX = new RegExp(
  `^${FIELDS.map((field) => list(field.atom, field.step)).join("\\s+")}$`,
  "i",
);

const FIELD_REGEXES = FIELDS.map((field) => new RegExp(`^${list(field.atom, field.step)}$`, "i"));

export interface ParsedField {
  field: CronField;
  text: string;
  values: number[];
  description: string;
}

export type CronParse =
  | { ok: true; fields: ParsedField[]; next: Date[]; text: string }
  | { ok: false; error: string };

function toValues(text: string, field: CronField): number[] {
  const set: number[] = [];
  for (let raw of text.split(",")) {
    if (field.names) raw = raw.replace(/[A-Za-z]{3}/g, (word) => String(field.names?.[word.toUpperCase()] ?? word));
    const match = new RegExp(`^${PATTERN}$`).exec(raw);
    if (!match) continue;
    const all = match[1] === undefined;
    const start = all ? field.min : Number(match[1]);
    const end = all ? field.max : match[2] !== undefined ? Number(match[2]) : start;
    const step = match[3] !== undefined ? Number(match[3]) : 1;
    if (end < start) continue;
    for (let value = start; value <= end; value += step) set.push(value);
  }
  const deduped = [...new Set(set.filter((value) => value >= field.min && value <= field.max))].sort((a, b) => a - b);
  return field.key === "dow" ? [...new Set(deduped.map((value) => (value === 7 ? 0 : value)))].sort((a, b) => a - b) : deduped;
}

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function describeToken(field: CronField, raw: string): string {
  let text = raw;
  if (field.names) text = text.replace(/[A-Za-z]{3}/g, (word) => String(field.names?.[word.toUpperCase()] ?? word));
  const match = new RegExp(`^${PATTERN}$`).exec(text);
  if (!match) return raw;
  const value = field.key === "dow" ? Number(match[1]) % 7 : Number(match[1]);
  const start = match[1] === undefined ? field.min : value;
  const end = match[2] !== undefined ? Number(match[2]) : start;
  const step = match[3] !== undefined ? Number(match[3]) : 1;
  const unit = field.short;
  const every = `cada ${step} ${unit}${step === 1 ? "" : "s"}`;

  if (match[1] === undefined) return every;
  if (field.key === "dow" && start === end && step === 1) return DAY_NAMES[start % 7];
  if (start === end) return `${unit} ${start}${step > 1 ? ` · ${every}` : ""}`;
  const range = `${unit} ${start}-${end}`;
  return step > 1 ? `${range} · ${every}` : range;
}

function describeField(field: CronField, text: string, values: number[]): string {
  const full = field.key === "dow" ? values.length === 7 : values.length === field.max + 1;
  if (full) {
    if (field.key === "minute") return "cada minuto";
    if (field.key === "hour") return "cada hora";
    return field.key === "dow" || field.key === "day" ? "todos los días" : "todos los meses";
  }
  return text.split(",").map((tokenText) => describeToken(field, tokenText)).join(", ");
}

export function parseCron(expression: string, now = new Date()): CronParse {
  const text = expression.trim();
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length !== 5) {
    return {
      ok: false,
      error:
        parts.length < 5
          ? `Faltan campos: se esperan 5 (minuto hora día mes semana) y hay ${parts.length}.`
          : `Sobran campos: se esperan 5 (minuto hora día mes semana) y hay ${parts.length}.`,
    };
  }
  for (let index = 0; index < FIELDS.length; index += 1) {
    if (!FIELD_REGEXES[index].test(parts[index])) {
      return { ok: false, error: `«${parts[index]}» no es válido para ${FIELDS[index].label.toLowerCase()} (se admite ${FIELDS[index].range}).` };
    }
  }

  const fields = FIELDS.map((field, index) => {
    const values = toValues(parts[index], field);
    const description = describeField(field, parts[index], values);
    return { field, text: parts[index], values, description };
  });

  return { ok: true, fields, text, next: nextRuns(fields, now) };
}

function nextRuns(fields: ParsedField[], now: Date, count = 5): Date[] {
  const { minute, hour, day, month, dow } = Object.fromEntries(fields.map((parsed) => [parsed.field.key, parsed.values])) as Record<CronFieldKey, number[]>;
  const dayFull = day.length === 31;
  const dowFull = dow.length === 7;
  const out: Date[] = [];
  let cursor = new Date(now);
  cursor.setSeconds(0, 0);
  for (let steps = 0; steps < 60 * 24 * 366 * 2 && out.length < count; steps += 1) {
    cursor = new Date(cursor.getTime() + 60_000);
    const dayOfWeek = cursor.getDay();
    const dayOfMonth = cursor.getDate();
    const monthMatches = month.includes(cursor.getMonth() + 1);
    const dayMatches = dayFull && dowFull
      ? true
      : dayFull
        ? dow.includes(dayOfWeek)
        : dowFull
          ? day.includes(dayOfMonth)
          : day.includes(dayOfMonth) || dow.includes(dayOfWeek);
    if (!monthMatches || !dayMatches) continue;
    if (!hour.includes(cursor.getHours())) continue;
    if (!minute.includes(cursor.getMinutes())) continue;
    out.push(cursor);
  }
  return out;
}