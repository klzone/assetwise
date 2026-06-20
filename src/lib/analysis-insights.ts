import { getAllocationByCategory, getAssetSummary, type MvpAsset } from "@/lib/mvp-store"
import {
  getPlanTypeMeta,
  type InvestmentPlan,
  type InvestmentPlanType,
  type PlanLinkedTransaction,
  type PlanRuleCheck,
} from "@/lib/investment-plans"
import { isTransactionDeviation, type ReviewFocus, type ReviewResult, type TargetedReview } from "@/lib/review-logs"

export type InsightTone = "positive" | "negative" | "warning" | "default"

export type AnalysisSnapshot = {
  portfolio: {
    totalValue: number
    totalCost: number
    totalProfit: number
    totalProfitPercent: number
    todayProfit: number
    todayProfitPercent: number
    highRiskPercent: number
    cashLikePercent: number
    allocation: Array<{ name: string; amount: number; value: number }>
  }
  discipline: {
    score: number
    linkedRatio: number
    matchedRatio: number
    deviationRatio: number
    reviewCoverage: number
    pendingReviews: number
    linkedTransactions: number
    reviewedTransactions: number
  }
  transactions: {
    total: number
    buyAmount: number
    sellAmount: number
    averageAmount: number
    byRuleCheck: Record<PlanRuleCheck, number>
    topAssets: Array<{ name: string; symbol: string; count: number; amount: number }>
  }
  plans: {
    total: number
    active: number
    averageProgress: number
    typeBreakdown: Array<{ type: InvestmentPlanType; label: string; count: number; progress: number; deviations: number }>
  }
  reviews: {
    total: number
    averageEmotion: number
    needsFix: number
    effective: number
    focusBreakdown: Array<{ focus: ReviewFocus; label: string; count: number }>
    emotionTrend: Array<{ date: string; score: number; title: string }>
    topTags: Array<{ tag: string; count: number }>
  }
  recommendations: Array<{
    title: string
    description: string
    priority: "high" | "medium" | "low"
    tone: InsightTone
  }>
}

const ruleChecks: PlanRuleCheck[] = ["matched", "warning", "violated", "not_checked"]

const focusLabels: Record<ReviewFocus, string> = {
  transaction: "交易复盘",
  plan: "计划复盘",
  plan_deviation: "偏离复盘",
  periodic: "周期复盘",
  emotion: "情绪复盘",
}

