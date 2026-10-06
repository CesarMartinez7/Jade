import { useEffect, useMemo, useState } from "react";
import { copyText } from "../lib/browser";
import {
  contrast,
  formatHsl,
  formatRgb,
  harmonies,
  parseColor,
  randomHex,
  readableOn,
  rgbToHsl,
  scale,
  toHex,
} from "../lib/color";
import { ToolHeader } from "../shell/tool-header";
import { Icon, iconCopy, iconShuffle, iconSwap } from "../ui/icons";
import { Panel } from "../ui/panel";

const STORAGE_KEY = "color_state";
const FALLBACK = { color: "#7be3b5", background: "#111111" };

function initialState(): typeof FALLBACK {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (parseColor(saved?.color ?? "") && parseColor(saved?.background ?? "")) return saved;
  } catch {
    // Dato guardado corrupto: se usan los colores por defecto.
  }
  return FALLBACK;
}

/** Campo de color: selector nativo más texto libre (hex, rgb o hsl). */
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  // El texto es propio del campo para poder escribir valores a medias sin perderlos.
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const invalid = parseColor(text) === null;

  return (
    <label className="flex min-w-0 flex-1 items-center gap-2">
      <span className="label w-12 shrink-0">{label}</span>
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
          if (parsed) onChange(toHex(parsed));
        }}
        onBlur={() => setText(value)}
        aria-label={label}
        aria-invalid={invalid}
        placeholder="#7be3b5, rgb(…) o hsl(…)"
        spellCheck={false}
        className="input aria-invalid:border-danger"
      />
    </label>
  );
}

function Swatch({ hex, onPick, label }: { hex: string; onPick: (hex: string) => void; label?: string }) {
  const rgb = parseColor(hex);
  return (
    <button
      type="button"
      title={`Usar ${hex}`}
      className="flex h-14 min-w-0 flex-1 flex-col items-center justify-end border-r-2 border-ink pb-1 font-mono text-[10px] font-bold transition-[flex-grow] last:border-r-0 hover:grow-[1.6]"
      style={{ background: hex, color: rgb ? readableOn(rgb) : undefined }}
      onClick={() => onPick(hex)}
    >
      {label && <span className="font-sans opacity-80">{label}</span>}
      <span className="truncate">{hex}</span>
    </button>
  );
}

const LEVELS = [
  { label: "AA texto normal", min: 4.5 },
  { label: "AA texto grande", min: 3 },
  { label: "AAA texto normal", min: 7 },
  { label: "AAA texto grande", min: 4.5 },
];

export default function ColorTool() {
  const [initial] = useState(initialState);
  const [color, setColor] = useState(initial.color);
  const [background, setBackground] = useState(initial.background);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ color, background }));
  }, [color, background]);

  // Ambos estados son siempre hex válidos: solo cambian a través de parseColor.
  const rgb = useMemo(() => parseColor(color) ?? { r: 0, g: 0, b: 0 }, [color]);
  const backgroundRgb = useMemo(
    () => parseColor(background) ?? { r: 0, g: 0, b: 0 },
    [background],
  );

  const hsl = rgbToHsl(rgb);
  const formats = [
    { label: "HEX", value: color },
    { label: "RGB", value: formatRgb(rgb) },
    { label: "HSL", value: formatHsl(hsl) },
  ];
  const shades = useMemo(() => scale(rgb), [rgb]);
  const groups = useMemo(() => harmonies(rgb), [rgb]);
  const ratio = contrast(rgb, backgroundRgb);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ToolHeader no="06" title="Colores" hint="Convierte formatos, genera escalas y comprueba el contraste.">
        <button type="button" className="btn btn-primary" onClick={() => setColor(randomHex())}>
          <Icon icon={iconShuffle} width={14} /> Aleatorio
        </button>
        <button
          type="button"
          className="btn"
          title="Intercambiar color y fondo"
          onClick={() => {
            setColor(background);
            setBackground(color);
          }}
        >
          <Icon icon={iconSwap} width={14} /> Intercambiar
        </button>
      </ToolHeader>

      <div className="grid min-h-0 flex-1 gap-4 overflow-auto pr-1 pb-1 lg:grid-cols-2 lg:overflow-hidden">
        <div className="flex min-h-0 flex-col gap-4">
          <Panel className="shrink-0">
            <div className="panel-header">
              <h2 className="panel-title">Color</h2>
            </div>
            <div
              className="flex h-28 shrink-0 items-end border-b-2 border-ink p-3 font-mono text-2xl font-bold"
              style={{ background: color, color: readableOn(rgb) }}
            >
              {color}
            </div>
            <div className="border-b-2 border-ink p-3">
              <ColorField label="Color" value={color} onChange={setColor} />
            </div>
            <dl className="font-mono text-xs">
              {formats.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 border-b border-line py-1 pr-2 pl-4 last:border-b-0"
                >
                  <dt className="label w-10 shrink-0 text-muted">{label}</dt>
                  <dd className="min-w-0 flex-1 truncate font-bold">{value}</dd>
                  <button
                    type="button"
                    className="icon-btn"
                    title={`Copiar ${label}`}
                    aria-label={`Copiar ${label}`}
                    onClick={() => copyText(value, `${label} copiado`)}
                  >
                    <Icon icon={iconCopy} width={14} />
                  </button>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel className="min-h-48 flex-1">
            <div className="panel-header">
              <h2 className="panel-title">Escala y armonías</h2>
              <span className="text-[11px] font-bold">clic para usar</span>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <div className="flex border-b-2 border-ink">
                {shades.map((hex) => (
                  <Swatch key={hex} hex={hex} onPick={setColor} />
                ))}
              </div>
              {groups.map((group) => (
                <div key={group.label} className="border-b border-line last:border-b-0">
                  <p className="label px-4 pt-2 pb-1 text-[10px] text-muted">{group.label}</p>
                  <div className="mx-4 mb-3 flex overflow-hidden rounded-lg border-2 border-ink">
                    {group.colors.map((hex, i) => (
                      <Swatch key={i} hex={hex} onPick={setColor} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel>
          <div className="panel-header">
            <h2 className="panel-title">Contraste</h2>
            <span className={`badge ${ratio >= 4.5 ? "badge-ok" : ratio >= 3 ? "badge-warn" : "badge-danger"}`}>
              {ratio.toFixed(2)} : 1
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3 border-b-2 border-ink p-3">
            <ColorField label="Texto" value={color} onChange={setColor} />
            <ColorField label="Fondo" value={background} onChange={setBackground} />
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <div className="border-b-2 border-ink p-6" style={{ background, color }}>
              <p className="text-3xl leading-tight font-extrabold">Texto grande de muestra</p>
              <p className="mt-2 text-sm">
                Texto normal de muestra: así se leería un párrafo con esta combinación de color y
                fondo.
              </p>
              <p className="mt-2 font-mono text-xs">const jade = "{color}";</p>
            </div>

            <ul>
              {LEVELS.map(({ label, min }) => {
                const pass = ratio >= min;
                return (
                  <li
                    key={label}
                    className="flex items-center justify-between gap-3 border-b border-line px-4 py-2 text-xs"
                  >
                    <span className="font-semibold">{label}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-faint">mín. {min}</span>
                      <span className={`badge ${pass ? "badge-ok" : "badge-danger"}`}>
                        {pass ? "pasa" : "no pasa"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="px-4 py-3 text-xs text-muted">
              Niveles WCAG 2. "Texto grande" es de 24 px en adelante, o 19 px en negrita.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
