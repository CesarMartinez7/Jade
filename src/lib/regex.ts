// Lógica pura del probador de regex: nombres de grupos, explicación en
// palabras, generación de código y los catálogos de ejemplos y de sintaxis.

export interface RegexMatch {
  index: number;
  text: string;
  groups: { name: string; value: string | undefined }[];
}

export interface RegexRequest {
  id: number;
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
}

export type RegexResponse =
  | { id: number; ok: true; matches: RegexMatch[]; truncated: boolean; replaced: string }
  | { id: number; ok: false; error: string };

// Tope de coincidencias que se devuelven a la interfaz.
export const MAX_MATCHES = 1000;

const NAMED_GROUP = /^\(\?<([^=!][^>]*)>/;

/** Nombre de cada grupo de captura, en orden: el suyo si lo tiene, o $1, $2… */
export function groupNames(pattern: string): string[] {
  const names: string[] = [];
  let inClass = false;
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === "\\") i++;
    else if (char === "[") inClass = true;
    else if (char === "]") inClass = false;
    else if (char === "(" && !inClass) {
      const named = NAMED_GROUP.exec(pattern.slice(i));
      // "(?:", "(?=", "(?<=" y similares no capturan.
      if (named) names.push(named[1]);
      else if (pattern[i + 1] !== "?") names.push(`$${names.length + 1}`);
    }
  }
  return names;
}

// ── Explicación ─────────────────────────────────────────────────────────────

export interface Piece {
  /** Fragmento del patrón, tal cual. */
  text: string;
  /** Qué significa, en palabras. */
  desc: string;
  /** Nivel de anidamiento dentro de grupos. */
  depth: number;
}

const ESCAPES: Record<string, string> = {
  d: "un dígito (0-9)",
  D: "cualquier cosa que no sea un dígito",
  w: "una letra, número o guion bajo",
  W: "cualquier cosa que no sea letra, número ni guion bajo",
  s: "un espacio en blanco (espacio, tab o salto de línea)",
  S: "cualquier cosa que no sea espacio en blanco",
  b: "un límite de palabra",
  B: "una posición que no es límite de palabra",
  n: "un salto de línea",
  r: "un retorno de carro",
  t: "un tabulador",
};

const GROUP_OPENERS: [string, string][] = [
  ["(?:", "grupo (agrupa sin capturar)"],
  ["(?=", "debe ir seguido de"],
  ["(?!", "no debe ir seguido de"],
  ["(?<=", "debe ir precedido de"],
  ["(?<!", "no debe ir precedido de"],
];

const QUANTIFIER = /^(\*|\+|\?|\{(\d+)(,(\d*))?\})(\?)?/;

function quantifierPhrase(match: RegExpExecArray): string {
  const [, symbol, min, comma, max, lazy] = match;
  let phrase: string;
  if (symbol === "*") phrase = "cero o más veces";
  else if (symbol === "+") phrase = "una o más veces";
  else if (symbol === "?") phrase = "opcional";
  else if (!comma) phrase = `exactamente ${min} ${min === "1" ? "vez" : "veces"}`;
  else if (!max) phrase = `${min} o más veces`;
  else phrase = `entre ${min} y ${max} veces`;
  return lazy ? `${phrase} (las menos posibles)` : phrase;
}

interface Draft {
  text: string;
  desc: string;
  depth: number;
  literal: boolean;
  quantified: boolean;
}

