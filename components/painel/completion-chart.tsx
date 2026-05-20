"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export function CompletionChart({
  data,
  color,
}: {
  data: { label: string; pct: number }[]
  color: string
}) {
  return (
    <div className="bg-card flex flex-col gap-2 rounded-2xl border border-border p-4">
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">% Refeições últimos 7 dias</h3>
      </header>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              ticks={[0, 50, 100]}
            />
            <Tooltip
              cursor={{ fill: "#e4e4e755" }}
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e4e4e7",
                borderRadius: 8,
                fontSize: 12,
                color: "#18181b",
              }}
              labelStyle={{ color: "#71717a" }}
              formatter={(v) => [`${Math.round(Number(v))}%`, "Concluídas"]}
            />
            <Bar dataKey="pct" radius={[6, 6, 0, 0]} fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
