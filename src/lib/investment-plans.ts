import { shouldUseSampleData } from "@/lib/mvp-store"

export type InvestmentPlanType =
  | "short_term"
  | "swing"
  | "dca"
  | "long_term"
  | "rebalance"
  | "cash_income"
  | "watchlist"

export type InvestmentPlanStatus = "draft" | "active" | "paused" | "completed" | "invalidated" | "archived"
export type InvestmentRiskLevel = "low" | "medium" | "high"
export type PlanRuleCheck = "matched" | "warning" | "violated" | "not_checked"
export type TransactionKind = "buy" | "sell"

export type PlanAsset = {
  symbol: string
  name: string
  allocation: number
  targetAmount: number
}

export type PlanRules = {
  entry: string
  add: string
  reduce: string
  exit: string
  stopLoss: string
  pause: string
  invalidation: string
  maxHoldingDays?: number
  buyPriceMin?: number
  buyPriceMax?: number
  targetPrice?: number
  stopLossPrice?: number
  baseDcaAmount?: number
  rebalanceThreshold?: number
}

export type PlanRiskControl = {
  maxPositionPercent: number
  maxSingleTradeAmount: number
  maxLossAmount: number
  maxDrawdownPercent: number
}

export type PlanSchedule = {
  startDate: string
  endDate?: string
  dcaFrequency?: "weekly" | "biweekly" | "monthly" | "quarterly"
  reviewFrequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly"
  nextReviewDate?: string
  reminderDate?: string
}

export type PlanExecutionStats = {
  investedAmount: number
  progressPercent: number
  matchedTransactions: number
  warningTransactions: number
  violatedTransactions: number
}

export type InvestmentPlan = {
  id: string
  title: string
  planType: InvestmentPlanType
  status: InvestmentPlanStatus
  priority: "high" | "medium" | "low"
  riskLevel: InvestmentRiskLevel
  objective: string
  thesis: string
  targetAmount: number
  expectedReturn: number
  assets: PlanAsset[]
  rules: PlanRules
  riskControl: PlanRiskControl
  schedule: PlanSchedule
  linkedTransactionIds: string[]
  linkedReviewIds: string[]
  executionStats: PlanExecutionStats
  notes?: string
  createdAt: string
  updatedAt: string
}

export type PlanLinkedTransaction = {
  id: string
  date: string
  kind: TransactionKind
  asset: string
  symbol: string
  quantity: number
  price: number
  amount: number
  reason: string
  result: string
  tags: string[]
  planId?: string
  planRuleCheck?: PlanRuleCheck
  planRuleNotes?: string
}

export type PlanRuleEvaluation = {
  plan: InvestmentPlan | null
  status: PlanRuleCheck
  notes: string
}

export type PlanTemplate = {
  type: InvestmentPlanType
  label: string
  shortLabel: string
  description: string
  defaultHorizon: string
  defaultRisk: InvestmentRiskLevel
  fields: string[]
  defaults: Pick<InvestmentPlan, "objective" | "thesis" | "rules" | "riskControl" | "schedule" | "expectedReturn" | "priority">
}

export const investmentPlansStorageKey = "assetwise_investment_plans_v1"
export const planTransactionsStorageKey = "assetwise_plan_transactions_v1"

const today = "2026-06-18"