/** Descompone un patrón en piezas y describe cada una en palabras. */
export function explain(pattern: string, flags: string): Piece[] {
  const out: Draft[] = [];
  let depth = 0;
  let group = 0;
  let i = 0;

  const push = (text: string, desc: string, literal = false) =>
    out.push({ text, desc, depth, literal, quantified: false });

  while (i < pattern.length) {
    const char = pattern[i];
    const rest = pattern.slice(i);

    if (char === "\\") {
      const next = pattern[i + 1] ?? "";
      const backref = /^\\k<([^>]+)>/.exec(rest);
      if (backref) {
        push(backref[0], `lo mismo que capturó el grupo «${backref[1]}»`);
        i += backref[0].length;
      } else if (/[1-9]/.test(next)) {
        push(`\\${next}`, `lo mismo que capturó el grupo $${next}`);
        i += 2;
      } else {
        push(`\\${next}`, ESCAPES[next] ?? `el carácter «${next}» literal`);
        i += 2;
      }
      continue;
    }

    if (char === "[") {
      let end = i + 1;
      if (pattern[end] === "^") end++;
      if (pattern[end] === "]") end++;
      while (end < pattern.length && pattern[end] !== "]") {
        if (pattern[end] === "\\") end++;
        end++;
      }
      const raw = pattern.slice(i, end + 1);
      const negated = raw[1] === "^";
      const inner = raw.slice(negated ? 2 : 1, -1);
      push(raw, negated ? `un carácter que no sea: ${inner}` : `un carácter de entre: ${inner}`);
      i = end + 1;
      continue;
    }

    if (char === "(") {
      const named = NAMED_GROUP.exec(rest);
      const opener = GROUP_OPENERS.find(([prefix]) => rest.startsWith(prefix));
      let text = "(";
      let desc: string;
      if (named) {
        group++;
        text = named[0];
        desc = `grupo de captura «${named[1]}»`;
      } else if (opener) {
        [text, desc] = opener;
      } else {
        group++;
        desc = `grupo de captura $${group}`;
      }
      push(text, `${desc}:`);
      depth++;
      i += text.length;
      continue;
    }

    if (char === ")") {
      depth = Math.max(0, depth - 1);
      push(")", "fin del grupo");
      i++;
      continue;
    }

    if (char === "|") {
      push("|", "o bien");
      i++;
      continue;
    }

    if (char === ".") {
      push(".", flags.includes("s") ? "cualquier carácter" : "cualquier carácter menos el salto de línea");
      i++;
      continue;
    }

    if (char === "^" || char === "$") {
      const where = char === "^" ? "inicio" : "fin";
      push(char, flags.includes("m") ? `${where} de una línea` : `${where} del texto`);
      i++;
      continue;
    }

    const quantifier = QUANTIFIER.exec(rest);
    const previous = out[out.length - 1];
    if (quantifier && previous && !previous.quantified && !previous.desc.endsWith(":")) {
      let target = previous;
      // En "abc+" el cuantificador solo afecta a la "c": se separa del resto.
      if (previous.literal && previous.text.length > 1) {
        const last = previous.text.slice(-1);
        previous.text = previous.text.slice(0, -1);
        push(last, "", true);
        target = out[out.length - 1];
      }
      target.text += quantifier[0];
      const phrase = quantifierPhrase(quantifier);
      target.desc = target.literal ? phrase : `${target.desc}, ${phrase}`;
      target.quantified = true;
      i += quantifier[0].length;
      continue;
    }

    // Texto literal: los caracteres seguidos se agrupan en una sola pieza.
    if (previous?.literal && !previous.quantified && previous.depth === depth) {
      previous.text += char;
    } else {
      push(char, "", true);
    }
    i++;
  }

  return out.map(({ text, desc, depth: level, literal, quantified }) => {
    if (literal) {
      const raw = quantified ? text[0] : text;
      const what = raw.length === 1 ? `el carácter «${raw}»` : `el texto «${raw}»`;
      return { text, depth: level, desc: quantified ? `${what}, ${desc}` : what };
    }
    return { text, depth: level, desc };
  });
}

// ── Código ──────────────────────────────────────────────────────────────────

export type Language = "javascript" | "python" | "csharp";

export const LANGUAGES: { id: Language; label: string }[] = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "csharp", label: "C#" },
];

