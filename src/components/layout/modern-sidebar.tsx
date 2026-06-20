"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowUpDown,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Target,
  Wallet,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const navigationItems = [
  { title: "仪表盘", href: "/", icon: LayoutDashboard },
  { title: "资产管理", href: "/assets", icon: Wallet },
  { title: "交易记录", href: "/transactions", icon: ArrowUpDown },
  { title: "投资计划", href: "/plans", icon: Target },
  { title: "复盘日志", href: "/reviews", icon: BookOpen },
  { title: "数据分析", href: "/analysis", icon: BarChart3 },
]

export function ModernSidebar({
  className,
  isMobileOpen = false,
  onMobileClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname() ?? "/"

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label="关闭导航"
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        data-sidebar
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-border bg-card transition-all duration-300",
          isCollapsed ? "lg:w-20" : "lg:w-72",
          "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className,
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[72px] min-h-[72px] items-center justify-between border-b border-border px-4">
            <Link href="/" className="flex min-w-0 items-center gap-3" onClick={onMobileClose}>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background shadow-sm">
                <Wallet className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">AssetWise</div>
                  <div className="truncate text-xs text-muted-foreground">本地投资复盘</div>
                </div>
              )}
            </Link>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="hidden h-8 w-8 p-0 lg:inline-flex"
                onClick={onToggleCollapse}
                aria-label={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 lg:hidden"
                onClick={onMobileClose}
                aria-label="关闭导航"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigationItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  title={isCollapsed ? item.title : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-smooth",
                    "text-muted-foreground hover:bg-background-secondary hover:text-foreground",
                    isActive && "bg-foreground text-background shadow-sm hover:bg-foreground hover:text-background",
                    isCollapsed && "lg:justify-center lg:px-0",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.title}</span>}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-border p-3">
            <Link
              href="/settings"
              onClick={onMobileClose}
              title={isCollapsed ? "设置" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-smooth hover:bg-background-secondary hover:text-foreground",
                pathname.startsWith("/settings") && "bg-foreground text-background shadow-sm hover:bg-foreground hover:text-background",
                isCollapsed && "lg:justify-center lg:px-0",
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>设置</span>}
            </Link>

            {!isCollapsed && (
              <div className="mt-4 rounded-md border border-border bg-background p-4">
                <div className="text-xs font-medium text-foreground">本地加密已开启</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  MVP 先保留本地安全与示例数据，云同步后续再接入。
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
