"use client"

import React, { useState } from 'react'
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
  Plus,
  Filter,
  Search,
  Edit,
  Trash2,
  Star,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { PageTransition, CardEnterAnimation, FadeInAnimation } from '@/components/ui/page-transition'
import { AnimatedCounter } from '@/components/ui/animated-counter'

interface ReviewEntry {
  id: string
  date: string
  title: string
  type: 'success' | 'failure' | 'lesson' | 'strategy'
  profit: number
  profitRate: number
  asset: string
  tags: string[]
  content: string
  rating: number
  lessons: string[]
  nextActions: string[]
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  // 模拟复盘数据
  const reviewEntries: ReviewEntry[] = [
    {
      id: '1',
      date: '2024-01-15',
      title: '腾讯控股买入时机分析',
      type: 'success',
      profit: 15600,
      profitRate: 12.5,
      asset: '腾讯控股 (00700.HK)',
      tags: ['港股', '科技股', '长线投资'],
      content: '在腾讯股价回调至320港元时买入，主要基于其游戏业务恢复和云服务增长预期。买入后股价稳步上涨，验证了投资逻辑的正确性。',
      rating: 4,
      lessons: [
        '技术分析结合基本面分析效果更佳',
        '耐心等待合适的买入时机很重要',
        '分批建仓可以降低风险'
      ],
      nextActions: [
        '继续关注腾讯Q4财报',
        '监控游戏版号发放情况',
        '评估是否继续加仓'
      ]
    },
    {
      id: '2',
      date: '2024-01-10',
      title: '比亚迪止损操作复盘',
      type: 'failure',
      profit: -8900,
      profitRate: -7.2,
      asset: '比亚迪 (002594.SZ)',
      tags: ['A股', '新能源', '止损'],
      content: '在比亚迪股价突破前高时追涨买入，但随后遭遇行业政策调整，股价快速下跌。及时止损避免了更大损失。',
      rating: 2,
      lessons: [
        '不要在股价高位追涨',
        '政策风险需要重点关注',
        '止损纪律必须严格执行'
      ],
      nextActions: [
        '等待更好的买入时机',
        '深入研究新能源政策',
        '完善风险控制策略'
      ]
    },
    {
      id: '3',
      date: '2024-01-08',
      title: '美股科技股配置策略',
      type: 'strategy',
      profit: 23400,
      profitRate: 18.7,
      asset: '纳斯达克ETF',
      tags: ['美股', 'ETF', '分散投资'],
      content: '通过ETF分散投资美股科技股，避免了个股选择风险。在美联储加息预期缓解时增加配置，获得了不错的收益。',
      rating: 5,
      lessons: [
        'ETF投资可以有效分散风险',
        '宏观经济环境对科技股影响很大',
        '定期调整仓位配置很重要'
      ],
      nextActions: [
        '继续关注美联储政策',
        '评估科技股估值水平',
        '考虑适当获利了结'
      ]
    },
    {
      id: '4',
      date: '2024-01-05',
      title: '价值投资理念学习',
      type: 'lesson',
      profit: 0,
      profitRate: 0,
      asset: '投资理念',
      tags: ['学习', '价值投资', '巴菲特'],
      content: '重新学习了巴菲特的价值投资理念，特别是关于"护城河"概念的理解。这对我的投资决策产生了重要影响。',
      rating: 4,
      lessons: [
        '优秀企业的护城河是长期投资的关键',
        '价格和价值的区别需要深入理解',
        '长期持有优质企业比频繁交易更有效'
      ],
      nextActions: [
        '筛选具有护城河的优质企业',
        '建立长期投资组合',
        '减少短期交易频率'
      ]
    }
  ]

  // 统计数据
  const stats = {
    totalEntries: reviewEntries.length,
    successRate: (reviewEntries.filter(r => r.type === 'success').length / reviewEntries.length * 100),
    totalProfit: reviewEntries.reduce((sum, r) => sum + r.profit, 0),
    avgRating: reviewEntries.reduce((sum, r) => sum + r.rating, 0) / reviewEntries.length,
    thisMonth: reviewEntries.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failure': return <XCircle className="h-4 w-4 text-red-500" />
      case 'lesson': return <BookOpen className="h-4 w-4 text-blue-500" />
      case 'strategy': return <Target className="h-4 w-4 text-purple-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      success: 'default',
      failure: 'destructive',
      lesson: 'secondary',
      strategy: 'outline'
    } as const
    
