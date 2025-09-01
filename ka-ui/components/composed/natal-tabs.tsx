"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ChartCard from "@/components/primitives/chart-card"
import RashiCanvas from "@/components/viz/rashi-canvas"
import DataTable from "@/components/tables/data-table"

export default function NatalTabs() {
  return (
    <Tabs defaultValue="rashi" className="space-y-6">
      <TabsList>
        <TabsTrigger value="rashi">Rāśi</TabsTrigger>
        <TabsTrigger value="bhava">Bhāva Chalit</TabsTrigger>
        <TabsTrigger value="vargas">Vargas</TabsTrigger>
        <TabsTrigger value="analyst">Analyst</TabsTrigger>
      </TabsList>

      <TabsContent value="rashi">
        <ChartCard title="Rāśi Chart">
          <RashiCanvas
            cells={Array.from({ length: 12 }).map((_, i) => ({
              idx: i + 1,
              label: `House ${i + 1}`,
              grahas: []
            }))}
          />
        </ChartCard>
      </TabsContent>

      <TabsContent value="bhava">
        <ChartCard title="Bhāva Chalit">Chalit canvas</ChartCard>
      </TabsContent>

      <TabsContent value="vargas">
        <div className="grid md:grid-cols-3 gap-4">
          {["D9","D10","D7"].map(v => (
            <div key={v} className="bg-surface border border-border rounded-2xl p-4 h-40 grid place-items-center text-text/60">
              {v} thumbnail
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="analyst">
        <DataTable
          rows={[{ id: "Sun", lon: 147.92, house: 1, retro: false }]}
          columns={[
            { key: "id", header: "Planet" },
            { key: "lon", header: "Longitude" },
            { key: "house", header: "House" },
            { key: "retro", header: "Retro" },
          ]}
        />
      </TabsContent>
    </Tabs>
  )
}
