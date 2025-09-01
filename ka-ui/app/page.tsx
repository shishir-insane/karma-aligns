import PageTransition from "@/components/layout/page-transition"
import NowCard from "@/components/primitives/now-card"
import ChartCard from "@/components/primitives/chart-card"

export default function DashboardPage() {
  return (
    <PageTransition>
      <div className="grid gap-8">
        {/* --- Top section: Ritual / Now-cards --- */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NowCard
            title="Panchāṅga (Today)"
            kpis={[
              ["Tithi", "Shukla Panchami"],
              ["Nakṣatra", "Maghā"],
            ]}
          />
          <NowCard
            title="Current Dashā"
            kpis={[
              ["Mahā", "Saturn"],
              ["Antar", "Venus"],
            ]}
          />
          <NowCard
            title="Highlights"
            kpis={[
              ["Strong", "Jupiter"],
              ["Watch", "Mars"],
            ]}
          />
        </section>

        {/* --- Secondary section: Chart + Timeline previews --- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Rāśi Chart (Snapshot)">
            <div className="text-text/60">Chart canvas placeholder</div>
          </ChartCard>

          <ChartCard title="Dashā Timeline (This Year)">
            <div className="text-text/60">Timeline canvas placeholder</div>
          </ChartCard>
        </section>
      </div>
    </PageTransition>
  )
}