export const planTemplates: PlanTemplate[] = [
  {
    type: "short_term",
    label: "短线计划",
    shortLabel: "短线",
    description: "事件驱动、技术触发、明确止盈止损，强调单笔风险控制。",
    defaultHorizon: "1-20 个交易日",
    defaultRisk: "high",
    fields: ["触发条件", "买入价区间", "目标价", "止损价", "最大持有天数", "单笔最大亏损"],
    defaults: {
      objective: "在明确触发条件出现后做一笔短线交易，严格控制亏损。",
      thesis: "价格、事件或情绪出现短期错配，但必须用止损和持有期限约束。",
      expectedReturn: 8,
      priority: "medium",
      rules: {
        entry: "仅在触发条件出现且价格进入计划区间时买入。",
        add: "短线计划默认不加仓，除非重新写明二次触发条件。",
        reduce: "接近目标价或波动放大时先减仓一半。",
        exit: "达到目标价、持有期结束或触发止损时退出。",
        stopLoss: "价格跌破止损价或单笔亏损达到上限时退出。",
        pause: "重大消息未确认或市场流动性异常时暂停。",
        invalidation: "触发条件被证伪，或价格未按预期反应。",
        maxHoldingDays: 20,
        buyPriceMin: 0,
        buyPriceMax: 0,
        targetPrice: 0,
        stopLossPrice: 0,
      },
      riskControl: {
        maxPositionPercent: 5,
        maxSingleTradeAmount: 10000,
        maxLossAmount: 1000,
        maxDrawdownPercent: 6,
      },
      schedule: {
        startDate: today,
        reviewFrequency: "daily",
        nextReviewDate: today,
      },
    },
  },
  {
    type: "swing",
    label: "波段计划",
    shortLabel: "波段",
    description: "中短期趋势、估值修复或行业景气改善，强调分批和趋势失效。",
    defaultHorizon: "1-6 个月",
    defaultRisk: "medium",
    fields: ["核心假设", "买入区间", "分批规则", "减仓规则", "趋势失效条件", "最大仓位"],
    defaults: {
      objective: "捕捉一段估值修复或趋势行情，分批执行并定期复盘。",
      thesis: "资产存在中期改善因素，但不作为永久核心仓。",
      expectedReturn: 12,
      priority: "medium",
      rules: {
        entry: "回撤到计划区间或趋势确认后分批买入。",
        add: "每次加仓必须有新增证据，且总仓位不超过上限。",
        reduce: "达到阶段目标、趋势放缓或仓位偏高时减仓。",
        exit: "目标达成、趋势破坏或 thesis 失效时退出。",
        stopLoss: "跌破关键位置或计划亏损阈值时复盘并减仓。",
        pause: "连续两次复盘没有新增证据时暂停加仓。",
        invalidation: "核心景气、估值或趋势假设不再成立。",
      },
      riskControl: {
        maxPositionPercent: 15,
        maxSingleTradeAmount: 20000,
        maxLossAmount: 3000,
        maxDrawdownPercent: 10,
      },
      schedule: {
        startDate: today,
        reviewFrequency: "weekly",
        nextReviewDate: today,
      },
    },
  },
  {
    type: "dca",
    label: "定投计划",
    shortLabel: "定投",
    description: "指数、基金、长期配置，强调周期投入、估值增强和纪律执行。",
    defaultHorizon: "1-5 年",
    defaultRisk: "medium",
    fields: ["定投周期", "基础金额", "目标金额", "估值增强规则", "暂停条件", "止盈/再平衡规则"],
    defaults: {
      objective: "用固定节奏累积核心资产，减少择时压力。",
      thesis: "长期资产回报来自经济增长和估值均值回归，执行纪律比短期判断更重要。",
      expectedReturn: 8,
      priority: "high",
      rules: {
        entry: "按固定周期买入，低估时允许提高投入。",
        add: "估值分位较低或回撤达到阈值时追加 20%-50%。",
        reduce: "估值显著高估或组合占比超过目标时再平衡。",
        exit: "除非长期假设失效，不做一次性清仓。",
        stopLoss: "定投计划不使用短期止损，改用复盘和仓位控制。",
        pause: "现金流不足、估值极端高估或目标仓位已满时暂停。",
        invalidation: "标的长期逻辑恶化，或用户资金目标发生变化。",
        baseDcaAmount: 3000,
      },
      riskControl: {
        maxPositionPercent: 35,
        maxSingleTradeAmount: 15000,
        maxLossAmount: 0,
        maxDrawdownPercent: 20,
      },
      schedule: {
        startDate: today,
        dcaFrequency: "monthly",
        reviewFrequency: "monthly",
        nextReviewDate: today,
      },
    },
  },
  {
    type: "long_term",
    label: "长线计划",
    shortLabel: "长线",
    description: "核心资产长期持有，强调 thesis、基本面检查和长期仓位纪律。",
    defaultHorizon: "3 年以上",
    defaultRisk: "medium",
    fields: ["长期 thesis", "目标仓位", "加仓条件", "减仓条件", "卖出条件", "季度/年度复盘"],
    defaults: {
      objective: "建立长期核心仓位，以年度维度评估投资结果。",
      thesis: "长期价值来自竞争力、现金流、行业空间或资产配置价值。",
      expectedReturn: 10,
      priority: "high",
      rules: {
        entry: "估值合理且长期 thesis 清楚时建仓。",
        add: "基本面继续验证且估值更有吸引力时加仓。",
        reduce: "仓位过高、估值极端或基本面边际转弱时减仓。",
        exit: "长期 thesis 被证伪、治理恶化或出现更优机会成本。",
        stopLoss: "长线计划不用价格止损，使用基本面失效条件。",
        pause: "信息不足或估值不具安全边际时暂停加仓。",
        invalidation: "核心竞争力、现金流、行业空间或管理质量明显恶化。",
      },
      riskControl: {
        maxPositionPercent: 25,
        maxSingleTradeAmount: 30000,
        maxLossAmount: 0,
        maxDrawdownPercent: 25,
      },
      schedule: {
        startDate: today,
        reviewFrequency: "quarterly",
        nextReviewDate: today,
      },
    },
  },
  {
    type: "rebalance",
    label: "组合再平衡",
    shortLabel: "再平衡",
    description: "控制资产配置漂移，按目标权重和偏离阈值执行。",
    defaultHorizon: "季度/年度",
    defaultRisk: "low",
    fields: ["目标权重", "偏离阈值", "再平衡周期", "允许交易成本", "买卖顺序"],
    defaults: {
      objective: "让组合回到目标权重，降低单一资产或行业暴露。",
      thesis: "长期收益来自资产配置，过度漂移会让风险超出原计划。",
      expectedReturn: 6,
      priority: "medium",
      rules: {
        entry: "任一资产偏离目标权重超过阈值时触发。",
        add: "优先补足低于目标权重的资产。",
        reduce: "优先降低超过目标权重的资产。",
        exit: "再平衡完成后计划进入等待状态。",
        stopLoss: "不以短期价格止损，以组合风险偏离为准。",
        pause: "交易成本过高或税费影响过大时暂停。",
        invalidation: "目标资产配置本身不再符合风险偏好。",
        rebalanceThreshold: 5,
      },
      riskControl: {
        maxPositionPercent: 40,
        maxSingleTradeAmount: 50000,
        maxLossAmount: 0,
        maxDrawdownPercent: 15,
      },
      schedule: {
        startDate: today,
        reviewFrequency: "quarterly",
        nextReviewDate: today,
      },
    },
  },
  {
    type: "cash_income",
    label: "现金/红利计划",
    shortLabel: "现金红利",
    description: "防御仓、现金管理、红利资产，强调流动性和收益稳定。",
    defaultHorizon: "3-24 个月",
    defaultRisk: "low",
    fields: ["流动性需求", "收益目标", "久期/风险限制", "买入条件", "替换条件", "到期提醒"],
    defaults: {
      objective: "提高闲置资金收益，同时保留必要流动性。",
      thesis: "现金和红利资产用于降低组合波动，服务未来机会和生活现金流。",
      expectedReturn: 4,
      priority: "medium",
      rules: {
        entry: "收益率达到要求且流动性风险可接受时买入。",
        add: "现金比例高于目标且没有更高优先级计划时追加。",
        reduce: "需要现金、收益吸引力下降或久期风险升高时降低。",
        exit: "到期、收益优势消失或替代资产更优时退出。",
        stopLoss: "关注信用/久期风险，不以日内价格波动为主。",
        pause: "短期内有大额支出或市场利率快速变化时暂停。",
        invalidation: "收益稳定性下降，或流动性不满足需求。",
      },
      riskControl: {
        maxPositionPercent: 30,
        maxSingleTradeAmount: 50000,
        maxLossAmount: 0,
        maxDrawdownPercent: 5,
      },
      schedule: {
        startDate: today,
        reviewFrequency: "monthly",
        nextReviewDate: today,
      },
    },
  },
  {
    type: "watchlist",
    label: "观察清单",
    shortLabel: "观察",
    description: "尚未形成交易计划，只记录等待条件和放弃条件。",
    defaultHorizon: "自定义",
    defaultRisk: "medium",
    fields: ["关注理由", "触发条件", "放弃条件", "观察截止日", "转计划条件"],
    defaults: {
      objective: "记录一个值得观察但暂不交易的机会。",
      thesis: "机会尚未满足交易条件，需要等待证据。",
      expectedReturn: 0,
      priority: "low",
      rules: {
        entry: "只有触发条件出现后，才转为正式交易计划。",
        add: "观察清单不加仓。",
        reduce: "观察清单无减仓动作。",
        exit: "超过截止日或放弃条件出现时归档。",
        stopLoss: "未交易，不设止损。",
        pause: "信息不足时继续观察。",
        invalidation: "关注理由不再成立，或出现更高优先级机会。",
      },
      riskControl: {
        maxPositionPercent: 0,
        maxSingleTradeAmount: 0,
        maxLossAmount: 0,
        maxDrawdownPercent: 0,
      },
      schedule: {
        startDate: today,
        reviewFrequency: "weekly",
        nextReviewDate: today,
      },
    },
  },
]

