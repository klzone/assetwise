"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Archive, CheckCircle, Eye, Pause, Plus, RotateCcw, ShieldAlert, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState, FilterToolbar, MetricCard, PageHeader, PageShell, SectionPanel } from "@/components/ui/workspace"
import {
  calculatePlanStats,
  createPlanFromTemplate,
  getPlanTypeMeta,
  getStatusLabel,
  getStoredInvestmentPlans,
  getStoredPlanTransactions,
  planTemplates,
  refreshPlanExecutionStats,
  saveStoredInvestmentPlans,
  type InvestmentPlan,
  type InvestmentPlanStatus,
  type InvestmentPlanType,
  type PlanLinkedTransaction,
} from "@/lib/investment-plans"

const editableStatuses: InvestmentPlanStatus[] = ["draft", "active", "paused", "completed", "invalidated", "archived"]

export default function PlansPage() {
  const [plans, setPlans] = useState<InvestmentPlan[]>([])
  const [transactions, setTransactions] = useState<PlanLinkedTransaction[]>([])
  const [typeFilter, setTypeFilter] = useState<"all" | InvestmentPlanType>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | InvestmentPlanStatus>("all")
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null)
  const [detailPlan, setDetailPlan] = useState<InvestmentPlan | null>(null)

  const loadPlans = () => {
    const storedTransactions = getStoredPlanTransactions()
    const storedPlans = refreshPlanExecutionStats(getStoredInvestmentPlans(), storedTransactions)
    setTransactions(storedTransactions)
    setPlans(storedPlans)
  }

  useEffect(() => {
    loadPlans()
    window.addEventListener("assetwise-plans-updated", loadPlans)
    window.addEventListener("assetwise-transactions-updated", loadPlans)
    return () => {
      window.removeEventListener("assetwise-plans-updated", loadPlans)
      window.removeEventListener("assetwise-transactions-updated", loadPlans)
    }
  }, [])

  const filteredPlans = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return plans.filter((plan) => {
      const matchesType = typeFilter === "all" || plan.planType === typeFilter
      const matchesStatus = statusFilter === "all" || plan.status === statusFilter
      const matchesQuery =
        !normalizedQuery ||
        plan.title.toLowerCase().includes(normalizedQuery) ||
        plan.objective.toLowerCase().includes(normalizedQuery) ||
        plan.thesis.toLowerCase().includes(normalizedQuery) ||
        plan.assets.some((asset) => asset.name.toLowerCase().includes(normalizedQuery) || asset.symbol.toLowerCase().includes(normalizedQuery))

      return matchesType && matchesStatus && matchesQuery
    })
  }, [plans, query, statusFilter, typeFilter])

  const stats = calculatePlanStats(plans, transactions)

  const persistPlans = (nextPlans: InvestmentPlan[]) => {
    const refreshed = refreshPlanExecutionStats(nextPlans, transactions)
    setPlans(refreshed)
    saveStoredInvestmentPlans(refreshed)
  }

  const openCreateDialog = () => {
    setEditingPlan(createPlanFromTemplate("dca"))
    setDialogOpen(true)
  }

  const openEditDialog = (plan: InvestmentPlan) => {
    setEditingPlan(plan)
    setDialogOpen(true)
  }

  const handleSavePlan = (plan: InvestmentPlan) => {
    const timestamp = new Date().toISOString()
    const nextPlan = { ...plan, updatedAt: timestamp }
    const exists = plans.some((item) => item.id === nextPlan.id)
    const nextPlans = exists
      ? plans.map((item) => (item.id === nextPlan.id ? nextPlan : item))
      : [{ ...nextPlan, createdAt: timestamp }, ...plans]

    persistPlans(nextPlans)
    setDialogOpen(false)
    setEditingPlan(null)
  }

  const updatePlanStatus = (plan: InvestmentPlan, status: InvestmentPlanStatus) => {
    persistPlans(plans.map((item) => (item.id === plan.id ? { ...item, status, updatedAt: new Date().toISOString() } : item)))
  }

  const archivePlan = (plan: InvestmentPlan) => updatePlanStatus(plan, "archived")

  return (
    <PageShell>
      <PageHeader
        eyebrow="Plans"
        title="投资计划"
        description="交易前写清楚假设、仓位、触发条件和退出规则；交易后检查是否符合计划。"
        actions={
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            新建计划
          </Button>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard title="执行中计划" value={stats.activePlans} detail={`${stats.totalPlans} 个总计划`} />
        <MetricCard title="待复盘提醒" value={stats.dueReviews} tone={stats.dueReviews > 0 ? "warning" : "default"} />
        <MetricCard title="偏离规则交易" value={stats.violatedTransactions} tone={stats.violatedTransactions > 0 ? "negative" : "default"} />
        <MetricCard title="目标金额" value={`¥${stats.totalTargetAmount.toLocaleString("zh-CN")}`} detail={`已执行 ¥${stats.totalInvestedAmount.toLocaleString("zh-CN")}`} />
      </section>

      <SectionPanel eyebrow="Discipline Center" title="计划工作台" description={`${filteredPlans.length} 个计划`}>
        <FilterToolbar
          className="mb-4"
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="搜索计划、资产或假设"
          filters={
            <>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | InvestmentPlanType)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {planTemplates.map((template) => (
                    <SelectItem key={template.type} value={template.type}>
                      {template.shortLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | InvestmentPlanStatus)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  {editableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />

        {filteredPlans.length > 0 ? (
          <div className="grid gap-3">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                transactions={transactions.filter((transaction) => transaction.planId === plan.id)}
                onView={() => setDetailPlan(plan)}
                onEdit={() => openEditDialog(plan)}
                onStatusChange={(status) => updatePlanStatus(plan, status)}
                onArchive={() => archivePlan(plan)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Target}
            title="还没有匹配的投资计划"
            description="换一个筛选条件，或从模板创建一条新的投资计划。"
            action={
              <Button className="gap-2" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                新建计划
              </Button>
            }
          />
        )}
      </SectionPanel>

      <PlanEditorDialog
        open={dialogOpen}
        plan={editingPlan}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingPlan(null)
        }}
        onSave={handleSavePlan}
      />
      <PlanDetailDialog
        plan={detailPlan}
        transactions={detailPlan ? transactions.filter((transaction) => transaction.planId === detailPlan.id) : []}
        onOpenChange={(open) => !open && setDetailPlan(null)}
        onEdit={(plan) => {
          setDetailPlan(null)
          openEditDialog(plan)
        }}
      />
    </PageShell>
  )
}

function PlanCard({
  plan,
  transactions,
  onView,
  onEdit,
  onStatusChange,
  onArchive,
}: {
  plan: InvestmentPlan
  transactions: PlanLinkedTransaction[]
  onView: () => void
  onEdit: () => void
  onStatusChange: (status: InvestmentPlanStatus) => void
  onArchive: () => void
}) {
  const template = getPlanTypeMeta(plan.planType)
  const statusTone = plan.executionStats.violatedTransactions > 0 ? "destructive" : plan.status === "active" ? "default" : "secondary"
  const checkSummary = [
    `${plan.executionStats.matchedTransactions} 符合`,
    `${plan.executionStats.warningTransactions} 需说明`,
    `${plan.executionStats.violatedTransactions} 偏离`,
  ].join(" · ")

  return (
    <article className="rounded-[1.05rem] border border-white/80 bg-card/62 p-4 shadow-sm backdrop-blur-xl transition-smooth hover:border-border-hover hover:shadow-md">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{template.shortLabel}</Badge>
            <Badge variant={statusTone}>{getStatusLabel(plan.status)}</Badge>
            <RiskBadge risk={plan.riskLevel} />
            {plan.executionStats.violatedTransactions > 0 ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                有偏离
              </Badge>
            ) : null}
          </div>
          <h2 className="text-lg font-semibold text-foreground">{plan.title}</h2>
          <p className="mt-1.5 max-w-3xl text-xs leading-5 text-muted-foreground">{plan.objective}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={onView}>
            <Eye className="h-4 w-4" aria-hidden="true" />
            详情
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            编辑
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.8fr]">
        <div>
          <p className="label-tiny mb-1.5">投资假设</p>
          <p className="line-clamp-3 text-xs leading-5 text-foreground-secondary">{plan.thesis}</p>
        </div>
        <div>
          <p className="label-tiny mb-1.5">主要规则</p>
          <p className="line-clamp-3 text-xs leading-5 text-foreground-secondary">{plan.rules.entry}</p>
        </div>
        <div>
          <p className="label-tiny mb-1.5">执行进度</p>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-tabular">{plan.executionStats.progressPercent.toFixed(1)}%</span>
            <span className="text-muted-foreground">¥{plan.executionStats.investedAmount.toLocaleString("zh-CN")}</span>
          </div>
          <Progress value={plan.executionStats.progressPercent} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 border-t border-border/80 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {plan.assets.map((asset) => (
            <Badge key={`${asset.symbol}-${asset.name}`} variant="secondary">
              {asset.symbol || asset.name || "未命名资产"}
            </Badge>
          ))}
          <span>{transactions.length} 条关联交易</span>
          <span>{checkSummary}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {plan.status === "active" ? (
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => onStatusChange("paused")}>
              <Pause className="h-4 w-4" aria-hidden="true" />
              暂停
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => onStatusChange("active")}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              激活
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => onStatusChange("completed")}>
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            完成
          </Button>
          <Button variant="ghost" size="sm" className="gap-1" onClick={onArchive}>
            <Archive className="h-4 w-4" aria-hidden="true" />
            归档
          </Button>
        </div>
      </div>
    </article>
  )
}

