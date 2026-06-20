"use client"

import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, CheckCircle, Eye, Plus, X } from "lucide-react"
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
import { FilterToolbar, MetricCard, PageHeader, PageShell, SectionPanel } from "@/components/ui/workspace"
import {
  evaluateTransactionAgainstPlan,
  findRecommendedPlan,
  getRuleCheckLabel,
  getStoredInvestmentPlans,
  getStoredPlanTransactions,
  refreshPlanExecutionStats,
  saveStoredInvestmentPlans,
  saveStoredPlanTransactions,
  type InvestmentPlan,
  type PlanLinkedTransaction,
  type PlanRuleCheck,
  type TransactionKind,
} from "@/lib/investment-plans"

type TransactionForm = {
  date: string
  kind: TransactionKind
  asset: string
  symbol: string
  quantity: string
  price: string
  reason: string
  result: string
  planId: string
  planRuleNotes: string
}

const emptyForm: TransactionForm = {
  date: "2026-06-18",
  kind: "buy",
  asset: "",
  symbol: "",
  quantity: "",
  price: "",
  reason: "",
  result: "",
  planId: "none",
  planRuleNotes: "",
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<PlanLinkedTransaction[]>([])
  const [plans, setPlans] = useState<InvestmentPlan[]>([])
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState<"all" | TransactionKind>("all")
  const [selected, setSelected] = useState<PlanLinkedTransaction | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<TransactionForm>(emptyForm)

  const loadData = () => {
    setTransactions(getStoredPlanTransactions())
    setPlans(getStoredInvestmentPlans())
  }

  useEffect(() => {
    loadData()
    window.addEventListener("assetwise-transactions-updated", loadData)
    window.addEventListener("assetwise-plans-updated", loadData)
    return () => {
      window.removeEventListener("assetwise-transactions-updated", loadData)
      window.removeEventListener("assetwise-plans-updated", loadData)
    }
  }, [])

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return transactions.filter((transaction) => {
      const matchesKind = kind === "all" || transaction.kind === kind
      const matchesQuery =
        !normalizedQuery ||
        transaction.asset.toLowerCase().includes(normalizedQuery) ||
        transaction.symbol.toLowerCase().includes(normalizedQuery) ||
        transaction.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))

      return matchesKind && matchesQuery
    })
  }, [kind, query, transactions])

  const totalBuy = transactions
    .filter((item) => item.kind === "buy")
    .reduce((sum, item) => sum + item.amount, 0)
  const totalSell = transactions
    .filter((item) => item.kind === "sell")
    .reduce((sum, item) => sum + item.amount, 0)
  const violatedCount = transactions.filter((item) => item.planRuleCheck === "violated").length

  const selectedPlan = form.planId === "none" ? null : plans.find((plan) => plan.id === form.planId) ?? null
  const draftAmount = Number(form.quantity || 0) * Number(form.price || 0)
  const draftEvaluation = evaluateTransactionAgainstPlan(
    {
      kind: form.kind,
      asset: form.asset,
      symbol: form.symbol,
      amount: draftAmount,
      price: Number(form.price || 0),
    },
    selectedPlan,
  )

  const updateForm = <K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) => {
    const nextForm = { ...form, [key]: value }

    if ((key === "asset" || key === "symbol") && nextForm.planId === "none") {
      const recommended = findRecommendedPlan({ asset: nextForm.asset, symbol: nextForm.symbol }, plans)
      if (recommended) {
        nextForm.planId = recommended.id
        nextForm.planRuleNotes = "系统根据资产自动推荐关联该计划。"
      }
    }

    setForm(nextForm)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const quantity = Number(form.quantity)
    const price = Number(form.price)
    const amount = quantity * price
    if (!form.asset.trim() || !form.symbol.trim() || Number.isNaN(quantity) || Number.isNaN(price) || amount <= 0) return

    const plan = form.planId === "none" ? null : plans.find((item) => item.id === form.planId) ?? null
    const evaluation = evaluateTransactionAgainstPlan(
      { kind: form.kind, asset: form.asset, symbol: form.symbol, amount, price },
      plan,
    )

    const nextTransaction: PlanLinkedTransaction = {
      id: `tx-${Date.now()}`,
      date: form.date,
      kind: form.kind,
      asset: form.asset.trim(),
      symbol: form.symbol.trim().toUpperCase(),
      quantity,
      price,
      amount,
      reason: form.reason.trim() || (plan ? `关联计划：${plan.title}` : "手动记录交易"),
      result: form.result.trim() || "待复盘",
      tags: plan ? [getRuleCheckLabel(evaluation.status), "计划关联"] : ["未关联计划"],
      planId: plan?.id,
      planRuleCheck: evaluation.status,
      planRuleNotes: form.planRuleNotes.trim() || evaluation.notes,
    }

    const nextTransactions = [nextTransaction, ...transactions]
    const refreshedPlans = refreshPlanExecutionStats(plans, nextTransactions)
    setTransactions(nextTransactions)
    setPlans(refreshedPlans)
    saveStoredPlanTransactions(nextTransactions)
    saveStoredInvestmentPlans(refreshedPlans)
    setDialogOpen(false)
    setForm(emptyForm)
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Transactions"
        title="交易记录"
        description="记录买入卖出、关联投资计划，并检查是否符合计划纪律。"
        actions={
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            新增交易
          </Button>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard title="交易笔数" value={transactions.length} />
        <MetricCard title="买入总额" value={`¥${totalBuy.toLocaleString("zh-CN")}`} tone="positive" />
        <MetricCard title="卖出总额" value={`¥${totalSell.toLocaleString("zh-CN")}`} tone="negative" />
        <MetricCard title="偏离计划" value={violatedCount} tone={violatedCount > 0 ? "negative" : "default"} />
      </section>

      <SectionPanel eyebrow="Ledger" title="交易明细" description={`${filteredTransactions.length} 条记录`}>
        <FilterToolbar
          className="mb-4"
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="搜索资产、代码或标签"
          filters={
            <Select value={kind} onValueChange={(value) => setKind(value as "all" | TransactionKind)}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="buy">买入</SelectItem>
                <SelectItem value="sell">卖出</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <div className="divide-y divide-border">
          {filteredTransactions.map((transaction) => {
            const plan = plans.find((item) => item.id === transaction.planId)
            return (
              <button
                key={transaction.id}
                type="button"
                onClick={() => setSelected(transaction)}
                className="grid w-full grid-cols-1 gap-3 rounded-xl px-2.5 py-3 text-left transition-smooth hover:bg-background-secondary/80 md:grid-cols-[1fr_auto]"
              >
                <div className="flex items-start gap-3">
                  <TransactionIcon kind={transaction.kind} />
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{transaction.asset}</h3>
                      <Badge variant="outline">{transaction.symbol}</Badge>
                      <Badge variant={transaction.kind === "buy" ? "default" : "secondary"}>
                        {transaction.kind === "buy" ? "买入" : "卖出"}
                      </Badge>
                      <RuleCheckBadge status={transaction.planRuleCheck} />
                    </div>
                    <p className="mb-2 max-w-3xl text-xs leading-5 text-muted-foreground">{transaction.reason}</p>
                    <div className="flex flex-wrap gap-2">
                      {plan ? <Badge variant="secondary">计划：{plan.title}</Badge> : null}
                      {transaction.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 md:justify-end">
                  <div className="text-left md:text-right">
                    <p className="font-tabular text-lg font-semibold text-foreground">¥{transaction.amount.toLocaleString("zh-CN")}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.quantity} 份 · {transaction.date}
                    </p>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
              </button>
            )
          })}
        </div>
      </SectionPanel>

      <TransactionEditorDialog
        open={dialogOpen}
        form={form}
        plans={plans}
        evaluation={draftEvaluation}
        onFormChange={updateForm}
        onSubmit={handleSubmit}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setForm(emptyForm)
        }}
      />
      <TransactionDetailDialog
        transaction={selected}
        plan={selected ? plans.find((item) => item.id === selected.planId) ?? null : null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </PageShell>
  )
}

