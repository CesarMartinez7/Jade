import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { useReducedMotion } from "./hooks/useReducedMotion";
import Aurora from "./reactbits/Aurora";
import ClickSpark from "./reactbits/ClickSpark";
import Dock from "./reactbits/Dock";
import CommandPalette from "./shell/command-palette";
import { TOOLS, type ToolId, toolFromHash } from "./shell/tools";
import { useUi } from "./stores/ui";
import { Icon, iconSearch } from "./ui/icons";

const App = () => {
  const [active, setActive] = useState<ToolId>(toolFromHash);
  // Las herramientas visitadas quedan montadas para no perder lo que se escribió.
  const [visited, setVisited] = useState<ToolId[]>([active]);

  const paletteOpen = useUi((state) => state.paletteOpen);
  const setPaletteOpen = useUi((state) => state.setPaletteOpen);
  const togglePalette = useUi((state) => state.togglePalette);

  const reducedMotion = useReducedMotion();

  const selectTool = useCallback((id: ToolId) => {
    setActive(id);
    setVisited((prev) => (prev.includes(id) ? prev : [...prev, id]));
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  useEffect(() => {
    const handleHashChange = () => selectTool(toolFromHash());
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

  const dockItems = useMemo(
    () => [
      ...TOOLS.map((tool) => ({
        icon: <Icon icon={tool.icon} width={18} />,
        label: tool.label,
        onClick: () => selectTool(tool.id),
        className:
          active === tool.id
            ? "border-transparent! bg-fg! text-bg!"
            : "",
      })),
      {
        icon: <Icon icon={iconSearch} width={18} />,
        label: "Buscar · Ctrl K",
        onClick: () => setPaletteOpen(true),
      },
    ],
    [active, selectTool, setPaletteOpen],
  );

  return (
    <ClickSpark sparkColor="#ffffff" sparkSize={8} sparkRadius={18} sparkCount={6} duration={350}>
      {!reducedMotion && (
        <div className="pointer-events-none fixed inset-0 opacity-15" aria-hidden="true">
          <Aurora colorStops={["#ffffff", "#5a5a5a", "#ffffff"]} amplitude={1.1} blend={0.6} speed={0.5} />
        </div>
      )}

      <main className="relative mx-auto h-full max-w-[1800px]">
        {TOOLS.filter((tool) => visited.includes(tool.id)).map((tool) => (
          <div key={tool.id} hidden={active !== tool.id} className="h-full animate-tool-in">
            <Suspense fallback={<p className="p-6 text-xs text-faint">Cargando…</p>}>
              <tool.component />
            </Suspense>
          </div>
        ))}
      </main>

      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
        <Dock
          items={dockItems}
          className="glass pointer-events-auto"
          panelHeight={56}
          dockHeight={80}
          baseItemSize={38}
          magnification={54}
          distance={120}
        />
      </nav>

      {paletteOpen && (
        <CommandPalette onClose={() => setPaletteOpen(false)} onSelectTool={selectTool} />
      )}
    </ClickSpark>
  );
};

export default App;
