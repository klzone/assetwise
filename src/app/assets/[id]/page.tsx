'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, PieChart, Activity, AlertTriangle, Star, StarOff, ShoppingCart, Minus, Plus, RefreshCw, ExternalLink, CloudOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

// 资产详情页面
export default function AssetDetailPage() {
  const params = useParams()
  const assetId = params.id as string

  const [isWatchlisted, setIsWatchlisted] = useState(false)
  const [buyQuantity, setBuyQuantity] = useState('')
  const [sellQuantity, setSellQuantity] = useState('')

  // 模拟资产数据
  const asset = {
    id: assetId,
    name: '苹果公司',
    symbol: 'AAPL',
    category: '股票',
    currentPrice: 175.43,
    purchasePrice: 150.00,
    quantity: 100,
    totalValue: 17543,
    totalCost: 15000,
    profitLoss: 2543,
    profitLossPercent: 16.95,
    dayChange: 2.15,
    dayChangePercent: 1.24,
    allocation: 25.3,
    lastUpdated: '2小时前',
    riskLevel: 'medium' as const,
    description: '苹果公司是一家美国跨国科技公司，专门设计、开发和销售消费电子产品、计算机软件和在线服务。',
    marketCap: '2.8万亿美元',
    peRatio: 28.5,
    dividendYield: 0.52,
    beta: 1.25,
    volume: '45,234,567',
    avgVolume: '52,123,456',
    high52Week: 198.23,
    low52Week: 124.17
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'high': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'low': return '低风险'
      case 'medium': return '中等风险'
      case 'high': return '高风险'
      default: return '未知'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center gap-4">
        <Link href="/assets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回资产列表
          </Button>
        </Link>
      </div>

      {/* 资产基本信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{asset.name}</CardTitle>
                    <CardDescription className="text-lg">
                      {asset.symbol} • {asset.category}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsWatchlisted(!isWatchlisted)}
                >
                  {isWatchlisted ? (
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  ) : (
                    <StarOff className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">当前价格</Label>
                  <div className="text-2xl font-bold">¥{asset.currentPrice.toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">日涨跌</Label>
                  <div className={`text-2xl font-bold flex items-center gap-1 ${
                    asset.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {asset.dayChange >= 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    {asset.dayChangePercent >= 0 ? '+' : ''}{asset.dayChangePercent.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">持仓盈亏</Label>
                  <div className={`text-2xl font-bold ${
                    asset.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ¥{asset.profitLoss.toFixed(2)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">风险等级</Label>
                  <Badge className={getRiskColor(asset.riskLevel)}>
                    {getRiskText(asset.riskLevel)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 持仓信息 */}
        <Card>
          <CardHeader>
            <CardTitle>持仓信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">持仓数量</span>
              <span className="font-medium">{asset.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">购买价格</span>
              <span className="font-medium">¥{asset.purchasePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">总成本</span>
              <span className="font-medium">¥{asset.totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">当前市值</span>
              <span className="font-medium">¥{asset.totalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">配置占比</span>
              <span className="font-medium">{asset.allocation.toFixed(1)}%</span>
            </div>
            <Progress value={asset.allocation} className="w-full" />
          </CardContent>
        </Card>
      </div>

      {/* 详细信息标签页 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="trading">交易</TabsTrigger>
          <TabsTrigger value="analysis">分析</TabsTrigger>
          <TabsTrigger value="news">资讯</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">市值</span>
                  <span>{asset.marketCap}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">市盈率</span>
                  <span>{asset.peRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">股息率</span>
                  <span>{asset.dividendYield}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Beta系数</span>
                  <span>{asset.beta}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>交易数据</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">成交量</span>
                  <span>{asset.volume}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">平均成交量</span>
                  <span>{asset.avgVolume}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">52周最高</span>
                  <span>¥{asset.high52Week}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">52周最低</span>
                  <span>¥{asset.low52Week}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>公司简介</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {asset.description}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trading" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  买入
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="buy-quantity">买入数量</Label>
                  <Input
                    id="buy-quantity"
                    type="number"
                    placeholder="输入买入数量"
                    value={buyQuantity}
                    onChange={(e) => setBuyQuantity(e.target.value)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  预计成本: ¥{(parseFloat(buyQuantity) * asset.currentPrice || 0).toFixed(2)}
                </div>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  买入
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Minus className="h-5 w-5" />
                  卖出
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sell-quantity">卖出数量</Label>
                  <Input
                    id="sell-quantity"
                    type="number"
                    placeholder="输入卖出数量"
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(e.target.value)}
                    max={asset.quantity}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  预计收入: ¥{(parseFloat(sellQuantity) * asset.currentPrice || 0).toFixed(2)}
                </div>
                <Button variant="destructive" className="w-full">
                  <Minus className="h-4 w-4 mr-2" />
                  卖出
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  技术分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  技术分析图表
                  <br />
                  <small>功能开发中...</small>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  基本面分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  基本面数据
                  <br />
                  <small>功能开发中...</small>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  风险评估
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  风险指标
                  <br />
                  <small>功能开发中...</small>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="news" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                相关资讯
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CloudOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                暂无相关资讯
                <br />
                <small>功能开发中...</small>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}