import { jwtDecode } from "jwt-decode";
import type React from "react";
import { useMemo, useState } from "react";
import { copyText } from "../lib/browser";
import type { JsonValue } from "../lib/json";
import { EmptyState, ToolHeader } from "../shell/tool-header";
import { Panel } from "../ui/panel";
import { Icon, iconCopy, iconTrash } from "../ui/icons";
import JsonTree from "../ui/json-tree";

type Claims = { [key: string]: JsonValue };

const relativeFormat = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "medium" });

function relativeTime(ms: number): string {
  const seconds = Math.round((ms - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
  }
  return relativeFormat.format(seconds, "second");
}

function decode(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { error: "Un JWT tiene tres partes separadas por puntos: header.payload.firma" };
  }
  try {
    return {
      header: jwtDecode<Claims>(token, { header: true }),
      payload: jwtDecode<Claims>(token),
      signature: parts[2],
    };
  } catch {
    return { error: "No se pudo decodificar: el contenido no es Base64URL/JSON válido" };
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line px-3 py-1.5 last:border-b-0">
      <dt className="shrink-0 text-xs text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right font-mono text-xs">{children}</dd>
    </div>
  );
}

function DateRow({ label, seconds }: { label: string; seconds: JsonValue | undefined }) {
  if (typeof seconds !== "number") return null;
  const ms = seconds * 1000;
  return (
    <Row label={label}>
      {dateFormat.format(ms)} <span className="text-faint">· {relativeTime(ms)}</span>
    </Row>
  );
}

function Part({
  title,
  color,
  data,
}: {
  title: string;
  color: string;
  data: Claims;
}) {
  return (
    <Panel>
      <div className="panel-header">
        <h2 className={`panel-title ${color}`}>{title}</h2>
        <button
          type="button"
          className="icon-btn"
          title="Copiar JSON"
          aria-label={`Copiar ${title}`}
          onClick={() => copyText(JSON.stringify(data, null, 2))}
        >
          <Icon icon={iconCopy} width={14} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        <JsonTree data={data} openDepth={3} />
      </div>
    </Panel>
  );
}

export default function JwtTool() {
  const [token, setToken] = useState("");
  const trimmed = token.trim();
  const decoded = useMemo(() => (trimmed ? decode(trimmed) : null), [trimmed]);
  const ok = decoded && !("error" in decoded) ? decoded : null;
  const error = decoded && "error" in decoded ? decoded.error : null;

  const exp = ok?.payload.exp;
  const expired = typeof exp === "number" && exp * 1000 < Date.now();

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 pb-20">
      <ToolHeader title="JWT" hint="Decodifica header y payload. El token nunca sale de tu navegador.">
        <button
          type="button"
          className="btn btn-ghost btn-danger"
          disabled={!token}
          onClick={() => setToken("")}
        >
          <Icon icon={iconTrash} width={14} /> Limpiar
        </button>
      </ToolHeader>

      <div className="grid min-h-0 flex-1 gap-3 overflow-auto lg:grid-cols-2 lg:overflow-hidden">
        <div className="flex min-h-0 flex-col gap-3">
          <Panel className="min-h-40 flex-1">
            <div className="panel-header">
              <h2 className="panel-title">Token</h2>
              <span className="font-mono text-[11px]">
                <span className="text-danger">header</span>
                <span className="text-faint">.</span>
                <span className="text-tok-keyword">payload</span>
                <span className="text-faint">.</span>
                <span className="text-info">firma</span>
              </span>
            </div>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              aria-label="Token JWT"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
              spellCheck={false}
              autoFocus
              className="textarea min-h-0 flex-1 break-all"
            />
          </Panel>

          {ok && (
            <Panel className="shrink-0">
              <div className="panel-header">
                <h2 className="panel-title">Resumen</h2>
                {typeof exp === "number" && (
                  <span className={`badge ${expired ? "badge-danger" : "badge-ok"}`}>
                    {expired ? "expirado" : "vigente"}
                  </span>
                )}
              </div>
              <dl>
                {typeof ok.header.alg === "string" && <Row label="Algoritmo">{ok.header.alg}</Row>}
                {typeof ok.payload.iss === "string" && <Row label="Emisor (iss)">{ok.payload.iss}</Row>}
                {typeof ok.payload.sub === "string" && <Row label="Sujeto (sub)">{ok.payload.sub}</Row>}
                <DateRow label="Emitido (iat)" seconds={ok.payload.iat} />
                <DateRow label="Válido desde (nbf)" seconds={ok.payload.nbf} />
                <DateRow label="Expira (exp)" seconds={exp} />
              </dl>
              <p className="border-t border-line px-3 py-1.5 text-[11px] text-faint">
                La firma no se verifica: no confíes en estos datos sin validarla en tu servidor.
              </p>
            </Panel>
          )}
        </div>

        {ok ? (
          <div className="grid min-h-0 gap-3 lg:grid-rows-[auto_1fr_auto]">
            <Part title="Header" color="text-danger" data={ok.header} />
            <Part title="Payload" color="text-tok-keyword" data={ok.payload} />
            <Panel>
              <div className="panel-header">
                <h2 className="panel-title text-info">Firma</h2>
              </div>
              <code className="p-3 font-mono text-xs break-all text-muted">{ok.signature}</code>
            </Panel>
          </div>
        ) : (
          <Panel>
            {error ? (
              <EmptyState title="Token inválido">
                <span className="text-danger">{error}</span>
              </EmptyState>
            ) : (
              <EmptyState title="Pega un token para ver su contenido" />
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}