function TransactionIcon({ kind }: { kind: TransactionKind }) {
  const isBuy = kind === "buy"
  const Icon = isBuy ? ArrowDownLeft : ArrowUpRight

  return (
    <div
      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
        isBuy ? "bg-success-light text-success" : "bg-destructive-light text-destructive"
      }`}
      aria-hidden="true"
    >
      <Icon className="h-4 w-4" />
    </div>
  )
}

function TransactionEditorDialog({
  open,
  form,
  plans,
  evaluation,
  onFormChange,
  onSubmit,
  onOpenChange,
}: {
  open: boolean
  form: TransactionForm
  plans: InvestmentPlan[]
  evaluation: { status: PlanRuleCheck; notes: string }
  onFormChange: <K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>新增交易</DialogTitle>
          <DialogDescription>关联投资计划后，系统会在保存前检查交易是否符合计划纪律。</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="日期">
              <Input value={form.date} onChange={(event) => onFormChange("date", event.target.value)} type="date" />
            </Field>
            <Field label="方向">
              <Select value={form.kind} onValueChange={(value) => onFormChange("kind", value as TransactionKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">买入</SelectItem>
                  <SelectItem value="sell">卖出</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="资产名称">
              <Input value={form.asset} onChange={(event) => onFormChange("asset", event.target.value)} placeholder="沪深300 ETF" required />
            </Field>
            <Field label="资产代码">
              <Input value={form.symbol} onChange={(event) => onFormChange("symbol", event.target.value.toUpperCase())} placeholder="510300" required />
            </Field>
            <Field label="数量">
              <Input value={form.quantity} onChange={(event) => onFormChange("quantity", event.target.value)} inputMode="decimal" required />
            </Field>
            <Field label="价格">
              <Input value={form.price} onChange={(event) => onFormChange("price", event.target.value)} inputMode="decimal" required />
            </Field>
            <Field label="关联计划">
              <Select value={form.planId} onValueChange={(value) => onFormChange("planId", value)}>
                <SelectTrigger className="md:col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不关联计划</SelectItem>
                  {plans
                    .filter((plan) => plan.status === "active" || plan.status === "draft")
                    .map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <RuleCheckPanel status={evaluation.status} notes={evaluation.notes} />

          {(evaluation.status === "warning" || evaluation.status === "violated") && (
            <Field label="偏离/说明原因">
              <Textarea
                value={form.planRuleNotes}
                onChange={(event) => onFormChange("planRuleNotes", event.target.value)}
                rows={3}
                placeholder="说明为什么仍然执行这笔交易，后续复盘会用到。"
              />
            </Field>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="交易理由">
              <Textarea value={form.reason} onChange={(event) => onFormChange("reason", event.target.value)} rows={3} />
            </Field>
            <Field label="执行结果">
              <Textarea value={form.result} onChange={(event) => onFormChange("result", event.target.value)} rows={3} placeholder="可先写待复盘" />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">保存交易</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TransactionDetailDialog({
  transaction,
  plan,
  onOpenChange,
}: {
  transaction: PlanLinkedTransaction | null
  plan: InvestmentPlan | null
  onOpenChange: (open: boolean) => void
}) {
  if (!transaction) return null

  return (
    <Dialog open={Boolean(transaction)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label-tiny mb-2">Transaction Detail</p>
              <DialogTitle>{transaction.asset}</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onOpenChange(false)} aria-label="关闭交易详情">
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </DialogHeader>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Detail label="代码" value={transaction.symbol} />
          <Detail label="日期" value={transaction.date} />
          <Detail label="数量" value={`${transaction.quantity} 份`} />
          <Detail label="价格" value={`¥${transaction.price.toFixed(2)}`} />
          <Detail label="金额" value={`¥${transaction.amount.toLocaleString("zh-CN")}`} />
          <Detail label="方向" value={transaction.kind === "buy" ? "买入" : "卖出"} />
        </dl>
        <div className="space-y-3">
          <Thinking label="关联计划" value={plan?.title ?? "未关联计划"} />
          <Thinking label="规则检查" value={`${getRuleCheckLabel(transaction.planRuleCheck)}：${transaction.planRuleNotes || "无备注"}`} />
          <Thinking label="交易理由" value={transaction.reason} />
          <Thinking label="执行结果" value={transaction.result} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RuleCheckPanel({ status, notes }: { status: PlanRuleCheck; notes: string }) {
  const icon =
    status === "matched" ? <CheckCircle className="h-4 w-4" aria-hidden="true" /> : <AlertTriangle className="h-4 w-4" aria-hidden="true" />
  const className =
    status === "matched"
      ? "border-success/30 bg-success-light text-success"
      : status === "violated"
        ? "border-destructive/30 bg-destructive-light text-destructive"
        : "border-warning/30 bg-warning-light text-warning"

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${className}`}>
      {icon}
      <div>
        <div className="text-sm font-medium">{getRuleCheckLabel(status)}</div>
        <div className="mt-1 text-sm leading-6">{notes}</div>
      </div>
    </div>
  )
}

function RuleCheckBadge({ status }: { status?: PlanRuleCheck }) {
  if (status === "violated") return <Badge variant="destructive">偏离计划</Badge>
  if (status === "warning") return <Badge variant="secondary">需说明</Badge>
  if (status === "matched") return <Badge variant="default">符合计划</Badge>
  return <Badge variant="outline">未检查</Badge>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-tiny mb-2">{label}</dt>
      <dd className="font-tabular text-lg font-semibold text-foreground">{value}</dd>
    </div>
  )
}

function Thinking({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-tiny mb-2">{label}</p>
      <p className="text-sm leading-6 text-foreground-secondary">{value}</p>
    </div>
  )
}
