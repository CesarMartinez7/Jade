// Letras de bloque (celda de 20×28, trazo de 6) dibujadas como formas para
// no depender de ninguna fuente. Cada entrada es el `d` de un path.
const LETTERS: Record<string, string> = {
  A: "M0 0h20v28h-6v-9H6v9H0zM6 6v7h8V6z",
  C: "M0 0h20v6H6v16h14v6H0z",
  I: "M0 0h20v6h-7v16h7v6H0v-6h7V6H0z",
  L: "M0 0h6v22h14v6H0z",
  N: "M0 0h6l8 17V0h6v28h-6L6 11v17H0z",
  O: "M0 0h20v28H0zM6 6v16h8V6z",
  R: "M0 0h20v17h-5.5L20 28h-7l-5.5-11H6v11H0zM6 6v5h8V6z",
};

const COLORS = ["#ff8fc7", "#ffd84d", "#6ee7b0", "#c4b5fd", "#ffffff"];
const TILTS = [-6, 4, -3, 5, -5];
const STEP = 56;

interface StickerWordProps {
  word: string;
  className?: string;
}

/** Una palabra como fila de pegatinas: una ficha de color por letra. */
export function StickerWord({ word, className }: StickerWordProps) {
  const letters = word.toUpperCase().split("");
  return (
    <svg
      viewBox={`0 0 ${letters.length * STEP + 16} 72`}
      className={className}
      role="img"
      aria-label={word}
    >
      {letters.map((letter, i) => (
        <g
          key={i}
          transform={`translate(${12 + i * STEP} 12) rotate(${TILTS[i % TILTS.length]} 22 22)`}
        >
          <rect x="4" y="4" width="44" height="44" rx="8" fill="var(--color-shadow)" />
          <rect
            width="44"
            height="44"
            rx="8"
            fill={COLORS[i % COLORS.length]}
            stroke="var(--color-ink)"
            strokeWidth="3"
          />
          <path d={LETTERS[letter]} fill="#111111" fillRule="evenodd" transform="translate(12 8)" />
        </g>
      ))}
    </svg>
  );
}
