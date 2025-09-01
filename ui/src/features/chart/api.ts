import { fetchJson, qs } from '@/lib/api'

export type ChartInputs = {
  dob: string; tob: string; tz: string; lat: number; lon: number;
  ayanamsa?: string; hsys?: string;
};

export async function getChartId(inp: ChartInputs) {
  return fetchJson<{ chart_id: string }>(`/chart/id` + qs(inp));
}
export async function getAsc(params: ChartInputs | { chart_id: string }) {
  return fetchJson<{ asc: { lon: number; idx: number }; chart_id: string }>(`/asc` + qs(params as any));
}
export async function getPlanets(params: ChartInputs | { chart_id: string }) {
  return fetchJson<{ planets: Record<string, { lon: number; speed: number; retrograde: boolean }>; chart_id: string }>(`/planets` + qs(params as any));
}
export async function getRashi(params: ChartInputs | { chart_id: string }) {
  return fetchJson<{ rashi: string[][]; asc_idx: number; chart_id: string }>(`/charts/rashi` + qs(params as any));
}
export async function getChalit(params: ChartInputs | { chart_id: string }) {
  return fetchJson<{ chalit: string[][]; chart_id: string }>(`/charts/chalit` + qs(params as any));
}