    const labels = {
      success: '成功',
      failure: '失败',
      lesson: '学习',
      strategy: '策略'
    }
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || 'secondary'}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    )
  }

  const filteredEntries = reviewEntries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.asset.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || entry.type === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* 页面标题区域 */}
        <FadeInAnimation delay={0}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">复盘日志</h1>
              <p className="text-muted-foreground mt-2">
                记录投资经验，总结得失，持续改进
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="glass-effect">
                <Filter className="h-4 w-4 mr-2" />
                筛选
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary-hover">
                <Plus className="h-4 w-4 mr-2" />
                新建复盘
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
                    <p className="text-sm font-medium text-muted-foreground">总复盘数</p>
                    <div className="text-2xl font-bold">
                      <AnimatedCounter value={stats.totalEntries} />
                    </div>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">成功率</p>
                    <div className="text-2xl font-bold text-green-600">
                      <AnimatedCounter value={stats.successRate} suffix="%" />
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总盈亏</p>
                    <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <AnimatedCounter 
                        value={stats.totalProfit} 
                        prefix={stats.totalProfit >= 0 ? '+¥' : '-¥'} 
                        format="currency"
                      />
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">平均评分</p>
                    <div className="text-2xl font-bold text-orange-600">
                      <AnimatedCounter value={stats.avgRating} suffix="/5" decimals={1} />
                    </div>
                  </div>
                  <Star className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">本月复盘</p>
                    <div className="text-2xl font-bold">
                      <AnimatedCounter value={stats.thisMonth} />
                    </div>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
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
                      placeholder="搜索复盘记录..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      <SelectItem value="success">成功</SelectItem>
                      <SelectItem value="failure">失败</SelectItem>
                      <SelectItem value="lesson">学习</SelectItem>
                      <SelectItem value="strategy">策略</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">按日期</SelectItem>
                      <SelectItem value="profit">按盈亏</SelectItem>
                      <SelectItem value="rating">按评分</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardEnterAnimation>

        {/* 复盘记录列表 */}
        <CardEnterAnimation delay={300}>
          <div className="space-y-4">
            {filteredEntries.map((entry, index) => (
              <Card key={entry.id} className="modern-card-hover">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* 头部信息 */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(entry.type)}
                          <h3 className="text-lg font-semibold">{entry.title}</h3>
                          {getTypeBadge(entry.type)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {entry.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="h-4 w-4" />
                            {entry.asset}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {entry.rating}/5
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

                    {/* 盈亏信息 */}
                    {entry.profit !== 0 && (
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">盈亏:</span>
                          <span className={`font-semibold ${entry.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.profit >= 0 ? '+' : ''}¥{entry.profit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">收益率:</span>
                          <span className={`font-semibold ${entry.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.profitRate >= 0 ? '+' : ''}{entry.profitRate}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 标签 */}
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* 内容 */}
                    <div className="space-y-3">
                      <p className="text-sm leading-relaxed">{entry.content}</p>
                      
                      {/* 经验教训 */}
                      {entry.lessons.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">经验教训:</h4>
                          <ul className="space-y-1">
                            {entry.lessons.map((lesson, lessonIndex) => (
                              <li key={lessonIndex} className="text-sm flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{lesson}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 后续行动 */}
                      {entry.nextActions.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">后续行动:</h4>
                          <ul className="space-y-1">
                            {entry.nextActions.map((action, actionIndex) => (
                              <li key={actionIndex} className="text-sm flex items-start gap-2">
                                <span className="text-orange-500 mt-1">→</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* 评分显示 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">评分:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= entry.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardEnterAnimation>

        {/* 空状态 */}
        {filteredEntries.length === 0 && (
          <CardEnterAnimation delay={300}>
            <Card className="modern-card">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">暂无复盘记录</h3>
                <p className="text-muted-foreground mb-4">
                  开始记录您的投资复盘，积累宝贵经验
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一个复盘
                </Button>
              </CardContent>
            </Card>
          </CardEnterAnimation>
        )}
      </div>
    </PageTransition>
  )
}