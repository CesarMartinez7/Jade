import { create } from "zustand";

export type Theme = "dia" | "noche";

const THEME_KEY = "jade_theme";

function initialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dia" || saved === "noche") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "noche" : "dia";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

interface UiState {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

export const useUi = create<UiState>((set, get) => ({
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  togglePalette: () => set((state) => ({ paletteOpen: !state.paletteOpen })),
  theme: initialTheme(),
  toggleTheme: () => {
    const theme = get().theme === "dia" ? "noche" : "dia";
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },
}));

applyTheme(useUi.getState().theme);
