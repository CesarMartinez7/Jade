// Geometría compartida con la exportación a SVG/PNG (lib/sticker-export.ts).
export const STICKER = {
  colors: ["#ff8fc7", "#ffd84d", "#6ee7b0", "#c4b5fd", "#ffffff"],
  tilts: [-6, 4, -3, 5, -5],
  step: 56,
  tile: 44,
  height: 72,
  fontSize: 28,
  fontWeight: 800,
};

const { colors: COLORS, tilts: TILTS, step: STEP, tile: TILE } = STICKER;

interface StickerWordProps {
  word: string;
  className?: string;
}

/** Una palabra como fila de pegatinas: una ficha de color por carácter. */
export function StickerWord({ word, className }: StickerWordProps) {
  const letters = [...word.toUpperCase()];
  const width = Math.max(letters.length, 1) * STEP + 16;

  return (
    <svg
      viewBox={`0 0 ${width} ${STICKER.height}`}
      className={className}
      role="img"
      aria-label={word}
    >
      {letters.map((letter, i) =>
        letter === " " ? null : (
          <g
            key={i}
            transform={`translate(${12 + i * STEP} 12) rotate(${TILTS[i % TILTS.length]} ${TILE / 2} ${TILE / 2})`}
          >
            <rect x="4" y="4" width={TILE} height={TILE} rx="8" fill="var(--color-shadow)" />
            <rect
              width={TILE}
              height={TILE}
              rx="8"
              fill={COLORS[i % COLORS.length]}
              stroke="var(--color-ink)"
              strokeWidth="3"
            />
            <text
              x={TILE / 2}
              y={TILE / 2 + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#111111"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: STICKER.fontWeight,
                fontSize: STICKER.fontSize,
              }}
            >
              {letter}
            </text>
          </g>
        ),
      )}
    </svg>
  );
}
