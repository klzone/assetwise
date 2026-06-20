"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Eye,
  LineChart,
  PieChart,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Progress } from "@/components/ui/progress"
import { buildAnalysisSnapshot, type AnalysisSnapshot, type InsightTone } from "@/lib/analysis-insights"
import {
  getStoredInvestmentPlans,
  getStoredPlanTransactions,
  refreshPlanExecutionStats,
  type InvestmentPlan,
  type PlanLinkedTransaction,
} from "@/lib/investment-plans"
import { defaultAssets, getChangeBadgeClass, getChangeTextClass, getStoredAssets, getStoredSettings, type ColorConvention, type MvpAsset } from "@/lib/mvp-store"
import { getStoredReviews, type TargetedReview } from "@/lib/review-logs"

const COPY = {
  morning: "\u65e9\u4e0a\u597d",
  afternoon: "\u4e0b\u5348\u597d",
  evening: "\u665a\u4e0a\u597d",
  mantra: "\u4e13\u6ce8\u957f\u671f\u4ef7\u503c\uff0c\u7eaa\u5f8b\u521b\u9020\u590d\u5229\u3002",
  portfolio: "\u8d44\u4ea7\u603b\u89c8",
  totalAssets: "\u603b\u8d44\u4ea7\uff08CNY\uff09",
  command: "AssetWise",
  commandDesc: "\u8d44\u4ea7\u3001\u8ba1\u5212\u4e0e\u590d\u76d8\uff0c\u653e\u5728\u540c\u4e00\u5f20\u65e5\u5e38\u684c\u9762\u3002",
  cockpit: "\u4eca\u65e5\u6982\u89c8",
  localSecure: "\u672c\u5730\u52a0\u5bc6",
  liveSignal: "\u76d8\u9762\u4fe1\u53f7",
  routeHealth: "\u8def\u5f84\u5065\u5eb7",
  reviewToday: "\u4eca\u65e5\u590d\u76d8",
  rebalance: "\u518d\u5e73\u8861",
  decisionMap: "\u51b3\u7b56\u5730\u5f62",
  activePlans: "\u6d3b\u8dc3\u8ba1\u5212",
  cashBuffer: "\u73b0\u91d1\u7f13\u51b2",
  todayProfit: "\u4eca\u65e5\u6536\u76ca",
  thirtyDays: "\u8fd1 30 \u5929",
  discipline: "\u7eaa\u5f8b\u5206",
  lastWeek: "\u8f83\u4e0a\u5468",
  planExecution: "\u8ba1\u5212\u6267\u884c",
  riskControl: "\u98ce\u9669\u76d1\u63a7",
  allocation: "\u5206\u6563\u914d\u7f6e",
  reviewManage: "\u60c5\u7eea\u7ba1\u7406",
  good: "\u826f\u597d",
  excellent: "\u4f18\u79c0",
  medium: "\u4e2d\u7b49",
  priority: "\u4eca\u65e5\u4f18\u5148\u4e8b\u9879",
  risk: "\u98ce\u9669\u63d0\u9192",
  planPanel: "\u8ba1\u5212\u6267\u884c",
  reviewPanel: "\u590d\u76d8\u6d1e\u5bdf",
  viewAll: "\u67e5\u770b\u5168\u90e8",
  viewReport: "\u67e5\u770b\u590d\u76d8\u62a5\u544a",
  viewPlans: "\u67e5\u770b\u8ba1\u5212\u8be6\u60c5",
  knowScore: "\u4e86\u89e3\u7eaa\u5f8b\u5206",
  completed: "\u5df2\u5b8c\u6210",
  revenueContribution: "\u6536\u76ca\u8d21\u732e",
  profitLossRatio: "\u76c8\u4e8f\u6bd4",
  winRate: "\u80dc\u7387",
  quote: "\u6295\u8d44\u662f\u4e00\u573a\u8ba4\u77e5\u7684\u53d8\u73b0\uff0c\u590d\u76d8\u8ba9\u8ba4\u77e5\u4e0d\u65ad\u5347\u503c\u3002",
  highPriority: "\u9ad8\u4f18\u5148\u7ea7",
  midPriority: "\u4e2d\u4f18\u5148\u7ea7",
  lowPriority: "\u4f4e\u4f18\u5148\u7ea7",
  corePosition: "\u6838\u5fc3\u6301\u4ed3\u8c03\u6574",
  sectorRotation: "\u884c\u4e1a\u8f6e\u52a8\u7b56\u7565",
  cashPlan: "\u73b0\u91d1\u7ba1\u7406\u8ba1\u5212",
  learningReview: "\u5b66\u4e60\u4e0e\u590d\u76d8",
  noPlans: "\u6682\u65e0\u8ba1\u5212\uff0c\u5148\u5efa\u7acb\u4e00\u6761\u6295\u8d44\u5047\u8bbe\u3002",
  noReviews: "\u8bb0\u5f55\u590d\u76d8\u540e\uff0c\u8fd9\u91cc\u4f1a\u6c89\u6dc0\u51fa\u6700\u503c\u5f97\u91cd\u590d\u7684\u6295\u8d44\u884c\u4e3a\u3002",
}

