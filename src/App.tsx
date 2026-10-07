import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import "./App.css";
import CommandPalette from "./shell/command-palette";
import { TOOLS, type ToolId, toolFromHash } from "./shell/tools";
import { useUi } from "./stores/ui";
import { Icon } from "./ui/icons";
import { Logo } from "./ui/logo";

// Páginas fuera del índice de herramientas (solo por hash).
const CarolinaPage = lazy(() => import("./pages/carolina"));
const JadeComponentsPage = lazy(() => import("./pages/jade-components"));
const isCarolina = () => window.location.hash === "#carolina";
const isJade = () => window.location.hash === "#jade";

const App = () => {
  const [carolina, setCarolina] = useState(isCarolina);
  const [jade, setJade] = useState(isJade);
  const [active, setActive] = useState<ToolId>(toolFromHash);
  // Las herramientas visitadas quedan montadas para no perder lo que se escribió.
  const [visited, setVisited] = useState<ToolId[]>([active]);

  const paletteOpen = useUi((state) => state.paletteOpen);
  const setPaletteOpen = useUi((state) => state.setPaletteOpen);
  const togglePalette = useUi((state) => state.togglePalette);
  const theme = useUi((state) => state.theme);
  const toggleTheme = useUi((state) => state.toggleTheme);

  const selectTool = useCallback((id: ToolId) => {
    setActive(id);
    setVisited((prev) => (prev.includes(id) ? prev : [...prev, id]));
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const carolina = isCarolina();
      const jade = isJade();
      setCarolina(carolina);
      setJade(jade);
      if (!carolina && !jade) selectTool(toolFromHash());
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectTool, togglePalette]);

  if (carolina) {
    return (
      <Suspense fallback={null}>
        <CarolinaPage />
      </Suspense>
    );
  }

  if (jade) {
    return (
      <Suspense fallback={null}>
        <JadeComponentsPage />
      </Suspense>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:flex-row">
      <aside className="brutal flex shrink-0 items-center gap-2 rounded-xl bg-bg p-2 md:w-56 md:flex-col md:items-stretch md:gap-0 md:p-0">
        <div className="flex items-center gap-3 md:border-b-2 md:border-ink md:bg-mint md:p-4 md:text-onfill">
          <Logo size={36} className="shrink-0" />
          <div className="hidden min-w-0 md:block">
            <p className="text-[26px] leading-none font-extrabold tracking-tight">Jade</p>
            <p className="mt-1 text-[11px] font-semibold">Caja de herramientas dev</p>
          </div>
        </div>

        <nav aria-label="Herramientas" className="min-w-0 flex-1 md:flex-none md:p-3">
          <ol className="flex gap-1.5 overflow-x-auto md:flex-col md:overflow-visible">
            {TOOLS.map((tool, i) => (
              <li key={tool.id}>
                <button
                  type="button"
                  title={tool.description}
                  aria-current={active === tool.id ? "page" : undefined}
                  className="group flex w-full items-center gap-2.5 rounded-lg border-2 border-transparent px-2 py-1.5 text-left whitespace-nowrap transition-colors hover:border-ink hover:bg-hover aria-[current=page]:border-ink aria-[current=page]:bg-fg aria-[current=page]:text-bg"
                  onClick={() => selectTool(tool.id)}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-bg text-fg group-aria-[current=page]:bg-yellow group-aria-[current=page]:text-onfill">
                    <Icon icon={tool.icon} width={15} />
                  </span>
                  <span className="hidden text-[13px] font-bold group-aria-[current=page]:inline md:inline">
                    {tool.label}
                  </span>
                  <span className="ml-auto hidden font-mono text-[10px] font-bold opacity-50 md:inline">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-2 md:mt-auto md:flex-col md:items-stretch md:border-t-2 md:border-ink md:p-3">
          <button type="button" className="btn justify-between" onClick={() => setPaletteOpen(true)}>
            Buscar <kbd className="hidden md:inline-flex">Ctrl K</kbd>
          </button>
          <button
            type="button"
            className="btn justify-between"
            title="Cambiar entre día y noche"
            onClick={toggleTheme}
          >
            <span className="hidden md:inline">Tema</span>
            <span>{theme === "dia" ? "☀ Día" : "☾ Noche"}</span>
          </button>
          <a href="#jade" className="btn justify-between">
            <span className="hidden md:inline">Jade</span>
            <span>Componentes</span>
          </a>
          <p className="hidden pt-1 text-[11px] leading-4 font-medium text-muted md:block">
            100% local: nada de lo que pegues sale de tu navegador.
          </p>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1">
        {TOOLS.filter((tool) => visited.includes(tool.id)).map((tool) => (
          <div key={tool.id} hidden={active !== tool.id} className="h-full animate-tool-in">
            <Suspense fallback={<p className="label p-6">Cargando…</p>}>
              <tool.component />
            </Suspense>
          </div>
        ))}
      </main>

      {paletteOpen && (
        <CommandPalette onClose={() => setPaletteOpen(false)} onSelectTool={selectTool} />
      )}
    </div>
  );
};

export default App;
