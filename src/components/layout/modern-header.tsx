"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowUpDown,
  BarChart3,
  BookOpen,
  CalendarDays,
  Home,
  Lock,
  Menu,
  PieChart,
  Search,
  Settings,
  Sun,
  Target,
  Wallet,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const COPY = {
  dashboard: "\u4eea\u8868\u76d8",
  assets: "\u8d44\u4ea7",
  transactions: "\u4ea4\u6613",
  plans: "\u8ba1\u5212",
  reviews: "\u590d\u76d8",
  analysis: "\u5206\u6790",
  settings: "\u8bbe\u7f6e",
  localMode: "\u672c\u5730\u6a21\u5f0f",
  openNav: "\u6253\u5f00\u5bfc\u822a",
  closeNav: "\u5173\u95ed\u5bfc\u822a",
  mainNav: "\u4e3b\u5bfc\u822a",
  home: "AssetWise \u9996\u9875",
  search: "\u641c\u7d22",
  display: "\u663e\u793a\u6a21\u5f0f",
}

type NavigationItem = {
  title: string
  href: string
  icon: LucideIcon
}

const navigationItems: NavigationItem[] = [
  { title: COPY.dashboard, href: "/", icon: Home },
  { title: COPY.assets, href: "/assets", icon: PieChart },
  { title: COPY.transactions, href: "/transactions", icon: ArrowUpDown },
  { title: COPY.plans, href: "/plans", icon: Target },
  { title: COPY.reviews, href: "/reviews", icon: BookOpen },
  { title: COPY.analysis, href: "/analysis", icon: BarChart3 },
]

export function ModernHeader({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/"
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const today = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date())

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-border/80 bg-background/88 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/78",
          className,
        )}
      >
        <div className="relative mx-auto grid min-h-16 w-full max-w-[1720px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-9">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-xl p-0 lg:hidden"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? COPY.closeNav : COPY.openNav}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>

            <nav aria-label={COPY.mainNav} className="hidden min-w-0 items-center gap-1 rounded-full border border-border/70 bg-card/72 p-1 shadow-[0_10px_30px_rgb(9_9_11_/_0.04)] lg:flex">
              {navigationItems.map((item) => (
                <TopNavItem key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>
          </div>

          <Link href="/" className="group flex items-center justify-center" aria-label={COPY.home}>
            <span className="text-lg font-semibold tracking-tight text-foreground transition-smooth group-hover:tracking-normal sm:text-xl">
              AssetWise
            </span>
          </Link>

          <div className="flex min-w-0 items-center justify-end gap-2">
            <div className="hidden items-center gap-2 rounded-full bg-card/72 px-3 py-1.5 text-xs font-medium text-foreground shadow-[0_10px_30px_rgb(9_9_11_/_0.04)] md:flex">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              {today}
            </div>

            <div className="hidden items-center gap-2 rounded-full bg-card/72 px-3 py-1.5 text-xs font-medium text-foreground shadow-[0_10px_30px_rgb(9_9_11_/_0.04)] lg:flex">
              <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_0_4px_rgb(34_197_94_/_0.10)]" aria-hidden="true" />
              {COPY.localMode}
              <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            </div>

            <HeaderIconButton label={COPY.search} icon={Search} />
            <Link href="/settings" aria-label={COPY.settings} title={COPY.settings}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card/72 text-foreground shadow-[0_10px_30px_rgb(9_9_11_/_0.04)] transition-smooth hover:-translate-y-0.5 hover:bg-background-secondary">
                <Settings className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
            <HeaderIconButton label={COPY.display} icon={Sun} />
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="border-t border-border/80 bg-card/95 px-4 py-2.5 shadow-sm lg:hidden">
            <nav aria-label={COPY.mainNav} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {navigationItems.map((item) => (
                <MobileNavItem key={item.href} item={item} pathname={pathname} onNavigate={() => setIsMobileMenuOpen(false)} />
              ))}
            </nav>
          </div>
        ) : null}
      </header>
    </>
  )
}

function HeaderIconButton({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="hidden h-9 w-9 items-center justify-center rounded-full bg-card/72 text-foreground shadow-[0_10px_30px_rgb(9_9_11_/_0.04)] transition-smooth hover:-translate-y-0.5 hover:bg-background-secondary sm:flex"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

function TopNavItem({ item, pathname }: { item: NavigationItem; pathname: string }) {
  const Icon = item.icon
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      className={cn(
        "group inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted-foreground transition-smooth hover:bg-background-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isActive && "bg-foreground text-background shadow-[0_12px_28px_rgb(9_9_11_/_0.12)] hover:bg-foreground hover:text-background",
      )}
      aria-label={item.title}
      aria-current={isActive ? "page" : undefined}
      title={item.title}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
      <span className="whitespace-nowrap">{item.title}</span>
    </Link>
  )
}

function MobileNavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavigationItem
  pathname: string
  onNavigate: () => void
}) {
  const Icon = item.icon
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background text-xs text-muted-foreground transition-smooth hover:border-border-hover hover:bg-background-secondary hover:text-foreground",
        isActive && "border-foreground bg-foreground text-background hover:bg-foreground hover:text-background",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{item.title}</span>
    </Link>
  )
}
