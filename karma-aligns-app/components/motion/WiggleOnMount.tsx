"use client";
import * as React from "react";
import { motion } from "framer-motion";

export default function WiggleOnMount({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, rotate: -0.4 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.28, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
