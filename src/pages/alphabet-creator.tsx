import { useState } from "react";
import toast from "react-hot-toast";
import { Badge, Button, Card, CardBody, CardHeader, Field, Input } from "../jade";
import { copyText, downloadText } from "../lib/browser";
import { downloadBlob, stickerWordPng, stickerWordSvg } from "../lib/sticker-export";
import { iconCopy, iconDownload, iconTrash } from "../ui/icons";
import { StickerWord } from "../ui/sticker-word";

const GLYPHS = [..."ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789!?&"];
const MAX_LENGTH = 20;

const fileName = (word: string) =>
  word
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, "-")
    .replace(/^-|-$/g, "") || "jade";

/** Escribe una palabra con el alfabeto de pegatinas de Jade y expórtala. */
export function AlphabetCreator() {
  const [word, setWord] = useState("JADE");
  const trimmed = word.trim();

  const append = (glyph: string) => setWord((prev) => (prev + glyph).slice(0, MAX_LENGTH));

  const downloadPng = async () => {
    const blob = await stickerWordPng(trimmed);
    if (!blob) return toast.error("No se pudo generar el PNG");
    downloadBlob(blob, `${fileName(trimmed)}.png`);
  };

  return (
    <Card className="col-span-full flex flex-col">
      <CardHeader tone="pink">
        <div className="min-w-0">
          <h3 className="text-sm leading-tight font-extrabold">Creador de alfabeto</h3>
          <p className="truncate text-[11px] font-medium opacity-70">
            Escribe cualquier palabra con las letras de Jade y descárgala
          </p>
        </div>
        <Badge>
          {[...word].length}/{MAX_LENGTH}
        </Badge>
      </CardHeader>

      <div className="dotted flex min-h-36 items-center justify-center border-b-2 border-ink p-5">
        {trimmed ? (
          // La altura se limita para que una palabra corta no ocupe todo el ancho.
          <StickerWord word={word} className="max-h-28 w-full" />
        ) : (
          <p className="sticker rounded-lg px-3 py-1.5 text-sm">Escribe algo para empezar</p>
        )}
      </div>

      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Texto" className="min-w-48 flex-1">
            <Input
              value={word}
              maxLength={MAX_LENGTH}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Tu nombre, tu marca…"
              spellCheck={false}
            />
          </Field>
          <Button variant="primary" icon={iconDownload} disabled={!trimmed} onClick={downloadPng}>
            PNG
          </Button>
          <Button
            icon={iconDownload}
            disabled={!trimmed}
            onClick={() => downloadText(stickerWordSvg(trimmed), `${fileName(trimmed)}.svg`, "image/svg+xml")}
          >
            SVG
          </Button>
          <Button
            icon={iconCopy}
            disabled={!trimmed}
            onClick={() => copyText(`<StickerWord word="${trimmed}" />`, "Uso copiado")}
          >
            Uso
          </Button>
          <Button variant="danger" icon={iconTrash} disabled={!word} onClick={() => setWord("")}>
            Limpiar
          </Button>
        </div>

        <div>
          <p className="label mb-2 text-[10px] text-muted">Alfabeto · clic para añadir</p>
          <div className="flex flex-wrap gap-1.5">
            {GLYPHS.map((glyph) => (
              <button
                key={glyph}
                type="button"
                aria-label={`Añadir ${glyph}`}
                className="brutal-sm flex size-9 items-center justify-center rounded-lg bg-bg text-base font-extrabold transition-transform hover:-translate-y-0.5 hover:-rotate-6 hover:bg-yellow hover:text-onfill active:translate-y-0.5"
                onClick={() => append(glyph)}
              >
                {glyph}
              </button>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
