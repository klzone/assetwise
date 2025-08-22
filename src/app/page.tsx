"use client"

import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { AssetAllocationChart } from '@/components/charts/asset-allocation-chart'
import { ProfitTrendChart } from '@/components/charts/profit-trend-chart'
import { AssetPerformanceChart } from '@/components/charts/asset-performance-chart'
import { AnimatedCounter, AnimatedPercentage, AnimatedCurrency } from '@/components/ui/animated-counter'
import { PageTransition, CardEnterAnimation, FadeInAnimation } from '@/components/ui/page-transition'
import { dataService, DashboardStats, AssetAllocation, ProfitTrendData, AssetPerformanceData, PopularAssetData, TransactionWithAsset } from '@/lib/data-service'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [assetAllocation, setAssetAllocation] = useState<AssetAllocation[]>([])
  const [profitTrend, setProfitTrend] = useState<ProfitTrendData[]>([])
  const [assetPerformance, setAssetPerformance] = useState<AssetPerformanceData[]>([])
  const [popularAssets, setPopularAssets] = useState<PopularAssetData[]>([])
  const [recentTransactions, setRecentTransactions] = useState<TransactionWithAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 加载数据
  const loadData = async () => {
    try {
      setStats(dataService.getDashboardStats())
      setAssetAllocation(dataService.getAssetAllocation())
      setProfitTrend(dataService.getProfitTrendData())
      setAssetPerformance(dataService.getAssetPerformanceData())
      setPopularAssets(dataService.getPopularAssets())
      setRecentTransactions(dataService.getRecentTransactions(3))
    } catch (error) {
      console.error('加载仪表盘数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await dataService.refreshAllData()
      await loadData()
    } catch (error) {
      console.error('刷新数据失败:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* 页面标题区域 */}
        <FadeInAnimation delay={0}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">资产仪表盘</h1>
              <p className="text-muted-foreground mt-2">
                实时监控您的投资组合表现和市场动态
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="glass-effect"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? '刷新中' : '刷新数据'}
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary-hover" asChild>
                <a href="/assets">
                  <Plus className="h-4 w-4 mr-2" />
                  添加资产
                </a>
              </Button>
            </div>
          </div>
        </FadeInAnimation>

        {/* 核心指标卡片区域 */}
        <CardEnterAnimation delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="总资产价值"
              value={stats?.totalValue || 0}
              change={stats?.totalProfitPercent || 0}
              changeType={stats && stats.totalProfit >= 0 ? "positive" : "negative"}
              icon={<DollarSign className="h-5 w-5" />}
              description="较成本增长"
              isCurrency
            />
            <MetricCard
              title="今日收益"
              value={stats?.todayProfit || 0}
              change={stats?.todayProfitPercent || 0}
              changeType={stats && stats.todayProfit >= 0 ? "positive" : "negative"}
              icon={<TrendingUp className="h-5 w-5" />}
              description="今日盈亏"
              isCurrency
            />
            <MetricCard
              title="持仓数量"
              value={stats?.assetCount || 0}
              change={0}
              changeType="neutral"
              icon={<PieChart className="h-5 w-5" />}
              description="投资标的"
            />
            <MetricCard
              title="年化收益率"
              value={stats?.annualizedReturn || 0}
              change={0}
              changeType={stats && stats.annualizedReturn >= 0 ? "positive" : "negative"}
              icon={<BarChart3 className="h-5 w-5" />}
              description="预估年化"
              isPercentage
            />
          </div>
        </CardEnterAnimation>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 资产配置图表 */}
          <div className="lg:col-span-2">
            <AssetAllocationChart 
              data={assetAllocation}
              title="资产配置分析"
              description="投资组合分布情况"
            />
          </div>

          {/* 快速操作面板 */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">快速操作</CardTitle>
              <CardDescription>常用功能入口</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuickActionItem
                title="买入资产"
                description="添加新的投资标的"
                icon="📈"
                href="/assets"
              />
              <QuickActionItem
                title="卖出资产"
                description="出售持有的资产"
                icon="📉"
                href="/assets"
              />
              <QuickActionItem
                title="查看报告"
                description="生成投资分析报告"
                icon="📊"
                href="/analysis"
              />
              <QuickActionItem
                title="风险评估"
                description="评估投资组合风险"
                icon="⚠️"
                href="/analysis"
              />
            </CardContent>
          </Card>
        </div>

        {/* 收益趋势和资产表现图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProfitTrendChart 
            data={profitTrend}
            title="收益趋势分析"
            description="过去30天收益变化趋势"
            chartType="area"
          />
          <AssetPerformanceChart 
            data={assetPerformance}
            title="资产表现对比"
            description="各资产收益率排行"
          />
        </div>

        {/* 最新动态和持仓概览 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 最新交易记录 */}
          <Card className="modern-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">最新交易</CardTitle>
                <CardDescription>近期交易记录</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href="/transactions">查看全部</a>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      type={transaction.type}
                      asset={`${transaction.assetName} (${transaction.assetSymbol})`}
                      amount={`¥${transaction.totalAmount.toLocaleString()}`}
                      quantity={`${transaction.quantity}股`}
                      time={new Date(transaction.date).toLocaleDateString('zh-CN')}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>暂无交易记录</p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <a href="/assets">添加资产</a>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 热门资产 */}
          <Card className="modern-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">热门资产</CardTitle>
                <CardDescription>市场关注度较高的投资标的</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                更多推荐
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularAssets.map((asset) => (
                  <PopularAssetItem
                    key={asset.symbol}
                    name={asset.name}
                    symbol={asset.symbol}
                    price={`¥${asset.price.toLocaleString()}`}
                    change={`${asset.changePercent >= 0 ? '+' : ''}${asset.changePercent.toFixed(2)}%`}
                    changeType={asset.changePercent >= 0 ? "positive" : "negative"}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}

// 指标卡片组件
interface MetricCardProps {
  title: string
  value: number
  change: number
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  description: string
  isCurrency?: boolean
  isPercentage?: boolean
}

function MetricCard({ title, value, change, changeType, icon, description, isCurrency, isPercentage }: MetricCardProps) {
  const changeColor = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground'
  }[changeType]

  const changeIcon = changeType === 'positive' ? (
    <ArrowUpRight className="h-3 w-3" />
  ) : changeType === 'negative' ? (
    <ArrowDownRight className="h-3 w-3" />
  ) : null

  return (
    <Card className="modern-card-hover group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            {icon}
          </div>
          {changeType !== 'neutral' && (
            <div className={`flex items-center gap-1 text-sm font-medium ${changeColor}`}>
              {changeIcon}
              <AnimatedPercentage value={change} showSign={changeType !== 'neutral'} />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold">
            {isCurrency ? (
              <AnimatedCurrency value={value} />
            ) : isPercentage ? (
              <AnimatedPercentage value={value} showSign={false} />
            ) : (
              <AnimatedCounter value={value} />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// 快速操作项组件
interface QuickActionItemProps {
  title: string
  description: string
  icon: string
  href: string
}

function QuickActionItem({ title, description, icon, href }: QuickActionItemProps) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
    >
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
    </a>
  )
}

// 交易记录项组件
interface TransactionItemProps {
  type: 'buy' | 'sell'
  asset: string
  amount: string
  quantity: string
  time: string
}

function TransactionItem({ type, asset, amount, quantity, time }: TransactionItemProps) {
  const typeColor = type === 'buy' ? 'text-success' : 'text-destructive'
  const typeText = type === 'buy' ? '买入' : '卖出'

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${type === 'buy' ? 'bg-success' : 'bg-destructive'}`} />
        <div>
          <p className="font-medium text-sm">{asset}</p>
          <p className="text-xs text-muted-foreground">{quantity} • {time}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium text-sm ${typeColor}`}>{typeText}</p>
        <p className="text-xs text-muted-foreground">{amount}</p>
      </div>
    </div>
  )
}

// 热门资产项组件
interface PopularAssetItemProps {
  name: string
  symbol: string
  price: string
  change: string
  changeType: 'positive' | 'negative'
}

function PopularAssetItem({ name, symbol, price, change, changeType }: PopularAssetItemProps) {
  const changeColor = changeType === 'positive' ? 'text-success' : 'text-destructive'
  const changeIcon = changeType === 'positive' ? (
    <TrendingUp className="h-3 w-3" />
  ) : (
    <TrendingDown className="h-3 w-3" />
  )

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer">
      <div>
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground">{symbol}</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-sm">{price}</p>
        <div className={`flex items-center gap-1 text-xs ${changeColor}`}>
          {changeIcon}
          {change}
        </div>
      </div>
    </div>
  )
}