function PlanEditorDialog({
  open,
  plan,
  onOpenChange,
  onSave,
}: {
  open: boolean
  plan: InvestmentPlan | null
  onOpenChange: (open: boolean) => void
  onSave: (plan: InvestmentPlan) => void
}) {
  const [draft, setDraft] = useState<InvestmentPlan | null>(plan)

  useEffect(() => {
    setDraft(plan)
  }, [plan])

  if (!draft) return null

  const template = getPlanTypeMeta(draft.planType)
  const primaryAsset = draft.assets[0] ?? { symbol: "", name: "", allocation: 100, targetAmount: draft.targetAmount }

  const updateDraft = (patch: Partial<InvestmentPlan>) => setDraft((value) => (value ? { ...value, ...patch } : value))
  const updateRules = (patch: Partial<InvestmentPlan["rules"]>) => updateDraft({ rules: { ...draft.rules, ...patch } })
  const updateRisk = (patch: Partial<InvestmentPlan["riskControl"]>) => updateDraft({ riskControl: { ...draft.riskControl, ...patch } })
  const updateSchedule = (patch: Partial<InvestmentPlan["schedule"]>) => updateDraft({ schedule: { ...draft.schedule, ...patch } })
  const updatePrimaryAsset = (patch: Partial<typeof primaryAsset>) => {
    const nextAsset = { ...primaryAsset, ...patch }
    updateDraft({ assets: [nextAsset], targetAmount: nextAsset.targetAmount || draft.targetAmount })
  }

  const handleTypeChange = (type: InvestmentPlanType) => {
    const next = createPlanFromTemplate(type)
    setDraft({
      ...next,
      id: draft.id,
      title: next.title,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      linkedTransactionIds: draft.linkedTransactionIds,
      linkedReviewIds: draft.linkedReviewIds,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{draft.linkedTransactionIds.length > 0 ? "编辑投资计划" : "创建投资计划"}</DialogTitle>
          <DialogDescription>先选择计划类型，再填写目标、资产、规则、风控和复盘节奏。</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <section>
            <p className="label-tiny mb-3">1. 选择计划类型</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {planTemplates.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleTypeChange(item.type)}
                  className={`rounded-xl border p-3 text-left transition-smooth hover:border-border-hover ${
                    draft.planType === item.type ? "border-foreground bg-foreground text-background" : "border-border bg-background"
                  }`}
                >
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className={`mt-2 text-xs leading-5 ${draft.planType === item.type ? "text-background/75" : "text-muted-foreground"}`}>
                    {item.description}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Field label="计划标题">
              <Input value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} />
            </Field>
            <Field label="状态">
              <Select value={draft.status} onValueChange={(status) => updateDraft({ status: status as InvestmentPlanStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="计划目标">
              <Textarea value={draft.objective} onChange={(event) => updateDraft({ objective: event.target.value })} rows={3} />
            </Field>
            <Field label="投资假设">
              <Textarea value={draft.thesis} onChange={(event) => updateDraft({ thesis: event.target.value })} rows={3} />
            </Field>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <Field label="资产名称">
              <Input value={primaryAsset.name} onChange={(event) => updatePrimaryAsset({ name: event.target.value })} placeholder="沪深300 ETF" />
            </Field>
            <Field label="资产代码">
              <Input value={primaryAsset.symbol} onChange={(event) => updatePrimaryAsset({ symbol: event.target.value.toUpperCase() })} placeholder="510300" />
            </Field>
            <Field label="目标金额">
              <Input
                value={String(primaryAsset.targetAmount || draft.targetAmount)}
                onChange={(event) => updatePrimaryAsset({ targetAmount: Number(event.target.value || 0) })}
                inputMode="decimal"
              />
            </Field>
            <Field label="目标仓位 %">
              <Input
                value={String(primaryAsset.allocation)}
                onChange={(event) => updatePrimaryAsset({ allocation: Number(event.target.value || 0) })}
                inputMode="decimal"
              />
            </Field>
          </section>

          <section>
            <p className="label-tiny mb-3">模板重点字段</p>
            <div className="flex flex-wrap gap-2">
              {template.fields.map((field) => (
                <Badge key={field} variant="secondary">
                  {field}
                </Badge>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <RuleField label="入场/买入规则" value={draft.rules.entry} onChange={(entry) => updateRules({ entry })} />
            <RuleField label="加仓规则" value={draft.rules.add} onChange={(add) => updateRules({ add })} />
            <RuleField label="减仓规则" value={draft.rules.reduce} onChange={(reduce) => updateRules({ reduce })} />
            <RuleField label="退出规则" value={draft.rules.exit} onChange={(exit) => updateRules({ exit })} />
            <RuleField label="止损/暂停规则" value={draft.rules.stopLoss} onChange={(stopLoss) => updateRules({ stopLoss })} />
            <RuleField label="失效条件" value={draft.rules.invalidation} onChange={(invalidation) => updateRules({ invalidation })} />
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <Field label="单笔上限">
              <Input value={String(draft.riskControl.maxSingleTradeAmount)} onChange={(event) => updateRisk({ maxSingleTradeAmount: Number(event.target.value || 0) })} inputMode="decimal" />
            </Field>
            <Field label="最大仓位 %">
              <Input value={String(draft.riskControl.maxPositionPercent)} onChange={(event) => updateRisk({ maxPositionPercent: Number(event.target.value || 0) })} inputMode="decimal" />
            </Field>
            <Field label="最大亏损">
              <Input value={String(draft.riskControl.maxLossAmount)} onChange={(event) => updateRisk({ maxLossAmount: Number(event.target.value || 0) })} inputMode="decimal" />
            </Field>
            <Field label="最大回撤 %">
              <Input value={String(draft.riskControl.maxDrawdownPercent)} onChange={(event) => updateRisk({ maxDrawdownPercent: Number(event.target.value || 0) })} inputMode="decimal" />
            </Field>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <Field label="开始日期">
              <Input value={draft.schedule.startDate} onChange={(event) => updateSchedule({ startDate: event.target.value })} type="date" />
            </Field>
            <Field label="结束日期">
              <Input value={draft.schedule.endDate ?? ""} onChange={(event) => updateSchedule({ endDate: event.target.value })} type="date" />
            </Field>
            <Field label="复盘频率">
              <Select value={draft.schedule.reviewFrequency} onValueChange={(reviewFrequency) => updateSchedule({ reviewFrequency: reviewFrequency as InvestmentPlan["schedule"]["reviewFrequency"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">每日</SelectItem>
                  <SelectItem value="weekly">每周</SelectItem>
                  <SelectItem value="biweekly">双周</SelectItem>
                  <SelectItem value="monthly">每月</SelectItem>
                  <SelectItem value="quarterly">每季</SelectItem>
                  <SelectItem value="yearly">每年</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="下次复盘">
              <Input value={draft.schedule.nextReviewDate ?? ""} onChange={(event) => updateSchedule({ nextReviewDate: event.target.value })} type="date" />
            </Field>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => onSave(draft)} disabled={!draft.title.trim() || !draft.objective.trim()}>
            保存计划
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PlanDetailDialog({
  plan,
  transactions,
  onOpenChange,
  onEdit,
}: {
  plan: InvestmentPlan | null
  transactions: PlanLinkedTransaction[]
  onOpenChange: (open: boolean) => void
  onEdit: (plan: InvestmentPlan) => void
}) {
  if (!plan) return null
  const template = getPlanTypeMeta(plan.planType)

  return (
    <Dialog open={Boolean(plan)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{plan.title}</DialogTitle>
          <DialogDescription>
            {template.label} · {getStatusLabel(plan.status)} · {transactions.length} 条关联交易
          </DialogDescription>
        </DialogHeader>

          <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MiniStat label="目标金额" value={`¥${plan.targetAmount.toLocaleString("zh-CN")}`} />
            <MiniStat label="已执行" value={`¥${plan.executionStats.investedAmount.toLocaleString("zh-CN")}`} />
            <MiniStat label="规则偏离" value={String(plan.executionStats.violatedTransactions)} />
          </div>

          <div>
            <p className="label-tiny mb-2">计划目标</p>
            <p className="text-sm leading-6 text-foreground-secondary">{plan.objective}</p>
          </div>
          <div>
            <p className="label-tiny mb-2">投资假设</p>
            <p className="text-sm leading-6 text-foreground-secondary">{plan.thesis}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <RuleBlock title="入场" value={plan.rules.entry} />
            <RuleBlock title="加仓" value={plan.rules.add} />
            <RuleBlock title="减仓" value={plan.rules.reduce} />
            <RuleBlock title="退出" value={plan.rules.exit} />
            <RuleBlock title="止损/暂停" value={plan.rules.stopLoss} />
            <RuleBlock title="失效条件" value={plan.rules.invalidation} icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />} />
          </div>

          <div>
            <p className="label-tiny mb-3">关联交易</p>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">{transaction.asset}</div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.kind === "buy" ? "买入" : "卖出"} · ¥{transaction.amount.toLocaleString("zh-CN")} · {transaction.date}
                      </div>
                    </div>
                    <Badge variant={transaction.planRuleCheck === "violated" ? "destructive" : transaction.planRuleCheck === "warning" ? "secondary" : "default"}>
                      {transaction.planRuleNotes || "已关联"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-background p-4 text-xs leading-5 text-muted-foreground">
                暂无关联交易。新增交易时选择该计划后，会自动出现在这里。
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onEdit(plan)}>
            编辑计划
          </Button>
          <Button onClick={() => onOpenChange(false)}>完成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RiskBadge({ risk }: { risk: InvestmentPlan["riskLevel"] }) {
  const label = risk === "high" ? "高风险" : risk === "medium" ? "中风险" : "低风险"
  return <Badge variant="outline">{label}</Badge>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function RuleField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} />
    </Field>
  )
}

function RuleBlock({ title, value, icon }: { title: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <p className="label-tiny">{title}</p>
      </div>
      <p className="text-sm leading-6 text-foreground-secondary">{value}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="label-tiny mb-2">{label}</p>
      <p className="font-tabular text-xl font-semibold text-foreground">{value}</p>
    </div>
  )
}
