const RESULT_KEY = "ka:lastResult";
const INPUT_KEY  = "ka:lastInput";

function set(k: string, v: unknown) {
  const s = JSON.stringify(v);
  try { sessionStorage.setItem(k, s); } catch {}
  try { localStorage.setItem(k, s); } catch {}
}

function get(k: string) {
  // prefer sessionStorage (same-tab), fall back to localStorage
  try {
    const s = sessionStorage.getItem(k);
    if (s) return JSON.parse(s);
  } catch {}
  try {
    const l = localStorage.getItem(k);
    if (l) return JSON.parse(l);
  } catch {}
  return undefined;
}

export function saveCompute(input: unknown, result: unknown) {
  set(INPUT_KEY, input);
  set(RESULT_KEY, result);
}

export function loadCompute(): { input?: any; result?: any } {
  return { input: get(INPUT_KEY), result: get(RESULT_KEY) };
}

export function clearCompute() {
  try { sessionStorage.removeItem(INPUT_KEY); sessionStorage.removeItem(RESULT_KEY); } catch {}
  try { localStorage.removeItem(INPUT_KEY); localStorage.removeItem(RESULT_KEY); } catch {}
}