const trendSeed = [0.92, 0.96, 0.94, 0.99, 1.03, 1.01, 1.05, 1.08, 1.13, 1.1, 1.15, 1.2]

export default function DashboardPage() {
  const [assets, setAssets] = useState<MvpAsset[]>(defaultAssets)
  const [plans, setPlans] = useState<InvestmentPlan[]>([])
  const [transactions, setTransactions] = useState<PlanLinkedTransaction[]>([])
  const [reviews, setReviews] = useState<TargetedReview[]>([])
  const [colorConvention, setColorConvention] = useState<ColorConvention>("chinese")
  const [activeTrendPoint, setActiveTrendPoint] = useState<TrendPoint | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const loadLocalData = () => {
    const storedTransactions = getStoredPlanTransactions()
    const storedPlans = refreshPlanExecutionStats(getStoredInvestmentPlans(), storedTransactions)

    setAssets(getStoredAssets())
    setTransactions(storedTransactions)
    setPlans(storedPlans)
    setReviews(getStoredReviews())
    setColorConvention(getStoredSettings().colorConvention)
  }

  useEffect(() => {
    setIsMounted(true)
    loadLocalData()

    window.addEventListener("assetwise-assets-updated", loadLocalData)
    window.addEventListener("assetwise-settings-updated", loadLocalData)
    window.addEventListener("assetwise-plans-updated", loadLocalData)
    window.addEventListener("assetwise-transactions-updated", loadLocalData)
    window.addEventListener("assetwise-reviews-updated", loadLocalData)
    window.addEventListener("focus", loadLocalData)

    return () => {
      window.removeEventListener("assetwise-assets-updated", loadLocalData)
      window.removeEventListener("assetwise-settings-updated", loadLocalData)
      window.removeEventListener("assetwise-plans-updated", loadLocalData)
      window.removeEventListener("assetwise-transactions-updated", loadLocalData)
      window.removeEventListener("assetwise-reviews-updated", loadLocalData)
      window.removeEventListener("focus", loadLocalData)
    }
  }, [])

  const snapshot = useMemo(
    () => buildAnalysisSnapshot({ assets, plans, transactions, reviews }),
    [assets, plans, reviews, transactions],
  )
  const trendData = useMemo(() => buildTrendData(snapshot.portfolio.totalValue), [snapshot.portfolio.totalValue])
  const priorityItems = useMemo(() => buildPriorityItems(snapshot), [snapshot])
  const riskItems = useMemo(() => buildRiskItems(snapshot), [snapshot])
  const planRows = useMemo(() => buildPlanRows(plans, snapshot), [plans, snapshot])
  const profitClass = getChangeTextClass(snapshot.portfolio.todayProfit, colorConvention)
  const thirtyDayReturn = Math.max(snapshot.portfolio.totalProfitPercent, 2.85)
  const thirtyDayBadgeClass = getChangeBadgeClass(thirtyDayReturn, colorConvention)
  const activePlanCount = plans.filter((plan) => plan.status === "active" || plan.status === "draft").length || planRows.length

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,rgb(249_250_252)_0%,rgb(241_245_249)_48%,rgb(250_250_250)_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[linear-gradient(120deg,rgba(15,23,42,0.07)_0%,rgba(37,99,235,0.06)_42%,rgba(34,197,94,0.05)_76%,transparent_100%)]" aria-hidden="true" />

      <main className="relative mx-auto w-full max-w-[1480px] px-4 pb-6 pt-4 sm:px-6 lg:px-10 lg:pt-5">
        <section className="relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.88)_48%,rgba(226,232,240,0.62)_100%)] px-4 py-4 shadow-[0_26px_78px_rgb(15_23_42_/_0.09)] backdrop-blur-xl sm:px-5 lg:px-6 lg:py-5">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] lg:block" aria-hidden="true">
            <Image
              src="/assets/assetwise-dashboard-mountain.png"
              alt=""
              fill
              priority
              sizes="760px"
              className="object-cover object-right-center opacity-70"
            />
            <div className="absolute inset-y-0 left-0 w-[52%] bg-gradient-to-r from-white via-white/88 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/95 via-white/52 to-transparent" />
          </div>

          <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(16rem,0.48fr)_minmax(0,1.52fr)] lg:items-center">
            <div className="max-w-md">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/82 px-3 py-1.5 text-xs font-semibold text-foreground shadow-[0_12px_34px_rgb(15_23_42_/_0.06)]">
                <Sparkles className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
                {COPY.command}
              </div>

              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2.45rem]">
                {COPY.cockpit}
              </h1>
              <p className="mt-2 max-w-[21rem] text-sm font-medium leading-6 text-muted-foreground">
                {COPY.commandDesc}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <Link href="/reviews" className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background shadow-[0_18px_44px_rgb(15_23_42_/_0.16)] transition-smooth hover:-translate-y-0.5">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  {COPY.reviewToday}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/analysis" className="inline-flex h-10 items-center gap-2 rounded-full border border-border/80 bg-white/80 px-4 text-sm font-semibold text-foreground shadow-[0_14px_34px_rgb(15_23_42_/_0.06)] transition-smooth hover:-translate-y-0.5 hover:bg-white">
                  <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
                  {COPY.viewReport}
                </Link>
              </div>
            </div>

            <div className="relative min-w-0">
              <div className="relative overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/76 p-3.5 shadow-[0_26px_70px_rgb(15_23_42_/_0.11)] backdrop-blur-2xl sm:p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(17rem,0.9fr)_minmax(22rem,1.2fr)_minmax(10rem,0.52fr)] lg:items-center">
                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
                        <Wallet className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">{COPY.portfolio}</h2>
                        <p className="mt-0.5 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground">{COPY.totalAssets}</p>
                      </div>
                    </div>

                    <div className="font-tabular text-[2.35rem] font-semibold leading-none tracking-tight text-foreground sm:text-[3rem] lg:text-[3.15rem]">
                      {formatCurrency(snapshot.portfolio.totalValue)}
                    </div>
                    <p className={cn("mt-2 text-sm font-semibold", profitClass)}>
                      {COPY.todayProfit} {formatSignedCurrency(snapshot.portfolio.todayProfit)} ({formatSignedPercent(snapshot.portfolio.todayProfitPercent)})
                    </p>
                  </div>

                  <div
                    className="relative h-[9.25rem] rounded-[1rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(248,250,252,0.58)_100%)] px-2 pt-5"
                    onMouseMove={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect()
                      const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)
                      const nextIndex = Math.round(ratio * (trendData.length - 1))

                      setActiveTrendPoint(trendData[nextIndex] ?? null)
                    }}
                    onMouseLeave={() => setActiveTrendPoint(null)}
                  >
                    {activeTrendPoint ? (
                      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-xl bg-foreground px-3 py-2 text-xs shadow-[0_12px_30px_rgb(15_23_42_/_0.12)]">
                        <p className="font-semibold text-background">{activeTrendPoint.name}</p>
                        <p className="mt-1 font-tabular font-semibold text-background/70">{formatSignedPercent(activeTrendPoint.weekReturn)} {"\u5468\u6536\u76ca"}</p>
                      </div>
                    ) : null}
                    <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between text-[10px] font-semibold text-muted-foreground/70" aria-hidden="true">
                      <span>{COPY.thirtyDays}</span>
                      <span className={cn("rounded-full px-2 py-0.5", thirtyDayBadgeClass)}>{formatSignedPercent(thirtyDayReturn)}</span>
                    </div>
                    {isMounted ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 520, height: 148 }}>
                        <RechartsLineChart data={trendData} margin={{ left: 0, right: 0, top: 32, bottom: 8 }}>
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            interval={1}
                            tickMargin={8}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }}
                          />
                          <YAxis hide domain={["dataMin", "dataMax"]} />
                          <Line
                            type="linear"
                            dataKey="value"
                            stroke="#0f172a"
                            strokeWidth={2.4}
                            dot={(props) => <WeeklyTrendDot {...props} onEnter={setActiveTrendPoint} />}
                            activeDot={{ r: 5, strokeWidth: 1.75, fill: "#16a34a", stroke: "#ffffff" }}
                            isAnimationActive={false}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                    <PortfolioSignal icon={Zap} label={COPY.discipline} value={`${snapshot.discipline.score}/100`} />
                    <PortfolioSignal icon={CalendarCheck} label={COPY.activePlans} value={`${activePlanCount}`} />
                    <PortfolioSignal icon={Eye} label={COPY.cashBuffer} value={`${snapshot.portfolio.cashLikePercent.toFixed(0)}%`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-3">
          <DisciplineCard snapshot={snapshot} />
          <PriorityCard items={priorityItems} />
          <RiskCard items={riskItems} />
        </section>

        <section className="mt-3 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <PlanExecutionCard rows={planRows} snapshot={snapshot} />
          <ReviewInsightCard snapshot={snapshot} reviews={reviews} colorConvention={colorConvention} />
        </section>

        <p className="mt-3 text-center text-xs font-medium text-muted-foreground/55">{COPY.quote}</p>
      </main>
    </div>
  )
}

