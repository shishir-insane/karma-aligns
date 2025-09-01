// app/timing/page.tsx
import PageTransition from "@/components/layout/page-transition"
import Timeline, { TLItem } from "@/components/viz/timeline"
import VarshaAnnual from "@/components/composed/varsha-annual"
import ChartCard from "@/components/primitives/chart-card"

export default function TimingPage() {
  const demo: TLItem[] = [
    { label: "Saturn", from: new Date(), to: new Date(), level: 1 },
    { label: "Venus", from: new Date(), to: new Date(), level: 2 }
  ]
  return (
    <PageTransition>
      <ChartCard title="Dashā Timeline"><Timeline items={demo} /></ChartCard>
      <VarshaAnnual />
    </PageTransition>
  )
}
