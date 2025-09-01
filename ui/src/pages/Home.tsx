import { useState } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import InputFL from '@/components/InputFL'
import { useChartId, useChartSlices } from '@/features/chart/hooks'
import type { ChartInputs } from '@/features/chart/api'

const DEFAULTS: ChartInputs = {
  dob: '1984-09-24', tob: '17:30', tz: '+05:30', lat: 26.7606, lon: 83.3732, ayanamsa: 'lahiri', hsys: 'P'
}

export default function Home() {
  const [form, setForm] = useState<ChartInputs>(DEFAULTS)
  const { data: cid, refetch, isFetching, error } = useChartId(form)
  const chartId = cid?.chart_id ?? null
  const { qAsc, qPlanets, qRashi, qChalit } = useChartSlices(chartId || undefined)

  const update = (k: keyof ChartInputs) => (e: any) => {
    const v = k === 'lat' || k === 'lon' ? parseFloat(e.target.value) : e.target.value
    setForm(f => ({ ...f, [k]: v }))
  }

  return (
    <div className="grid gap-6">
      <Card>
        <h1 className="font-display text-2xl mb-3">Generate Chart</h1>
        <div className="grid gap-3 md:grid-cols-3">
          <InputFL label="Date of Birth" type="date" value={form.dob} onChange={update('dob')} />
          <InputFL label="Time of Birth" type="time" value={form.tob} onChange={update('tob')} />
          <InputFL label="Time Zone" value={form.tz} onChange={update('tz')} placeholder="+05:30" />
          <InputFL label="Latitude" type="number" step="0.0001" value={form.lat} onChange={update('lat')} />
          <InputFL label="Longitude" type="number" step="0.0001" value={form.lon} onChange={update('lon')} />
          <div className="flex items-end">
            <Button onClick={() => refetch()} disabled={isFetching} className="w-full h-[48px]">
              {isFetching ? 'Computing…' : 'Get Chart ID & Load'}
            </Button>
          </div>
        </div>
        {error && <p className="text-red-400 mt-2 text-sm">Error: {(error as any).message}</p>}
        {chartId && <p className="text-xs text-[--text-2] mt-2">chart_id: <code className="font-mono">{chartId}</code></p>}
      </Card>

      <Card>
        <h2 className="font-display text-xl mb-2">Ascendant</h2>
        {qAsc.isLoading ? 'Loading…' : qAsc.data ? (
          <div className="text-sm">ASC index: {qAsc.data.asc.idx} | lon: {qAsc.data.asc.lon.toFixed(2)}°</div>
        ) : qAsc.error ? <p className="text-red-400 text-sm">Error loading asc.</p> : null}
      </Card>

      <Card>
        <h2 className="font-display text-xl mb-2">Planets</h2>
        {qPlanets.isLoading ? 'Loading…' : qPlanets.data ? (
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-y-1 text-sm">
            {Object.entries(qPlanets.data.planets).map(([name, p]) => (
              <li key={name}>{name}: {p.lon.toFixed(2)}° {p.retrograde ? '℞' : ''}</li>
            ))}
          </ul>
        ) : qPlanets.error ? <p className="text-red-400 text-sm">Error loading planets.</p> : null}
      </Card>

      <Card>
        <h2 className="font-display text-xl mb-2">Rashi placements</h2>
        {qRashi.isLoading ? 'Loading…' : qRashi.data ? <HousesGrid houses={qRashi.data.rashi}/> : qRashi.error ? <p className="text-red-400 text-sm">Error</p> : null}
      </Card>

      <Card>
        <h2 className="font-display text-xl mb-2">Chalit placements</h2>
        {qChalit.isLoading ? 'Loading…' : qChalit.data ? <HousesGrid houses={qChalit.data.chalit}/> : qChalit.error ? <p className="text-red-400 text-sm">Error</p> : null}
      </Card>
    </div>
  )
}

function HousesGrid({houses}:{houses:string[][]}) {
  return (
    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
      {houses.map((ps, i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-2">
          <div className="text-xs text-[--text-2] mb-1">House {i+1}</div>
          <div className="text-sm">{ps.join(', ') || '—'}</div>
        </div>
      ))}
    </div>
  )
}
