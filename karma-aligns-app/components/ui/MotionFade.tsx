
'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { PropsWithChildren } from 'react';

export default function MotionFade({ children, delay=0 }: PropsWithChildren & {delay?: number}) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}
