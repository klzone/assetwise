"use client"

import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Link2,
  Pencil,
  Plus,
  Search,
  Star,
  Target,
  Trash2,
} from "lucide-react"
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
  getRuleCheckLabel,
  getStoredInvestmentPlans,
  getStoredPlanTransactions,
  refreshPlanExecutionStats,
  saveStoredInvestmentPlans,
  type InvestmentPlan,
  type PlanLinkedTransaction,
  type PlanRuleCheck,
} from "@/lib/investment-plans"
import {
  buildReviewDraftFromPlan,
  buildReviewDraftFromTransaction,
  createEmptyReviewDraft,
  focusOptions,
  getFocusLabel,
  getReviewResultLabel,
  getReviewStats,
  getStoredReviews,
  isTransactionDeviation,
  saveStoredReviews,
  syncPlanReviewLinks,
  type ReviewDraft,
  type ReviewFocus,
  type ReviewResult,
  type TargetedReview,
} from "@/lib/review-logs"

type ReviewForm = ReviewDraft & {
  sourceTransactionId: string
  sourcePlanId: string
  tagsText: string
}

const today = "2026-06-18"

function createEmptyForm(): ReviewForm {
  const draft = createEmptyReviewDraft()
  return {
    ...draft,
    sourceTransactionId: "none",
    sourcePlanId: "none",
    tagsText: draft.tags.join("，"),
  }
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<TargetedReview[]>([])
  const [plans, setPlans] = useState<InvestmentPlan[]>([])
  const [transactions, setTransactions] = useState<PlanLinkedTransaction[]>([])
  const [query, setQuery] = useState("")
  const [focus, setFocus] = useState<"all" | ReviewFocus>("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [deletingReview, setDeletingReview] = useState<TargetedReview | null>(null)
  const [form, setForm] = useState<ReviewForm>(createEmptyForm)

  const loadData = () => {
    const storedTransactions = getStoredPlanTransactions()
    const storedPlans = refreshPlanExecutionStats(getStoredInvestmentPlans(), storedTransactions)
    setTransactions(storedTransactions)
    setPlans(storedPlans)
    setReviews(getStoredReviews())
  }

  useEffect(() => {
    loadData()
    window.addEventListener("assetwise-plans-updated", loadData)
    window.addEventListener("assetwise-transactions-updated", loadData)
    window.addEventListener("assetwise-reviews-updated", loadData)
    return () => {
      window.removeEventListener("assetwise-plans-updated", loadData)
      window.removeEventListener("assetwise-transactions-updated", loadData)
      window.removeEventListener("assetwise-reviews-updated", loadData)
    }
  }, [])

  const stats = useMemo(() => getReviewStats(reviews, plans, transactions), [plans, reviews, transactions])

  const reviewedTransactionIds = useMemo(() => new Set(reviews.flatMap((review) => review.transactionIds)), [reviews])
  const reviewedPlanIds = useMemo(() => new Set(reviews.map((review) => review.planId).filter(Boolean)), [reviews])

  const pendingTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (reviewedTransactionIds.has(transaction.id)) return false
        return Boolean(transaction.planId) || isTransactionDeviation(transaction.planRuleCheck)
      }),
    [reviewedTransactionIds, transactions],
  )

  const duePlans = useMemo(
    () =>
      plans.filter((plan) => {
        if (plan.status !== "active" || reviewedPlanIds.has(plan.id)) return false
        return Boolean(plan.schedule.nextReviewDate && plan.schedule.nextReviewDate <= today)
      }),
    [plans, reviewedPlanIds],
  )

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return reviews.filter((review) => {
      const plan = plans.find((item) => item.id === review.planId)
      const linkedTransactions = transactions.filter((transaction) => review.transactionIds.includes(transaction.id))
      const matchesFocus = focus === "all" || review.focus === focus
      const matchesPlan = planFilter === "all" || review.planId === planFilter
      const searchable = [
        review.title,
        review.decisionSnapshot,
        review.executionSummary,
        review.planExpectation,
        review.actualOutcome,
        review.lesson,
        review.nextAction,
        plan?.title,
        ...review.tags,
        ...linkedTransactions.flatMap((transaction) => [transaction.asset, transaction.symbol, transaction.planRuleNotes ?? ""]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return matchesFocus && matchesPlan && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [focus, planFilter, plans, query, reviews, transactions])

  const openManualReview = () => {
    setEditingReviewId(null)
    setForm(createEmptyForm())
    setDialogOpen(true)
  }

  const openFromTransaction = (transactionId: string) => {
    const transaction = transactions.find((item) => item.id === transactionId)
    if (!transaction) return
    const plan = plans.find((item) => item.id === transaction.planId) ?? null
    setEditingReviewId(null)
    setForm(toForm(buildReviewDraftFromTransaction(transaction, plan), transaction.id, plan?.id))
    setDialogOpen(true)
  }

  const openFromPlan = (planId: string) => {
    const plan = plans.find((item) => item.id === planId)
    if (!plan) return
    setEditingReviewId(null)
    setForm(toForm(buildReviewDraftFromPlan(plan, transactions), "none", plan.id))
    setDialogOpen(true)
  }

  const openEditReview = (review: TargetedReview) => {
    setEditingReviewId(review.id)
    setForm(toFormFromReview(review))
    setDialogOpen(true)
  }

  const updateForm = <K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSourceTransactionChange = (value: string) => {
    if (value === "none") {
      updateForm("sourceTransactionId", "none")
      return
    }
    const transaction = transactions.find((item) => item.id === value)
    if (!transaction) return
    const plan = plans.find((item) => item.id === transaction.planId) ?? null
    setForm(toForm(buildReviewDraftFromTransaction(transaction, plan), transaction.id, plan?.id))
  }

  const handleSourcePlanChange = (value: string) => {
    if (value === "none") {
      updateForm("sourcePlanId", "none")
      return
    }
    const plan = plans.find((item) => item.id === value)
    if (!plan) return
    setForm(toForm(buildReviewDraftFromPlan(plan, transactions), "none", plan.id))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title.trim()) return

    const timestamp = new Date().toISOString()
    const existingReview = editingReviewId ? reviews.find((review) => review.id === editingReviewId) : null
    const nextReview: TargetedReview = {
      id: existingReview?.id ?? `review-${Date.now()}`,
      date: form.date,
      title: form.title.trim(),
      focus: form.focus,
      planId: form.planId,
      transactionIds: form.transactionIds,
      result: form.result,
      emotionScore: clampEmotionScore(form.emotionScore),
      decisionSnapshot: form.decisionSnapshot.trim(),
      executionSummary: form.executionSummary.trim(),
      planExpectation: form.planExpectation.trim(),
      actualOutcome: form.actualOutcome.trim(),
      lesson: form.lesson.trim(),
      nextAction: form.nextAction.trim(),
      tags: parseTags(form.tagsText),
      createdAt: existingReview?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }

    const nextReviews = existingReview
      ? reviews.map((review) => (review.id === existingReview.id ? nextReview : review))
      : [nextReview, ...reviews]
    const nextPlans = syncPlanReviewLinks(plans, nextReviews)
    setReviews(nextReviews)
    setPlans(nextPlans)
    saveStoredReviews(nextReviews)
    saveStoredInvestmentPlans(nextPlans)
    setDialogOpen(false)
    setEditingReviewId(null)
    setForm(createEmptyForm())
  }

  const handleDeleteReview = () => {
    if (!deletingReview) return

    const nextReviews = reviews.filter((review) => review.id !== deletingReview.id)
    const nextPlans = syncPlanReviewLinks(plans, nextReviews)
    setReviews(nextReviews)
    setPlans(nextPlans)
    saveStoredReviews(nextReviews)
    saveStoredInvestmentPlans(nextPlans)
    setDeletingReview(null)
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Reviews"
        title="复盘日志"
        description="把交易结果和投资计划放回同一张桌面上，复盘每一次执行是否服务原计划、偏离是否有理由、下一步如何修正。"
        actions={
          <Button className="gap-2" onClick={openManualReview}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            新建复盘
          </Button>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard title="复盘数量" value={stats.totalReviews} icon={BookOpen} />
        <MetricCard title="关联交易" value={stats.linkedTransactions} icon={Link2} />
        <MetricCard title="关联计划" value={stats.linkedPlans} icon={Target} />
        <MetricCard
          title="待复盘线索"
          value={stats.pendingReviews}
          tone={stats.pendingReviews > 0 ? "warning" : "default"}
          icon={CalendarClock}
          detail={stats.needsFix > 0 ? `${stats.needsFix} 条复盘结论需要修正动作` : "计划内交易也会进入复盘闭环"}
        />
      </section>

      {(pendingTransactions.length > 0 || duePlans.length > 0) && (
        <SectionPanel
          className="mb-4"
          eyebrow="Review Queue"
          title="待复盘线索"
          description="优先处理已经关联计划、出现偏离或到达复盘日的事项。"
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {pendingTransactions.slice(0, 4).map((transaction) => {
              const plan = plans.find((item) => item.id === transaction.planId)
              return (
                <button
                  key={transaction.id}
                  type="button"
                  onClick={() => openFromTransaction(transaction.id)}
                  className="rounded-xl border border-border bg-background p-3 text-left transition-smooth hover:border-primary/40 hover:bg-background-secondary"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <ReviewCueIcon status={transaction.planRuleCheck} />
                    <span className="font-medium text-foreground">{transaction.asset}</span>
                    <Badge variant="outline">{transaction.symbol}</Badge>
                    <RuleCheckBadge status={transaction.planRuleCheck} />
                  </div>
                  <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{transaction.reason}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {plan ? `关联计划：${plan.title}` : "未关联计划，需要补充交易依据"}
                  </p>
                </button>
              )
            })}

            {duePlans.slice(0, 4).map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => openFromPlan(plan.id)}
                className="rounded-xl border border-border bg-background p-3 text-left transition-smooth hover:border-primary/40 hover:bg-background-secondary"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-warning" aria-hidden="true" />
                  <span className="font-medium text-foreground">{plan.title}</span>
                  <Badge variant="secondary">到期复盘</Badge>
                </div>
                <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{plan.objective}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  完成度 {plan.executionStats.progressPercent.toFixed(0)}% · 下一复盘日 {plan.schedule.nextReviewDate}
                </p>
              </button>
            ))}
          </div>
        </SectionPanel>
      )}

      <SectionPanel eyebrow="Journal" title="有针对性的复盘" description={`${filteredReviews.length} 条记录`}>
        <FilterToolbar
          className="mb-4"
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="搜索计划、交易、结论或下一步动作"
          filters={
            <>
              <Select value={focus} onValueChange={(value) => setFocus(value as "all" | ReviewFocus)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部焦点</SelectItem>
                  {focusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部计划</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />

        {filteredReviews.length > 0 ? (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                plan={plans.find((plan) => plan.id === review.planId) ?? null}
                transactions={transactions.filter((transaction) => review.transactionIds.includes(transaction.id))}
                onEdit={() => openEditReview(review)}
                onDelete={() => setDeletingReview(review)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="没有找到复盘"
            description="换一个关键词、计划或焦点筛选试试，也可以从待复盘线索直接生成草稿。"
          />
        )}
      </SectionPanel>

      <ReviewEditorDialog
        open={dialogOpen}
        form={form}
        plans={plans}
        transactions={transactions}
        onFormChange={updateForm}
        onSourceTransactionChange={handleSourceTransactionChange}
        onSourcePlanChange={handleSourcePlanChange}
        onSubmit={handleSubmit}
        mode={editingReviewId ? "edit" : "create"}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingReviewId(null)
            setForm(createEmptyForm())
          }
        }}
      />
      <DeleteReviewDialog review={deletingReview} onCancel={() => setDeletingReview(null)} onConfirm={handleDeleteReview} />
    </PageShell>
  )
}

