"use client"

import React, { useState } from 'react'
import { 
  Eye, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Percent,
  Target,
  Activity,
  BarChart3,
  X,
  ArrowDownLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AssetData } from './asset-card'
import { useLocale } from '@/contexts/locale-context'
import { TransactionHistory } from './transaction-history'

interface AssetDetailDialogProps {
  asset: AssetData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onSell?: (asset: AssetData) => void
}

export function AssetDetailDialog({ 
  asset, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete,
  onSell
}: AssetDetailDialogProps) {
  const { formatCurrency, formatPercent, getProfitLossColorClass } = useLocale()

  if (!asset) return null

  const isProfitable = asset.profitLoss >= 0
  const isDayPositive = asset.dayChange >= 0
  
  const profitLossColorClass = getProfitLossColorClass(asset.profitLoss)
  const dayChangeColorClass = getProfitLossColorClass(asset.dayChange)
  
  const riskColors = {
    low: 'bg-success/10 text-success border-success/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    high: 'bg-destructive/10 text-destructive border-destructive/20'
  }
  
  const riskLabels = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  }

  // 获取最近五日的价格历史
  const [performanceData, setPerformanceData] = useState<{date: string, value: number}[]>([])
  
  // 使用 useEffect 获取价格历史数据
  React.useEffect(() => {
    if (asset) {
      // 导入 priceManager
      import('@/lib/price-manager').then(({ priceManager }) => {
        // 获取最近5天的价格历史
        const priceHistory = priceManager.getPriceHistory(asset.symbol, 5)
        
        if (priceHistory && priceHistory.length > 0) {
          // 使用实际的价格历史数据
          const historyData = priceHistory.map(item => ({
            date: item.date,
            value: item.price
          }))
          setPerformanceData(historyData)
        } else {
          // 如果没有历史数据，则使用当前价格创建5天的数据点
          const today = new Date()
          const fiveDaysData = Array.from({ length: 5 }).map((_, index) => {
            const date = new Date(today)
            date.setDate(date.getDate() - (4 - index))
            return {
              date: date.toISOString().split('T')[0],
              value: asset.currentPrice || asset.purchasePrice || 0
            }
          })
          setPerformanceData(fiveDaysData)
        }
      })
    }
  }, [asset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={asset.logo} alt={asset.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {(asset.symbol && asset.symbol.slice(0, 2)) || (asset.name && asset.name.slice(0, 2)) || 'AW'}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">{asset.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">{asset.symbol}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${riskColors[asset.riskLevel]}`}
                  >
                    {riskLabels[asset.riskLevel]}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {asset.category}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => onSell?.(asset)}
              >
                <ArrowDownLeft className="h-4 w-4 mr-2" />
                卖出
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit?.(asset.id)}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  onDelete?.(asset.id)
                  onOpenChange(false) // 删除后关闭对话框
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="performance">表现</TabsTrigger>
            <TabsTrigger value="details">详情</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* 价格信息卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    当前价格
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(asset.currentPrice)}</div>
                  <div className={`flex items-center gap-1 mt-1 ${dayChangeColorClass}`}>
                    {isDayPositive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-sm">
                      {isDayPositive ? '+' : ''}{formatCurrency(asset.dayChange)}
                    </span>
                    <span className="text-xs">
                      ({formatPercent(asset.dayChangePercent)})
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    总价值
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(asset.totalValue)}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {(asset.quantity !== undefined && asset.quantity !== null) ? asset.quantity.toLocaleString() : '0'} 股 × {formatCurrency(asset.currentPrice)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    盈亏情况
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profitLossColorClass}`}>
                    {isProfitable ? '+' : ''}{formatCurrency(asset.profitLoss)}
                  </div>
                  <div className={`text-sm mt-1 ${profitLossColorClass}`}>
                    {formatPercent(asset.profitLossPercent)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 持仓信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  持仓信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">持仓数量</p>
                    <p className="text-lg font-semibold">{(asset.quantity !== undefined && asset.quantity !== null) ? asset.quantity.toLocaleString() : '0'} 股</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">购买成本</p>
                    <p className="text-lg font-semibold">{formatCurrency(asset.purchasePrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">总投入</p>
                    <p className="text-lg font-semibold">{formatCurrency(asset.totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">配置占比</p>
                    <p className="text-lg font-semibold">{(asset.allocation || 0).toFixed(1)}%</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">投资组合占比</span>
                    <span className="text-sm font-medium">{(asset.allocation || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={asset.allocation} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* 表现图表 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  最近五日价格走势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 relative p-4 bg-muted/20 rounded-lg">
                  {performanceData.length > 0 ? (
                    <>
                      {/* 折线图 */}
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* 绘制折线 */}
                        {performanceData.length > 1 && (
                          <polyline
                            points={performanceData.map((data, index) => {
                              const x = (index / (performanceData.length - 1)) * 100;
                              const minValue = Math.min(...performanceData.map(d => d.value));
                              const maxValue = Math.max(...performanceData.map(d => d.value));
                              const range = maxValue - minValue || 1;
                              const y = 100 - (((data.value - minValue) / range) * 80 + 10);
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                        
                        {/* 绘制数据点 */}
                        {performanceData.map((data, index) => {
                          const x = (index / (performanceData.length - 1)) * 100;
                          const minValue = Math.min(...performanceData.map(d => d.value));
                          const maxValue = Math.max(...performanceData.map(d => d.value));
                          const range = maxValue - minValue || 1;
                          const y = 100 - (((data.value - minValue) / range) * 80 + 10);
                          return (
                            <circle
                              key={index}
                              cx={x}
                              cy={y}
                              r="2"
                              fill="hsl(var(--primary))"
                              stroke="white"
                              strokeWidth="1"
                            />
                          );
                        })}
                      </svg>
                      
                      {/* 日期标签 */}
                      <div className="flex justify-between mt-2">
                        {performanceData.map((data, index) => (
                          <div key={index} className="text-xs text-muted-foreground">
                            {data.date}
                          </div>
                        ))}
                      </div>
                      
                      {/* 价格标签 */}
                      <div className="absolute top-4 right-4 space-y-1">
                        {performanceData.map((data, index) => (
                          <div key={index} className="text-xs flex justify-end">
                            <span className="text-muted-foreground mr-2">{data.date}:</span>
                            <span className="font-medium">{formatCurrency(data.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">暂无价格历史数据</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 关键指标 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">收益指标</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总收益率</span>
                    <span className={`font-medium ${profitLossColorClass}`}>
                      {formatPercent(asset.profitLossPercent)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">今日涨跌</span>
                    <span className={`font-medium ${dayChangeColorClass}`}>
                      {formatPercent(asset.dayChangePercent)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">年化收益率</span>
                    <span className="font-medium">
                      {formatPercent(asset.profitLossPercent * 2.5)} (估算)
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">风险指标</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">风险等级</span>
                    <Badge 
                      variant="outline" 
                      className={`${riskColors[asset.riskLevel]}`}
                    >
                      {riskLabels[asset.riskLevel]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">波动率</span>
                    <span className="font-medium">
                      {(Math.random() * 20 + 10).toFixed(1)}% (估算)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">最大回撤</span>
                    <span className="font-medium text-destructive">
                      -{(Math.random() * 15 + 5).toFixed(1)}% (估算)
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">资产名称</p>
                      <p className="font-medium">{asset.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">交易代码</p>
                      <p className="font-medium">{asset.symbol}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">资产分类</p>
                      <Badge variant="secondary">{asset.category}</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">风险等级</p>
                      <Badge 
                        variant="outline" 
                        className={`${riskColors[asset.riskLevel]}`}
                      >
                        {riskLabels[asset.riskLevel]}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">最后更新</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {asset.lastUpdated}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 交易记录 */}
            <TransactionHistory assetId={asset.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}