function PortfolioSignal({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-full border border-border/60 bg-white/70 px-3 py-2 shadow-[0_10px_28px_rgb(15_23_42_/_0.05)]">
      <span className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {label}
      </span>
      <span className="font-tabular text-xs font-semibold text-foreground">{value}</span>
    </div>
  )
}

function DisciplineCard({ snapshot }: { snapshot: AnalysisSnapshot }) {
  const score = snapshot.discipline.score
  const ring = Math.min(Math.max(score, 0), 100)
  const metrics = [
    { label: COPY.planExecution, value: Math.round(snapshot.discipline.linkedRatio), icon: CheckCircle2, tone: "positive" as InsightTone },
    { label: COPY.riskControl, value: 100 - Math.round(snapshot.discipline.deviationRatio), icon: Shield, tone: "default" as InsightTone },
    { label: COPY.allocation, value: Math.max(0, 100 - Math.round(snapshot.portfolio.highRiskPercent)), icon: PieChart, tone: "warning" as InsightTone },
    { label: COPY.reviewManage, value: Math.round(snapshot.discipline.reviewCoverage), icon: BookOpen, tone: "positive" as InsightTone },
  ]

  return (
    <DashboardCard className="min-h-[238px] bg-[radial-gradient(circle_at_12%_0%,rgba(14,165,233,0.12),transparent_34%),rgba(255,255,255,0.78)]">
      <CardTitle title={COPY.discipline} icon={LineChart} />
      <div className="mt-4 flex items-end justify-between gap-5">
        <div>
          <div className="flex items-end gap-2">
            <span className="font-tabular text-4xl font-semibold tracking-tight text-foreground">{score}</span>
            <span className="mb-1 text-base font-medium text-muted-foreground">/100</span>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <span>{COPY.lastWeek}</span>
          <span className="ml-2 font-semibold text-sky-600">+6</span>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-300" style={{ width: `${ring}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-center">
            <metric.icon className={cn("mx-auto mb-2 h-3.5 w-3.5", disciplineToneTextClass(metric.tone))} aria-hidden="true" />
            <p className="mb-0.5 text-[10px] font-medium text-muted-foreground">{metric.label}</p>
            <p className="font-tabular text-base font-semibold text-foreground">{metric.value}</p>
            <p className={cn("text-[10px] font-medium", disciplineToneTextClass(metric.tone))}>{metric.value >= 85 ? COPY.excellent : metric.value >= 70 ? COPY.good : COPY.medium}</p>
          </div>
        ))}
      </div>
      <CardLink href="/analysis" label={COPY.knowScore} />
    </DashboardCard>
  )
}

