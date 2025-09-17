// hooks/useOneTimeNudge.ts
import { useEffect, useState } from "react";

export default function useOneTimeNudge(key: string) {
  const [show, setShow] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(key) !== "1";
  });
  useEffect(() => {
    if (!show && typeof window !== "undefined") {
      window.localStorage.setItem(key, "1");
    }
  }, [key, show]);

  return {
    show,
    dismiss: () => setShow(false),
  };
}
