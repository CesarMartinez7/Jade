import { useMemo, useState } from "react";
import { copyText } from "../lib/browser";
import { CRON_REGEX, FIELDS, parseCron } from "../lib/cron";
import { EmptyState, ToolHeader } from "../shell/tool-header";
import { Icon, iconCalendar, iconCopy, iconTrash } from "../ui/icons";
import { Panel } from "../ui/panel";

const PRESETS = [
  { expr: "* * * * *", label: "Cada minuto" },
  { expr: "*/5 * * * *", label: "Cada 5 min" },
  { expr: "0 * * * *", label: "Cada hora" },
  { expr: "0 9 * * *", label: "09:00 diario" },
  { expr: "15 8 * * 1-5", label: "08:15 entre semana" },
  { expr: "0 */2 * * *", label: "Cada 2 horas" },
  { expr: "0 0 1 * *", label: "Cada mes" },
];

const fmt = (date: Date) =>
  date.toLocaleString("es-ES", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function CronTool() {
  const [expression, setExpression] = useState(PRESETS[1].expr);
  const parsed = useMemo(() => parseCron(expression), [expression]);

  const copyNext = () => {
    if (parsed.ok) {
      copyText(parsed.next.map((date) => fmt(date)).join("\n"), "Próximas ejecuciones copiadas");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ToolHeader
        no="08"
        title="Cron"
        hint="Valida expresiones cron de 5 campos con una expresión regular y calcula las próximas ejecuciones."
      >
        <button
          type="button"
          className="btn btn-ghost btn-danger"
          disabled={!expression}
          onClick={() => setExpression("")}
        >
          <Icon icon={iconTrash} width={14} /> Limpiar
        </button>
      </ToolHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto pr-1 pb-1 lg:flex-row lg:overflow-hidden">
        <div className="flex w-80 shrink-0 flex-col gap-4">
          <Panel className="shrink-0">
            <div className="panel-header">
              <h2 className="panel-title">Expresión</h2>
              <span className={`badge ${parsed.ok ? "badge-ok" : "badge-danger"}`}>
                {parsed.ok ? "válida" : "inválida"}
              </span>
            </div>
            <div className="flex flex-col gap-2 p-3">
              <input
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                aria-label="Expresión cron"
                aria-invalid={!parsed.ok}
                placeholder="* * * * *"
                spellCheck={false}
                autoFocus
                className="input font-mono"
              />
              {!parsed.ok && expression.trim() && (
                <p className="text-xs leading-5 font-medium text-danger">{parsed.error}</p>
              )}
            </div>
          </Panel>

          <Panel className="shrink-0">
            <div className="panel-header">
              <h2 className="panel-title">Ejemplos</h2>
            </div>
            <div className="flex flex-wrap gap-1.5 p-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.expr}
                  type="button"
                  title={preset.expr}
                  aria-pressed={preset.expr === expression}
                  className="btn"
                  onClick={() => setExpression(preset.expr)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="shrink-0">
            <div className="panel-header">
              <h2 className="panel-title">Campos</h2>
            </div>
            <table className="w-full text-xs">
              <tbody>
                {FIELDS.map((field, index) => (
                  <tr key={field.key} className="border-b border-line last:border-0">
                    <td className="py-1.5 pr-2 pl-3 font-bold whitespace-nowrap">{index + 1}.</td>
                    <td className="w-0 py-1.5 pr-2 font-bold whitespace-nowrap">{field.label}</td>
                    <td className="w-0 py-1.5 pr-3 font-mono text-muted whitespace-nowrap">{field.range}</td>
                    <td className="py-1.5 pl-2 font-mono text-faint">a-b · a/n · */n · a,b,c</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t-2 border-ink p-2 text-[11px] text-muted">
              Hora local. Día de semana: 0 o 7 es domingo; también <code className="font-mono">MON-SUN</code>.
            </p>
          </Panel>

          <Panel className="shrink-0">
            <div className="panel-header">
              <h2 className="panel-title">Validación</h2>
              <button
                type="button"
                className="icon-btn"
                title="Copiar expresión regular"
                aria-label="Copiar expresión regular"
                onClick={() => copyText(CRON_REGEX.source, "Expresión regular copiada")}
              >
                <Icon icon={iconCopy} width={14} />
              </button>
            </div>
            <details className="p-3">
              <summary className="cursor-pointer text-xs font-bold text-muted">Cómo se valida</summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded-lg border-2 border-line bg-bg p-2 font-mono text-[11px] leading-4 break-words whitespace-pre-wrap">
                {CRON_REGEX.source}
              </pre>
            </details>
            <p className="border-t-2 border-ink p-2 text-[11px] text-muted">
              Sintaxis clásica: <code className="font-mono">minuto hora día-mes mes día-semana</code>, sin
              segundos ni año.
            </p>
          </Panel>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <Panel className="flex-1">
            <div className="panel-header">
              <h2 className="panel-title">Explicación</h2>
              {parsed.ok && <span className="font-mono text-[11px] font-bold text-muted">{parsed.text}</span>}
            </div>
            {!expression.trim() ? (
              <EmptyState title="Escribe una expresión cron">
                por ejemplo <b>*/5 * * * *</b> o elige una de los ejemplos
              </EmptyState>
            ) : !parsed.ok ? (
              <EmptyState title="La expresión no es válida">
                <Icon icon={iconCalendar} width={14} /> {parsed.error}
              </EmptyState>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-auto">
                <ol className="text-xs">
                  {parsed.fields.map(({ field, text, description }) => (
                    <li key={field.key} className="border-b border-line">
                      <div className="flex items-baseline gap-3 py-2 pr-4 pl-3">
                        <span className="tok-key w-24 shrink-0">{field.label}</span>
                        <code className="shrink-0 rounded-md border-2 border-ink bg-yellow px-1.5 font-mono font-bold text-onfill">
                          {text}
                        </code>
                        <span className="min-w-0 break-words">{description}</span>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="border-t-2 border-ink p-2.5 text-[11px] text-muted">
                  Si se restringen a la vez el día del mes y el día de semana, se ejecuta cuando cumple
                  cualquiera de los dos (comportamiento estándar de cron).
                </p>
              </div>
            )}
          </Panel>

          <Panel className="min-h-56">
            <div className="panel-header">
              <h2 className="panel-title">Próximas ejecuciones</h2>
              <button
                type="button"
                className="icon-btn"
                title="Copiar fechas"
                aria-label="Copiar fechas"
                disabled={!parsed.ok}
                onClick={copyNext}
              >
                <Icon icon={iconCopy} width={14} />
              </button>
            </div>
            {parsed.ok ? (
              parsed.next.length === 0 ? (
                <EmptyState title="No se encontraron ejecuciones" />
              ) : (
                <ol className="font-mono text-xs">
                  {parsed.next.map((date, index) => (
                    <li key={index} className="flex items-baseline gap-3 border-b border-line py-2 px-4 last:border-0">
                      <span className="w-6 shrink-0 font-bold text-faint">{index + 1}</span>
                      <span className="font-bold capitalize">{fmt(date)}</span>
                    </li>
                  ))}
                </ol>
              )
            ) : (
              <EmptyState title="Corrige la expresión para ver fechas" />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}