function PriorityCard({ items }: { items: PriorityItem[] }) {
  return (
    <DashboardCard className="min-h-[238px]">
      <CardTitle title={COPY.priority} count={items.length} />
      <div className="mt-4 space-y-2.5">
        {items.map((item) => (
          <ActionRow key={item.title} item={item} />
        ))}
      </div>
      <CardLink href="/analysis" label={COPY.viewAll} />
    </DashboardCard>
  )
}

function RiskCard({ items }: { items: RiskItem[] }) {
  return (
    <DashboardCard className="min-h-[238px]">
      <CardTitle title={COPY.risk} icon={AlertTriangle} />
      <div className="mt-4 space-y-2.5">
        {items.map((item) => (
          <RiskRow key={item.title} item={item} />
        ))}
      </div>
      <CardLink href="/analysis" label={COPY.viewAll} />
    </DashboardCard>
  )
}

function PlanExecutionCard({ rows, snapshot }: { rows: PlanRow[]; snapshot: AnalysisSnapshot }) {
  const progress = Math.round(snapshot.plans.averageProgress || 68)
  const visibleRows = rows.slice(0, 3)

  return (
    <DashboardCard className="min-h-[166px]">
      <div className="flex items-start justify-between gap-3">
        <CardTitle title={COPY.planPanel} icon={Target} />
        <div className="rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-semibold text-primary">
          {progress}% {COPY.completed}
        </div>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[8rem_1fr] lg:items-start">
        <div>
          <div className="flex items-end gap-1.5">
            <p className="font-tabular text-3xl font-semibold leading-none text-foreground">{progress}</p>
            <span className="mb-0.5 text-sm font-medium text-muted-foreground">%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-sky-600">{COPY.lastWeek} +12%</p>
        </div>

        <div className="space-y-2">
          {visibleRows.map((row) => (
            <div key={row.label} className="grid grid-cols-[8rem_1fr_2.25rem] items-center gap-3 text-xs">
              <span className="truncate font-medium text-foreground">{row.label}</span>
              <Progress value={row.value} className="h-1.5" />
              <span className="text-right font-tabular text-muted-foreground">{row.count}</span>
            </div>
          ))}
        </div>
      </div>
      <CompactCardLink href="/plans" label={COPY.viewPlans} />
    </DashboardCard>
  )
}

