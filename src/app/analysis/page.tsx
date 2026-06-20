"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  LineChart,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MetricCard, PageHeader, PageShell, SectionPanel } from "@/components/ui/workspace"
import {
  buildAnalysisSnapshot,
  getRuleCheckText,
  type AnalysisSnapshot,
  type InsightTone,
} from "@/lib/analysis-insights"
import {
  getStoredInvestmentPlans,
  getStoredPlanTransactions,
  refreshPlanExecutionStats,
  type InvestmentPlan,
  type PlanLinkedTransaction,
  type PlanRuleCheck,
} from "@/lib/investment-plans"
import { defaultAssets, getChangeTextClass, getStoredAssets, getStoredSettings, type ColorConvention, type MvpAsset } from "@/lib/mvp-store"
import { getStoredReviews, type TargetedReview } from "@/lib/review-logs"

export default function AnalysisPage() {
  const [assets, setAssets] = useState<MvpAsset[]>(defaultAssets)
  const [plans, setPlans] = useState<InvestmentPlan[]>([])
  const [transactions, setTransactions] = useState<PlanLinkedTransaction[]>([])
  const [reviews, setReviews] = useState<TargetedReview[]>([])
  const [colorConvention, setColorConvention] = useState<ColorConvention>("chinese")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadData = () => {
    const storedTransactions = getStoredPlanTransactions()
    const storedPlans = refreshPlanExecutionStats(getStoredInvestmentPlans(), storedTransactions)

    setAssets(getStoredAssets())
    setTransactions(storedTransactions)
    setPlans(storedPlans)
    setReviews(getStoredReviews())
    setColorConvention(getStoredSettings().colorConvention)
  }

  useEffect(() => {
    loadData()
    window.addEventListener("assetwise-assets-updated", loadData)
    window.addEventListener("assetwise-plans-updated", loadData)
    window.addEventListener("assetwise-transactions-updated", loadData)
    window.addEventListener("assetwise-reviews-updated", loadData)
    window.addEventListener("assetwise-settings-updated", loadData)
    window.addEventListener("focus", loadData)
    return () => {
      window.removeEventListener("assetwise-assets-updated", loadData)
      window.removeEventListener("assetwise-plans-updated", loadData)
      window.removeEventListener("assetwise-transactions-updated", loadData)
      window.removeEventListener("assetwise-reviews-updated", loadData)
      window.removeEventListener("assetwise-settings-updated", loadData)
      window.removeEventListener("focus", loadData)
    }
  }, [])

  const snapshot = useMemo(
    () => buildAnalysisSnapshot({ assets, plans, transactions, reviews }),
    [assets, plans, reviews, transactions],
  )
  const totalProfitClass = getChangeTextClass(snapshot.portfolio.totalProfit, colorConvention)

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData()
    window.setTimeout(() => setIsRefreshing(false), 450)
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Analysis"
        title="数据分析"
        description="聚合资产、交易、投资计划和复盘日志，观察收益、纪律、情绪和风险暴露，形成下一步可执行建议。"
        actions={
          <Button variant="outline" className="gap-2" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            刷新分析
          </Button>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          title="纪律评分"
          value={`${snapshot.discipline.score}`}
          detail="计划关联、规则符合、复盘覆盖综合评分"
          tone={snapshot.discipline.score >= 80 ? "positive" : snapshot.discipline.score >= 60 ? "warning" : "negative"}
          icon={ShieldCheck}
        />
        <MetricCard
          title="累计收益率"
          value={`${withSign(snapshot.portfolio.totalProfitPercent)}%`}
          detail={`${withCurrency(snapshot.portfolio.totalProfit)} 累计收益`}
          valueClassName={totalProfitClass}
          iconClassName={totalProfitClass}
          icon={snapshot.portfolio.totalProfit >= 0 ? TrendingUp : TrendingDown}
        />
        <MetricCard
          title="计划内交易"
          value={`${snapshot.discipline.linkedRatio.toFixed(0)}%`}
          detail={`${snapshot.discipline.linkedTransactions} / ${snapshot.transactions.total} 笔已关联计划`}
          tone={snapshot.discipline.linkedRatio >= 80 ? "positive" : "warning"}
          icon={Target}
        />
        <MetricCard
          title="复盘覆盖"
          value={`${snapshot.discipline.reviewCoverage.toFixed(0)}%`}
          detail={`${snapshot.discipline.reviewedTransactions} 笔交易已进入复盘`}
          tone={snapshot.discipline.reviewCoverage >= 80 ? "positive" : "warning"}
          icon={ClipboardCheck}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <PortfolioPanel snapshot={snapshot} colorConvention={colorConvention} />
        <ExecutionPanel snapshot={snapshot} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <PlanPanel snapshot={snapshot} />
        <ReviewPanel snapshot={snapshot} />
      </section>

      <RecommendationPanel snapshot={snapshot} />
    </PageShell>
  )
}