function ReviewCard({
  review,
  plan,
  transactions,
  onEdit,
  onDelete,
}: {
  review: TargetedReview
  plan: InvestmentPlan | null
  transactions: PlanLinkedTransaction[]
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <article className="rounded-[1.05rem] border border-white/80 bg-card/62 p-4 shadow-sm backdrop-blur-xl">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">{review.title}</h2>
            <Badge variant="outline">{getFocusLabel(review.focus)}</Badge>
            <ResultBadge result={review.result} />
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>{review.date}</span>
            {plan ? <span>· 计划：{plan.title}</span> : null}
            {transactions.length > 0 ? <span>· 交易：{transactions.map((transaction) => transaction.symbol).join("、")}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex w-fit items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-sm font-semibold">
            <Star className="h-4 w-4 text-warning" aria-hidden="true" />
            <span className="font-tabular">{review.emotionScore}/10</span>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            编辑
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            删除
          </Button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <ReviewBlock label="当时决策" value={review.decisionSnapshot} />
        <ReviewBlock label="执行与结果" value={review.executionSummary} />
        <ReviewBlock label="计划预期" value={review.planExpectation} />
        <ReviewBlock label="实际结果" value={review.actualOutcome} />
        <ReviewBlock label="复盘结论" value={review.lesson || "待补充结论。"} />
        <ReviewBlock label="下一步动作" value={review.nextAction || "待补充下一步动作。"} />
      </div>

      <div className="grid gap-3 border-t border-border/80 pt-3 md:grid-cols-[1fr_1fr]">
        <div>
          <p className="label-tiny mb-3">关联交易结果</p>
          <div className="flex flex-wrap gap-2">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <Badge key={transaction.id} variant="outline" className="gap-1">
                  <Link2 className="h-3 w-3" aria-hidden="true" />
                  {transaction.asset} · {getRuleCheckLabel(transaction.planRuleCheck)}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">未关联交易</span>
            )}
          </div>
        </div>
        <div>
          <p className="label-tiny mb-3">标签</p>
          <div className="flex flex-wrap gap-2">
            {review.tags.length > 0 ? (
              review.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">暂无标签</span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function ReviewEditorDialog({
  open,
  form,
  plans,
  transactions,
  onFormChange,
  onSourceTransactionChange,
  onSourcePlanChange,
  onSubmit,
  mode,
  onOpenChange,
}: {
  open: boolean
  form: ReviewForm
  plans: InvestmentPlan[]
  transactions: PlanLinkedTransaction[]
  onFormChange: <K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) => void
  onSourceTransactionChange: (value: string) => void
  onSourcePlanChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  mode: "create" | "edit"
  onOpenChange: (open: boolean) => void
}) {
  const linkedTransactions = transactions.filter((transaction) => form.transactionIds.includes(transaction.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "编辑复盘" : "新建复盘"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "调整复盘内容、关联计划或交易引用，保存后会同步计划引用。" : "先从交易或计划生成复盘草稿，再补充结论和下一步动作。"}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="从交易生成">
              <Select value={form.sourceTransactionId} onValueChange={onSourceTransactionChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不选择交易</SelectItem>
                  {transactions.map((transaction) => (
                    <SelectItem key={transaction.id} value={transaction.id}>
                      {transaction.date} · {transaction.asset} · {getRuleCheckLabel(transaction.planRuleCheck)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="从计划生成">
              <Select value={form.sourcePlanId} onValueChange={onSourcePlanChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不选择计划</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_160px_160px_140px]">
            <Field label="标题">
              <Input value={form.title} onChange={(event) => onFormChange("title", event.target.value)} required />
            </Field>
            <Field label="日期">
              <Input value={form.date} onChange={(event) => onFormChange("date", event.target.value)} type="date" />
            </Field>
            <Field label="复盘焦点">
              <Select value={form.focus} onValueChange={(value) => onFormChange("focus", value as ReviewFocus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {focusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="结论">
              <Select value={form.result} onValueChange={(value) => onFormChange("result", value as ReviewResult)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="effective">有效</SelectItem>
                  <SelectItem value="neutral">观察中</SelectItem>
                  <SelectItem value="needs_fix">待修正</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_140px]">
            <Field label="关联投资计划">
              <Select value={form.planId ?? "none"} onValueChange={(value) => onFormChange("planId", value === "none" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不关联计划</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="情绪评分">
              <Input
                value={form.emotionScore}
                onChange={(event) => onFormChange("emotionScore", Number(event.target.value))}
                type="number"
                min={1}
                max={10}
                inputMode="numeric"
              />
            </Field>
          </div>

          {linkedTransactions.length > 0 && (
            <div className="rounded-xl border border-border bg-background-secondary p-3">
              <p className="label-tiny mb-3">已引用交易</p>
              <div className="flex flex-wrap gap-2">
                {linkedTransactions.map((transaction) => (
                  <Badge key={transaction.id} variant="outline">
                    {transaction.asset} · {getRuleCheckLabel(transaction.planRuleCheck)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="当时决策">
              <Textarea value={form.decisionSnapshot} onChange={(event) => onFormChange("decisionSnapshot", event.target.value)} rows={4} />
            </Field>
            <Field label="执行与结果">
              <Textarea value={form.executionSummary} onChange={(event) => onFormChange("executionSummary", event.target.value)} rows={4} />
            </Field>
            <Field label="计划预期">
              <Textarea value={form.planExpectation} onChange={(event) => onFormChange("planExpectation", event.target.value)} rows={4} />
            </Field>
            <Field label="实际结果">
              <Textarea value={form.actualOutcome} onChange={(event) => onFormChange("actualOutcome", event.target.value)} rows={4} />
            </Field>
            <Field label="复盘结论">
              <Textarea value={form.lesson} onChange={(event) => onFormChange("lesson", event.target.value)} rows={4} />
            </Field>
            <Field label="下一步动作">
              <Textarea value={form.nextAction} onChange={(event) => onFormChange("nextAction", event.target.value)} rows={4} />
            </Field>
          </div>

          <Field label="标签">
            <Input value={form.tagsText} onChange={(event) => onFormChange("tagsText", event.target.value)} placeholder="用逗号分隔，例如：计划内，定投，情绪" />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">保存复盘</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteReviewDialog({
  review,
  onCancel,
  onConfirm,
}: {
  review: TargetedReview | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={Boolean(review)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>删除复盘</DialogTitle>
          <DialogDescription>删除后会从关联计划中移除这条复盘引用，但不会删除原始交易或投资计划。</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-border bg-background-secondary p-3">
          <p className="text-sm font-medium text-foreground">{review?.title}</p>
          <p className="mt-2 text-sm text-muted-foreground">{review?.date}</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            删除复盘
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ResultBadge({ result }: { result: ReviewResult }) {
  const variant = result === "needs_fix" ? "destructive" : result === "effective" ? "default" : "secondary"
  return <Badge variant={variant}>{getReviewResultLabel(result)}</Badge>
}

function RuleCheckBadge({ status }: { status?: PlanRuleCheck }) {
  if (status === "violated") return <Badge variant="destructive">偏离计划</Badge>
  if (status === "warning") return <Badge variant="secondary">需说明</Badge>
  if (status === "matched") return <Badge variant="default">符合计划</Badge>
  return <Badge variant="outline">未检查</Badge>
}

function ReviewCueIcon({ status }: { status?: PlanRuleCheck }) {
  if (status === "matched") return <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
  if (status === "warning" || status === "violated") return <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
  return <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
}

function ReviewBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-border pl-3">
      <p className="label-tiny mb-1.5">{label}</p>
      <p className="line-clamp-3 text-xs leading-5 text-foreground-secondary">{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function toForm(draft: ReviewDraft, sourceTransactionId = "none", sourcePlanId = "none"): ReviewForm {
  return {
    ...draft,
    sourceTransactionId,
    sourcePlanId,
    tagsText: draft.tags.join("，"),
  }
}

function toFormFromReview(review: TargetedReview): ReviewForm {
  return {
    date: review.date,
    title: review.title,
    focus: review.focus,
    planId: review.planId,
    transactionIds: review.transactionIds,
    result: review.result,
    emotionScore: review.emotionScore,
    decisionSnapshot: review.decisionSnapshot,
    executionSummary: review.executionSummary,
    planExpectation: review.planExpectation,
    actualOutcome: review.actualOutcome,
    lesson: review.lesson,
    nextAction: review.nextAction,
    tags: review.tags,
    sourceTransactionId: review.transactionIds[0] ?? "none",
    sourcePlanId: review.planId ?? "none",
    tagsText: review.tags.join("，"),
  }
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 8)
}

function clampEmotionScore(value: number) {
  if (Number.isNaN(value)) return 5
  return Math.max(1, Math.min(10, Math.round(value)))
}