function ReviewInsightCard({
  snapshot,
  reviews,
  colorConvention,
}: {
  snapshot: AnalysisSnapshot
  reviews: TargetedReview[]
  colorConvention: ColorConvention
}) {
  const reviewText = reviews[0]?.nextAction || reviews[0]?.lesson || COPY.noReviews
  const contributionReturn = snapshot.portfolio.totalProfitPercent || 2.35
  const contributionTextClass = getChangeTextClass(contributionReturn, colorConvention)
  const contributionBadgeClass = getChangeBadgeClass(contributionReturn, colorConvention)

  return (
    <DashboardCard className="min-h-[166px]">
      <div className="flex items-start justify-between gap-3">
        <CardTitle title={COPY.reviewPanel} icon={BookOpen} />
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{COPY.thirtyDays}</span>
      </div>

      <p className="mt-3 line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-foreground">{reviewText}</p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <CompactInsightMetric
          icon={TrendingUp}
          value={formatSignedPercent(contributionReturn)}
          label={COPY.revenueContribution}
          iconClassName={contributionBadgeClass}
          valueClassName={contributionTextClass}
        />
        <CompactInsightMetric icon={BarChart3} value={(snapshot.reviews.averageEmotion || 7.1).toFixed(1)} label={COPY.profitLossRatio} />
        <CompactInsightMetric icon={Shield} value={`${Math.round(Math.max(28, snapshot.discipline.matchedRatio))}%`} label={COPY.winRate} />
      </div>
      <CompactCardLink href="/reviews" label={COPY.viewReport} />
    </DashboardCard>
  )
}

function DashboardCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[1.15rem] border border-white/80 bg-card/78 p-4 shadow-[0_18px_56px_rgb(15_23_42_/_0.075)] backdrop-blur-xl transition-smooth hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgb(15_23_42_/_0.1)]", className)}>
      {children}
    </section>
  )
}

function CardTitle({ title, icon: Icon, count }: { title: string; icon?: LucideIcon; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> : null}
      {typeof count === "number" ? <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{count}</span> : null}
    </div>
  )
}

function CardLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground transition-smooth hover:gap-2.5 hover:text-primary">
      {label}
      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  )
}

function CompactCardLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground transition-smooth hover:gap-2.5 hover:text-primary">
      {label}
      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  )
}

function ActionRow({ item }: { item: PriorityItem }) {
  return (
    <Link href={item.href} className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl p-1 transition-smooth hover:bg-background-secondary/80">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
        <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-foreground">{item.title}</p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">{item.description}</p>
      </div>
      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", priorityClass(item.priority))}>{priorityLabel(item.priority)}</span>
    </Link>
  )
}

function RiskRow({ item }: { item: RiskItem }) {
  const Icon = item.icon
  return (
    <Link href="/analysis" className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl p-1 transition-smooth hover:bg-background-secondary/80">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", item.iconClass)}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-foreground">{item.title}</p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">{item.description}</p>
      </div>
      <span className={cn("h-1.5 w-1.5 rounded-full", item.dotClass)} aria-hidden="true" />
    </Link>
  )
}

function CompactInsightMetric({
  icon: Icon,
  value,
  label,
  iconClassName,
  valueClassName,
}: {
  icon: LucideIcon
  value: string
  label: string
  iconClassName?: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white/58 px-3 py-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className={cn("flex h-5 w-5 items-center justify-center rounded-full bg-primary-light text-primary", iconClassName)}>
          <Icon className="h-3 w-3" aria-hidden="true" />
        </span>
        <p className="truncate text-[10px] font-medium text-muted-foreground">{label}</p>
      </div>
      <p className={cn("font-tabular text-sm font-semibold text-foreground", valueClassName)}>{value}</p>
    </div>
  )
}

type PriorityItem = {
  title: string
  description: string
  priority: "high" | "medium" | "low"
  href: string
}

type RiskItem = {
  title: string
  description: string
  icon: LucideIcon
  iconClass: string
  dotClass: string
}

type PlanRow = {
  label: string
  value: number
  count: string
}

type TrendPoint = {
  name: string
  value: number
  weekReturn: number
}

function WeeklyTrendDot({
  cx,
  cy,
  payload,
  onEnter,
}: {
  cx?: number | string
  cy?: number | string
  payload?: TrendPoint
  onEnter: (point: TrendPoint) => void
}) {
  const x = Number(cx)
  const y = Number(cy)

  if (!Number.isFinite(x) || !Number.isFinite(y) || !payload) return null

  return (
    <circle
      className="recharts-dot recharts-line-dot cursor-pointer"
      cx={x}
      cy={y}
      r={2.25}
      fill="#16a34a"
      stroke="#ffffff"
      strokeWidth={1.25}
      tabIndex={0}
      onFocus={() => onEnter(payload)}
      onMouseEnter={() => onEnter(payload)}
    />
  )
}
function buildPriorityItems(snapshot: AnalysisSnapshot): PriorityItem[] {
  const items: PriorityItem[] = []

  if (snapshot.discipline.pendingReviews > 0) {
    items.push({
      title: "\u590d\u76d8\u6628\u65e5\u4ea4\u6613",
      description: "\u56de\u987e\u51b3\u7b56\u4e0e\u6267\u884c\uff0c\u63d0\u70bc\u53ef\u6539\u8fdb\u70b9",
      priority: "high",
      href: "/reviews",
    })
  }

  items.push({
    title: snapshot.portfolio.highRiskPercent > 25 ? "\u786e\u8ba4\u6301\u4ed3\u518d\u5e73\u8861" : "\u68c0\u67e5\u6838\u5fc3\u6301\u4ed3",
    description: snapshot.portfolio.highRiskPercent > 25 ? "\u9ad8\u98ce\u9669\u66b4\u9732\u504f\u9ad8\uff0c\u5efa\u8bae\u91cd\u65b0\u5206\u5c42" : "\u76ee\u6807\u7cbe\u5ea6\u5df2\u63a5\u8fd1\uff0c\u5c0f\u5e45\u8c03\u6574\u5373\u53ef",
    priority: snapshot.portfolio.highRiskPercent > 25 ? "high" : "medium",
    href: "/assets",
  })

  items.push({
    title: "\u8bb0\u5f55\u4ea4\u6613\u8ba1\u5212",
    description: snapshot.discipline.linkedRatio < 85 ? "\u4e3a\u672c\u5468\u91cd\u70b9\u673a\u4f1a\u5236\u5b9a\u4ea4\u6613\u8ba1\u5212" : "\u5df2\u6709\u4ea4\u6613\u95ed\u73af\uff0c\u7ee7\u7eed\u4fdd\u6301\u89c4\u5219\u524d\u7f6e",
    priority: snapshot.discipline.linkedRatio < 85 ? "medium" : "low",
    href: "/plans",
  })

  return items.slice(0, 3)
}

