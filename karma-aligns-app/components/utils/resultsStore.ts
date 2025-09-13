import pako from "pako";

// Simple sessionStorage wrapper so we don't bloat the URL with large JSON.
const RESULT_KEY = "ka:lastResult";
const INPUT_KEY  = "ka:lastInput";

export function saveCompute(input: unknown, result: unknown) {
  try {
    const zipped = pako.deflate(JSON.stringify(result), { to: "string" });
    sessionStorage.setItem(INPUT_KEY, JSON.stringify(input));
    sessionStorage.setItem(RESULT_KEY, zipped);
  } catch {}
}

export function loadCompute(): { input?: any; result?: any } {
  try {
    const input  = JSON.parse(sessionStorage.getItem(INPUT_KEY) || "null") || undefined;
    const raw    = sessionStorage.getItem(RESULT_KEY);
    const json   = raw ? pako.inflate(raw, { to: "string" }) : undefined;
    const result = json ? JSON.parse(json) : undefined;
    return { input, result };
  } catch {
    return {};
  }
}


export function clearCompute() {
  try {
    sessionStorage.removeItem(INPUT_KEY);
    sessionStorage.removeItem(RESULT_KEY);
  } catch {}
}
