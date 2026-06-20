"use client"

import type { FormEvent, ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { Eye, Grid3X3, List, Pencil, Plus, Search, Trash2, Wallet } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState, FilterToolbar, MetricCard, PageHeader, PageShell, ResponsiveDataView, SectionPanel } from "@/components/ui/workspace"
import {
  assetCategories,
  defaultAssets,
  getAssetSummary,
  getChangeTextClass,
  getStoredAssets,
  getStoredSettings,
  saveStoredAssets,
  type ColorConvention,
  type MvpAsset,
  type RiskLevel,
} from "@/lib/mvp-store"

type AssetForm = {
  name: string
  symbol: string
  category: string
  value: string
  cost: string
  dayChange: string
  risk: RiskLevel
}

const emptyForm: AssetForm = {
  name: "",
  symbol: "",
  category: "宽基指数",
  value: "",
  cost: "",
  dayChange: "0",
  risk: "中",
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<MvpAsset[]>(defaultAssets)
  const [colorConvention, setColorConvention] = useState<ColorConvention>("chinese")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<MvpAsset | null>(null)
  const [form, setForm] = useState<AssetForm>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<MvpAsset | null>(null)
  const [viewTarget, setViewTarget] = useState<MvpAsset | null>(null)

  useEffect(() => {
    const loadData = () => {
      setAssets(getStoredAssets())
      setColorConvention(getStoredSettings().colorConvention)
    }

    loadData()
    window.addEventListener("assetwise-assets-updated", loadData)
    window.addEventListener("assetwise-settings-updated", loadData)
    window.addEventListener("focus", loadData)

    return () => {
      window.removeEventListener("assetwise-assets-updated", loadData)
      window.removeEventListener("assetwise-settings-updated", loadData)
      window.removeEventListener("focus", loadData)
    }
  }, [])

  const categories = useMemo(
    () => Array.from(new Set([...assetCategories, ...assets.map((asset) => asset.category)])),
    [assets],
  )

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return assets.filter((asset) => {
      const matchesCategory = category === "all" || asset.category === category
      const matchesQuery =
        !normalizedQuery ||
        asset.name.toLowerCase().includes(normalizedQuery) ||
        asset.symbol.toLowerCase().includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [assets, category, query])

  const summary = getAssetSummary(assets)
  const totalProfitClass = getChangeTextClass(summary.totalProfit, colorConvention)
  const totalProfitPercentClass = getChangeTextClass(summary.totalProfitPercent, colorConvention)

  const saveAssets = (nextAssets: MvpAsset[]) => {
    setAssets(nextAssets)
    saveStoredAssets(nextAssets)
  }

  const openCreateDialog = () => {
    setEditingAsset(null)
    setForm(emptyForm)
    setAssetDialogOpen(true)
  }

  const openEditDialog = (asset: MvpAsset) => {
    setEditingAsset(asset)
    setForm({
      name: asset.name,
      symbol: asset.symbol,
      category: asset.category,
      value: String(asset.value),
      cost: String(asset.cost),
      dayChange: String(asset.dayChange),
      risk: asset.risk,
    })
    setAssetDialogOpen(true)
  }

  const handleSubmitAsset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextAsset: MvpAsset = {
      id: editingAsset?.id ?? `asset-${Date.now()}`,
      name: form.name.trim(),
      symbol: form.symbol.trim().toUpperCase(),
      category: form.category,
      value: Number(form.value),
      cost: Number(form.cost),
      dayChange: Number(form.dayChange || 0),
      risk: form.risk,
    }

    if (!nextAsset.name || !nextAsset.symbol || Number.isNaN(nextAsset.value) || Number.isNaN(nextAsset.cost)) {
      return
    }

    const nextAssets = editingAsset
      ? assets.map((asset) => (asset.id === editingAsset.id ? nextAsset : asset))
      : [nextAsset, ...assets]

    saveAssets(nextAssets)
    setAssetDialogOpen(false)
    setEditingAsset(null)
    setForm(emptyForm)
  }

  const handleDeleteAsset = () => {
    if (!deleteTarget) return

    saveAssets(assets.filter((asset) => asset.id !== deleteTarget.id))
    setDeleteTarget(null)

    if (viewTarget?.id === deleteTarget.id) {
      setViewTarget(null)
    }
  }

  const getAllocation = (asset: MvpAsset) => (summary.totalValue > 0 ? (asset.value / summary.totalValue) * 100 : 0)

  return (
    <PageShell>
      <PageHeader
        eyebrow="Assets"
        title="资产管理"
        description="跟踪持仓、市值、成本、收益与组合结构。"
        actions={
          <Button data-testid="asset-add-button" className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            添加资产
          </Button>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard title="总市值" value={`¥${summary.totalValue.toLocaleString("zh-CN")}`} />
        <MetricCard title="投入成本" value={`¥${summary.totalCost.toLocaleString("zh-CN")}`} />
        <MetricCard
          title="总收益"
          value={`${summary.totalProfit >= 0 ? "+" : ""}¥${summary.totalProfit.toLocaleString("zh-CN")}`}
          valueClassName={totalProfitClass}
        />
        <MetricCard
          title="收益率"
          value={`${summary.totalProfitPercent >= 0 ? "+" : ""}${summary.totalProfitPercent.toFixed(2)}%`}
          valueClassName={totalProfitPercentClass}
        />
      </section>

      <SectionPanel eyebrow="Holdings" title="持仓清单" description={`${filteredAssets.length} / ${assets.length} 个资产`}>
        <FilterToolbar
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="搜索资产或代码"
          className="mb-4"
          filters={
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类别</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          actions={
            <div className="flex rounded-md border border-border bg-card p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode("grid")}
                aria-label="网格视图"
              >
                <Grid3X3 className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode("list")}
                aria-label="列表视图"
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          }
        />

        {filteredAssets.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  allocation={getAllocation(asset)}
                  colorConvention={colorConvention}
                  onView={() => setViewTarget(asset)}
                  onEdit={() => openEditDialog(asset)}
                  onDelete={() => setDeleteTarget(asset)}
                />
              ))}
            </div>
          ) : (
            <ResponsiveDataView
              table={
                <AssetTable
                  assets={filteredAssets}
                  colorConvention={colorConvention}
                  getAllocation={getAllocation}
                  onView={setViewTarget}
                  onEdit={openEditDialog}
                  onDelete={setDeleteTarget}
                />
              }
              cards={filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  allocation={getAllocation(asset)}
                  colorConvention={colorConvention}
                  onView={() => setViewTarget(asset)}
                  onEdit={() => openEditDialog(asset)}
                  onDelete={() => setDeleteTarget(asset)}
                />
              ))}
            />
          )
        ) : (
          <EmptyState
            icon={Search}
            title="没有找到资产"
            description="调整搜索词或分类筛选，也可以直接添加一个新资产。"
            action={
              <Button data-testid="asset-empty-add-button" className="gap-2" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                添加资产
              </Button>
            }
          />
        )}
      </SectionPanel>

      <AssetEditorDialog
        open={assetDialogOpen}
        editingAsset={editingAsset}
        form={form}
        categories={categories}
        onOpenChange={setAssetDialogOpen}
        onFormChange={setForm}
        onSubmit={handleSubmitAsset}
      />
      <AssetDetailDialog
        asset={viewTarget}
        allocation={viewTarget ? getAllocation(viewTarget) : 0}
        colorConvention={colorConvention}
        onOpenChange={(open) => !open && setViewTarget(null)}
      />
      <DeleteAssetDialog
        asset={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteAsset}
      />
    </PageShell>
  )
}

