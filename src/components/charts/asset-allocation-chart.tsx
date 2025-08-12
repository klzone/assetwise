"use client"

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AssetAllocationData {
  name: string
  value: number
  percentage: number
  color: string
}

interface AssetAllocationChartProps {
  data: AssetAllocationData[]
  title?: string
  description?: string
  className?: string
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(221.2 83.2% 53.3%)', // 科技蓝
  'hsl(262.1 83.3% 57.8%)', // 紫色
  'hsl(142.1 76.2% 36.3%)', // 绿色
  'hsl(346.8 77.2% 49.8%)', // 红色
  'hsl(24.6 95% 53.1%)',    // 橙色
]

export function AssetAllocationChart({ 
  data, 
  title = "资产配置分析", 
  description = "投资组合分布情况",
  className 
}: AssetAllocationChartProps) {
  // 自定义工具提示
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            价值: ¥{data.value.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            占比: {data.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  // 自定义图例
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className={`modern-card ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// 示例数据生成函数
export function generateAssetAllocationData(): AssetAllocationData[] {
  return [
    { name: '科技股', value: 45000, percentage: 35.2, color: COLORS[0] },
    { name: '金融股', value: 32000, percentage: 25.0, color: COLORS[1] },
    { name: '消费股', value: 25000, percentage: 19.5, color: COLORS[2] },
    { name: '医疗股', value: 15000, percentage: 11.7, color: COLORS[3] },
    { name: '能源股', value: 11000, percentage: 8.6, color: COLORS[4] },
  ]
}