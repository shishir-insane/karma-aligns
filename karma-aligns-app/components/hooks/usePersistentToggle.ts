// hooks/usePersistentToggle.ts
import { useEffect, useState } from "react";

export default function usePersistentToggle(key: string, initial = true) {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return initial;
    const v = window.localStorage.getItem(key);
    return v == null ? initial : v === "1";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, open ? "1" : "0");
    }
  }, [key, open]);
  return [open, setOpen] as const;
}
