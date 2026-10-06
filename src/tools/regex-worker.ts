// La regex se ejecuta aquí, fuera del hilo principal: si un patrón entra en
// retroceso catastrófico, la interfaz puede terminar este worker en vez de
// quedarse congelada.
import {
  groupNames,
  MAX_MATCHES,
  type RegexMatch,
  type RegexRequest,
  type RegexResponse,
} from "../lib/regex";

self.onmessage = (event: MessageEvent<RegexRequest>) => {
  const { id, pattern, flags, text, replacement } = event.data;
  let response: RegexResponse;

  try {
    const regex = new RegExp(pattern, flags);
    const names = groupNames(pattern);

    // Sin la bandera g solo existe la primera coincidencia.
    const found = regex.global
      ? text.matchAll(regex)
      : [regex.exec(text)].filter((match) => match !== null);

    const matches: RegexMatch[] = [];
    let truncated = false;
    for (const match of found) {
      if (matches.length >= MAX_MATCHES) {
        truncated = true;
        break;
      }
      matches.push({
        index: match.index ?? 0,
        text: match[0],
        groups: match.slice(1).map((value, i) => ({ name: names[i] ?? `$${i + 1}`, value })),
      });
    }

    response = { id, ok: true, matches, truncated, replaced: text.replace(regex, replacement) };
  } catch (e) {
    response = { id, ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  self.postMessage(response);
};
