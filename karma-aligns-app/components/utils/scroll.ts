export function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
  
    const header = document.querySelector("header") as HTMLElement | null;
    const varH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--ka-header-h")
    ) || 72; // fallback
    const gap = 12;
    const headerH = (header?.offsetHeight ?? varH) + gap;
  
    const rect = el.getBoundingClientRect();
    const y = rect.top + window.scrollY - headerH;
    const max = document.documentElement.scrollHeight - window.innerHeight;
  
    window.scrollTo({ top: Math.min(y, max), behavior: "smooth" });
  }
  