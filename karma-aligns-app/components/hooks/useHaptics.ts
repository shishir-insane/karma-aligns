"use client";
export default function useHaptics() {
  return {
    light: (ms = 10) => "vibrate" in navigator && (navigator as any).vibrate?.(ms),
    medium: (ms = 18) => "vibrate" in navigator && (navigator as any).vibrate?.(ms),
  };
}
