import { Icon } from "@iconify/react/dist/iconify.js";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useCallback, useMemo } from "react";

import { ModalViewer } from "./ui/difftext";


import toast from "react-hot-toast";
import ContainerDescripcion from "./components/container-descripcion";
import ContainerTextArea from "./components/container-editor";
import { BaseModalLazy, GridLayoutLazy, JsonDiffLazy, JsonViewerLazy } from "./components/lazy";

import ToolBar from "./components/toolbar";
import AuroraStore from "./ui/aurora/aurora.store";
import Console from "./ui/console";
import JWTDecode from "./ui/decodejwt";

import "./App.css"

import { JsonViewerStore } from "./ui/formatter/stores/jsonviewer";

const App = () => {
  
  const [value, setValue] = useState<string | null | undefined>(
    localStorage.getItem("jsonData") || "",
  );
  const [openViewerJsonFull, setOpenViewerJsonFull] = useState<boolean>(false);
  const [isOpenDiff, setIsOpenDiff] = useState<boolean>(false);
  const [isOpenDiffText, setIsOpenDiffText] = useState<boolean>(false);
  const [isDecode, setIsDecode] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState(false);

  // Derived JSON validation (memoized to avoid parsing on every render)
  const { isValid, error } = useMemo(() => {
    if (!value) return { isValid: false, error: "JSON inválido. Por favor verifica tu entrada." };
    try {
      JSON.parse(value);
      return { isValid: true, error: "" };
    } catch {
      return { isValid: false, error: "JSON inválido. Por favor verifica tu entrada." };
    }
  }, [value]);

  const showFullScreen = JsonViewerStore((state) => state.fullScreenModal);

  // Download Stores JSONvIEWER
  const openModalDownload = JsonViewerStore(
    (state) => state.isOpenModalDownload,
  );
  const setOpenModalDownload = JsonViewerStore(
    (state) => state.toogleOpenModalDownload,
  );

  const isDownload = JsonViewerStore((state) => state.isDownload);
  const toogleDownload = JsonViewerStore((state) => state.toogleDownload);
  const onChangeNameFileDownload = JsonViewerStore(
    (state) => state.onChangeFileDownload,
  );

  // Aurora Stores
  const showAurora = AuroraStore((state) => state.valor);
  const setShowAurora = AuroraStore((state) => state.setShowAurora);

  const [showConsole, setShowConsole] = useState<boolean>(false);

  const [downloadFileName, setDownloadFileName] = useState("");

  const handleDownloadJson = useCallback(() => toogleDownload(!isDownload), [toogleDownload, isDownload]);
  const handleCloseAll = useCallback(() => setOpenViewerJsonFull(false), []);
  const handleCloseDecode = useCallback(() => setIsDecode(false), []);
  const handleCloseDiffText = useCallback(() => setIsOpenDiffText(false), []);
  const handleCloseDiff = useCallback(() => setIsOpenDiff(false), []);
  const handleCloseConsole = useCallback(() => setShowConsole(false), []);
  const handleCloseJsonViewerDowload = useCallback(() => setOpenModalDownload(!openModalDownload), [openModalDownload, setOpenModalDownload]);



  // Limpiar el input y el formatter
  const handleClear = useCallback(() => {
    if (localStorage.getItem("jsonData") === null) {
      toast.error("No hay nada que limpiar.");
      return;
    }
    setValue("");
    localStorage.removeItem("jsonData");
    toast.success("Limpiado exitosamente.");
  }, []);

  // Cargue del input del json o txt
  const handleClickCargueJson = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.txt";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setValue(result);
        };
        reader.readAsText(file);
      }
    };
    input.click();

    // Remuevo ese input de cargue json para no dejarlos en el nodo
    input.remove();
  }, []);



  const handleClickminifyJson = useCallback(() => {
    if (!value) {
      toast.error("JSON inválido para minificar");
      return;
    }
    try {
      const parseado = JSON.parse(value as string);
      setValue(JSON.stringify(parseado));

      toast.success("JSON minificado");
    } catch {
      toast.error("JSON inválido para minificar");
    }
  }, [value]);

  const handleCopy = useCallback(() => {
    if (!value || value.length === 0) {
      toast.error("Estas seguro que tienes algo que copiar?");
      return;
    }
    try {
      navigator.clipboard
        .writeText(value as string)
        .then(() => toast.success("Copiado exitosamente"));
    } catch {
      toast.error("Ocurrio un error al copiar.");
    }
  }, [value]);

  const handleCopyUrl = useCallback(() => {
    if (!value) {
      toast.error("Error al generar URL compartible");
      return;
    }
    try {
      const encoded = btoa(unescape(encodeURIComponent(value as string)));
      const url = new URL(window.location.href);
      url.searchParams.set("jsdata", encoded);
      const fullUrl = url.toString();

      navigator.clipboard
        .writeText(fullUrl)
        .then(() => {
          toast.success("Direccion copiada con exito.");
        })
        .catch(() => {
          toast.error("No se pudo copiar la URL");
        });
    } catch {
      toast.error("Error al generar URL compartible");
    }
  }, [value]);

  useEffect(() => {

    localStorage.clear()

    const keydown = (e: KeyboardEvent) => {
      if (e.key === "x" && e.ctrlKey) {
        setShowConsole((prev) => !prev);
      }
    };

    window.addEventListener("keydown", keydown);

    return () => {
      window.removeEventListener("keydown", keydown);
    };
  }, []);

  return (
    <>
      {/* Botón toggle layout en fixed */}
      <div className="fixed bottom-4 left-4 z-50  items-center justify-center   text-zinc-300 px-4 py-2 text-sm rounded-xl shadow-lg transition-all flex flex-row gap-2">
        <button
          className=" z-50 flex items-center justify-center gap-2 bg-gradient-to-t from-zinc-900 to-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 text-sm rounded-xl shadow-lg transition min-w-[120px]"
          onClick={() => {
            setShowAurora(!showAurora);
          }}
        >
          <Icon icon="tabler:beer" width="20" height="20" />
          {showAurora ? "Ocultar Aurora" : "Mostrar Aurora"}
        </button>
        <button
          type="button"
          title="Cambiar a Grid"
          className=" left-50 z-50 flex items-center justify-center gap-2 bg-gradient-to-t from-zinc-900 to-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-2 text-sm rounded-xl shadow-lg transition"
          onClick={() => setShowGrid((prev) => !prev)}
        >
          <Icon
            icon={`tabler:${showGrid ? "layout-grid" : "layout"}`}
            width="22"
          />
        </button>
      </div>

      <div className="relative">
        <div className=" text-zinc-200 min-h-screen ">
          <BaseModalLazy
            isOpen={openModalDownload}
            onClose={handleCloseJsonViewerDowload}
          >
            <div className="bg-zinc-900 p-4 h-42 w-md rounded-xl space-y-3.5">
              <h4 className="text-center ">Descargar Json</h4>
              <input
                className="input-gray w-full"
                value={downloadFileName}
                placeholder="Nombre Archivo"
                type="text"
                onChange={(e) => {
                  setDownloadFileName(e.target.value);
                  onChangeNameFileDownload(e.target.value);
                }}
              />
              <button
                className="bg-blue-500 w-full p-2 rounded"
                onClick={handleDownloadJson}
              >
                Descargar
              </button>
            </div>
          </BaseModalLazy>

          {openModalDownload && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0"
            ></motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              className={` ${showGrid ? "max-w-[100vw] min-w-[80vw]" : "max-w-7xl"} mx-auto flex flex-col lg:flex-row gap-6 h-full md:p-5`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {showGrid ? (
                <GridLayoutLazy
                  value={value}
                  setValue={setValue}
                  isValid={isValid}
                  error={error}
                  openAll={openViewerJsonFull}
                  setOpenAll={setOpenViewerJsonFull}
                  isOpenDiff={isOpenDiff}
                  setIsOpenDiff={setIsOpenDiff}
                  isOpenDiffText={isOpenDiffText}
                  setIsOpenDiffText={setIsOpenDiffText}
                  isDecode={isDecode}
                  setIsDecode={setIsDecode}
                  handleClear={handleClear}
                  handleClickCargueJson={handleClickCargueJson}
                  handleClickminifyJson={handleClickminifyJson}
                  handleCopy={handleCopy}
                  handleCopyUrl={handleCopyUrl}
                />
              ) : (
                <>
                  <motion.aside
                    exit={{ scale: 0 }}
                    className="w-full lg:w-64 grid gap-5 rounded-2xl"
                  >
                    <ToolBar
                      showConsole={showConsole}
                      setShowConsole={setShowConsole}
                      classContainerButtons="flex flex-col gap-3"
                      classContainerMain="flex flex-col gap-3"
                      handleClear={handleClear}
                      handleClickCargueJson={handleClickCargueJson}
                      handleClickminifyJson={handleClickminifyJson}
                      handleCopy={handleCopy}
                      handleCopyUrl={handleCopyUrl}
                      isDecode={isDecode}
                      setIsDecode={setIsDecode}
                      isOpenDiff={isOpenDiff}
                      setIsOpenDiff={setIsOpenDiff}
                      setIsOpenDiffText={setIsOpenDiffText}
                      isOpenDiffText={isOpenDiffText}
                      classNameContainer="p-6 shadow-2xl rounded-2xl backdrop-blur"
                    />
                    <ContainerDescripcion />
                  </motion.aside>
                  <main className="flex-1 space-y-6 max-w-full">
                    <ContainerTextArea
                      value={value}
                      setValue={setValue}
                      classText="h-78"
                      heightEditor="200px"
                      classNameContainerEditor=""
                    />
                    <section className="rounded-xl backdrop-blur shadow-2xl bg-zinc-900/80 p-6 flex flex-col gap-y-3">
                      <div className="p-1 flex justify-between">
                        <label className="bg-gradient-to-bl from-white to-zinc-600 bg-clip-text text-transparent">
                          Datos Procesados
                        </label>
                        <div className="flex justify-center items-center gap-2"></div>
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words break-all  h-fit">
                        <JsonViewerLazy
                          data={value}
                          isOpen={openViewerJsonFull}
                          isOpenModal={openViewerJsonFull}
                          setIsOpenModal={setOpenViewerJsonFull}
                          height="50vh"
                          maxHeight="50vh"
                          __changed={{}}
                        />
                      </div>
                    </section>
                  </main>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <BaseModalLazy isOpen={showFullScreen} onClose={handleCloseAll}>
          <JsonViewerLazy
            maxHeight="90vh"
            width="90vw"
            height="90vh"
            data={value}
            isOpen={openViewerJsonFull}
            isOpenModal={openViewerJsonFull}
            setIsOpenModal={setOpenViewerJsonFull}
            __changed={{}}
          />
        </BaseModalLazy>

        <BaseModalLazy isOpen={isDecode} onClose={handleCloseDecode}>
          <JWTDecode />
        </BaseModalLazy>

        <BaseModalLazy isOpen={isOpenDiffText} onClose={handleCloseDiffText}>
          <ModalViewer />
        </BaseModalLazy>

        <BaseModalLazy isOpen={isOpenDiff} onClose={handleCloseDiff}>
          <JsonDiffLazy />
        </BaseModalLazy>

        <BaseModalLazy isOpen={showConsole} onClose={handleCloseConsole}>
          <Console />
        </BaseModalLazy>
      </div>
    </>
  );
};

export default App;
