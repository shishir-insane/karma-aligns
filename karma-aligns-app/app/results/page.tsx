"use client";

import { useEffect, useState } from "react";
import ResultsPage from "@/components/results/ResultsPage";
import { loadCompute } from "@/components/utils/resultsStore";

export default function Results() {
  const [data, setData] = useState<{ input?: any; result?: any }>();

  useEffect(() => {
    setData(loadCompute());
    setTimeout(() => setData(loadCompute()), 50);
  }, []);

  if (!data?.result) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-white/80">
        Generating your chart…
      </div>
    );
  }

  const { input, result } = data;

  // pass full payload
  return (
    <ResultsPage
      name={input?.name}
      birth={{ date: input?.date, time: input?.time, tz: input?.tz, location: input?.location }}
      chartImg="/sample-chart.png"
      data={result}
    />
  );
}
