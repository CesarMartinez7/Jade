export interface DiffLine {
  kind: "same" | "add" | "del";
  text: string;
  oldNo?: number;
  newNo?: number;
  /** Rango [inicio, fin) del fragmento que cambió dentro de la línea. */
  mark?: [number, number];
}

// Límite de celdas de la tabla LCS (~16 MB) antes de caer al modo simple.
const MAX_CELLS = 4_000_000;

/** Diff por líneas (LCS). `key` normaliza cada línea antes de compararla. */
export function diffLines(
  before: string,
  after: string,
  key: (line: string) => string = (line) => line,
): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const ka = a.map(key);
  const kb = b.map(key);

  // Recorta prefijo y sufijo comunes para achicar la tabla.
  let start = 0;
  while (start < a.length && start < b.length && ka[start] === kb[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && ka[endA - 1] === kb[endB - 1]) {
    endA--;
    endB--;
  }

  const out: DiffLine[] = [];
  const same = (i: number, j: number) =>
    out.push({ kind: "same", text: b[j], oldNo: i + 1, newNo: j + 1 });
  const del = (i: number) => out.push({ kind: "del", text: a[i], oldNo: i + 1 });
  const add = (j: number) => out.push({ kind: "add", text: b[j], newNo: j + 1 });

  for (let i = 0; i < start; i++) same(i, i);

  const n = endA - start;
  const m = endB - start;

  if (n * m > MAX_CELLS) {
    for (let i = start; i < endA; i++) del(i);
    for (let j = start; j < endB; j++) add(j);
  } else {
    // lcs[i][j] = longitud de la LCS de a[start+i..] y b[start+j..]
    const width = m + 1;
    const lcs = new Uint32Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        lcs[i * width + j] =
          ka[start + i] === kb[start + j]
            ? lcs[(i + 1) * width + j + 1] + 1
            : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (ka[start + i] === kb[start + j]) same(start + i++, start + j++);
      else if (lcs[(i + 1) * width + j] >= lcs[i * width + j + 1]) del(start + i++);
      else add(start + j++);
    }
    while (i < n) del(start + i++);
    while (j < m) add(start + j++);
  }

  for (let i = endA, j = endB; i < a.length; i++, j++) same(i, j);

  markPairs(out);
  return out;
}

/** En bloques con igual número de borradas y añadidas, marca qué parte cambió. */
function markPairs(lines: DiffLine[]) {
  let i = 0;
  while (i < lines.length) {
    if (lines[i].kind !== "del") {
      i++;
      continue;
    }
    let dels = i;
    while (dels < lines.length && lines[dels].kind === "del") dels++;
    let adds = dels;
    while (adds < lines.length && lines[adds].kind === "add") adds++;

    if (dels - i === adds - dels) {
      for (let k = 0; k < dels - i; k++) {
        const oldLine = lines[i + k];
        const newLine = lines[dels + k];
        const x = oldLine.text;
        const y = newLine.text;
        let prefix = 0;
        while (prefix < x.length && prefix < y.length && x[prefix] === y[prefix]) prefix++;
        let suffix = 0;
        while (
          suffix < x.length - prefix &&
          suffix < y.length - prefix &&
          x[x.length - 1 - suffix] === y[y.length - 1 - suffix]
        ) {
          suffix++;
        }
        oldLine.mark = [prefix, x.length - suffix];
        newLine.mark = [prefix, y.length - suffix];
      }
    }
    i = adds;
  }
}
