import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Accessible modal with dark glass backdrop.
 * - ESC closes, click backdrop closes.
 * - Focus return to trigger if provided.
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;      // container
  overlayClassName?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

export default function Modal({
  open,
  onClose,
  children,
  className = "w-full max-w-3xl rounded-2xl border border-white/10 bg-zinc-900 p-4 sm:p-6",
  overlayClassName = "fixed inset-0 bg-black/60 backdrop-blur-sm",
  initialFocusRef,
}: ModalProps) {
  const lastActiveRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) {
      lastActiveRef.current = document.activeElement as HTMLElement | null;
      initialFocusRef?.current?.focus?.();
    } else {
      lastActiveRef.current?.focus?.();
    }
  }, [open, initialFocusRef]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          aria-modal="true"
          role="dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={overlayClassName + " z-50 flex items-end sm:items-center justify-center p-4"}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className={className}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
