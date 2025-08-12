"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowUpDown, 
  BookOpen, 
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  PieChart,
  BarChart3,
  Target,
  Bell,
  User,
  LogOut,
  Home,
  CreditCard,
  FileText,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  className?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    title: '仪表盘',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: '资产管理',
    href: '/assets',
    icon: Wallet,
    children: [
      { title: '资产概览', href: '/assets', icon: PieChart },
      { title: '投资组合', href: '/assets/portfolio', icon: Target },
      { title: '资产分析', href: '/assets/analysis', icon: BarChart3 },
    ]
  },
  {
    title: '交易记录',
    href: '/transactions',
    icon: ArrowUpDown,
    badge: '新',
  },
  {
    title: '复盘日志',
    href: '/reviews',
    icon: BookOpen,
  },
  {
    title: '投资计划',
    href: '/plans',
    icon: Target,
  },
  {
    title: '数据报告',
    href: '/reports',
    icon: TrendingUp,
    children: [
      { title: '收益报告', href: '/reports/profit', icon: TrendingUp },
      { title: '风险分析', href: '/reports/risk', icon: Target },
    ]
  },
]

const bottomNavItems: NavItem[] = [
  {
    title: '设置',
    href: '/settings',
    icon: Settings,
  },
]

export function ModernSidebar({ 
  className, 
  isMobileOpen = false, 
  onMobileClose,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  
  // 使用外部传入的状态，如果没有则使用内部状态
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed

  // 检测移动端设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setIsCollapsed(false) // 移动端不使用折叠模式
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 移动端路由变化时自动关闭侧边栏
  useEffect(() => {
    if (isMobile && onMobileClose) {
      onMobileClose()
    }
  }, [pathname, isMobile, onMobileClose])

  const toggleCollapse = () => {
    if (isMobile) {
      // 移动端点击切换按钮关闭侧边栏
      onMobileClose?.()
    } else {
      // 桌面端切换折叠状态
      if (onToggleCollapse) {
        onToggleCollapse()
      } else {
        setInternalIsCollapsed(!internalIsCollapsed)
      }
      if (!isCollapsed) {
        setExpandedItems([])
      }
    }
  }

  const toggleExpanded = (href: string) => {
    if (isCollapsed) return
    
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    )
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const isExpanded = (href: string) => expandedItems.includes(href)

  return (
    <div>
        {/* 移动端遮罩层 */}
        {isMobile && isMobileOpen && (
          <div 
            className="mobile-menu-overlay fixed inset-0 z-40 bg-black/20 lg:hidden"
            onClick={onMobileClose}
          />
        )}
        
        {/* 侧边栏容器 */}
        <div 
          data-sidebar
          className={cn(
            "fixed left-0 top-0 z-50 h-screen transition-all duration-300 ease-in-out",
            // 桌面端样式
            "lg:z-40",
            !isMobile && (isCollapsed ? "w-16" : "w-72"),
            // 移动端样式
            isMobile && "w-72",
            isMobile && (isMobileOpen ? "translate-x-0" : "-translate-x-full"),
            className
          )}
        >
        {/* 侧边栏主体 */}
        <div className="flex h-full flex-col glass-effect border-r border-border/50 bg-card/95 backdrop-blur-xl">
          {/* 顶部Logo区域 */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gradient-primary">AssetWise</h1>
                  <p className="text-xs text-muted-foreground">智能资产管理</p>
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="h-8 w-8 p-0 hover:bg-primary/10 touch-target"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>


          {/* 导航菜单 */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {navigationItems.map((item) => (
              <div key={item.href}>
                <NavItemComponent
                  item={item}
                  isCollapsed={isCollapsed}
                  isActive={isActive(item.href)}
                  isExpanded={isExpanded(item.href)}
                  onToggleExpanded={() => toggleExpanded(item.href)}
                />
                
                {/* 子菜单 */}
                {item.children && isExpanded(item.href) && !isCollapsed && (
                  <div className="ml-4 mt-2 space-y-1 border-l border-border/30 pl-4">
                    {item.children.map((child) => (
                      <NavItemComponent
                        key={child.href}
                        item={child}
                        isCollapsed={false}
                        isActive={isActive(child.href)}
                        isChild
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* 底部区域 */}
          <div className="p-4 border-t border-border/50 space-y-2">
            {/* 底部导航 */}
            {bottomNavItems.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                isActive={isActive(item.href)}
              />
            ))}
            
            {/* 退出登录 */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 touch-target",
                isCollapsed ? "px-2" : "px-3"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-3">退出登录</span>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface NavItemComponentProps {
  item: NavItem
  isCollapsed: boolean
  isActive: boolean
  isExpanded?: boolean
  isChild?: boolean
  onToggleExpanded?: () => void
}

function NavItemComponent({ 
  item, 
  isCollapsed, 
  isActive, 
  isExpanded, 
  isChild = false,
  onToggleExpanded 
}: NavItemComponentProps) {
  const hasChildren = item.children && item.children.length > 0

  const content = (
    <div className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 touch-target",
      "hover:bg-secondary/80 hover:text-secondary-foreground",
      isActive && "bg-primary text-primary-foreground shadow-sm",
      isCollapsed && "justify-center px-2",
      isChild && "text-xs py-2"
    )}>
      <item.icon className={cn("h-4 w-4 flex-shrink-0", isChild && "h-3 w-3")} />
      
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{item.title}</span>
          
          {/* 徽章 */}
          {item.badge && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {item.badge}
            </Badge>
          )}
          
          {/* 展开箭头 */}
          {hasChildren && (
            <ChevronRight className={cn(
              "h-3 w-3 transition-transform duration-200",
              isExpanded && "rotate-90"
            )} />
          )}
        </>
      )}
    </div>
  )

  // 收缩状态下显示title属性作为悬停提示
  const linkProps = isCollapsed && !isChild ? { title: item.title } : {}

  if (hasChildren && !isCollapsed) {
    return (
      <button
        onClick={onToggleExpanded}
        className="w-full text-left"
        {...linkProps}
      >
        {content}
      </button>
    )
  }

  return (
    <Link href={item.href} className="block" {...linkProps}>
      {content}
    </Link>
  )
}
