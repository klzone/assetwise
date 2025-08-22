"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { fetchSinaFinanceData, formatPercent, getColorClass, type MarketData } from '@/lib/market-data'
import { 
  Search,
  Bell,
  Settings,
  User,
  Menu,
  ChevronRight,
  Filter,
  Download,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme/theme-toggle'

interface ModernHeaderProps {
  className?: string
  onMobileMenuToggle?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}


// 页面标题映射
const pageTitles: Record<string, { title: string; subtitle?: string; breadcrumb?: string[] }> = {
  '/': {
    title: '仪表盘',
    subtitle: '资产概览与数据分析',
    breadcrumb: ['首页', '仪表盘']
  },
  '/assets': {
    title: '资产管理',
    subtitle: '管理您的投资组合',
    breadcrumb: ['首页', '资产管理']
  },
  '/assets/portfolio': {
    title: '投资组合',
    subtitle: '查看投资组合详情',
    breadcrumb: ['首页', '资产管理', '投资组合']
  },
  '/transactions': {
    title: '交易记录',
    subtitle: '查看所有交易历史',
    breadcrumb: ['首页', '交易记录']
  },
  '/reviews': {
    title: '复盘日志',
    subtitle: '投资复盘与总结',
    breadcrumb: ['首页', '复盘日志']
  },
  '/reports': {
    title: '数据报告',
    subtitle: '详细的数据分析报告',
    breadcrumb: ['首页', '数据报告']
  },
  '/settings': {
    title: '设置',
    subtitle: '系统设置与个人偏好',
    breadcrumb: ['首页', '设置']
  },
}

export function ModernHeader({ className, onMobileMenuToggle, isCollapsed, onToggleCollapse }: ModernHeaderProps) {
  const pathname = usePathname()
  const pageInfo = pageTitles[pathname || '/'] || { title: '页面', breadcrumb: ['首页'] }
  
  // 市场数据状态
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)
  
  // 获取市场数据
  const fetchMarketData = async () => {
    try {
      const data = await fetchSinaFinanceData()
      setMarketData(data)
      setLastUpdateTime(new Date())
    } catch (error) {
      console.error('获取市场数据失败:', error)
    }
  }
  
  // 客户端检测
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // 初始化市场数据（移除定时更新以提升性能）
  useEffect(() => {
    if (!isClient) return
    
    // 只在初始化时获取一次数据
    fetchMarketData()
    
    // 移除定时更新，改为手动刷新
    // const interval = setInterval(fetchMarketData, 30000)
    // return () => clearInterval(interval)
  }, [isClient])
  
  // 手动刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchMarketData()
    setIsRefreshing(false)
  }

  return (
    <header className={cn(
      "sticky top-0 z-30 h-16 border-b border-border/50 glass-effect",
      "transition-all duration-300 ease-in-out",
      className
    )}>
      <div className="flex h-full items-center justify-between px-6">
        {/* 左侧区域 */}
        <div className="flex items-center gap-4">
          {/* 移动端菜单按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileMenuToggle}
            className="h-8 w-8 p-0 hover:bg-primary/10 lg:hidden touch-target"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* 实时市场信息 - 跑马灯效果 */}
          <div className="flex items-center gap-4">
            {isClient && (
              <div className="hidden lg:flex items-center gap-3">
                {/* 固定时间显示 */}
                {lastUpdateTime && (
                  <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-mono">
                      {lastUpdateTime.toLocaleTimeString('zh-CN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                )}
                
                {/* 跑马灯容器 */}
                <div className="w-96 overflow-hidden relative">
                  <div className="flex items-center gap-4 animate-marquee text-xs">
                    {marketData.concat(marketData).map((item, index) => (
                      <div
                        key={`${item.code}-${index}`}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-300 shrink-0",
                          getColorClass(item.isUp, 'bg'),
                          getColorClass(item.isUp, 'text')
                        )}
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="font-mono">{item.price.toFixed(0)}</span>
                        <div className="flex items-center gap-0.5">
                          {item.isUp ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <span>{formatPercent(item.changePercent)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 中间搜索区域 */}
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索资产、交易记录、复盘日志..."
              className="pl-10 bg-background/50 border-border/50 focus:bg-background transition-colors group-hover:border-primary/30"
            />
            
            {/* 搜索建议下拉框 */}
            <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-sm border border-border/50 rounded-md shadow-lg opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50">
              <div className="p-2">
                <div className="text-xs text-muted-foreground mb-2">快速搜索</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-primary/10 cursor-pointer">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span>苹果公司 (AAPL)</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-primary/10 cursor-pointer">
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    <span>特斯拉 (TSLA)</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-primary/10 cursor-pointer">
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <span>今日交易记录</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧操作区域 */}
        <div className="flex items-center gap-2">
          {/* 云端同步功能 */}
          <div className="hidden lg:flex items-center gap-1">
            {/* 同步状态指示器 */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-secondary/50 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-muted-foreground">已同步</span>
              </div>
              <span className="text-muted-foreground">|</span>
              <span className="text-foreground font-medium">3 项待同步</span>
            </div>
            
            {/* 云端同步按钮 */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 text-xs hover:bg-primary/10 transition-all",
                isRefreshing && "animate-spin"
              )}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {isRefreshing ? '同步中' : '同步'}
            </Button>
            
            {/* 待同步数据下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs hover:bg-primary/10 relative"
                >
                  <Download className="h-3 w-3 mr-1" />
                  待同步
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-warning">
                    3
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 glass-effect">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>待同步数据</span>
                  <Badge variant="secondary" className="text-xs">3项未同步</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-48 overflow-y-auto">
                  <DropdownMenuItem className="flex-col items-start p-3 cursor-pointer hover:bg-primary/5">
                    <div className="flex items-center gap-2 w-full">
                      <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                      <Plus className="h-3 w-3 text-primary" />
                      <span className="font-medium text-sm">新增交易记录</span>
                      <span className="text-xs text-muted-foreground ml-auto">5分钟前</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      买入 AAPL 100股，成交价 $185.32
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">交易记录</Badge>
                      <span className="text-xs text-warning">等待同步</span>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="flex-col items-start p-3 cursor-pointer hover:bg-primary/5">
                    <div className="flex items-center gap-2 w-full">
                      <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                      <Settings className="h-3 w-3 text-primary" />
                      <span className="font-medium text-sm">投资组合调整</span>
                      <span className="text-xs text-muted-foreground ml-auto">10分钟前</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      调整资产配置比例：股票70% → 65%，债券30% → 35%
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">配置调整</Badge>
                      <span className="text-xs text-warning">等待同步</span>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="flex-col items-start p-3 cursor-pointer hover:bg-primary/5">
                    <div className="flex items-center gap-2 w-full">
                      <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                      <User className="h-3 w-3 text-primary" />
                      <span className="font-medium text-sm">复盘日志更新</span>
                      <span className="text-xs text-muted-foreground ml-auto">15分钟前</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      添加了"2024年1月投资总结"复盘日志
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">复盘日志</Badge>
                      <span className="text-xs text-warning">等待同步</span>
                    </div>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="justify-center text-primary cursor-pointer"
                  onClick={() => {
                    // 执行全部同步操作
                    console.log('开始同步所有待同步数据')
                    handleRefresh()
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  同步所有数据
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 分隔线 */}
          <div className="hidden lg:block w-px h-4 bg-border/50" />

          {/* 搜索按钮（移动端） */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-primary/10 lg:hidden touch-target"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* 通知按钮 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10 relative"
              >
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-destructive">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 glass-effect">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>通知中心</span>
                <Badge variant="secondary" className="text-xs">3条新消息</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem 
                  className="flex-col items-start p-3 cursor-pointer hover:bg-primary/5"
                  onClick={() => {
                    // 跳转到资产详情页面
                    window.location.href = '/assets/AAPL'
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="font-medium text-sm">资产价格提醒</span>
                    <span className="text-xs text-muted-foreground ml-auto">2分钟前</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    您关注的股票 AAPL 价格上涨了 5.2%，当前价格 $185.32
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">价格提醒</Badge>
                    <span className="text-xs text-success">+5.2%</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="flex-col items-start p-3 cursor-pointer hover:bg-primary/5"
                  onClick={() => {
                    // 跳转到交易记录页面
                    window.location.href = '/transactions'
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <Download className="h-3 w-3 text-success" />
                    <span className="font-medium text-sm">交易完成</span>
                    <span className="text-xs text-muted-foreground ml-auto">1小时前</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    买入订单已成功执行，共购买 100 股 TSLA，成交价 $245.67
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">交易成功</Badge>
                    <span className="text-xs text-muted-foreground">订单号: #TX2024001</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="flex-col items-start p-3 cursor-pointer hover:bg-primary/5"
                  onClick={() => {
                    // 跳转到资产管理页面查看风险分析
                    window.location.href = '/assets'
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-2 w-2 rounded-full bg-warning" />
                    <TrendingDown className="h-3 w-3 text-warning" />
                    <span className="font-medium text-sm">风险提醒</span>
                    <span className="text-xs text-muted-foreground ml-auto">3小时前</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    您的投资组合风险等级已上升至中等，建议适当调整仓位配置
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="destructive" className="text-xs">风险警告</Badge>
                    <span className="text-xs text-warning">中等风险</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="flex-col items-start p-3 cursor-pointer hover:bg-primary/5"
                  onClick={() => {
                    // 跳转到复盘日志页面
                    window.location.href = '/reviews'
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <Bell className="h-3 w-3 text-blue-500" />
                    <span className="font-medium text-sm">系统通知</span>
                    <span className="text-xs text-muted-foreground ml-auto">5小时前</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    您的复盘日志"2024年1月投资总结"已收到3条评论
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">社区互动</Badge>
                    <span className="text-xs text-blue-500">3条新评论</span>
                  </div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="justify-center text-primary cursor-pointer"
                onClick={() => {
                  // 跳转到通知中心页面
                  window.location.href = '/notifications'
                }}
              >
                查看所有通知
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 主题切换 */}
          <ThemeToggle />

          {/* 用户菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-primary/10"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src="" alt="用户头像" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    用户
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-effect">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">投资达人</p>
                  <p className="text-xs text-muted-foreground">premium@example.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  个人资料
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  账户设置
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => {
                  // 这里可以添加退出登录的逻辑
                  console.log('退出登录')
                  // 例如：signOut() 或 router.push('/login')
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}