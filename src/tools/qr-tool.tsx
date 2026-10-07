import type React from "react";
import { create as createQr, toDataURL, type QRCode } from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { downloadText } from "../lib/browser";
import { contrast, parseColor, toHex } from "../lib/color";
import { EmptyState, ToolHeader } from "../shell/tool-header";
import { Icon, iconBolt, iconDownload, iconTrash, iconWifi } from "../ui/icons";
import { Panel } from "../ui/panel";

const LEVELS = ["L", "M", "Q", "H"] as const;
type Level = (typeof LEVELS)[number];

const RECOVERY: Record<Level, string> = {
  L: "7 %",
  M: "15 %",
  Q: "25 %",
  H: "30 %",
};

const MARGINS = [0, 2, 4, 6];

const EXAMPLES = {
  url: "https://example.com/jade",
};

type WifiSec = "WPA" | "WEP" | "nopass";

interface Wifi {
  ssid: string;
  password: string;
  security: WifiSec;
  hidden: boolean;
}

const SECURITY_LABELS: { id: WifiSec; label: string }[] = [
  { id: "WPA", label: "WPA" },
  { id: "WEP", label: "WEP" },
  { id: "nopass", label: "Sin clave" },
];

function escapeField(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function unescapeField(value: string): string {
  return value.replace(/\\([\\;,:"])/g, "$1");
}

function wifiString({ ssid, password, security, hidden }: Wifi): string | null {
  if (!ssid.trim()) return null;
  const fields = [`T:${security}`, `S:${escapeField(ssid)}`];
  if (security !== "nopass") fields.push(`P:${escapeField(password)}`);
  if (hidden) fields.push("H:true");
  return `WIFI:${fields.join(";")};;`;
}

function parseWifi(text: string): Wifi | null {
  if (!text.startsWith("WIFI:")) return null;
  const wifi: Wifi = { ssid: "", password: "", security: "WPA", hidden: false };
  let key = "";
  let value = "";
  const commit = () => {
    if (!key) return;
    const parsed = unescapeField(value);
    if (key === "T") wifi.security = parsed === "WEP" || parsed === "nopass" ? parsed : "WPA";
    else if (key === "S") wifi.ssid = parsed;
    else if (key === "P") wifi.password = parsed;
    else if (key === "H") wifi.hidden = parsed.toLowerCase() === "true";
    key = "";
    value = "";
  };
  let inKey = true;
  for (let i = 5; i < text.length; i += 1) {
    const char = text[i];
    if (char === "\\") {
      value += char + (text[i + 1] ?? "");
      i += 1;
      inKey = false;
      continue;
    }
    if (char === ":") {
      inKey = false;
      continue;
    }
    if (char === ";") {
      commit();
      inKey = true;
      continue;
    }
    if (inKey) key += char;
    else value += char;
  }
  return wifi.ssid ? wifi : null;
}

type Attempt =
  | { status: "empty" }
  | { status: "overflow" }
  | { status: "ok"; code: QRCode };

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const invalid = parseColor(text) === null;

  return (
    <div className="flex items-center gap-2">
      <span className="label w-20 shrink-0">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Selector de ${label.toLowerCase()}`}
        className="size-8 shrink-0 cursor-pointer rounded-lg border-2 border-ink bg-transparent p-0"
      />
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = parseColor(e.target.value);
          if (parsed && e.target.value.length >= 4) onChange(toHex(parsed));
        }}
        onBlur={() => setText(value)}
        aria-label={label}
        aria-invalid={invalid}
        spellCheck={false}
        className="input aria-invalid:border-danger"
      />
    </div>
  );
}

function Choice({
  label,
  options,
  value,
  render,
  onChange,
}: {
  label: string;
  options: number[];
  value: number;
  render?: (option: number) => string;
  onChange: (option: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="label w-20 shrink-0">{label}</span>
      <div className="flex gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="btn"
            aria-pressed={option === value}
            onClick={() => onChange(option)}
          >
            {render ? render(option) : option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line px-3 py-1.5 last:border-b-0">
      <dt className="shrink-0 text-xs text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right font-mono text-xs">{children}</dd>
    </div>
  );
}

function qrSvg(total: number, path: string, dark: string, light: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="${light}"/><path d="${path}" fill="${dark}"/></svg>`;
}

export default function QrTool() {
  const [text, setText] = useState(EXAMPLES.url);
  const [level, setLevel] = useState<Level>("M");
  const [margin, setMargin] = useState(4);
  const [dark, setDark] = useState("#111111");
  const [light, setLight] = useState("#ffffff");
  const [wifi, setWifi] = useState<Wifi>({ ssid: "", password: "", security: "WPA", hidden: false });
  const [wifiOpen, setWifiOpen] = useState(false);
  const wifiDirty = useRef(false);

  const trimmed = text.trim();

  const updateWifi = (patch: Partial<Wifi>) => {
    wifiDirty.current = true;
    setWifi((prev) => ({ ...prev, ...patch }));
  };

  const wifiCode = useMemo(() => wifiString(wifi), [wifi]);
  const wifiActive = typeof wifiCode === "string" && trimmed === wifiCode;

  const generateWifi = () => {
    const code = wifiString(wifi);
    if (!code) return;
    wifiDirty.current = false;
    setText(code);
  };

  useEffect(() => {
    if (wifiDirty.current) return;
    const parsed = parseWifi(trimmed);
    if (!parsed) return;
    const code = wifiString(parsed);
    if (code && code !== trimmed) setWifi(parsed);
  }, [trimmed]);

  const attempt = useMemo<Attempt>(() => {
    if (!trimmed) return { status: "empty" };
    try {
      return { status: "ok", code: createQr(trimmed, { errorCorrectionLevel: level }) };
    } catch {
      return { status: "overflow" };
    }
  }, [trimmed, level]);

  const geometry = useMemo(() => {
    if (attempt.status !== "ok") return null;
    const { size, data } = attempt.code.modules;
    const total = size + margin * 2;
    let path = "";
    for (let y = 0; y < size; y += 1) {
      let run = 0;
      for (let x = 0; x <= size; x += 1) {
        const isDark = x < size && data[y * size + x] !== 0;
        if (isDark) run += 1;
        else if (run > 0) {
          path += `M${x - run + margin} ${y + margin}h${run}v1h-${run}z`;
          run = 0;
        }
      }
    }
    return { total, path, size };
  }, [attempt, margin]);

  const ratio = useMemo(() => {
    const ink = parseColor(dark);
    const bg = parseColor(light);
    return ink && bg ? contrast(ink, bg) : 0;
  }, [dark, light]);

  const downloadPng = async () => {
    if (attempt.status !== "ok") return;
    try {
      const url = await toDataURL(trimmed, {
        errorCorrectionLevel: level,
        margin,
        width: 1024,
        color: { dark, light },
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = "qr.png";
      a.click();
    } catch {
      toast.error("No se pudo generar el PNG");
    }
  };

  const downloadSvg = () => {
    if (!geometry) return;
    downloadText(qrSvg(geometry.total, geometry.path, dark, light), "qr.svg", "image/svg+xml");
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ToolHeader
        no="07"
        title="QR"
        hint="Genera códigos QR en tu navegador. El contenido nunca sale de tu equipo."
      >
        <button type="button" className="btn" onClick={() => setText(EXAMPLES.url)}>
          <Icon icon={iconBolt} width={14} /> Ejemplo
        </button>
        <button
          type="button"
          className="btn"
          aria-pressed={wifiOpen}
          onClick={() => setWifiOpen((open) => !open)}
        >
          <Icon icon={iconWifi} width={14} /> WiFi
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-danger"
          disabled={!text}
          onClick={() => setText("")}
        >
          <Icon icon={iconTrash} width={14} /> Limpiar
        </button>
      </ToolHeader>

      <div className="grid min-h-0 flex-1 gap-4 overflow-auto pr-1 pb-1 lg:grid-cols-2 lg:overflow-hidden">
        <div className="flex min-h-0 flex-col gap-4">
          <Panel className="min-h-44 flex-1">
            <div className="panel-header">
              <h2 className="panel-title">Contenido</h2>
              {trimmed && <span className="badge">{trimmed.length} caracteres</span>}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Contenido del QR"
              placeholder="URL, texto, WIFI:T:WPA;S:…;;"
              spellCheck={false}
              autoFocus
              className="textarea min-h-0 flex-1"
            />
          </Panel>

          {wifiOpen && (
            <Panel className="shrink-0">
              <div className="panel-header">
                <h2 className="panel-title">WiFi</h2>
                {wifiActive && <span className="badge badge-ok">en uso</span>}
              </div>
              <div className="flex flex-col gap-3 p-3">
                <label className="flex items-center gap-2">
                  <span className="label w-20 shrink-0">Red</span>
                  <input
                    value={wifi.ssid}
                    onChange={(e) => updateWifi({ ssid: e.target.value })}
                    aria-label="Nombre de la red WiFi"
                    placeholder="MiRed"
                    spellCheck={false}
                    className="input"
                  />
                </label>

                <div className="flex items-center gap-2">
                  <span className="label w-20 shrink-0">Clave</span>
                  <div className="flex gap-1.5">
                    {SECURITY_LABELS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        className="btn"
                        aria-pressed={wifi.security === id}
                        onClick={() => updateWifi({ security: id })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  value={wifi.password}
                  onChange={(e) => updateWifi({ password: e.target.value })}
                  aria-label="Contraseña de la red WiFi"
                  placeholder="Contraseña…"
                  disabled={wifi.security === "nopass"}
                  spellCheck={false}
                  className="input disabled:opacity-60"
                />

                <button
                  type="button"
                  className="btn justify-between"
                  aria-pressed={wifi.hidden}
                  onClick={() => updateWifi({ hidden: !wifi.hidden })}
                >
                  Red oculta
                  <span className="font-mono text-[10px] opacity-60">H:true</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary justify-center"
                  disabled={!wifi.ssid.trim()}
                  onClick={generateWifi}
                >
                  <Icon icon={iconWifi} width={14} /> Generar código WiFi
                </button>
              </div>
            </Panel>
          )}

          <Panel className="shrink-0">
            <div className="panel-header">
              <h2 className="panel-title">Ajustes</h2>
              <span
                className={`badge ${ratio >= 7 ? "badge-ok" : ratio >= 4 ? "badge-warn" : "badge-danger"}`}
              >
                contraste {ratio.toFixed(1)}
              </span>
            </div>
            <div className="flex flex-col gap-3 p-3">
              <div className="flex items-center gap-2">
                <span className="label w-20 shrink-0">Corrección</span>
                <div className="flex gap-1.5">
                  {LEVELS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="btn"
                      title={`Recupera hasta ${RECOVERY[option]} del código`}
                      aria-pressed={option === level}
                      onClick={() => setLevel(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <span className="font-mono text-[11px] font-bold text-muted">
                  {RECOVERY[level]}
                </span>
              </div>

              <Choice
                label="Margen"
                options={MARGINS}
                value={margin}
                onChange={setMargin}
              />

              <ColorField label="Tinta" value={dark} onChange={setDark} />
              <ColorField label="Fondo" value={light} onChange={setLight} />
            </div>
          </Panel>
        </div>

        <Panel>
          <div className="panel-header">
            <h2 className="panel-title">Vista previa</h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!geometry}
                onClick={downloadSvg}
              >
                <Icon icon={iconDownload} width={14} /> SVG
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!geometry}
                onClick={downloadPng}
              >
                <Icon icon={iconDownload} width={14} /> PNG
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            {attempt.status === "empty" ? (
              <EmptyState title="Escribe o pega el contenido del QR">
                Usa los botones de arriba para cargar un ejemplo
              </EmptyState>
            ) : attempt.status === "overflow" ? (
              <EmptyState title="Contenido demasiado largo">
                <span className="text-danger">
                  Reduce el texto o baja el nivel de corrección
                </span>
              </EmptyState>
            ) : (
              geometry && (
                <div className="mx-auto flex w-full max-w-80 flex-col gap-4">
                  <div className="brutal rounded-xl p-4" style={{ background: light }}>
                    <svg
                      viewBox={`0 0 ${geometry.total} ${geometry.total}`}
                      role="img"
                      aria-label="Código QR generado"
                      shapeRendering="crispEdges"
                      className="block w-full"
                    >
                      <rect width={geometry.total} height={geometry.total} fill={light} />
                      <path d={geometry.path} fill={dark} />
                    </svg>
                  </div>
                  <dl className="overflow-hidden rounded-xl border-2 border-ink bg-bg">
                    <Row label="Versión">{attempt.code.version}</Row>
                    <Row label="Corrección">
                      {level} · {RECOVERY[level]}
                    </Row>
                    <Row label="Módulos">{geometry.size} × {geometry.size}</Row>
                    <Row label="Margen">{margin}</Row>
                    <Row label="Contraste">{ratio.toFixed(2)} : 1</Row>
                  </dl>
                </div>
              )
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
