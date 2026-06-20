import {
  getRuleCheckLabel,
  type InvestmentPlan,
  type PlanLinkedTransaction,
  type PlanRuleCheck,
} from "@/lib/investment-plans"
import { shouldUseSampleData } from "@/lib/mvp-store"

export type ReviewFocus = "transaction" | "plan" | "plan_deviation" | "periodic" | "emotion"
export type ReviewResult = "effective" | "needs_fix" | "neutral"

export type TargetedReview = {
  id: string
  date: string
  title: string
  focus: ReviewFocus
  planId?: string
  transactionIds: string[]
  result: ReviewResult
  emotionScore: number
  decisionSnapshot: string
  executionSummary: string
  planExpectation: string
  actualOutcome: string
  lesson: string
  nextAction: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type ReviewDraft = Omit<TargetedReview, "id" | "createdAt" | "updatedAt">

export const reviewLogsStorageKey = "assetwise_targeted_reviews_v1"

const today = "2026-06-18"

export const focusOptions: Array<{ value: ReviewFocus; label: string; description: string }> = [
  { value: "transaction", label: "交易复盘", description: "针对一笔或多笔交易，检查执行质量和结果。" },
  { value: "plan", label: "计划复盘", description: "针对投资计划，检查进度、假设和下一步。" },
  { value: "plan_deviation", label: "偏离复盘", description: "针对偏离计划的交易，记录原因和修正动作。" },
  { value: "periodic", label: "周期复盘", description: "按周、月、季度沉淀组合行为。" },
  { value: "emotion", label: "情绪复盘", description: "针对冲动、恐惧、贪婪等心理因素。" },
]

export const defaultTargetedReviews: TargetedReview[] = [
  {
    id: "review-001",
    date: "2026-06-13",
    title: "新能源仓位再平衡执行复盘",
    focus: "plan",
    planId: "plan-new-energy-swing",
    transactionIds: ["tx-002"],
    result: "effective",
    emotionScore: 7,
    decisionSnapshot: "新能源敞口偏高，按波段计划先卖出部分宁德时代，降低单一行业波动。",
    executionSummary: "卖出交易与计划减仓规则一致，交易后行业敞口回到目标区间。",
    planExpectation: "当新能源仓位超过目标区间时优先减仓，并继续观察趋势是否失效。",
    actualOutcome: "执行后组合风险下降，未出现追涨回补。",
    lesson: "盈利交易也需要服务组合风险，而不是只看单笔收益。",
    nextAction: "未来两周观察新能源反弹强度，若无新证据不回补。",
    tags: ["再平衡", "计划内", "风控"],
    createdAt: "2026-06-13T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
  },
  {
    id: "review-002",
    date: "2026-06-08",
    title: "核心指数定投执行复盘",
    focus: "transaction",
    planId: "plan-core-index-dca",
    transactionIds: ["tx-001"],
    result: "neutral",
    emotionScore: 6,
    decisionSnapshot: "沪深300 回到计划买入区间，按月度定投规则补仓核心仓位。",
    executionSummary: "交易金额未超过单笔上限，执行符合定投计划。",
    planExpectation: "按固定周期买入，低估时允许增强投入，不做短期止损。",
    actualOutcome: "按计划完成补仓，后续未追加追涨。",
    lesson: "规则明确时，执行阻力明显下降。",
    nextAction: "月底复查估值分位和现金比例。",
    tags: ["定投", "计划内", "指数"],
    createdAt: "2026-06-08T08:00:00.000Z",
    updatedAt: "2026-06-08T08:00:00.000Z",
  },
  {
    id: "review-003",
    date: "2026-06-04",
    title: "盘中冲动交易观察",
    focus: "emotion",
    transactionIds: [],
    result: "effective",
    emotionScore: 4,
    decisionSnapshot: "盘中看到热点异动产生追涨冲动，但没有下单。",
    executionSummary: "未发生交易，避免了计划外行动。",
    planExpectation: "没有触发计划或观察清单条件时不临场交易。",
    actualOutcome: "冲动被记录下来，未对组合造成影响。",
    lesson: "没有符合计划的交易，也是一笔有效决策。",
    nextAction: "为热点交易单独建立观察清单，避免临场决策。",
    tags: ["情绪", "纪律", "未交易"],
    createdAt: "2026-06-04T08:00:00.000Z",
    updatedAt: "2026-06-04T08:00:00.000Z",
  },
]

export function getStoredReviews() {
  if (typeof window === "undefined") return defaultTargetedReviews

  try {
    const stored = window.localStorage.getItem(reviewLogsStorageKey)
    if (!stored) return shouldUseSampleData() ? defaultTargetedReviews : []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.map(normalizeReview) : shouldUseSampleData() ? defaultTargetedReviews : []
  } catch {
    return shouldUseSampleData() ? defaultTargetedReviews : []
  }
}

export function saveStoredReviews(reviews: TargetedReview[]) {
  window.localStorage.setItem(reviewLogsStorageKey, JSON.stringify(reviews))
  window.dispatchEvent(new Event("assetwise-reviews-updated"))
}

export function createEmptyReviewDraft(): ReviewDraft {
  return {
    date: today,
    title: "",
    focus: "transaction",
    transactionIds: [],
    result: "neutral",
    emotionScore: 5,
    decisionSnapshot: "",
    executionSummary: "",
    planExpectation: "",
    actualOutcome: "",
    lesson: "",
    nextAction: "",
    tags: [],
  }
}

export function buildReviewDraftFromTransaction(
  transaction: PlanLinkedTransaction,
  plan?: InvestmentPlan | null,
): ReviewDraft {
  const isDeviation = transaction.planRuleCheck === "warning" || transaction.planRuleCheck === "violated"
  const ruleLabel = getRuleCheckLabel(transaction.planRuleCheck)

  return {
    date: today,
    title: `${transaction.asset} ${transaction.kind === "buy" ? "买入" : "卖出"}复盘`,
    focus: isDeviation ? "plan_deviation" : "transaction",
    planId: plan?.id ?? transaction.planId,
    transactionIds: [transaction.id],
    result: isDeviation ? "needs_fix" : "neutral",
    emotionScore: isDeviation ? 4 : 6,
    decisionSnapshot: transaction.reason,
    executionSummary: `${ruleLabel}：${transaction.planRuleNotes || "暂无规则说明"}。执行结果：${transaction.result || "待补充"}`,
    planExpectation: plan
      ? `${plan.title} 要求：入场 ${plan.rules.entry}；减仓 ${plan.rules.reduce}；退出 ${plan.rules.exit}`
      : "这笔交易未关联投资计划，需要补充交易前的依据。",
    actualOutcome: transaction.result || "待观察实际收益、风险暴露和行为影响。",
    lesson: isDeviation ? "这笔交易存在计划偏离，需要说明为什么偏离仍然合理，以及下次如何提前处理。" : "",
    nextAction: isDeviation ? "补充偏离原因，并在下一次同类交易前先更新计划规则。" : "",
    tags: compactTags([
      "交易复盘",
      ruleLabel,
      transaction.kind === "buy" ? "买入" : "卖出",
      ...(transaction.tags ?? []),
    ]),
  }
}

export function buildReviewDraftFromPlan(
  plan: InvestmentPlan,
  transactions: PlanLinkedTransaction[],
): ReviewDraft {
  const linkedTransactions = transactions.filter((transaction) => transaction.planId === plan.id)
  const deviationCount = linkedTransactions.filter((transaction) => isTransactionDeviation(transaction.planRuleCheck)).length

  return {
    date: today,
    title: `${plan.title} 阶段复盘`,
    focus: deviationCount > 0 ? "plan_deviation" : "plan",
    planId: plan.id,
    transactionIds: linkedTransactions.map((transaction) => transaction.id),
    result: deviationCount > 0 ? "needs_fix" : "neutral",
    emotionScore: deviationCount > 0 ? 4 : 6,
    decisionSnapshot: plan.objective,
    executionSummary: `已关联 ${linkedTransactions.length} 笔交易，投入 ${formatCurrency(plan.executionStats.investedAmount)}，完成度 ${plan.executionStats.progressPercent.toFixed(0)}%。`,
    planExpectation: `${plan.thesis} 风控上限：单笔 ${formatCurrency(plan.riskControl.maxSingleTradeAmount)}，最大仓位 ${plan.riskControl.maxPositionPercent}%。`,
    actualOutcome:
      deviationCount > 0
        ? `发现 ${deviationCount} 笔规则偏离或需说明交易。`
        : "当前交易未触发明显偏离，需要继续观察计划假设是否成立。",
    lesson: "",
    nextAction: plan.schedule.nextReviewDate ? `下一次计划复盘：${plan.schedule.nextReviewDate}` : "补充下一次复盘日期。",
    tags: compactTags(["计划复盘", plan.status, deviationCount > 0 ? "偏离处理" : "计划内"]),
  }
}

export function getReviewStats(
  reviews: TargetedReview[],
  plans: InvestmentPlan[],
  transactions: PlanLinkedTransaction[],
) {
  const linkedTransactionIds = new Set(reviews.flatMap((review) => review.transactionIds))
  const linkedPlanIds = new Set(reviews.map((review) => review.planId).filter(Boolean))
  const pendingTransactions = transactions.filter((transaction) => {
    const hasReview = linkedTransactionIds.has(transaction.id)
    return !hasReview && (Boolean(transaction.planId) || isTransactionDeviation(transaction.planRuleCheck))
  })
  const duePlanReviews = plans.filter((plan) => {
    if (plan.status !== "active" || !plan.schedule.nextReviewDate) return false
    return plan.schedule.nextReviewDate <= today && !linkedPlanIds.has(plan.id)
  })

  return {
    totalReviews: reviews.length,
    linkedTransactions: linkedTransactionIds.size,
    linkedPlans: linkedPlanIds.size,
    pendingReviews: pendingTransactions.length + duePlanReviews.length,
    needsFix: reviews.filter((review) => review.result === "needs_fix").length,
  }
}

export function syncPlanReviewLinks(plans: InvestmentPlan[], reviews: TargetedReview[]) {
  return plans.map((plan) => ({
    ...plan,
    linkedReviewIds: reviews.filter((review) => review.planId === plan.id).map((review) => review.id),
  }))
}

export function getFocusLabel(focus: ReviewFocus) {
  return focusOptions.find((option) => option.value === focus)?.label ?? "复盘"
}

export function getReviewResultLabel(result: ReviewResult) {
  if (result === "effective") return "有效"
  if (result === "needs_fix") return "待修正"
  return "观察中"
}

export function isTransactionDeviation(status?: PlanRuleCheck) {
  return status === "warning" || status === "violated"
}

function normalizeReview(value: Partial<TargetedReview>): TargetedReview {
  const fallback = createEmptyReviewDraft()
  const timestamp = new Date().toISOString()

  return {
    ...fallback,
    ...value,
    id: String(value.id ?? `review-${Date.now()}`),
    date: String(value.date ?? fallback.date),
    title: String(value.title ?? fallback.title),
    focus: isReviewFocus(value.focus) ? value.focus : fallback.focus,
    planId: value.planId ? String(value.planId) : undefined,
    transactionIds: Array.isArray(value.transactionIds) ? value.transactionIds.map(String) : [],
    result: isReviewResult(value.result) ? value.result : fallback.result,
    emotionScore: Number(value.emotionScore ?? fallback.emotionScore),
    decisionSnapshot: String(value.decisionSnapshot ?? ""),
    executionSummary: String(value.executionSummary ?? ""),
    planExpectation: String(value.planExpectation ?? ""),
    actualOutcome: String(value.actualOutcome ?? ""),
    lesson: String(value.lesson ?? ""),
    nextAction: String(value.nextAction ?? ""),
    tags: Array.isArray(value.tags) ? compactTags(value.tags.map(String)) : [],
    createdAt: String(value.createdAt ?? timestamp),
    updatedAt: String(value.updatedAt ?? timestamp),
  }
}

function isReviewFocus(value: unknown): value is ReviewFocus {
  return typeof value === "string" && focusOptions.some((option) => option.value === value)
}

function isReviewResult(value: unknown): value is ReviewResult {
  return value === "effective" || value === "needs_fix" || value === "neutral"
}

function compactTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 8)
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN")}`
}