function PortfolioPanel({ snapshot, colorConvention }: { snapshot: AnalysisSnapshot; colorConvention: ColorConvention }) {
  const todayProfitClass = getChangeTextClass(snapshot.portfolio.todayProfit, colorConvention)

  return (
    <SectionPanel
      eyebrow="Portfolio"
      title="组合结构与收益"
      action={<LineChart className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <MiniStat
          title="总市值"
          value={formatCurrency(snapshot.portfolio.totalValue)}
          detail={`成本 ${formatCurrency(snapshot.portfolio.totalCost)}`}
        />
        <MiniStat
          title="今日收益"
          value={`${withCurrency(snapshot.portfolio.todayProfit)}`}
          detail={`${withSign(snapshot.portfolio.todayProfitPercent)}%`}
          valueClassName={todayProfitClass}
        />
        <MiniStat
          title="高风险暴露"
          value={`${snapshot.portfolio.highRiskPercent.toFixed(0)}%`}
          detail={`现金/防御 ${snapshot.portfolio.cashLikePercent.toFixed(0)}%`}
          tone={snapshot.portfolio.highRiskPercent > 35 ? "warning" : "default"}
        />
      </div>

      <div className="space-y-3">
        {snapshot.portfolio.allocation.map((item) => (
          <BarRow
            key={item.name}
            label={item.name}
            value={item.value}
            valueLabel={`${item.value.toFixed(1)}%`}
            detail={formatCurrency(item.amount)}
            tone="default"
          />
        ))}
      </div>
    </SectionPanel>
  )
}

function ExecutionPanel({ snapshot }: { snapshot: AnalysisSnapshot }) {
  const ruleRows: Array<{ status: PlanRuleCheck; value: number; tone: InsightTone }> = [
    { status: "matched", value: snapshot.transactions.byRuleCheck.matched, tone: "positive" },
    { status: "warning", value: snapshot.transactions.byRuleCheck.warning, tone: "warning" },
    { status: "violated", value: snapshot.transactions.byRuleCheck.violated, tone: "negative" },
    { status: "not_checked", value: snapshot.transactions.byRuleCheck.not_checked, tone: "default" },
  ]

  return (
    <SectionPanel
      eyebrow="Execution"
      title="交易纪律"
      action={<CheckCircle2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <MiniStat title="交易笔数" value={snapshot.transactions.total} detail={`均值 ${formatCurrency(snapshot.transactions.averageAmount)}`} />
        <MiniStat title="买入金额" value={formatCurrency(snapshot.transactions.buyAmount)} tone="positive" />
        <MiniStat title="卖出金额" value={formatCurrency(snapshot.transactions.sellAmount)} tone="negative" />
      </div>

      <div className="space-y-3">
        {ruleRows.map((row) => (
          <BarRow
            key={row.status}
            label={getRuleCheckText(row.status)}
            value={snapshot.transactions.total > 0 ? (row.value / snapshot.transactions.total) * 100 : 0}
            valueLabel={`${row.value} 笔`}
            detail={`${(snapshot.transactions.total > 0 ? (row.value / snapshot.transactions.total) * 100 : 0).toFixed(0)}%`}
            tone={row.tone}
          />
        ))}
      </div>

      <div className="mt-5">
        <p className="label-tiny mb-4">高频交易标的</p>
        <div className="grid gap-3">
          {snapshot.transactions.topAssets.length > 0 ? (
            snapshot.transactions.topAssets.map((asset) => (
              <div key={asset.symbol || asset.name} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{asset.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{asset.symbol || "未填代码"} · {asset.count} 笔</p>
                </div>
                <p className="font-tabular text-sm text-foreground">{formatCurrency(asset.amount)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">暂无交易记录。</p>
          )}
        </div>
      </div>
    </SectionPanel>
  )
}

function PlanPanel({ snapshot }: { snapshot: AnalysisSnapshot }) {
  return (
    <SectionPanel
      eyebrow="Plans"
      title="计划执行质量"
      action={<Target className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <MiniStat title="计划总数" value={snapshot.plans.total} detail={`${snapshot.plans.active} 个执行中`} />
        <MiniStat title="平均进度" value={`${snapshot.plans.averageProgress.toFixed(0)}%`} />
        <MiniStat
          title="待复盘线索"
          value={snapshot.discipline.pendingReviews}
          tone={snapshot.discipline.pendingReviews > 0 ? "warning" : "positive"}
        />
      </div>

      <div className="space-y-3">
        {snapshot.plans.typeBreakdown.length > 0 ? (
          snapshot.plans.typeBreakdown.map((item) => (
            <BarRow
              key={item.type}
              label={item.label}
              value={item.progress}
              valueLabel={`${item.progress.toFixed(0)}%`}
              detail={`${item.count} 个计划 · ${item.deviations} 次偏离/说明`}
              tone={item.deviations > 0 ? "warning" : "default"}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">暂无投资计划。</p>
        )}
      </div>
    </SectionPanel>
  )
}

function ReviewPanel({ snapshot }: { snapshot: AnalysisSnapshot }) {
  return (
    <SectionPanel
      eyebrow="Reviews"
      title="复盘与情绪"
      action={<Brain className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <MiniStat title="复盘数量" value={snapshot.reviews.total} detail={`${snapshot.reviews.effective} 条有效结论`} />
        <MiniStat
          title="平均情绪"
          value={`${snapshot.reviews.averageEmotion.toFixed(1)}/10`}
          tone={snapshot.reviews.averageEmotion < 5 && snapshot.reviews.averageEmotion > 0 ? "warning" : "default"}
        />
        <MiniStat
          title="待修正结论"
          value={snapshot.reviews.needsFix}
          tone={snapshot.reviews.needsFix > 0 ? "warning" : "positive"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="label-tiny mb-4">情绪评分走势</p>
          <div className="flex h-36 items-end gap-2 rounded-xl border border-border bg-background p-3" aria-label="情绪评分走势，满分 10 分">
            {snapshot.reviews.emotionTrend.length > 0 ? (
              snapshot.reviews.emotionTrend.map((point) => (
                <div key={`${point.date}-${point.title}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-md bg-foreground"
                    style={{ height: `${Math.max(8, point.score * 10)}%` }}
                    title={`${point.date} ${point.score}/10 ${point.title}`}
                  />
                  <span className="font-tabular text-xs text-muted-foreground">{point.score}</span>
                </div>
              ))
            ) : (
              <p className="self-center text-sm text-muted-foreground">暂无复盘情绪记录。</p>
            )}
          </div>
        </div>

        <div>
          <p className="label-tiny mb-4">复盘焦点</p>
          <div className="space-y-2.5">
            {snapshot.reviews.focusBreakdown.length > 0 ? (
              snapshot.reviews.focusBreakdown.map((item) => (
                <div key={item.focus} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-2.5">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <Badge variant="secondary">{item.count} 条</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">暂无复盘分类。</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="label-tiny mb-4">高频复盘标签</p>
        <div className="flex flex-wrap gap-2">
          {snapshot.reviews.topTags.length > 0 ? (
            snapshot.reviews.topTags.map((item) => (
              <Badge key={item.tag} variant="outline">
                {item.tag} · {item.count}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">暂无标签。</span>
          )}
        </div>
      </div>
    </SectionPanel>
  )
}

function RecommendationPanel({ snapshot }: { snapshot: AnalysisSnapshot }) {
  return (
    <SectionPanel
      className="mt-4"
      eyebrow="Recommendations"
      title="下一步建议"
      description="建议只基于当前本地数据生成，用于纪律提醒和复盘方向，不构成买卖建议。"
      action={<BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
    >
      <div className="grid gap-3 lg:grid-cols-3">
        {snapshot.recommendations.map((item) => {
          const Icon = item.tone === "negative" || item.tone === "warning" ? AlertTriangle : ShieldCheck
          return (
            <article key={item.title} className="rounded-xl border border-border bg-background p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Icon className={`h-4 w-4 ${toneTextClass(item.tone)}`} aria-hidden="true" />
                <Badge variant={item.priority === "high" ? "destructive" : item.priority === "medium" ? "secondary" : "outline"}>
                  {item.priority === "high" ? "高优先级" : item.priority === "medium" ? "中优先级" : "低优先级"}
                </Badge>
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{item.description}</p>
            </article>
          )
        })}
      </div>
    </SectionPanel>
  )
}

function MiniStat({
  title,
  value,
  detail,
  tone = "default",
  valueClassName,
}: {
  title: string
  value: React.ReactNode
  detail?: React.ReactNode
  tone?: InsightTone
  valueClassName?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="label-tiny mb-2">{title}</p>
      <p className={`font-tabular text-xl font-semibold ${valueClassName ?? toneTextClass(tone)}`}>{value}</p>
      {detail ? <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  )
}

function BarRow({
  label,
  value,
  valueLabel,
  detail,
  tone,
}: {
  label: string
  value: number
  valueLabel: string
  detail?: string
  tone: InsightTone
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-tabular text-muted-foreground">{valueLabel}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted" aria-label={`${label} ${valueLabel}`}>
        <div className={`h-1.5 rounded-full ${toneBgClass(tone)}`} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
      </div>
      {detail ? <div className="mt-2 text-xs text-muted-foreground">{detail}</div> : null}
    </div>
  )
}

function formatCurrency(value: number) {
  return `¥${Math.round(value).toLocaleString("zh-CN")}`
}

function withCurrency(value: number) {
  return `${value >= 0 ? "+" : ""}${formatCurrency(value)}`
}

function withSign(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`
}

function toneTextClass(tone: InsightTone) {
  if (tone === "positive") return "text-success"
  if (tone === "negative") return "text-destructive"
  if (tone === "warning") return "text-warning"
  return "text-foreground"
}

function toneBgClass(tone: InsightTone) {
  if (tone === "positive") return "bg-success"
  if (tone === "negative") return "bg-destructive"
  if (tone === "warning") return "bg-warning"
  return "bg-foreground"
}
