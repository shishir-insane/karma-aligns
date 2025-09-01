import ChartCard from "@/components/primitives/chart-card"

export default function VarshaAnnual() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <ChartCard title="Annual Highlights (Varṣaphal)">
        <div className="text-center">Muntha / Sahams / Mudda (bind here)</div>
      </ChartCard>
      <ChartCard title="Return Chart">
        <div className="text-center">Solar return rāśi</div>
      </ChartCard>
    </div>
  )
}
