"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getChangeTextClass, getStoredSettings, type ColorConvention } from "@/lib/mvp-store"

const assets = [
  { id: "hs300", name: "沪深300 ETF", symbol: "510300", category: "宽基指数", value: 76840, cost: 71200, dayChange: 0.62, allocation: 33.6, risk: "中", note: "核心仓位，按定投计划执行。" },
  { id: "dividend", name: "中证红利 ETF", symbol: "515080", category: "红利资产", value: 41150, cost: 38900, dayChange: 0.18, allocation: 18.0, risk: "低", note: "用于提高现金流稳定性。" },
  { id: "catl", name: "宁德时代", symbol: "300750", category: "个股", value: 36240, cost: 39500, dayChange: -1.24, allocation: 15.9, risk: "高", note: "波动较高，已在复盘中降低仓位。" },
  { id: "money", name: "货币基金", symbol: "CASH", category: "现金", value: 36590, cost: 36590, dayChange: 0.01, allocation: 16.0, risk: "低", note: "用于等待计划内买入机会。" },
  { id: "bond", name: "国债 ETF", symbol: "511010", category: "债券", value: 21810, cost: 21280, dayChange: 0.08, allocation: 9.5, risk: "低", note: "降低组合波动。" },
  { id: "tech", name: "科创50 ETF", symbol: "588000", category: "主题机会", value: 16000, cost: 15500, dayChange: 1.36, allocation: 7.0, risk: "高", note: "机会仓，严格执行退出规则。" },
]

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const [colorConvention, setColorConvention] = useState<ColorConvention>("chinese")
  const asset = assets.find((item) => item.id === params.id) ?? assets[0]
  const profit = asset.value - asset.cost
  const profitPercent = asset.cost > 0 ? (profit / asset.cost) * 100 : 0
  const isPositive = profit >= 0
  const profitClass = getChangeTextClass(profit, colorConvention)
  const dayChangeClass = getChangeTextClass(asset.dayChange, colorConvention)

  useEffect(() => {
    const loadSettings = () => setColorConvention(getStoredSettings().colorConvention)

    loadSettings()
    window.addEventListener("assetwise-settings-updated", loadSettings)
    window.addEventListener("focus", loadSettings)

    return () => {
      window.removeEventListener("assetwise-settings-updated", loadSettings)
      window.removeEventListener("focus", loadSettings)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_76%_8%,rgb(236_241_248)_0%,transparent_30%),linear-gradient(180deg,rgb(250_250_250)_0%,rgb(245_247_250)_100%)]">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-12 lg:py-7">
        <Button variant="ghost" className="mb-5 gap-2 px-0" asChild>
          <Link href="/assets">
            <ArrowLeft className="h-4 w-4" />
            返回资产管理
          </Link>
        </Button>

        <header className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{asset.category}</Badge>
            <Badge variant="secondary">风险 {asset.risk}</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{asset.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{asset.symbol}</p>
        </header>

        <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Metric title="当前市值" value={`¥${asset.value.toLocaleString("zh-CN")}`} />
          <Metric title="累计收益" value={`${isPositive ? "+" : ""}¥${profit.toLocaleString("zh-CN")}`} valueClassName={profitClass} />
          <Metric title="收益率" value={`${isPositive ? "+" : ""}${profitPercent.toFixed(2)}%`} valueClassName={profitClass} />
        </section>

        <Card className="rounded-[1.15rem] border-white/80 bg-card/78 p-4 shadow-[0_18px_56px_rgb(15_23_42_/_0.075)] backdrop-blur-xl">
          <CardContent className="grid gap-5 p-0 md:grid-cols-2">
            <div>
              <p className="label-tiny mb-3">Position</p>
              <dl className="space-y-3 text-sm">
                <Detail label="投入成本" value={`¥${asset.cost.toLocaleString("zh-CN")}`} />
                <Detail label="组合占比" value={`${asset.allocation.toFixed(1)}%`} />
                <Detail label="日涨跌" value={`${asset.dayChange >= 0 ? "+" : ""}${asset.dayChange.toFixed(2)}%`} valueClassName={dayChangeClass} />
              </dl>
            </div>
            <div>
              <p className="label-tiny mb-3">Review Note</p>
              <p className="text-xs leading-5 text-foreground-secondary">{asset.note}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                {asset.dayChange >= 0 ? <TrendingUp className={`h-4 w-4 ${dayChangeClass}`} /> : <TrendingDown className={`h-4 w-4 ${dayChangeClass}`} />}
                下一次交易后建议关联一条复盘日志。
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Metric({
  title,
  value,
  valueClassName,
}: {
  title: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-[1.15rem] border border-white/80 bg-card/78 p-4 shadow-[0_18px_56px_rgb(15_23_42_/_0.075)] backdrop-blur-xl">
      <p className="label-tiny mb-2">{title}</p>
      <p className={`text-2xl font-semibold ${valueClassName ?? "text-foreground"}`}>{value}</p>
    </div>
  )
}

function Detail({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-medium ${valueClassName ?? ""}`}>{value}</dd>
    </div>
  )
}