export function buildAnalysisSnapshot({
  assets,
  plans,
  transactions,
  reviews,
}: {
  assets: MvpAsset[]
  plans: InvestmentPlan[]
  transactions: PlanLinkedTransaction[]
  reviews: TargetedReview[]
}): AnalysisSnapshot {
  const assetSummary = getAssetSummary(assets)
  const allocation = getAllocationByCategory(assets)
  const totalAssetValue = assetSummary.totalValue
  const highRiskValue = assets
    .filter((asset) => isHighRisk(asset.risk))
    .reduce((sum, asset) => sum + asset.value, 0)
  const cashLikeValue = assets
    .filter((asset) => /现金|货币|债|红利|鐜伴噾|璐у竵|鍊哄埜|绾㈠埄|cash|bond|dividend/i.test(`${asset.category} ${asset.name} ${asset.symbol}`))
    .reduce((sum, asset) => sum + asset.value, 0)

  const linkedTransactions = transactions.filter((transaction) => Boolean(transaction.planId))
  const matchedTransactions = transactions.filter((transaction) => transaction.planRuleCheck === "matched")
  const deviationTransactions = transactions.filter((transaction) => isTransactionDeviation(transaction.planRuleCheck))
  const reviewedTransactionIds = new Set(reviews.flatMap((review) => review.transactionIds))
  const reviewedTransactions = transactions.filter((transaction) => reviewedTransactionIds.has(transaction.id))
  const duePlanReviews = plans.filter((plan) => plan.status === "active" && plan.schedule.nextReviewDate && plan.schedule.nextReviewDate <= "2026-06-18")
  const unreviewedLinkedTransactions = linkedTransactions.filter((transaction) => !reviewedTransactionIds.has(transaction.id))

  const linkedRatio = ratio(linkedTransactions.length, transactions.length)
  const matchedRatio = ratio(matchedTransactions.length, transactions.length)
  const deviationRatio = ratio(deviationTransactions.length, transactions.length)
  const reviewCoverage = ratio(reviewedTransactions.length, transactions.length)
  const averageEmotion = average(reviews.map((review) => review.emotionScore))
  const disciplineScore = clamp(
    Math.round(linkedRatio * 0.3 + matchedRatio * 0.3 + reviewCoverage * 0.25 + (100 - deviationRatio) * 0.15),
    0,
    100,
  )

  const byRuleCheck = ruleChecks.reduce(
    (accumulator, status) => {
      accumulator[status] = transactions.filter((transaction) => (transaction.planRuleCheck ?? "not_checked") === status).length
      return accumulator
    },
    { matched: 0, warning: 0, violated: 0, not_checked: 0 } as Record<PlanRuleCheck, number>,
  )

  const activePlans = plans.filter((plan) => plan.status === "active")
  const planTypes = Array.from(new Set(plans.map((plan) => plan.planType)))

  return {
    portfolio: {
      totalValue: assetSummary.totalValue,
      totalCost: assetSummary.totalCost,
      totalProfit: assetSummary.totalProfit,
      totalProfitPercent: assetSummary.totalProfitPercent,
      todayProfit: assetSummary.todayProfit,
      todayProfitPercent: assetSummary.todayProfitPercent,
      highRiskPercent: ratio(highRiskValue, totalAssetValue),
      cashLikePercent: ratio(cashLikeValue, totalAssetValue),
      allocation,
    },
    discipline: {
      score: disciplineScore,
      linkedRatio,
      matchedRatio,
      deviationRatio,
      reviewCoverage,
      pendingReviews: unreviewedLinkedTransactions.length + duePlanReviews.length,
      linkedTransactions: linkedTransactions.length,
      reviewedTransactions: reviewedTransactions.length,
    },
    transactions: {
      total: transactions.length,
      buyAmount: sumBy(transactions.filter((transaction) => transaction.kind === "buy"), "amount"),
      sellAmount: sumBy(transactions.filter((transaction) => transaction.kind === "sell"), "amount"),
      averageAmount: average(transactions.map((transaction) => transaction.amount)),
      byRuleCheck,
      topAssets: getTopTransactionAssets(transactions),
    },
    plans: {
      total: plans.length,
      active: activePlans.length,
      averageProgress: average(plans.map((plan) => plan.executionStats.progressPercent)),
      typeBreakdown: planTypes.map((type) => {
        const typePlans = plans.filter((plan) => plan.planType === type)
        return {
          type,
          label: getPlanTypeMeta(type).shortLabel,
          count: typePlans.length,
          progress: average(typePlans.map((plan) => plan.executionStats.progressPercent)),
          deviations: typePlans.reduce(
            (sum, plan) => sum + plan.executionStats.warningTransactions + plan.executionStats.violatedTransactions,
            0,
          ),
        }
      }),
    },
    reviews: {
      total: reviews.length,
      averageEmotion,
      needsFix: reviews.filter((review) => review.result === "needs_fix").length,
      effective: reviews.filter((review) => review.result === "effective").length,
      focusBreakdown: getReviewFocusBreakdown(reviews),
      emotionTrend: reviews
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-8)
        .map((review) => ({ date: review.date, score: review.emotionScore, title: review.title })),
      topTags: getTopReviewTags(reviews),
    },
    recommendations: buildRecommendations({
      highRiskPercent: ratio(highRiskValue, totalAssetValue),
      cashLikePercent: ratio(cashLikeValue, totalAssetValue),
      linkedRatio,
      deviationRatio,
      reviewCoverage,
      pendingReviews: unreviewedLinkedTransactions.length + duePlanReviews.length,
      averageEmotion,
      needsFix: reviews.filter((review) => review.result === "needs_fix").length,
      transactionCount: transactions.length,
    }),
  }
}

export function getRuleCheckText(status: PlanRuleCheck) {
  if (status === "matched") return "符合计划"
  if (status === "warning") return "需说明"
  if (status === "violated") return "偏离计划"
  return "未检查"
}

export function getReviewResultText(result: ReviewResult) {
  if (result === "effective") return "有效"
  if (result === "needs_fix") return "待修正"
  return "观察中"
}