export function getPlanTypeMeta(type: InvestmentPlanType) {
  return planTemplates.find((template) => template.type === type) ?? planTemplates[0]
}

export function createPlanFromTemplate(type: InvestmentPlanType): InvestmentPlan {
  const template = getPlanTypeMeta(type)
  const timestamp = new Date().toISOString()

  return {
    id: `plan-${Date.now()}`,
    title: template.label,
    planType: type,
    status: type === "watchlist" ? "draft" : "active",
    priority: template.defaults.priority,
    riskLevel: template.defaultRisk,
    objective: template.defaults.objective,
    thesis: template.defaults.thesis,
    targetAmount: type === "watchlist" ? 0 : 50000,
    expectedReturn: template.defaults.expectedReturn,
    assets: [{ symbol: "", name: "", allocation: type === "watchlist" ? 0 : 100, targetAmount: type === "watchlist" ? 0 : 50000 }],
    rules: { ...template.defaults.rules },
    riskControl: { ...template.defaults.riskControl },
    schedule: { ...template.defaults.schedule },
    linkedTransactionIds: [],
    linkedReviewIds: [],
    executionStats: {
      investedAmount: 0,
      progressPercent: 0,
      matchedTransactions: 0,
      warningTransactions: 0,
      violatedTransactions: 0,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const defaultInvestmentPlans: InvestmentPlan[] = [
  {
    ...createPlanFromTemplate("dca"),
    id: "plan-core-index-dca",
    title: "核心指数定投计划",
    status: "active",
    targetAmount: 120000,
    expectedReturn: 8,
    assets: [{ symbol: "510300", name: "沪深300 ETF", allocation: 100, targetAmount: 120000 }],
    linkedTransactionIds: ["tx-001"],
    executionStats: {
      investedAmount: 42000,
      progressPercent: 35,
      matchedTransactions: 1,
      warningTransactions: 0,
      violatedTransactions: 0,
    },
  },
  {
    ...createPlanFromTemplate("swing"),
    id: "plan-new-energy-swing",
    title: "新能源仓位再平衡",
    status: "active",
    targetAmount: 30000,
    expectedReturn: 12,
    assets: [{ symbol: "300750", name: "宁德时代", allocation: 100, targetAmount: 30000 }],
    rules: {
      ...createPlanFromTemplate("swing").rules,
      reduce: "新能源敞口超过目标区间时优先减仓。",
      invalidation: "行业景气或政策预期明显弱于假设。",
    },
    linkedTransactionIds: ["tx-002"],
    executionStats: {
      investedAmount: 12000,
      progressPercent: 40,
      matchedTransactions: 1,
      warningTransactions: 0,
      violatedTransactions: 0,
    },
  },
  {
    ...createPlanFromTemplate("watchlist"),
    id: "plan-ai-watchlist",
    title: "AI 算力观察清单",
    status: "draft",
    assets: [{ symbol: "588000", name: "科创50 ETF", allocation: 0, targetAmount: 0 }],
    thesis: "AI 算力主题有长期空间，但当前估值和波动尚未满足交易条件。",
  },
]

export const defaultPlanTransactions: PlanLinkedTransaction[] = [
  {
    id: "tx-001",
    date: "2026-06-12",
    kind: "buy",
    asset: "沪深300 ETF",
    symbol: "510300",
    quantity: 3000,
    price: 3.92,
    amount: 11760,
    reason: "指数回到计划买入区间，按月度定投规则补仓核心仓位。",
    result: "执行符合计划，后续不追涨。",
    tags: ["计划内", "指数", "低估"],
    planId: "plan-core-index-dca",
    planRuleCheck: "matched",
    planRuleNotes: "资产匹配定投计划，金额未超过单笔上限。",
  },
  {
    id: "tx-002",
    date: "2026-06-10",
    kind: "sell",
    asset: "宁德时代",
    symbol: "300750",
    quantity: 100,
    price: 186.2,
    amount: 18620,
    reason: "新能源仓位占比偏高，组合波动超过设定阈值，先降低敞口。",
    result: "卖出后行业敞口回到目标区间。",
    tags: ["再平衡", "个股", "风控"],
    planId: "plan-new-energy-swing",
    planRuleCheck: "matched",
    planRuleNotes: "卖出方向符合减仓规则。",
  },
  {
    id: "tx-003",
    date: "2026-06-06",
    kind: "buy",
    asset: "中证红利 ETF",
    symbol: "515080",
    quantity: 2000,
    price: 1.38,
    amount: 2760,
    reason: "增加现金流属性，降低组合整体波动。",
    result: "作为防御仓位持有，季度复查成分变化。",
    tags: ["红利", "防御", "现金流"],
    planRuleCheck: "not_checked",
    planRuleNotes: "未关联计划。",
  },
]

export function getStoredInvestmentPlans() {
  if (typeof window === "undefined") return defaultInvestmentPlans

  try {
    const stored = window.localStorage.getItem(investmentPlansStorageKey)
    if (!stored) return shouldUseSampleData() ? defaultInvestmentPlans : []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.map(normalizePlan) : shouldUseSampleData() ? defaultInvestmentPlans : []
  } catch {
    return shouldUseSampleData() ? defaultInvestmentPlans : []
  }
}

export function saveStoredInvestmentPlans(plans: InvestmentPlan[]) {
  window.localStorage.setItem(investmentPlansStorageKey, JSON.stringify(plans))
  window.dispatchEvent(new Event("assetwise-plans-updated"))
}

export function getStoredPlanTransactions() {
  if (typeof window === "undefined") return defaultPlanTransactions

  try {
    const stored = window.localStorage.getItem(planTransactionsStorageKey)
    if (!stored) return shouldUseSampleData() ? defaultPlanTransactions : []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.map(normalizeTransaction) : shouldUseSampleData() ? defaultPlanTransactions : []
  } catch {
    return shouldUseSampleData() ? defaultPlanTransactions : []
  }
}

export function saveStoredPlanTransactions(transactions: PlanLinkedTransaction[]) {
  window.localStorage.setItem(planTransactionsStorageKey, JSON.stringify(transactions))
  window.dispatchEvent(new Event("assetwise-transactions-updated"))
}

export function calculatePlanStats(plans: InvestmentPlan[], transactions: PlanLinkedTransaction[] = []) {
  const activePlans = plans.filter((plan) => plan.status === "active")
  const dueReviews = plans.filter((plan) => {
    if (!plan.schedule.nextReviewDate || plan.status !== "active") return false
    return plan.schedule.nextReviewDate <= today
  })
  const violatedTransactions = transactions.filter((transaction) => transaction.planRuleCheck === "violated")

  return {
    totalPlans: plans.length,
    activePlans: activePlans.length,
    dueReviews: dueReviews.length,
    violatedTransactions: violatedTransactions.length,
    totalTargetAmount: plans.reduce((sum, plan) => sum + plan.targetAmount, 0),
    totalInvestedAmount: plans.reduce((sum, plan) => sum + plan.executionStats.investedAmount, 0),
  }
}

export function refreshPlanExecutionStats(plans: InvestmentPlan[], transactions: PlanLinkedTransaction[]) {
  return plans.map((plan) => {
    const linked = transactions.filter((transaction) => transaction.planId === plan.id)
    const investedAmount = linked.reduce((sum, transaction) => {
      if (transaction.kind === "buy") return sum + transaction.amount
      if (transaction.kind === "sell") return Math.max(0, sum - transaction.amount)
      return sum
    }, 0)

    return {
      ...plan,
      linkedTransactionIds: linked.map((transaction) => transaction.id),
      executionStats: {
        investedAmount,
        progressPercent: plan.targetAmount > 0 ? Math.min(100, (investedAmount / plan.targetAmount) * 100) : 0,
        matchedTransactions: linked.filter((transaction) => transaction.planRuleCheck === "matched").length,
        warningTransactions: linked.filter((transaction) => transaction.planRuleCheck === "warning").length,
        violatedTransactions: linked.filter((transaction) => transaction.planRuleCheck === "violated").length,
      },
    }
  })
}

export function findRecommendedPlan(transaction: Pick<PlanLinkedTransaction, "symbol" | "asset">, plans: InvestmentPlan[]) {
  return plans.find((plan) => {
    if (plan.status !== "active") return false
    return plan.assets.some((asset) => {
      const symbolMatch = asset.symbol && asset.symbol.toLowerCase() === transaction.symbol.toLowerCase()
      const nameMatch = asset.name && transaction.asset.toLowerCase().includes(asset.name.toLowerCase())
      return symbolMatch || nameMatch
    })
  }) ?? null
}

export function evaluateTransactionAgainstPlan(
  transaction: Pick<PlanLinkedTransaction, "kind" | "symbol" | "asset" | "amount" | "price">,
  plan: InvestmentPlan | null,
): PlanRuleEvaluation {
  if (!plan) {
    return { plan: null, status: "not_checked", notes: "未关联计划。" }
  }

  const assetMatched = plan.assets.some((asset) => {
    const symbolMatch = asset.symbol && asset.symbol.toLowerCase() === transaction.symbol.toLowerCase()
    const nameMatch = asset.name && transaction.asset.toLowerCase().includes(asset.name.toLowerCase())
    return symbolMatch || nameMatch
  })

  if (!assetMatched) {
    return { plan, status: "violated", notes: "交易标的不在计划资产范围内，需要说明偏离原因。" }
  }

  if (plan.planType === "watchlist") {
    return { plan, status: "warning", notes: "该计划仍是观察清单，交易前建议先转为正式计划。" }
  }

  if (transaction.amount > 0 && plan.riskControl.maxSingleTradeAmount > 0 && transaction.amount > plan.riskControl.maxSingleTradeAmount) {
    return { plan, status: "warning", notes: "交易金额超过计划单笔上限，建议记录原因并复盘。" }
  }

  const { buyPriceMin, buyPriceMax, stopLossPrice, targetPrice } = plan.rules
  if (transaction.kind === "buy" && buyPriceMin && buyPriceMax && (transaction.price < buyPriceMin || transaction.price > buyPriceMax)) {
    return { plan, status: "warning", notes: "买入价格不在计划区间内。" }
  }

  if (transaction.kind === "sell" && stopLossPrice && transaction.price <= stopLossPrice) {
    return { plan, status: "matched", notes: "卖出价格触发止损条件。" }
  }

  if (transaction.kind === "sell" && targetPrice && transaction.price >= targetPrice) {
    return { plan, status: "matched", notes: "卖出价格达到目标价条件。" }
  }

  return { plan, status: "matched", notes: "资产、方向和金额未触发规则偏离。" }
}

export function getRuleCheckLabel(status?: PlanRuleCheck) {
  if (status === "matched") return "符合计划"
  if (status === "warning") return "需说明"
  if (status === "violated") return "偏离计划"
  return "未检查"
}

export function getStatusLabel(status: InvestmentPlanStatus) {
  const labels: Record<InvestmentPlanStatus, string> = {
    draft: "草稿",
    active: "执行中",
    paused: "暂停",
    completed: "已完成",
    invalidated: "已失效",
    archived: "已归档",
  }
  return labels[status]
}

function normalizePlan(value: Partial<InvestmentPlan>): InvestmentPlan {
  const fallback = createPlanFromTemplate(value.planType ?? "dca")
  return {
    ...fallback,
    ...value,
    id: String(value.id ?? fallback.id),
    assets: Array.isArray(value.assets) ? value.assets : fallback.assets,
    rules: { ...fallback.rules, ...(value.rules ?? {}) },
    riskControl: { ...fallback.riskControl, ...(value.riskControl ?? {}) },
    schedule: { ...fallback.schedule, ...(value.schedule ?? {}) },
    linkedTransactionIds: Array.isArray(value.linkedTransactionIds) ? value.linkedTransactionIds : [],
    linkedReviewIds: Array.isArray(value.linkedReviewIds) ? value.linkedReviewIds : [],
    executionStats: { ...fallback.executionStats, ...(value.executionStats ?? {}) },
  }
}

function normalizeTransaction(value: Partial<PlanLinkedTransaction>): PlanLinkedTransaction {
  return {
    id: String(value.id ?? `tx-${Date.now()}`),
    date: String(value.date ?? today),
    kind: value.kind === "sell" ? "sell" : "buy",
    asset: String(value.asset ?? ""),
    symbol: String(value.symbol ?? ""),
    quantity: Number(value.quantity ?? 0),
    price: Number(value.price ?? 0),
    amount: Number(value.amount ?? 0),
    reason: String(value.reason ?? ""),
    result: String(value.result ?? ""),
    tags: Array.isArray(value.tags) ? value.tags.map(String) : [],
    planId: value.planId,
    planRuleCheck: value.planRuleCheck ?? "not_checked",
    planRuleNotes: value.planRuleNotes ?? "",
  }
}
