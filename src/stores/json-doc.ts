import toast from "react-hot-toast";
import { create } from "zustand";
import {
  copyText,
  decodeBase64,
  downloadText,
  encodeBase64,
  pickTextFile,
} from "../lib/browser";
import { parseJson } from "../lib/json";

const STORAGE_KEY = "jsonData";
const SHARE_PARAM = "jsdata";

function initialValue(): string {
  const shared = new URLSearchParams(window.location.search).get(SHARE_PARAM);
  if (shared) {
    try {
      return decodeBase64(shared);
    } catch {
      // URL compartida corrupta: se ignora y se usa lo guardado.
    }
  }
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

interface JsonDocState {
  value: string;
  setValue: (value: string) => void;
}

export const useJsonDoc = create<JsonDocState>((set) => ({
  value: initialValue(),
  setValue: (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Documento demasiado grande para localStorage: se mantiene solo en memoria.
    }
    set({ value });
  },
}));

// ── Acciones sobre el documento (usadas por la barra y la paleta de comandos) ──

function reformat(indent: number | undefined, done: string) {
  const { value, setValue } = useJsonDoc.getState();
  const result = parseJson(value);
  if (!result.ok) {
    toast.error("El JSON no es válido");
    return;
  }
  setValue(JSON.stringify(result.data, null, indent));
  toast.success(done);
}

export const jsonActions = {
  format: () => reformat(2, "JSON formateado"),
  minify: () => reformat(undefined, "JSON minificado"),

  copy: () => {
    const { value } = useJsonDoc.getState();
    if (!value) return toast.error("No hay nada que copiar");
    copyText(value);
  },

  clear: () => {
    useJsonDoc.getState().setValue("");
  },

  load: async () => {
    const text = await pickTextFile(".json,.txt,application/json,text/plain");
    if (text !== null) useJsonDoc.getState().setValue(text);
  },

  download: () => {
    const { value } = useJsonDoc.getState();
    if (!value) return toast.error("No hay nada que descargar");
    downloadText(value, "data.json", "application/json");
  },

  share: () => {
    const { value } = useJsonDoc.getState();
    if (!value) return toast.error("No hay nada que compartir");
    const url = new URL(window.location.href);
    url.searchParams.set(SHARE_PARAM, encodeBase64(value));
    copyText(url.toString(), "Enlace copiado");
  },
};
