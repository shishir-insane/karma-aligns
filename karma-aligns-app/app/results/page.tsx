"use client";

import { useEffect, useState } from "react";
import ResultsPage from "@/components/results/ResultsPage";
import { loadCompute } from "@/components/utils/resultsStore";

export default function Results() {
  const [data, setData] = useState<{ input?: any; result?: any } | null>(null);

  useEffect(() => {
    setData(loadCompute());
  }, []);

  if (!data) {
    // first render while we read sessionStorage
    return (
      <div className="min-h-[60vh] grid place-items-center text-white/80">
        Generating your chart…
      </div>
    );
  }

  if (!data.result?.acg) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center text-white/80 p-6">
        <div>
          <p className="mb-4">We couldn’t find a recent computation in this session.</p>
          <a href="/" className="inline-flex rounded-2xl px-5 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-[0_8px_30px_rgba(168,85,247,.30)] font-bold">
            Back to generator
          </a>
        </div>
      </div>
    );
  }

  const { input, result } = data;
  const name = input?.name || "Guest";
  const birth = {
    date: input?.date || "",
    time: input?.time || "",
    tz:   input?.tz   || "",
    location: input?.location || "",
  };

  return (
    <ResultsPage
      name={name}
      birth={birth}
      chartImg="/sample-chart.png"
      acg={result.acg}
    />
  );
}
