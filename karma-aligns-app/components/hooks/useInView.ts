// hooks/useInView.ts
import { useEffect, useRef, useState } from "react";

export default function useInView<T extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
      else setInView(false);
    }, { rootMargin: "48px", threshold: 0.1, ...(options || {}) });
    io.observe(el);
    return () => io.disconnect();
  }, [options]);

  return { ref, inView };
}
