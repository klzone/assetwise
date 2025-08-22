"use client"

import React, { useState, useEffect } from 'react'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Search, 
  Calendar,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PageTransition, CardEnterAnimation, FadeInAnimation } from '@/components/ui/page-transition'
import { AnimatedCounter, AnimatedCurrency, AnimatedPercentage } from '@/components/ui/animated-counter'
import { dataService, TransactionWithAsset } from '@/lib/data-service'
import { TransactionType } from '@/lib/transaction-types'

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('all')
  const [transactions, setTransactions] = useState<TransactionWithAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalBuyAmount: 0,
    totalSellAmount: 0,
    totalProfit: 0,
    buyCount: 0,
    sellCount: 0
  })

  // 加载数据
  const loadData = () => {
    try {
      const transactionData = dataService.getTransactionsWithAssets()
      const transactionStats = dataService.getTransactionStats()
      
      setTransactions(transactionData)
      setStats(transactionStats)
    } catch (error) {
      console.error('加载交易数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 过滤交易记录
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.assetSymbol.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || transaction.type === filterType
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus
    const matchesTab = activeTab === 'all' || transaction.type === activeTab
    
    return matchesSearch && matchesType && matchesStatus && matchesTab
  })

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
              <h1 className="text-3xl font-bold text-gradient-primary">交易记录</h1>
              <p className="text-muted-foreground mt-2">
                查看和分析您的所有交易活动
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="glass-effect">
                <Download className="h-4 w-4 mr-2" />
                导出记录
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary-hover" asChild>
                <a href="/assets">
                  <Plus className="h-4 w-4 mr-2" />
                  新增交易
                </a>
              </Button>
            </div>
          </div>
        </FadeInAnimation>

        {/* 统计卡片区域 */}
        <CardEnterAnimation delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="总交易次数"
              value={stats.totalTransactions}
              icon={<DollarSign className="h-5 w-5" />}
              description="累计交易"
            />
            <StatCard
              title="买入总额"
              value={stats.totalBuyAmount}
              icon={<TrendingUp className="h-5 w-5" />}
              description="资金投入"
              isCurrency
            />
            <StatCard
              title="卖出总额"
              value={stats.totalSellAmount}
              icon={<TrendingDown className="h-5 w-5" />}
              description="资金回收"
              isCurrency
            />
            <StatCard
              title="交易盈亏"
              value={stats.totalProfit}
              icon={<ArrowUpRight className="h-5 w-5" />}
              description="卖出净收益"
              isCurrency
              isProfit
            />
          </div>
        </CardEnterAnimation>

        {/* 筛选和搜索区域 */}
        <CardEnterAnimation delay={200}>
          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索资产名称或代码..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="交易类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      <SelectItem value="buy">买入</SelectItem>
                      <SelectItem value="sell">卖出</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                      <SelectItem value="pending">待处理</SelectItem>
                      <SelectItem value="failed">失败</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    更多筛选
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardEnterAnimation>

        {/* 交易记录列表 */}
        <CardEnterAnimation delay={300}>
          <Card className="modern-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">交易明细</CardTitle>
                  <CardDescription>共 {filteredTransactions.length} 条记录</CardDescription>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">全部</TabsTrigger>
                    <TabsTrigger value="buy">买入</TabsTrigger>
                    <TabsTrigger value="sell">卖出</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction, index) => (
                    <TransactionItem 
                      key={transaction.id} 
                      transaction={transaction}
                      delay={index * 50}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">暂无交易记录</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                        ? '没有找到符合条件的交易记录，请调整筛选条件'
                        : '还没有任何交易记录，开始添加您的第一笔资产吧'
                      }
                    </p>
                    <Button asChild>
                      <a href="/assets">
                        <Plus className="h-4 w-4 mr-2" />
                        添加资产
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CardEnterAnimation>
      </div>
    </PageTransition>
  )
}

// 统计卡片组件
interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  description: string
  isCurrency?: boolean
  isProfit?: boolean
}

function StatCard({ title, value, icon, description, isCurrency, isProfit }: StatCardProps) {
  return (
    <Card className="modern-card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
          {isProfit && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              value >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {value >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {value >= 0 ? '+' : ''}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold">
            {isCurrency ? (
              <AnimatedCurrency value={value} />
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

// 交易记录项组件
interface TransactionItemProps {
  transaction: TransactionWithAsset
  delay?: number
}

function TransactionItem({ transaction, delay = 0 }: TransactionItemProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: '已完成', variant: 'default' as const },
      pending: { label: '待处理', variant: 'secondary' as const },
      failed: { label: '失败', variant: 'destructive' as const }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.completed
  }

  const statusBadge = getStatusBadge(transaction.status)

  return (
    <FadeInAnimation delay={delay}>
      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-secondary/30 transition-colors">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            transaction.type === TransactionType.BUY ? 'bg-success/10' : 'bg-destructive/10'
          }`}>
            {transaction.type === TransactionType.BUY ? (
              <TrendingUp className="h-5 w-5 text-success" />
            ) : (
              <TrendingDown className="h-5 w-5 text-destructive" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{transaction.assetName}</h4>
              <Badge variant="outline" className="text-xs">{transaction.assetSymbol}</Badge>
              <Badge variant={statusBadge.variant} className="text-xs">
                {statusBadge.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{transaction.quantity} 股</span>
              <span>¥{transaction.price.toFixed(2)}/股</span>
              <span>{formatDate(transaction.date)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-medium">
              <AnimatedCurrency value={transaction.totalAmount} />
            </div>
            {transaction.profit !== undefined && transaction.profitRate !== undefined && (
              <div className={`text-sm ${
                transaction.profit >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {transaction.profit >= 0 ? '+' : ''}
                <AnimatedCurrency value={transaction.profit} />
                ({transaction.profit >= 0 ? '+' : ''}
                <AnimatedPercentage value={transaction.profitRate} showSign={false} />)
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                编辑交易
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                删除记录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </FadeInAnimation>
  )
}