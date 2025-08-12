"use client"

import React, { useState, useEffect } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface ProfitTrendData {
  date: string
  profit: number
  totalValue: number
  profitPercent: number
}

interface ProfitTrendChartProps {
  data: ProfitTrendData[]
  title?: string
  description?: string
  className?: string
  chartType?: 'line' | 'area'
}

export function ProfitTrendChart({ 
  data, 
  title = "收益趋势分析", 
  description = "投资组合收益变化趋势",
  className,
  chartType = 'area'
}: ProfitTrendChartProps) {
  const [isClient, setIsClient] = useState(false)
  
  // 客户端检测
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // 计算总体趋势
  const firstValue = data[0]?.profit || 0
  const lastValue = data[data.length - 1]?.profit || 0
  const totalChange = lastValue - firstValue
  const totalChangePercent = firstValue !== 0 ? (totalChange / Math.abs(firstValue)) * 100 : 0
  const isPositiveTrend = totalChange >= 0

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">总价值: </span>
              <span className="font-medium">¥{data.totalValue.toLocaleString()}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">盈亏: </span>
              <span className={`font-medium ${data.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {data.profit >= 0 ? '+' : ''}¥{data.profit.toLocaleString()}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">收益率: </span>
              <span className={`font-medium ${data.profitPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                {data.profitPercent >= 0 ? '+' : ''}{data.profitPercent.toFixed(2)}%
              </span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  // 格式化Y轴标签
  const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 10000) {
      return `${(value / 10000).toFixed(1)}万`
    }
    return value.toLocaleString()
  }

  return (
    <Card className={`modern-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isClient && (
              <Badge 
                variant={isPositiveTrend ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {isPositiveTrend ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPositiveTrend ? '+' : ''}{totalChangePercent.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {isClient ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="5%" 
                        stopColor={isPositiveTrend ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                        stopOpacity={0.3}
                      />
                      <stop 
                        offset="95%" 
                        stopColor={isPositiveTrend ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={formatYAxis}
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke={isPositiveTrend ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                    strokeWidth={2}
                    fill="url(#profitGradient)"
                    className="drop-shadow-sm"
                  />
                </AreaChart>
              ) : (
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={formatYAxis}
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke={isPositiveTrend ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                    strokeWidth={2}
                    dot={{ fill: isPositiveTrend ? "hsl(var(--success))" : "hsl(var(--destructive))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, className: "drop-shadow-md" }}
                    className="drop-shadow-sm"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="animate-pulse">加载图表中...</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 示例数据生成函数 - 使用固定种子避免水合错误
export function generateProfitTrendData(): ProfitTrendData[] {
  const baseValue = 100000
  const data: ProfitTrendData[] = []
  
  // 使用固定的伪随机数序列，避免服务端和客户端不一致
  const fixedRandomValues = [
    0.95, 1.02, 0.88, 1.15, 0.92, 1.08, 0.85, 1.12, 0.98, 1.05,
    0.91, 1.18, 0.87, 1.09, 0.94, 1.06, 0.89, 1.14, 0.96, 1.03,
    0.93, 1.11, 0.86, 1.07, 0.99, 1.04, 0.90, 1.16, 0.97, 1.01
  ]
  
  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    
    // 使用固定的随机因子避免水合错误
    const randomFactor = fixedRandomValues[i] || 1.0
    const trendFactor = 1 + (i * 0.01) // 整体上升趋势
    const totalValue = baseValue * randomFactor * trendFactor
    const profit = totalValue - baseValue
    const profitPercent = (profit / baseValue) * 100
    
    data.push({
      date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      profit: Math.round(profit),
      totalValue: Math.round(totalValue),
      profitPercent: Number(profitPercent.toFixed(2))
    })
  }
  
  return data
}
