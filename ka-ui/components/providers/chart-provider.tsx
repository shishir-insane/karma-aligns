"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export type ChartMeta = {
  id?: string
  name?: string
  dob?: string
  tob?: string
  tz?: string
  lat?: number
  lon?: number
  ayanamsa?: string
  hsys?: string
  chart_id?: string
}

type Ctx = {
  presets: ChartMeta[]
  selectedId: string
  meta: ChartMeta
  setMeta: (next: Partial<ChartMeta>) => void
  setPresets: (next: ChartMeta[]) => void
  selectPreset: (id: string) => void
}

const ChartContext = createContext<Ctx | null>(null)

const DEFAULT_PRESETS: ChartMeta[] = [
  {
    id: "preset-a",
    name: "Shishir Kumar",
    dob: "1984-09-24",
    tob: "17:30",
    tz: "+05:30",
    lat: 26.7658,
    lon: 83.3649,
    ayanamsa: "lahiri",
    hsys: "P",
  },
  {
    id: "preset-b",
    name: "Sanghita",
    dob: "1986-03-17",
    tob: "16:50",
    tz: "+05:30",
    lat: 24.8332,
    lon: 92.7789,
    ayanamsa: "lahiri",
    hsys: "P",
  },
  {
    id: "preset-c",
    name: "Samvrita",
    dob: "2015-08-15",
    tob: "22:30",
    tz: "+05:30",
    lat: 12.9715,
    lon: 77.5945,
    ayanamsa: "lahiri",
    hsys: "P",
  },
]

const LS_KEY = "ka.chart.presets.v1"
const LS_SELECTED = "ka.chart.selected.v1"

export function ChartProvider({ children }: { children: React.ReactNode }) {
  // 1) SSR-safe deterministic initial state (NO localStorage reads here)
  const [presets, setPresetsState] = useState<ChartMeta[]>(DEFAULT_PRESETS)
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_PRESETS[0]!.id!)
  const [metaPatch, setMetaPatch] = useState<Partial<ChartMeta>>({})

  // 2) After hydration, sync from localStorage (if present)
  useEffect(() => {
    try {
      const rawPresets = window.localStorage.getItem(LS_KEY)
      if (rawPresets) {
        const parsed = JSON.parse(rawPresets) as ChartMeta[]
        if (Array.isArray(parsed) && parsed.length) {
          // only set if different to avoid extra renders
          const changed =
            JSON.stringify(parsed) !== JSON.stringify(presets)
          if (changed) setPresetsState(parsed)
        }
      }
      const rawSel = window.localStorage.getItem(LS_SELECTED)
      if (rawSel && rawSel !== selectedId) {
        setSelectedId(rawSel)
      }
    } catch {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once post-hydration

  const setPresets = useCallback((next: ChartMeta[]) => {
    setPresetsState(next)
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(next))
    } catch {}
    // keep selection valid
    if (!next.find((p) => p.id === selectedId) && next.length) {
      setSelectedId(next[0]!.id!)
    }
  }, [selectedId])

  const selectPreset = useCallback((id: string) => {
    setSelectedId(id)
    try {
      window.localStorage.setItem(LS_SELECTED, id)
    } catch {}
  }, [])

  const setMeta = useCallback((next: Partial<ChartMeta>) => {
    setMetaPatch((m) => ({ ...m, ...next }))
  }, [])

  const meta = useMemo(() => {
    const base = presets.find((p) => p.id === selectedId) || presets[0] || {}
    return { ...base, ...metaPatch, id: base.id } as ChartMeta
  }, [presets, selectedId, metaPatch])

  const value = useMemo<Ctx>(
    () => ({ presets, selectedId, meta, setMeta, setPresets, selectPreset }),
    [presets, selectedId, meta, setMeta, setPresets, selectPreset]
  )

  return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
}

export function useChartMeta() {
  const ctx = useContext(ChartContext)
  if (!ctx) throw new Error("useChartMeta must be used within <ChartProvider>")
  return ctx
}
