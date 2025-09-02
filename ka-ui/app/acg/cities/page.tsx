"use client"

import { useEffect, useMemo, useState } from "react"
import { useChartMeta } from "@/components/providers/chart-provider"
import { fetchAcgCities, type ACGCityRow } from "@/lib/api-client"
import CitiesTable from "@/components/acg/cities-table"
import CitiesHowTo from "@/components/acg/cities-howto"
import { Page, PageHeader, SectionCard } from "@/components/layout/page-scaffold"

export default function AcgCitiesPage() {
  const { meta } = useChartMeta()
  const [rows, setRows] = useState<ACGCityRow[] | null>(null)
  const [loading, setLoading] = useState(true)

  const params = useMemo(
    () => ({
      dob: meta.dob,
      tob: meta.tob,
      tz: meta.tz,
      lat: meta.lat,
      lon: meta.lon,
    }),
    [meta.dob, meta.tob, meta.tz, meta.lat, meta.lon]
  )

  useEffect(() => {
    let cancel = false
    setLoading(true)
    setRows(null)
    ;(async () => {
      try {
        const data = await fetchAcgCities(params)
        if (!cancel) setRows(data)
      } catch (e) {
        console.error(e)
        if (!cancel) setRows([])
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [params])

  return (
    <Page>
      <PageHeader
        title="Astrocartography · Cities"
        subtitle="Nearest cities to your planetary lines · filter by planet, angle, distance"
      />

      {/* Same collapsible explainer as the ACG map page */}
      <SectionCard>
        <CitiesHowTo />
      </SectionCard>

      {/* Data section — fixed shell so width/height don't jump when filters change */}
      <SectionCard>
        {loading ? (
          <div className="h-40 rounded-xl bg-muted/20 animate-pulse" />
        ) : rows && rows.length > 0 ? (
          <CitiesTable data={rows} />
        ) : (
          <div className="p-6 text-sm text-text/70">
            No data returned by the API for these birth details.
          </div>
        )}
      </SectionCard>
    </Page>
  )
}
