"use client"

import React from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface AssetPerformanceData {
  name: string
  symbol: string
  profitLoss: number
  profitPercent: number
  value: number
}

interface AssetPerformanceChartProps {
  data: AssetPerformanceData[]
  title?: string
  description?: string
  className?: string
}

export function AssetPerformanceChart({ 
  data, 
  title = "资产表现分析", 
  description = "各资产收益对比",
  className 
}: AssetPerformanceChartProps) {
  // 计算统计信息
  const positiveCount = data.filter(item => item.profitPercent > 0).length
  const negativeCount = data.filter(item => item.profitPercent < 0).length
  const neutralCount = data.filter(item => item.profitPercent === 0).length

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{data.name} ({data.symbol})</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">总价值: </span>
              <span className="font-medium">¥{data.value.toLocaleString()}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">盈亏: </span>
              <span className={`font-medium ${data.profitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                {data.profitLoss >= 0 ? '+' : ''}¥{data.profitLoss.toLocaleString()}
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
    return `${value.toFixed(0)}%`
  }

  // 获取柱状图颜色
  const getBarColor = (value: number) => {
    if (value > 0) return 'hsl(var(--success))'
    if (value < 0) return 'hsl(var(--destructive))'
    return 'hsl(var(--muted-foreground))'
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
            <Badge variant="default" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {positiveCount} 盈利
            </Badge>
            <Badge variant="destructive" className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              {negativeCount} 亏损
            </Badge>
            {neutralCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Minus className="h-3 w-3" />
                {neutralCount} 持平
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="symbol" 
                className="text-xs"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={formatYAxis}
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="profitPercent" 
                radius={[4, 4, 0, 0]}
                className="drop-shadow-sm"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.profitPercent)}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// 示例数据生成函数
export function generateAssetPerformanceData(): AssetPerformanceData[] {
  return [
    { name: '苹果公司', symbol: 'AAPL', profitLoss: 2543, profitPercent: 16.95, value: 17543 },
    { name: '微软公司', symbol: 'MSFT', profitLoss: 2942, profitPercent: 18.39, value: 18942 },
    { name: '特斯拉', symbol: 'TSLA', profitLoss: -2362, profitPercent: -11.25, value: 18637 },
    { name: '亚马逊', symbol: 'AMZN', profitLoss: 825, profitPercent: 7.64, value: 11625 },
    { name: '谷歌', symbol: 'GOOGL', profitLoss: 1059, profitPercent: 14.12, value: 8559 },
    { name: '比特币ETF', symbol: 'BTCETF', profitLoss: 1460, profitPercent: 18.96, value: 9160 },
    { name: '阿里巴巴', symbol: 'BABA', profitLoss: -580, profitPercent: -8.32, value: 6400 },
    { name: '腾讯控股', symbol: 'TCEHY', profitLoss: 320, profitPercent: 4.57, value: 7320 }
  ]
}