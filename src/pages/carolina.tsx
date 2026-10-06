import { StickerWord } from "../ui/sticker-word";

// Textos de la página: cámbialos aquí.
const NAME = "Carolina";
const MESSAGE = "Este rinconcito de internet es tuyo. Gracias por estar.";
const SIGNATURE = "Con cariño, Cesar";
const FOOTNOTE = "Tú que dices que yo no hago nada... jajaja";

function Heart() {
  return (
    <svg width="44" height="44" viewBox="0 0 32 32" aria-hidden="true">
      <g transform="rotate(8 16 16)">
        <rect x="6.5" y="6.5" width="22" height="22" rx="4" fill="var(--color-shadow)" />
        <rect
          x="4"
          y="4"
          width="22"
          height="22"
          rx="4"
          fill="#ff8fc7"
          stroke="var(--color-ink)"
          strokeWidth="2"
        />
        {/* Corazón de bloques */}
        <path fill="#111111" d="M9 10h4v2h4v-2h4v6h-2v2h-2v2h-4v-2h-2v-2H9z" />
      </g>
    </svg>
  );
}

export default function CarolinaPage() {
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <main className="brutal w-full max-w-xl overflow-hidden rounded-xl bg-bg">
        <div className="flex items-center justify-between border-b-2 border-ink bg-yellow px-4 py-2 text-onfill">
          <span className="label">Para</span>
          <a href="#json" className="label underline underline-offset-2">
            Ir a Jade
          </a>
        </div>

        <div className="dotted flex flex-col items-center gap-5 px-5 py-8 text-center">
          <StickerWord word={NAME} className="w-full max-w-md" />
          <p className="rounded-md bg-bg px-2 text-lg leading-snug font-semibold text-balance">
            {MESSAGE}
          </p>
          <Heart />
          <p className="sticker rounded-lg px-3 py-1.5 text-sm">{SIGNATURE}</p>
          <p className="rounded-md bg-bg px-2 text-xs font-medium text-muted">{FOOTNOTE}</p>
        </div>
      </main>
    </div>
  );
}