function buildRecommendations(input: {
  highRiskPercent: number
  cashLikePercent: number
  linkedRatio: number
  deviationRatio: number
  reviewCoverage: number
  pendingReviews: number
  averageEmotion: number
  needsFix: number
  transactionCount: number
}) {
  const recommendations: AnalysisSnapshot["recommendations"] = []

  if (input.transactionCount === 0) {
    recommendations.push({
      title: "先积累可分析交易样本",
      description: "当前交易记录不足，建议先把新增交易与计划关联，再通过复盘沉淀结果。",
      priority: "high",
      tone: "warning",
    })
  }

  if (input.linkedRatio < 80) {
    recommendations.push({
      title: "提高交易前计划覆盖率",
      description: `当前计划关联率 ${formatPercent(input.linkedRatio)}，建议非现金类交易都先关联一个投资计划或观察清单。`,
      priority: "high",
      tone: "warning",
    })
  }

  if (input.deviationRatio > 20) {
    recommendations.push({
      title: "集中处理计划偏离",
      description: `偏离或需说明交易占比 ${formatPercent(input.deviationRatio)}，优先复盘这些交易的触发原因和规则缺口。`,
      priority: "high",
      tone: "negative",
    })
  }

  if (input.reviewCoverage < 80) {
    recommendations.push({
      title: "补齐交易后复盘",
      description: `复盘覆盖率 ${formatPercent(input.reviewCoverage)}，建议每笔非定投交易在 24 小时内补一条复盘。`,
      priority: "medium",
      tone: "warning",
    })
  }

  if (input.pendingReviews > 0) {
    recommendations.push({
      title: "清理待复盘队列",
      description: `还有 ${input.pendingReviews} 条计划或交易线索待复盘，处理后分析结论会更可靠。`,
      priority: "medium",
      tone: "warning",
    })
  }

  if (input.averageEmotion > 0 && input.averageEmotion < 5) {
    recommendations.push({
      title: "降低低情绪交易频率",
      description: `平均情绪评分 ${input.averageEmotion.toFixed(1)}/10，低情绪阶段适合减少短线交易和加仓动作。`,
      priority: "medium",
      tone: "negative",
    })
  }

  if (input.highRiskPercent > 35) {
    recommendations.push({
      title: "控制高风险资产暴露",
      description: `高风险资产占比 ${formatPercent(input.highRiskPercent)}，建议结合计划上限检查是否需要再平衡。`,
      priority: "medium",
      tone: "warning",
    })
  }

  if (input.cashLikePercent < 10) {
    recommendations.push({
      title: "保留现金缓冲",
      description: `现金和防御类资产约 ${formatPercent(input.cashLikePercent)}，若近期计划较多，可提高流动性缓冲。`,
      priority: "low",
      tone: "default",
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "继续保持交易闭环",
      description: "当前计划关联、复盘覆盖和风险暴露较均衡，下一步可关注收益来源和策略稳定性。",
      priority: "low",
      tone: "positive",
    })
  }

  return recommendations.slice(0, 5)
}

function getTopTransactionAssets(transactions: PlanLinkedTransaction[]) {
  const map = new Map<string, { name: string; symbol: string; count: number; amount: number }>()
  transactions.forEach((transaction) => {
    const key = transaction.symbol || transaction.asset
    const current = map.get(key) ?? { name: transaction.asset, symbol: transaction.symbol, count: 0, amount: 0 }
    current.count += 1
    current.amount += transaction.amount
    map.set(key, current)
  })

  return Array.from(map.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
}

function getReviewFocusBreakdown(reviews: TargetedReview[]) {
  const focuses: ReviewFocus[] = ["transaction", "plan", "plan_deviation", "periodic", "emotion"]
  return focuses
    .map((focus) => ({
      focus,
      label: focusLabels[focus],
      count: reviews.filter((review) => review.focus === focus).length,
    }))
    .filter((item) => item.count > 0)
}

function getTopReviewTags(reviews: TargetedReview[]) {
  const map = new Map<string, number>()
  reviews.flatMap((review) => review.tags).forEach((tag) => map.set(tag, (map.get(tag) ?? 0) + 1))
  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

function isHighRisk(risk: string) {
  return risk.includes("高") || risk.includes("楂")
}

function ratio(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0
}

function average(values: number[]) {
  const numeric = values.filter((value) => Number.isFinite(value))
  return numeric.length > 0 ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length : 0
}

function sumBy<T extends Record<K, number>, K extends keyof T>(items: T[], key: K) {
  return items.reduce((sum, item) => sum + item[key], 0)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`
}
