"use client"

import React, { useState } from 'react'
import { 
  Target,
  Calendar,
  DollarSign,
  TrendingUp,
  PieChart,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  Settings,
  BookOpen,
  Lightbulb,
  Flag
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTransition, CardEnterAnimation, FadeInAnimation } from '@/components/ui/page-transition'
import { AnimatedCounter } from '@/components/ui/animated-counter'

interface InvestmentPlan {
  id: string
  title: string
  description: string
  status: 'active' | 'paused' | 'completed' | 'draft'
  priority: 'high' | 'medium' | 'low'
  targetAmount: number
  currentAmount: number
  startDate: string
  endDate: string
  expectedReturn: number
  riskLevel: 'low' | 'medium' | 'high'
  category: string
  assets: Array<{
    name: string
    allocation: number
    currentPrice: number
    targetPrice: number
  }>
  milestones: Array<{
    title: string
    targetDate: string
    completed: boolean
    description: string
  }>
  notes: string
  createdAt: string
  updatedAt: string
}

export default function PlansPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('priority')

  // 模拟投资计划数据
  const investmentPlans: InvestmentPlan[] = [
    {
      id: '1',
      title: '科技股长期投资计划',
      description: '专注于优质科技股的长期价值投资，目标是在3年内实现30%的年化收益率',
      status: 'active',
      priority: 'high',
      targetAmount: 500000,
      currentAmount: 320000,
      startDate: '2024-01-01',
      endDate: '2026-12-31',
      expectedReturn: 30,
      riskLevel: 'medium',
      category: '股票投资',
      assets: [
        { name: '腾讯控股', allocation: 30, currentPrice: 320, targetPrice: 450 },
        { name: '阿里巴巴', allocation: 25, currentPrice: 85, targetPrice: 120 },
        { name: '美团', allocation: 20, currentPrice: 180, targetPrice: 250 },
        { name: '小米集团', allocation: 15, currentPrice: 12, targetPrice: 18 },
        { name: '现金储备', allocation: 10, currentPrice: 1, targetPrice: 1 }
      ],
      milestones: [
        {
          title: '完成初始建仓',
          targetDate: '2024-03-31',
          completed: true,
          description: '按计划配置完成各标的初始仓位'
        },
        {
          title: '达到50%目标金额',
          targetDate: '2024-12-31',
          completed: false,
          description: '投资金额达到25万元'
        },
        {
          title: '中期评估调整',
          targetDate: '2025-06-30',
          completed: false,
          description: '根据市场情况调整投资组合'
        },
        {
          title: '完成投资目标',
          targetDate: '2026-12-31',
          completed: false,
          description: '达到50万元投资目标'
        }
      ],
      notes: '重点关注公司基本面变化，定期调整仓位配置。注意控制单一标的风险。',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-15'
    },
    {
      id: '2',
      title: '稳健收益债券计划',
      description: '通过投资优质债券和债券基金，获得稳定的固定收益',
      status: 'active',
      priority: 'medium',
      targetAmount: 200000,
      currentAmount: 150000,
      startDate: '2024-02-01',
      endDate: '2025-02-01',
      expectedReturn: 8,
      riskLevel: 'low',
      category: '固收投资',
      assets: [
        { name: '国债ETF', allocation: 40, currentPrice: 102, targetPrice: 105 },
        { name: '企业债基金', allocation: 35, currentPrice: 1.15, targetPrice: 1.25 },
        { name: '可转债', allocation: 20, currentPrice: 110, targetPrice: 130 },
        { name: '货币基金', allocation: 5, currentPrice: 1, targetPrice: 1 }
      ],
      milestones: [
        {
          title: '完成债券配置',
          targetDate: '2024-04-30',
          completed: true,
          description: '按计划完成各类债券投资'
        },
        {
          title: '达到目标收益率',
          targetDate: '2024-12-31',
          completed: false,
          description: '年化收益率达到8%'
        }
      ],
      notes: '重点关注利率变化对债券价格的影响，适时调整久期配置。',
      createdAt: '2024-02-01',
      updatedAt: '2024-01-15'
    },
    {
      id: '3',
      title: '海外市场分散投资',
      description: '通过投资海外ETF和QDII基金，实现全球资产配置',
      status: 'draft',
      priority: 'low',
      targetAmount: 300000,
      currentAmount: 0,
      startDate: '2024-03-01',
      endDate: '2027-03-01',
      expectedReturn: 12,
      riskLevel: 'medium',
      category: '海外投资',
      assets: [
        { name: '标普500ETF', allocation: 40, currentPrice: 450, targetPrice: 550 },
        { name: '纳斯达克ETF', allocation: 30, currentPrice: 380, targetPrice: 480 },
        { name: '欧洲股票基金', allocation: 20, currentPrice: 1.2, targetPrice: 1.5 },
        { name: '新兴市场基金', allocation: 10, currentPrice: 0.8, targetPrice: 1.1 }
      ],
      milestones: [
        {
          title: '开通海外投资账户',
          targetDate: '2024-02-29',
          completed: false,
          description: '完成QDII账户开通和资金准备'
        },
        {
          title: '开始定投计划',
          targetDate: '2024-03-31',
          completed: false,
          description: '启动定期投资计划'
        }
      ],
      notes: '需要关注汇率风险和海外市场政策变化。',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-15'
    }
  ]

  // 统计数据
  const stats = {
    totalPlans: investmentPlans.length,
    activePlans: investmentPlans.filter(p => p.status === 'active').length,
    totalTarget: investmentPlans.reduce((sum, p) => sum + p.targetAmount, 0),
    totalCurrent: investmentPlans.reduce((sum, p) => sum + p.currentAmount, 0),
    avgProgress: investmentPlans.reduce((sum, p) => sum + (p.currentAmount / p.targetAmount * 100), 0) / investmentPlans.length
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4 text-green-500" />
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'draft': return <Clock className="h-4 w-4 text-gray-500" />
      default: return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      paused: 'secondary',
      completed: 'outline',
      draft: 'secondary'
    } as const
    
    const labels = {
      active: '进行中',
      paused: '暂停',
      completed: '已完成',
      draft: '草稿'
    }
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const
    
    const labels = {
      high: '高优先级',
      medium: '中优先级',
      low: '低优先级'
    }
    
    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>
        {labels[priority as keyof typeof labels] || priority}
      </Badge>
    )
  }

  const getRiskBadge = (risk: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const
    
    const labels = {
      high: '高风险',
      medium: '中风险',
      low: '低风险'
    }
    
    return (
      <Badge variant={variants[risk as keyof typeof variants] || 'secondary'}>
        {labels[risk as keyof typeof labels] || risk}
      </Badge>
    )
  }

  const filteredPlans = investmentPlans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || plan.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* 页面标题区域 */}
        <FadeInAnimation delay={0}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">投资计划</h1>
              <p className="text-muted-foreground mt-2">
                制定投资目标，跟踪执行进度
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="glass-effect">
                <Settings className="h-4 w-4 mr-2" />
                计划设置
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary-hover">
                <Plus className="h-4 w-4 mr-2" />
                新建计划
              </Button>
            </div>
          </div>
        </FadeInAnimation>

        {/* 统计概览 */}
        <CardEnterAnimation delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="modern-card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总计划数</p>
                    <div className="text-2xl font-bold">
                      <AnimatedCounter value={stats.totalPlans} />
                    </div>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">活跃计划</p>
                    <div className="text-2xl font-bold text-green-600">
                      <AnimatedCounter value={stats.activePlans} />
                    </div>
                  </div>
                  <Play className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">目标金额</p>
                    <div className="text-2xl font-bold text-blue-600">
                      <AnimatedCounter 
                        value={stats.totalTarget} 
                        prefix="¥" 
                        format="currency"
                      />
                    </div>
                  </div>
                  <Flag className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">当前金额</p>
                    <div className="text-2xl font-bold text-purple-600">
                      <AnimatedCounter 
                        value={stats.totalCurrent} 
                        prefix="¥" 
                        format="currency"
                      />
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">平均进度</p>
                    <div className="text-2xl font-bold text-orange-600">
                      <AnimatedCounter value={stats.avgProgress} suffix="%" decimals={1} />
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardEnterAnimation>

        {/* 搜索和筛选 */}
        <CardEnterAnimation delay={200}>
          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索投资计划..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="active">进行中</SelectItem>
                      <SelectItem value="paused">暂停</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                      <SelectItem value="draft">草稿</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">按优先级</SelectItem>
                      <SelectItem value="progress">按进度</SelectItem>
                      <SelectItem value="amount">按金额</SelectItem>
                      <SelectItem value="date">按日期</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardEnterAnimation>

        {/* 投资计划列表 */}
        <CardEnterAnimation delay={300}>
          <div className="space-y-6">
            {filteredPlans.map((plan, index) => (
              <Card key={plan.id} className="modern-card-hover">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* 头部信息 */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(plan.status)}
                          <h3 className="text-xl font-semibold">{plan.title}</h3>
                          {getStatusBadge(plan.status)}
                          {getPriorityBadge(plan.priority)}
                          {getRiskBadge(plan.riskLevel)}
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {plan.description}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {plan.startDate} - {plan.endDate}
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {plan.category}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            预期收益 {plan.expectedReturn}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 进度和金额 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">投资进度</span>
                          <span className="font-medium">
                            {((plan.currentAmount / plan.targetAmount) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={(plan.currentAmount / plan.targetAmount) * 100} 
                          className="h-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">当前金额</div>
                        <div className="text-lg font-semibold text-purple-600">
                          ¥{plan.currentAmount.toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">目标金额</div>
                        <div className="text-lg font-semibold text-blue-600">
                          ¥{plan.targetAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* 资产配置 */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">资产配置</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {plan.assets.map((asset, assetIndex) => (
                          <div key={assetIndex} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">{asset.name}</div>
                              <div className="text-xs text-muted-foreground">
                                配置 {asset.allocation}%
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="text-sm font-medium">
                                ¥{asset.currentPrice}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                目标 ¥{asset.targetPrice}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 里程碑 */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">执行里程碑</h4>
                      <div className="space-y-3">
                        {plan.milestones.map((milestone, milestoneIndex) => (
                          <div key={milestoneIndex} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                            <div className="mt-1">
                              {milestone.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${
                                  milestone.completed ? 'text-green-600' : 'text-foreground'
                                }`}>
                                  {milestone.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {milestone.targetDate}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {milestone.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 备注 */}
                    {plan.notes && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          计划备注
                        </h4>
                        <p className="text-sm leading-relaxed p-3 bg-muted/30 rounded-lg">
                          {plan.notes}
                        </p>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-3 pt-3 border-t">
                      {plan.status === 'active' ? (
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4 mr-2" />
                          暂停计划
                        </Button>
                      ) : plan.status === 'paused' ? (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          继续执行
                        </Button>
                      ) : plan.status === 'draft' ? (
                        <Button size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          启动计划
                        </Button>
                      ) : null}
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        查看详情
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        编辑计划
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardEnterAnimation>

        {/* 空状态 */}
        {filteredPlans.length === 0 && (
          <CardEnterAnimation delay={300}>
            <Card className="modern-card">
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">暂无投资计划</h3>
                <p className="text-muted-foreground mb-4">
                  制定您的第一个投资计划，开始系统化投资
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  创建投资计划
                </Button>
              </CardContent>
            </Card>
          </CardEnterAnimation>
        )}
      </div>
    </PageTransition>
  )
}