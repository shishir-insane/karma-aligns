import ChartCard from "@/components/primitives/chart-card"
import Heatmap from "@/components/viz/heatmap"
import RadarChartPlaceholder from "@/components/viz/radar"

export default function StrengthsGrid() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Ashtakavarga Heatmap">
        <Heatmap
          rows={7} cols={12}
          get={(r,c)=>Math.floor((Math.sin(r+c)+1)*4)}
          rowLabels={["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"]}
          colLabels={Array.from({length:12}).map((_,i)=>String(i+1))}
        />
      </ChartCard>

      <ChartCard title="Shadbala Radar">
        <RadarChartPlaceholder labels={["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"]} values={[1,2,3,2,4,2,3]} />
      </ChartCard>

      <ChartCard title="Bhava Bala">
        <div className="w-full h-full p-6 grid grid-cols-12 items-end gap-1">
          {Array.from({ length: 12 }).map((_,i)=>(
            <div key={i} className="bg-primary/20 rounded-md" style={{ height: `${20 + (i%6)*12}%` }} title={`House ${i+1}`} />
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Avasthas">
        <div className="flex flex-wrap gap-2">
          {["Jagrat","Shayana","Mudita","Kshudita"].map(s=>(
            <span key={s} className="px-3 py-1 rounded-full border border-border bg-background/60">{s}</span>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
