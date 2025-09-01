export type ChartId = string

export type Echo = {
  ayanamsa?: string
  hsys?: string
  tz?: string // offset string like +05:30
  unknownTime?: boolean
}

export type Symbols = {
  rashis: Record<string, { name: string; symbol: string }>
}

export type Graha = {
  id: string
  lon: number
  speed: number
  signId: number
  nakshatraId: number
  pada: number
  house?: number | null
  retro: boolean
}

export type GrahasResponse = {
  echo?: Echo
  grahas: Graha[]
}

export type RashiResponse = {
  echo?: Echo
  asc_idx?: number
  placements: Array<{ house: number; grahas: string[] }>
}

export type DashaNode = {
  lord: string
  from: string
  to: string
  antara?: DashaNode[]
  pratyantara?: DashaNode[]
}
export type DashaResponse = {
  echo?: Echo
  system: string
  maha: DashaNode[]
}

export type PanchangaResponse = {
  echo?: Echo
  tithi: string
  nakshatra: string
  yoga: string
  karana: string
  sunrise: string
  sunset: string
}

export type AspectsResponse = {
  echo?: Echo
  pairs: Array<{ a: string; b: string; kind: "full" | "special"; angle: number; orb: number }>
}

export type VarshaDetailsResponse = {
  echo?: Echo
  varsha_year: number
  muntha: { signId: number; house?: number | null }
  sahams: Array<{ name: string; signId: number; deg: number }>
  mudda: Array<{ lord: string; from: string; to: string }>
}
