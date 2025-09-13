import React from "react";
import clsx from "clsx";

/* Headings */
export const H1: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h1 className={clsx(
    "font-heading text-5xl md:text-6xl lg:text-7xl font-black leading-[1.02] md:leading-[1.05] tracking-tight",
    className
  )} {...props} />
);

export const H2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={clsx(
    "font-heading text-3xl md:text-4xl font-bold leading-tight tracking-tight",
    className
  )} {...props} />
);

export const H3: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={clsx(
    "font-heading text-xl md:text-2xl font-semibold leading-snug",
    className
  )} {...props} />
);

export const H4: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h4 className={clsx(
    "font-heading text-lg font-semibold leading-snug text-white/90",
    className
  )} {...props} />
);

/* Text */
export const Lead: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={clsx(
    "font-body text-xl md:text-2xl text-white/85 leading-relaxed tracking-[0.005em]",
    className
  )} {...props} />
);

export const Body: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={clsx(
    "font-body text-base md:text-[17px] text-white/80 leading-8 tracking-[0.003em]",
    className
  )} {...props} />
);

export const Small: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={clsx(
    "font-body text-sm text-white/70 leading-6 tracking-[0.01em]",
    className
  )} {...props} />
);

export const Caption: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={clsx(
    "font-body text-xs text-white/60 leading-5 tracking-[0.06em] uppercase",
    className
  )} {...props} />
);

/* Button label wrapper (for consistent sizing/weight) */
export const BtnLabel: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={clsx(
    "font-body text-sm md:text-base font-bold tracking-[0.02em]",
    className
  )} {...props} />
);
