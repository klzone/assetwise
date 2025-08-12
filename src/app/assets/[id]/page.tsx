"use client"

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft,
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
  Star,
  Share,
  Bookmark,
  Plus,
  Minus,
  RefreshCw,
  ExternalLink,
  Bell,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProfitTrendChart, generateProfitTrendData } from '@/components/charts/profit-trend-chart'

// 模拟资产详细数据
const mockAssetDetail = {
  id: '1',
  name: '苹果公司',
  symbol: 'AAPL',
  logo: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100&h=100&fit=crop&crop=center',
  category: '科技股',
  exchange: 'NASDAQ',
  currentPrice: 175.43,
  purchasePrice: 150.00,
  quantity: 100,
  totalValue: 17543,
  totalCost: 15000,
  profitLoss: 2543,
  profitLossPercent: 16.95,
  dayChange: 2.15,
  dayChangePercent: 1.24,
  weekChange: 8.75,
  weekChangePercent: 5.24,
  monthChange: 15.32,
  monthChangePercent: 9.58,
  yearChange: 25.43,
  yearChangePercent: 16.95,
  allocation: 25.3,
  riskLevel: 'medium' as const,
  marketCap: '2.8万亿',
  peRatio: 28.5,
  dividendYield: 0.52,
  beta: 1.25,
  volume: '52.3M',
  avgVolume: '48.7M',
  high52Week: 198.23,
  low52Week: 124.17,
  lastUpdated: '2小时前',
  description: '苹果公司是一家美国跨国科技公司，总部位于加利福尼亚州库比蒂诺。苹果设计、开发和销售消费电子产品、计算机软件和在线服务。',
  sector: '信息技术',
  industry: '消费电子',
  employees: '164,000',
  founded: '1976',
  website: 'https://www.apple.com'
}

// 模拟交易记录
const mockTransactions = [
  {
    id: '1',
    type: 'buy' as const,
    date: '2024-01-15',
    price: 150.00,
    quantity: 50,
    amount: 7500,
    fee: 5.99
  },
  {
    id: '2',
    type: 'buy' as const,
    date: '2024-02-20',
    price: 148.50,
    quantity: 30,
    amount: 4455,
    fee: 5.99
  },
  {
    id: '3',
    type: 'buy' as const,
    date: '2024-03-10',
    price: 152.75,
    quantity: 20,
    amount: 3055,
    fee: 5.99
  }
]

