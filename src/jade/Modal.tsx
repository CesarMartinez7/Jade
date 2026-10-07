import type React from "react";
import { createContext, useContext, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Icon, iconAlert, iconX } from "../ui/icons";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { cx } from "./cx";

export type ModalTone = "yellow" | "lilac" | "pink" | "mint";
export type ModalSize = "sm" | "md" | "lg" | "xl";

const TONES: Record<ModalTone, string> = {
  yellow: "bg-yellow",
  lilac: "bg-lilac",
  pink: "bg-pink",
  mint: "bg-mint",
};

const SIZES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ModalContext = createContext<() => void>(() => {});

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: ModalTone;
}

export function ModalHeader({ tone = "yellow", className, children, ...rest }: ModalHeaderProps) {
  return (
    <div
      className={cx(
        "flex shrink-0 items-center justify-between gap-3 border-b-2 border-ink px-4 py-3 text-onfill",
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function ModalTitle({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("min-w-0 truncate text-sm font-extrabold", className)} {...rest}>
      {children}
    </div>
  );
}

export function ModalBody({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("min-h-0 flex-1 overflow-auto text-sm font-medium", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function ModalFooter({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t-2 border-ink bg-panel px-4 py-3",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface ModalCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export function ModalClose({ label = "Cerrar", className, ...rest }: ModalCloseProps) {
  const onClose = useContext(ModalContext);
  return (
    <button
      type="button"
      aria-label={label}
      className={cx("icon-btn shrink-0 hover:border-onfill hover:bg-white", className)}
      onClick={onClose}
      {...rest}
    >
      <Icon icon={iconX} width={16} />
    </button>
  );
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  tone?: ModalTone;
  size?: ModalSize;
  footer?: React.ReactNode;
  showClose?: boolean;
  closeOnOverlay?: boolean;
  ariaLabel?: string;
  className?: string;
  headerClassName?: string;
  children?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  tone = "yellow",
  size = "md",
  footer,
  showClose = true,
  closeOnOverlay = true,
  ariaLabel,
  className,
  headerClassName,
  children,
}: ModalProps) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const active = restoreRef.current;
    const target =
      dialog?.querySelector<HTMLElement>("[data-autofocus]") ??
      (active && dialog?.contains(active) ? active : null) ??
      dialog;
    target?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      restoreRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey) {
      if (active === first || active === dialog) {
        last.focus();
        event.preventDefault();
      }
    } else if (active === last || active === dialog) {
      first.focus();
      event.preventDefault();
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <ModalContext.Provider value={onClose}>
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-page/80 p-4 pt-[12vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onMouseDown={(event) => {
              if (closeOnOverlay && event.target === event.currentTarget) onClose();
            }}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel ?? (typeof title === "string" ? title : undefined)}
              tabIndex={-1}
              className={cx(
                "brutal flex max-h-[80vh] w-full flex-col overflow-hidden rounded-xl bg-raised outline-none",
                SIZES[size],
                className,
              )}
              initial={reduced ? false : { opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.2, 0.9, 0.3, 1] as const }}
              onKeyDown={handleKeyDown}
            >
              {title !== undefined && (
                <ModalHeader tone={tone} className={headerClassName}>
                  {typeof title === "string" ? <ModalTitle>{title}</ModalTitle> : title}
                  {showClose && <ModalClose />}
                </ModalHeader>
              )}
              {title !== undefined ? (
                <ModalBody className="p-4">{children}</ModalBody>
              ) : (
                children
              )}
              {footer !== undefined && <ModalFooter>{footer}</ModalFooter>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>,
    document.body,
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  tone?: "danger" | "info";
  confirmLabel?: string;
  cancelLabel?: string;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  tone = "danger",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  children,
}: ConfirmDialogProps) {
  const danger = tone === "danger";
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      tone={danger ? "pink" : "mint"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            className={danger ? "bg-danger text-white" : undefined}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Alert tone={danger ? "danger" : "info"} icon={danger ? iconAlert : undefined}>
        {children ?? "Esta acción no se puede deshacer."}
      </Alert>
    </Modal>
  );
}
