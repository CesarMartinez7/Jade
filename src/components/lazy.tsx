import { lazy } from "react";

export const BaseModalLazy = lazy(
  () => import("../ui/base-modal/baseModal.tsx"),
);
export const GridLayoutLazy = lazy(() => import("../layout/GridLayout.tsx"));
export const JsonDiffLazy = lazy(() => import("../ui/diffjson.tsx"));
export const JsonViewerLazy = lazy(
  () => import("../ui/formatter/formatter.tsx"),
);
export const ModalViwerJSONLazy = lazy(() => import("../ui/modalviewer.tsx"));
export const CodeEditorLazy = lazy(
  () => import("../ui/code-editor/code-editor.tsx"),
);

export const ContainerTextArea = lazy(() => import("./container-editor.tsx"));