export default function AssetDetailPage() {
  const params = useParams()
  const [isWatchlisted, setIsWatchlisted] = useState(false)
  const [buyQuantity, setBuyQuantity] = useState('')
  const [sellQuantity, setSellQuantity] = useState('')

  const asset = mockAssetDetail
  const isProfitable = asset.profitLoss >= 0
  const isDayPositive = asset.dayChange >= 0

  const profitLossColor = isProfitable ? 'text-success' : 'text-destructive'
  const dayChangeColor = isDayPositive ? 'text-success' : 'text-destructive'

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

  return (
    <div className="space-y-8">
      {/* 返回按钮和页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={asset.logo} alt={asset.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {asset.symbol.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{asset.name}</h1>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{asset.symbol}</span>
              <Badge variant="outline" className={riskColors[asset.riskLevel]}>
                {riskLabels[asset.riskLevel]}
              </Badge>
              <Badge variant="secondary">{asset.category}</Badge>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsWatchlisted(!isWatchlisted)}
          >
            <Star className={`h-4 w-4 mr-2 ${isWatchlisted ? 'fill-current text-yellow-500' : ''}`} />
            {isWatchlisted ? '已关注' : '关注'}
          </Button>
          <Button variant="ghost" size="sm">
            <Share className="h-4 w-4 mr-2" />
            分享
          </Button>
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            提醒
          </Button>
        </div>
      </div>

      {/* 价格信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="modern-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">当前价格</span>
              <div className={`flex items-center gap-1 ${dayChangeColor}`}>
                {isDayPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-xs">
                  {isDayPositive ? '+' : ''}{asset.dayChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold">¥{asset.currentPrice.toLocaleString()}</p>
            <p className={`text-sm ${dayChangeColor}`}>
              {isDayPositive ? '+' : ''}¥{asset.dayChange.toLocaleString()} 今日
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">持仓价值</span>
            </div>
            <p className="text-2xl font-bold">¥{asset.totalValue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{asset.quantity} 股</p>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">总盈亏</span>
            </div>
            <p className={`text-2xl font-bold ${profitLossColor}`}>
              {isProfitable ? '+' : ''}¥{asset.profitLoss.toLocaleString()}
            </p>
            <p className={`text-sm ${profitLossColor}`}>
              {isProfitable ? '+' : ''}{asset.profitLossPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">配置占比</span>
            </div>
            <p className="text-2xl font-bold">{asset.allocation.toFixed(1)}%</p>
            <Progress value={asset.allocation} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 价格走势图 */}
        <div className="lg:col-span-2">
          <ProfitTrendChart 
            data={generateProfitTrendData()}
            title="价格走势"
            description="过去30天价格变化趋势"
            chartType="line"
          />
        </div>

        {/* 交易操作面板 */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">交易操作</CardTitle>
            <CardDescription>买入或卖出该资产</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="buy" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">买入</TabsTrigger>
                <TabsTrigger value="sell">卖出</TabsTrigger>
              </TabsList>
              
              <TabsContent value="buy" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="buy-quantity">买入数量</Label>
                  <Input
                    id="buy-quantity"
                    type="number"
                    placeholder="输入股数"
                    value={buyQuantity}
                    onChange={(e) => setBuyQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">预估金额</span>
                    <span className="font-medium">
                      ¥{(Number(buyQuantity) * asset.currentPrice || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">手续费</span>
                    <span className="font-medium">¥5.99</span>
                  </div>
                </div>
                <Button className="w-full bg-success hover:bg-success/90">
                  <Plus className="h-4 w-4 mr-2" />
                  确认买入
                </Button>
              </TabsContent>
              
              <TabsContent value="sell" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sell-quantity">卖出数量</Label>
                  <Input
                    id="sell-quantity"
                    type="number"
                    placeholder="输入股数"
                    max={asset.quantity}
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    可卖出: {asset.quantity} 股
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">预估金额</span>
                    <span className="font-medium">
                      ¥{(Number(sellQuantity) * asset.currentPrice || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">手续费</span>
                    <span className="font-medium">¥5.99</span>
                  </div>
                </div>
                <Button className="w-full bg-destructive hover:bg-destructive/90">
                  <Minus className="h-4 w-4 mr-2" />
                  确认卖出
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 详细信息标签页 */}
      <Card className="modern-card">
        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">概览</TabsTrigger>
                <TabsTrigger value="fundamentals">基本面</TabsTrigger>
                <TabsTrigger value="transactions">交易记录</TabsTrigger>
                <TabsTrigger value="news">相关资讯</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">公司简介</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {asset.description}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">基本信息</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">交易所</span>
                      <span>{asset.exchange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">行业</span>
                      <span>{asset.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">板块</span>
                      <span>{asset.sector}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">成立时间</span>
                      <span>{asset.founded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">员工数量</span>
                      <span>{asset.employees}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">价格区间</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">52周最高</span>
                      <span>¥{asset.high52Week.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">52周最低</span>
                      <span>¥{asset.low52Week.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">成交量</span>
                      <span>{asset.volume}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">平均成交量</span>
                      <span>{asset.avgVolume}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fundamentals" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{asset.marketCap}</p>
                    <p className="text-sm text-muted-foreground">市值</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{asset.peRatio}</p>
                    <p className="text-sm text-muted-foreground">市盈率</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{asset.dividendYield}%</p>
                    <p className="text-sm text-muted-foreground">股息率</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{asset.beta}</p>
                    <p className="text-sm text-muted-foreground">贝塔系数</p>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">交易历史</h3>
                <div className="space-y-3">
                  {mockTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${transaction.type === 'buy' ? 'bg-success' : 'bg-destructive'}`} />
                        <div>
                          <p className="font-medium">
                            {transaction.type === 'buy' ? '买入' : '卖出'} {transaction.quantity} 股
                          </p>
                          <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">¥{transaction.price.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          总额: ¥{transaction.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="news" className="p-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground">相关资讯功能开发中...</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}