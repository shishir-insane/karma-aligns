import pako from "pako";

// Simple sessionStorage wrapper so we don't bloat the URL with large JSON.
const RESULT_KEY = "ka:lastResult";
const INPUT_KEY  = "ka:lastInput";

export function saveCompute(input: unknown, result: unknown) {
  const blob = pako.deflate(JSON.stringify(result), { to: "string" });
  sessionStorage.setItem("ka:lastInput", JSON.stringify(input));
  sessionStorage.setItem("ka:lastResultZ", blob); // compressed
}
export function loadCompute<T=any>() {
  const input = JSON.parse(sessionStorage.getItem("ka:lastInput") || "null") || undefined;
  const raw = sessionStorage.getItem("ka:lastResultZ");
  const result = raw ? JSON.parse(pako.inflate(raw, { to: "string" })) : undefined;
  return { input, result as T };
}

export function clearCompute() {
  try {
    sessionStorage.removeItem(INPUT_KEY);
    sessionStorage.removeItem(RESULT_KEY);
  } catch {}
}
