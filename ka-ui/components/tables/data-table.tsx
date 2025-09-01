"use client"

import * as React from "react"

export type Column<T, K extends keyof T = keyof T> = {
  key: K
  header: string
  render?: (value: T[K], row: T) => React.ReactNode
}

export default function DataTable<T extends Record<string, unknown>>({
  rows,
  columns,
}: {
  rows: T[]
  columns: Array<Column<T>>
}) {
  return (
    <div className="w-full overflow-auto rounded-2xl border border-border bg-surface">
      <table className="min-w-[720px] w-full text-sm">
        <thead className="bg-background/60">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="text-left px-3 py-2 text-text/70 font-medium"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              {columns.map((col) => {
                const value = row[col.key]
                return (
                  <td key={String(col.key)} className="px-3 py-2">
                    {col.render ? col.render(value, row) : (value as React.ReactNode)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