/** Fragmento listo para pegar que usa el patrón en el lenguaje elegido. */
export function toCode(pattern: string, flags: string, language: Language): string {
  const all = flags.includes("g");

  if (language === "javascript") {
    const literal = `/${pattern.replace(/\//g, "\\/")}/${flags}`;
    return all
      ? `const regex = ${literal};\n\nfor (const match of texto.matchAll(regex)) {\n  console.log(match[0], match.index);\n}`
      : `const regex = ${literal};\n\nconst match = regex.exec(texto);\nif (match) console.log(match[0], match.index);`;
  }

  if (language === "python") {
    // Python escribe los grupos con nombre como (?P<nombre>…).
    const source = pattern.replace(/\(\?<(?![=!])/g, "(?P<");
    const quote = source.includes('"') ? "'''" : '"';
    const options = [
      flags.includes("i") && "re.IGNORECASE",
      flags.includes("m") && "re.MULTILINE",
      flags.includes("s") && "re.DOTALL",
    ].filter(Boolean);
    const args = options.length ? `, ${options.join(" | ")}` : "";
    const compile = `import re\n\nregex = re.compile(r${quote}${source}${quote}${args})\n\n`;
    return all
      ? `${compile}for match in regex.finditer(texto):\n    print(match.group(0), match.start())`
      : `${compile}match = regex.search(texto)\nif match:\n    print(match.group(0), match.start())`;
  }

  const options = [
    flags.includes("i") && "RegexOptions.IgnoreCase",
    flags.includes("m") && "RegexOptions.Multiline",
    flags.includes("s") && "RegexOptions.Singleline",
  ].filter(Boolean);
  const args = options.length ? `, ${options.join(" | ")}` : "";
  const create = `using System.Text.RegularExpressions;\n\nvar regex = new Regex(@"${pattern.replace(/"/g, '""')}"${args});\n\n`;
  return all
    ? `${create}foreach (Match match in regex.Matches(texto))\n{\n    Console.WriteLine($"{match.Value} {match.Index}");\n}`
    : `${create}var match = regex.Match(texto);\nif (match.Success) Console.WriteLine($"{match.Value} {match.Index}");`;
}

// ── Catálogos ───────────────────────────────────────────────────────────────

export const SAMPLE_TEXT = `Pedido #1042 del 2026-10-06 por $350.000
Pedido #1043 del 2026-10-07 por $89.900
Contacto: cesar@red5g.co, tel 300 123 4567
Web: https://red5g.co/soporte desde 192.168.1.20
Sesión 3f2b8c1e-9a4d-4e7b-8c21-5d6f7a8b9c0d
Colores: #7be3b5, #FFD84D y #111
<a href="/inicio">Inicio</a> <strong>Jade</strong>
ERROR: timeout en el servidor
error: usuario no encontrado`;

export const LIBRARY: { label: string; pattern: string; flags: string }[] = [
  { label: "Correo", pattern: "[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+", flags: "g" },
  { label: "URL", pattern: "https?://\\S+", flags: "g" },
  { label: "Fecha", pattern: "(?<año>\\d{4})-(?<mes>\\d{2})-(?<dia>\\d{2})", flags: "g" },
  { label: "Teléfono", pattern: "\\b\\d{3}[ -]?\\d{3}[ -]?\\d{4}\\b", flags: "g" },
  { label: "Precio", pattern: "\\$[\\d.]+", flags: "g" },
  { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g" },
  {
    label: "UUID",
    pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
    flags: "gi",
  },
  { label: "Color hex", pattern: "#(?:[0-9a-f]{6}|[0-9a-f]{3})\\b", flags: "gi" },
  { label: "Etiqueta HTML", pattern: "<(\\w+)[^>]*>", flags: "g" },
  { label: "Línea de error", pattern: "^error:.*$", flags: "gim" },
];

export const CHEATS: { insert: string; desc: string }[] = [
  { insert: "\\d", desc: "dígito" },
  { insert: "\\w", desc: "letra o número" },
  { insert: "\\s", desc: "espacio" },
  { insert: ".", desc: "cualquier carácter" },
  { insert: "+", desc: "una o más veces" },
  { insert: "*", desc: "cero o más veces" },
  { insert: "?", desc: "opcional" },
  { insert: "{3}", desc: "exactamente 3" },
  { insert: "[abc]", desc: "uno de estos" },
  { insert: "[^abc]", desc: "ninguno de estos" },
  { insert: "()", desc: "grupo de captura" },
  { insert: "(?<nombre>)", desc: "grupo con nombre" },
  { insert: "|", desc: "o bien" },
  { insert: "^", desc: "inicio" },
  { insert: "$", desc: "fin" },
  { insert: "\\b", desc: "límite de palabra" },
];
