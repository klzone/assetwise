"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

type Point = {
  date: string;
  value: number;
};

export interface MiniAreaProps {
  data: Point[];
  strokeVar?: string; // CSS var 名，如 --accent | --primary
  height?: number;
}

function hslVar(name: string) {
  return `hsl(var(${name}))`;
}

export function MiniArea({ data, strokeVar = "--accent", height = 240 }: MiniAreaProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="miniAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`hsl(var(${strokeVar}))`} stopOpacity={0.25} />
              <stop offset="95%" stopColor={`hsl(var(${strokeVar}))`} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            stroke="hsl(var(--muted-foreground))"
            minTickGap={24}
          />
          <YAxis
            width={48}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px"
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={hslVar(strokeVar)}
            strokeWidth={2}
            fill="url(#miniAreaFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MiniArea;