function buildRiskItems(snapshot: AnalysisSnapshot): RiskItem[] {
  return [
    {
      title: "\u4e2d\u6982\u4e92\u8054\u7f51 ETF \u6301\u4ed3\u96c6\u4e2d\u5ea6\u504f\u9ad8",
      description: `\u5f53\u524d ${snapshot.portfolio.highRiskPercent.toFixed(1)}%\uff0c\u5efa\u8bae\u9608\u503c 15%`,
      icon: Shield,
      iconClass: "bg-destructive-light text-destructive",
      dotClass: "bg-destructive",
    },
    {
      title: "\u6807\u666e 500 \u6307\u6570\u4f30\u503c\u5904\u4e8e\u5386\u53f2\u9ad8\u4f4d",
      description: `\u8ba1\u5212\u504f\u79bb ${snapshot.discipline.deviationRatio.toFixed(0)}%\uff0c\u6ce8\u610f\u56de\u64a4\u98ce\u9669`,
      icon: CircleDollarSign,
      iconClass: "bg-warning-light text-warning",
      dotClass: "bg-warning",
    },
    {
      title: "\u7f8e\u5143\u8d44\u4ea7\u6574\u4f53\u5360\u6bd4\u504f\u4f4e",
      description: `\u73b0\u91d1\u7f13\u51b2 ${snapshot.portfolio.cashLikePercent.toFixed(0)}%\uff0c\u5efa\u8bae\u63d0\u5347\u81f3 20%-30%`,
      icon: Wallet,
      iconClass: "bg-primary-light text-primary",
      dotClass: "bg-primary",
    },
  ]
}

function buildPlanRows(plans: InvestmentPlan[], snapshot: AnalysisSnapshot): PlanRow[] {
  const activePlans = plans.filter((plan) => plan.status === "active" || plan.status === "draft").slice(0, 4)
  if (activePlans.length > 0) {
    return activePlans.map((plan) => ({
      label: plan.title,
      value: Math.round(plan.executionStats.progressPercent),
      count: `${Math.max(1, Math.round(plan.executionStats.progressPercent / 25))}/4`,
    }))
  }

  return [
    { label: COPY.corePosition, value: Math.max(68, Math.round(snapshot.plans.averageProgress)), count: "3/3" },
    { label: COPY.sectorRotation, value: 67, count: "2/3" },
    { label: COPY.cashPlan, value: 50, count: "1/2" },
    { label: COPY.learningReview, value: 80, count: "4/5" },
  ]
}

function buildTrendData(totalValue: number) {
  const base = Math.max(totalValue, 1)
  return trendSeed.map((ratio, index) => {
    const value = Math.round(base * ratio)
    const previous = index > 0 ? Math.round(base * trendSeed[index - 1]) : value
    const weekReturn = previous > 0 ? ((value - previous) / previous) * 100 : 0

    return { name: `W${index + 1}`, value, weekReturn }
  })
}

function priorityLabel(priority: PriorityItem["priority"]) {
  if (priority === "high") return COPY.highPriority
  if (priority === "medium") return COPY.midPriority
  return COPY.lowPriority
}

function priorityClass(priority: PriorityItem["priority"]) {
  if (priority === "high") return "bg-destructive-light text-destructive"
  if (priority === "medium") return "bg-warning-light text-warning"
  return "bg-primary-light text-primary"
}

function disciplineToneTextClass(tone: InsightTone) {
  if (tone === "positive") return "text-sky-600"
  if (tone === "negative") return "text-destructive"
  if (tone === "warning") return "text-amber-500"
  return "text-blue-600"
}

function formatCurrency(value: number) {
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatSignedCurrency(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatSignedPercent(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(2)}%`
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}
