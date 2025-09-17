import * as React from "react";

type Row = { graha: string; virupa: number };

export default function VirupaByGrahaTable({
  rows,
}: {
  rows?: Row[]; // if undefined/empty, we render a friendly note
}) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-[12px] text-dim">
        Virūpa by graha data not available in this chart.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[12px]">
        <thead className="text-dim">
          <tr>
            <th className="py-1 pr-3">Graha</th>
            <th className="py-1 pr-3 text-right">Virūpa</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.graha} className="border-t border-white/10">
              <td className="py-1 pr-3">{r.graha}</td>
              <td className="py-1 pr-3 text-right font-mono">{Math.round(r.virupa)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