function AssetTable({
  assets,
  colorConvention,
  getAllocation,
  onView,
  onEdit,
  onDelete,
}: {
  assets: MvpAsset[]
  colorConvention: ColorConvention
  getAllocation: (asset: MvpAsset) => number
  onView: (asset: MvpAsset) => void
  onEdit: (asset: MvpAsset) => void
  onDelete: (asset: MvpAsset) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>资产</TableHead>
          <TableHead>类别</TableHead>
          <TableHead className="text-right">市值</TableHead>
          <TableHead className="text-right">累计收益</TableHead>
          <TableHead className="text-right">组合占比</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => {
          const profit = asset.value - asset.cost
          const profitPercent = asset.cost > 0 ? (profit / asset.cost) * 100 : 0
          const changeClass = getChangeTextClass(profit, colorConvention)

          return (
            <TableRow key={asset.id}>
              <TableCell>
                <div className="font-medium text-foreground">{asset.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{asset.symbol}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{asset.category}</Badge>
              </TableCell>
              <TableCell className="text-right text-base">¥{asset.value.toLocaleString("zh-CN")}</TableCell>
              <TableCell className={`text-right ${changeClass}`}>
                <div>{profit >= 0 ? "+" : ""}¥{profit.toLocaleString("zh-CN")}</div>
                <div className="text-xs">{profitPercent >= 0 ? "+" : ""}{profitPercent.toFixed(2)}%</div>
              </TableCell>
              <TableCell className="text-right">{getAllocation(asset).toFixed(1)}%</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <IconButton label={`查看 ${asset.name}`} onClick={() => onView(asset)} icon={<Eye className="h-4 w-4" />} />
                  <IconButton label={`编辑 ${asset.name}`} onClick={() => onEdit(asset)} icon={<Pencil className="h-4 w-4" />} />
                  <IconButton label={`删除 ${asset.name}`} onClick={() => onDelete(asset)} icon={<Trash2 className="h-4 w-4" />} destructive />
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function AssetCard({
  asset,
  allocation,
  colorConvention,
  onView,
  onEdit,
  onDelete,
}: {
  asset: MvpAsset
  allocation: number
  colorConvention: ColorConvention
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const profit = asset.value - asset.cost
  const profitPercent = asset.cost > 0 ? (profit / asset.cost) * 100 : 0
  const changeClass = getChangeTextClass(profit, colorConvention)

  return (
    <article className="rounded-[1.05rem] border border-white/80 bg-card/78 p-4 shadow-sm backdrop-blur-xl transition-smooth hover:border-border-hover hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">{asset.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{asset.symbol}</span>
            <Badge variant="outline">{asset.category}</Badge>
          </div>
        </div>
        <Badge variant="secondary">风险 {asset.risk}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Detail label="当前市值" value={`¥${asset.value.toLocaleString("zh-CN")}`} />
        <Detail label="累计收益" value={`${profit >= 0 ? "+" : ""}¥${profit.toLocaleString("zh-CN")}`} valueClassName={changeClass} />
        <Detail label="收益率" value={`${profitPercent >= 0 ? "+" : ""}${profitPercent.toFixed(2)}%`} valueClassName={changeClass} />
        <Detail label="组合占比" value={`${allocation.toFixed(1)}%`} />
      </div>

      <div className="mt-4 h-1.5 rounded-full bg-muted" aria-label={`${asset.name} 组合占比 ${allocation.toFixed(1)}%`}>
        <div className="h-1.5 rounded-full bg-foreground" style={{ width: `${Math.min(allocation, 100)}%` }} />
      </div>

      <div className="mt-3 flex justify-end gap-1">
        <IconButton label={`查看 ${asset.name}`} onClick={onView} icon={<Eye className="h-4 w-4" />} />
        <IconButton label={`编辑 ${asset.name}`} onClick={onEdit} icon={<Pencil className="h-4 w-4" />} />
        <IconButton label={`删除 ${asset.name}`} onClick={onDelete} icon={<Trash2 className="h-4 w-4" />} destructive />
      </div>
    </article>
  )
}

function AssetEditorDialog({
  open,
  editingAsset,
  form,
  categories,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean
  editingAsset: MvpAsset | null
  form: AssetForm
  categories: string[]
  onOpenChange: (open: boolean) => void
  onFormChange: (form: AssetForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const updateForm = <K extends keyof AssetForm>(key: K, value: AssetForm[K]) => {
    onFormChange({ ...form, [key]: value })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="asset-editor-dialog" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingAsset ? "编辑资产" : "添加资产"}</DialogTitle>
          <DialogDescription>记录资产名称、代码、市值、成本、当日变化与风险等级。</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="资产名称" required>
              <Input value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="沪深300 ETF" required />
            </Field>
            <Field label="代码" required>
              <Input value={form.symbol} onChange={(event) => updateForm("symbol", event.target.value)} placeholder="510300" required />
            </Field>
            <Field label="类别">
              <Select value={form.category} onValueChange={(value) => updateForm("category", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="风险等级">
              <Select value={form.risk} onValueChange={(value) => updateForm("risk", value as RiskLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="低">低</SelectItem>
                  <SelectItem value="中">中</SelectItem>
                  <SelectItem value="高">高</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="当前市值" required>
              <Input value={form.value} onChange={(event) => updateForm("value", event.target.value)} inputMode="decimal" placeholder="76840" required />
            </Field>
            <Field label="投入成本" required>
              <Input value={form.cost} onChange={(event) => updateForm("cost", event.target.value)} inputMode="decimal" placeholder="72000" required />
            </Field>
            <Field label="今日变化">
              <Input value={form.dayChange} onChange={(event) => updateForm("dayChange", event.target.value)} inputMode="decimal" placeholder="1260" />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button data-testid="asset-submit-button" type="submit">
              {editingAsset ? "保存资产" : "添加资产"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AssetDetailDialog({
  asset,
  allocation,
  colorConvention,
  onOpenChange,
}: {
  asset: MvpAsset | null
  allocation: number
  colorConvention: ColorConvention
  onOpenChange: (open: boolean) => void
}) {
  if (!asset) return null

  const profit = asset.value - asset.cost
  const profitPercent = asset.cost > 0 ? (profit / asset.cost) * 100 : 0
  const changeClass = getChangeTextClass(profit, colorConvention)
  const dayChangeClass = getChangeTextClass(asset.dayChange, colorConvention)

  return (
    <Dialog open={Boolean(asset)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{asset.name}</DialogTitle>
          <DialogDescription>
            {asset.symbol} · {asset.category} · 风险 {asset.risk}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Detail label="当前市值" value={`¥${asset.value.toLocaleString("zh-CN")}`} />
          <Detail label="投入成本" value={`¥${asset.cost.toLocaleString("zh-CN")}`} />
          <Detail label="累计收益" value={`${profit >= 0 ? "+" : ""}¥${profit.toLocaleString("zh-CN")}`} valueClassName={changeClass} />
          <Detail label="收益率" value={`${profitPercent >= 0 ? "+" : ""}${profitPercent.toFixed(2)}%`} valueClassName={changeClass} />
          <Detail label="今日变化" value={`${asset.dayChange >= 0 ? "+" : ""}¥${asset.dayChange.toLocaleString("zh-CN")}`} valueClassName={dayChangeClass} />
          <Detail label="组合占比" value={`${allocation.toFixed(1)}%`} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeleteAssetDialog({
  asset,
  onOpenChange,
  onConfirm,
}: {
  asset: MvpAsset | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={Boolean(asset)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除资产</DialogTitle>
          <DialogDescription>
            确认删除 {asset?.name}？这个操作会从本地资产列表中移除该记录。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Detail({ label, value, valueClassName }: { label: string; value: ReactNode; valueClassName?: string }) {
  return (
    <div>
      <p className="label-tiny mb-2">{label}</p>
      <p className={`font-tabular text-lg font-semibold ${valueClassName ?? "text-foreground"}`}>{value}</p>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  )
}

function IconButton({
  label,
  icon,
  onClick,
  destructive,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={`h-8 w-8 p-0 ${destructive ? "text-destructive hover:bg-destructive-light hover:text-destructive" : ""}`}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </Button>
  )
}
