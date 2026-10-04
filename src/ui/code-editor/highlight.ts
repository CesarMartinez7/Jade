export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// string (con ":" opcional → es una clave) | literal | número
const JSON_TOKEN =
  /("(?:[^"\\\n]|\\.)*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

/** Devuelve HTML resaltado y siempre escapado, seguro para innerHTML. */
export function highlightJson(code: string): string {
  let html = "";
  let last = 0;
  for (const match of code.matchAll(JSON_TOKEN)) {
    const index = match.index ?? 0;
    html += `<span class="tok-punct">${escapeHtml(code.slice(last, index))}</span>`;
    const [token, str, colon, keyword] = match;
    if (str !== undefined) {
      const kind = colon ? "tok-key" : "tok-string";
      html += `<span class="${kind}">${escapeHtml(str)}</span>`;
      if (colon) html += `<span class="tok-punct">${colon}</span>`;
    } else if (keyword) {
      html += `<span class="tok-keyword">${keyword}</span>`;
    } else {
      html += `<span class="tok-number">${token}</span>`;
    }
    last = index + token.length;
  }
  return html + `<span class="tok-punct">${escapeHtml(code.slice(last))}</span>`;
}
