// Exporta una palabra en pegatinas (ui/sticker-word.tsx) como archivo suelto.
import { STICKER } from "../ui/sticker-word";

const INK = "#111111";
const FONT_FAMILY = '"Bricolage Grotesque Variable", "Bricolage Grotesque", system-ui, sans-serif';

const { colors, tilts, step, tile, height, fontSize, fontWeight } = STICKER;

const lettersOf = (word: string) => [...word.toUpperCase()];
const widthOf = (count: number) => Math.max(count, 1) * step + 16;

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * SVG independiente de la app. Las letras siguen siendo texto: fuera de Jade
 * solo se ven igual si la fuente Bricolage Grotesque está disponible.
 */
export function stickerWordSvg(word: string): string {
  const letters = lettersOf(word);
  const tiles = letters
    .map((letter, i) => {
      if (letter === " ") return "";
      const half = tile / 2;
      return (
        `<g transform="translate(${12 + i * step} 12) rotate(${tilts[i % tilts.length]} ${half} ${half})">` +
        `<rect x="4" y="4" width="${tile}" height="${tile}" rx="8" fill="${INK}"/>` +
        `<rect width="${tile}" height="${tile}" rx="8" fill="${colors[i % colors.length]}" stroke="${INK}" stroke-width="3"/>` +
        `<text x="${half}" y="${half + 1}" text-anchor="middle" dominant-baseline="central" fill="${INK}" ` +
        `font-family='${FONT_FAMILY}' font-weight="${fontWeight}" font-size="${fontSize}">${escapeXml(letter)}</text>` +
        "</g>"
      );
    })
    .join("");
  const width = widthOf(letters.length);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
    `width="${width * 4}" height="${height * 4}" role="img" aria-label="${escapeXml(word)}">${tiles}</svg>\n`
  );
}

/** PNG con fondo transparente. Se dibuja con la fuente ya cargada en la página. */
export async function stickerWordPng(word: string, scale = 4): Promise<Blob | null> {
  const letters = lettersOf(word);
  const font = `${fontWeight} ${fontSize}px ${FONT_FAMILY}`;
  await document.fonts.load(font);

  const canvas = document.createElement("canvas");
  canvas.width = widthOf(letters.length) * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(scale, scale);
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;

  letters.forEach((letter, i) => {
    if (letter === " ") return;
    const half = tile / 2;
    ctx.save();
    // Mismo giro que el SVG: alrededor del centro de la ficha.
    ctx.translate(12 + i * step + half, 12 + half);
    ctx.rotate((tilts[i % tilts.length] * Math.PI) / 180);
    ctx.translate(-half, -half);

    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.roundRect(4, 4, tile, tile, 8);
    ctx.fill();

    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.roundRect(0, 0, tile, tile, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = INK;
    ctx.fillText(letter, half, half + 2);
    ctx.restore();
  });

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
