"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

type Item = {
  name: string;
  value: number;
  percentage?: number;
};

export interface DonutDistributionProps {
  data: Item[];
  height?: number;
}

const paletteVars = [
  "--accent",
  "--primary",
  "--success",
  "--warning",
  "--info",
  "--muted-foreground",
  "--secondary"
];

function colorByIndex(i: number) {
  const v = paletteVars[i % paletteVars.length];
  return `hsl(var(${v}))`;
}

export function DonutDistribution({ data, height = 240 }: DonutDistributionProps) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            formatter={(value: any, _name: any, props: any) => {
              const val = Number(value) || 0;
              const pct = total ? ((val / total) * 100).toFixed(1) : "0.0";
              return [`${val.toLocaleString()} (${pct}%)`, props?.payload?.name || ""];
            }}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px"
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
          />
          <Legend
            wrapperStyle={{ color: "hsl(var(--foreground))" }}
            iconType="circle"
            verticalAlign="bottom"
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            stroke="hsl(var(--background))"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colorByIndex(index)} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DonutDistribution;