"use client"

export default function RadarChartPlaceholder({
  labels,
  values,
}: {
  labels: string[]
  values: number[]
}) {
  return (
    <div className="w-full h-full grid place-items-center text-text/60">
      Radar (placeholder) · {labels.length} metrics · {values.length} values
    </div>
  )
}
