"use client"

import React from 'react'
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
import { AssetAllocationChart, generateAssetAllocationData } from '@/components/charts/asset-allocation-chart'
import { ProfitTrendChart, generateProfitTrendData } from '@/components/charts/profit-trend-chart'
import { AssetPerformanceChart, generateAssetPerformanceData } from '@/components/charts/asset-performance-chart'
import { AnimatedCounter, AnimatedPercentage, AnimatedCurrency } from '@/components/ui/animated-counter'
import { PageTransition, CardEnterAnimation, FadeInAnimation } from '@/components/ui/page-transition'

export default function DashboardPage() {
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
              <Button variant="outline" size="sm" className="glass-effect">
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新数据
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary-hover">
                <Plus className="h-4 w-4 mr-2" />
                添加资产
              </Button>
            </div>
          </div>
        </FadeInAnimation>

        {/* 核心指标卡片区域 */}
        <CardEnterAnimation delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="总资产价值"
              value="¥1,234,567.89"
              change="+12.5%"
              changeType="positive"
              icon={<DollarSign className="h-5 w-5" />}
              description="较上月增长"
            />
            <MetricCard
              title="今日收益"
              value="¥8,456.32"
              change="+2.8%"
              changeType="positive"
              icon={<TrendingUp className="h-5 w-5" />}
              description="今日盈亏"
            />
            <MetricCard
              title="持仓数量"
              value="23"
              change="+3"
              changeType="neutral"
              icon={<PieChart className="h-5 w-5" />}
              description="投资标的"
            />
            <MetricCard
              title="年化收益率"
              value="15.6%"
              change="+1.2%"
              changeType="positive"
              icon={<BarChart3 className="h-5 w-5" />}
              description="过去12个月"
            />
          </div>
        </CardEnterAnimation>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 资产配置图表 */}
        <div className="lg:col-span-2">
          <AssetAllocationChart 
            data={generateAssetAllocationData()}
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
              href="/transactions/buy"
            />
            <QuickActionItem
              title="卖出资产"
              description="出售持有的资产"
              icon="📉"
              href="/transactions/sell"
            />
            <QuickActionItem
              title="查看报告"
              description="生成投资分析报告"
              icon="📊"
              href="/reports"
            />
            <QuickActionItem
              title="风险评估"
              description="评估投资组合风险"
              icon="⚠️"
              href="/risk-assessment"
            />
          </CardContent>
        </Card>
      </div>

      {/* 收益趋势和资产表现图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfitTrendChart 
          data={generateProfitTrendData()}
          title="收益趋势分析"
          description="过去30天收益变化趋势"
          chartType="area"
        />
        <AssetPerformanceChart 
          data={generateAssetPerformanceData()}
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
            <Button variant="ghost" size="sm">
              查看全部
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <TransactionItem
                type="buy"
                asset="苹果公司 (AAPL)"
                amount="¥12,345.67"
                quantity="100股"
                time="2小时前"
              />
              <TransactionItem
                type="sell"
                asset="微软公司 (MSFT)"
                amount="¥8,765.43"
                quantity="50股"
                time="1天前"
              />
              <TransactionItem
                type="buy"
                asset="特斯拉 (TSLA)"
                amount="¥15,432.10"
                quantity="75股"
                time="2天前"
              />
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
              <PopularAssetItem
                name="比特币"
                symbol="BTC"
                price="¥234,567.89"
                change="+5.2%"
                changeType="positive"
              />
              <PopularAssetItem
                name="以太坊"
                symbol="ETH"
                price="¥12,345.67"
                change="-2.1%"
                changeType="negative"
              />
              <PopularAssetItem
                name="黄金ETF"
                symbol="GLD"
                price="¥1,234.56"
                change="+1.8%"
                changeType="positive"
              />
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
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  description: string
}

function MetricCard({ title, value, change, changeType, icon, description }: MetricCardProps) {
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

  // 解析数值用于动画
  const numericValue = parseFloat(value.replace(/[¥,]/g, '')) || 0
  const changeValue = parseFloat(change.replace(/[+%]/g, '')) || 0

  return (
    <Card className="modern-card-hover group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            {icon}
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${changeColor}`}>
            {changeIcon}
            <AnimatedPercentage value={changeValue} showSign={changeType !== 'neutral'} />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold">
            {title === '总资产价值' || title === '今日收益' ? (
              <AnimatedCurrency value={numericValue} />
            ) : title === '年化收益率' ? (
              <AnimatedPercentage value={numericValue} showSign={false} />
            ) : (
              <AnimatedCounter value={numericValue} />
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