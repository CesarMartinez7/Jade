// Conversión de colores, contraste WCAG y generación de escalas y armonías.

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Acepta #rgb, #rrggbb, rgb(r, g, b) y hsl(h, s%, l%). Devuelve null si no es un color. */
export function parseColor(input: string): Rgb | null {
  const text = input.trim().toLowerCase();

  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(text);
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].replace(/./g, "$&$&") : hex[1];
    const value = Number.parseInt(digits, 16);
    return { r: value >> 16, g: (value >> 8) & 255, b: value & 255 };
  }

  const numbers = text.match(/-?\d+(\.\d+)?/g)?.map(Number);
  if (numbers?.length !== 3) return null;

  if (text.startsWith("rgb")) {
    const [r, g, b] = numbers.map((n) => Math.round(clamp(n, 0, 255)));
    return { r, g, b };
  }
  if (text.startsWith("hsl")) {
    return hslToRgb({
      h: ((numbers[0] % 360) + 360) % 360,
      s: clamp(numbers[1], 0, 100),
      l: clamp(numbers[2], 0, 100),
    });
  }
  return null;
}

export function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = s / 100;
  const ln = l / 100;
  const chroma = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - chroma / 2;

  const sector = Math.floor(h / 60) % 6;
  const [rn, gn, bn] = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ][sector];

  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
  };
}

export const formatRgb = ({ r, g, b }: Rgb) => `rgb(${r}, ${g}, ${b})`;
export const formatHsl = ({ h, s, l }: Hsl) => `hsl(${h}, ${s}%, ${l}%)`;

/** Luminancia relativa según WCAG 2. */
function luminance({ r, g, b }: Rgb): number {
  const [rl, gl, bl] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** Relación de contraste WCAG entre dos colores, de 1 a 21. */
export function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Negro o blanco, el que se lea mejor sobre el color dado. */
export function readableOn(color: Rgb): string {
  return contrast(color, { r: 17, g: 17, b: 17 }) >= contrast(color, { r: 255, g: 255, b: 255 })
    ? "#111111"
    : "#ffffff";
}

const SCALE_STEPS = [95, 88, 78, 66, 54, 44, 34, 26, 18, 10];

/** El mismo tono y saturación, de muy claro a muy oscuro. */
export function scale(color: Rgb): string[] {
  const { h, s } = rgbToHsl(color);
  return SCALE_STEPS.map((l) => toHex(hslToRgb({ h, s, l })));
}

/** Colores relacionados girando el tono en la rueda de color. */
export function harmonies(color: Rgb): { label: string; colors: string[] }[] {
  const hsl = rgbToHsl(color);
  const rotate = (degrees: number) => toHex(hslToRgb({ ...hsl, h: (hsl.h + degrees + 360) % 360 }));
  return [
    { label: "Complementario", colors: [rotate(0), rotate(180)] },
    { label: "Análogos", colors: [rotate(-30), rotate(0), rotate(30)] },
    { label: "Tríada", colors: [rotate(0), rotate(120), rotate(240)] },
    { label: "Complementarios divididos", colors: [rotate(0), rotate(150), rotate(210)] },
  ];
}

export function randomHex(): string {
  return toHex({
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  });
}
