"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function SectionShell({
  id,
  title,
  actions,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: React.ReactNode;
  actions?: React.ReactNode;
  open: boolean;
  onToggle?: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="p-2 md:p-3 text-strong">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="heading-shadow-container" data-text={typeof title === "string" ? title : undefined}>
          <h2 className="hero-heading">{title}</h2>
        </div>
        {actions}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
