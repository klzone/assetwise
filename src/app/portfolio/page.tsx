"use client"

import { useEffect, useState } from "react"
import { PieChart, Plus, TrendingDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getChangeTextClass, getStoredSettings, type ColorConvention } from "@/lib/mvp-store"

const portfolios = [
  {
    name: "核心资产组合",
    goal: "长期稳健增长",
    value: 186270,
    returnRate: 8.6,
    allocation: [
      { name: "宽基指数", value: 46 },
      { name: "红利资产", value: 22 },
      { name: "债券和现金", value: 32 },
    ],
  },
  {
    name: "机会观察仓",
    goal: "小仓位捕捉阶段性主题",
    value: 42360,
    returnRate: -1.8,
    allocation: [
      { name: "个股", value: 58 },
      { name: "主题 ETF", value: 27 },
      { name: "现金", value: 15 },
    ],
  },
]

export default function PortfolioPage() {
  const [colorConvention, setColorConvention] = useState<ColorConvention>("chinese")
  const totalValue = portfolios.reduce((sum, item) => sum + item.value, 0)
  const averageReturn =
    portfolios.reduce((sum, item) => sum + item.returnRate, 0) / portfolios.length
  const averageReturnClass = getChangeTextClass(averageReturn, colorConvention)

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
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-12 lg:py-7">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-tiny mb-2">Portfolio</p>
            <h1 className="text-3xl font-semibold tracking-tight">投资组合</h1>
          </div>
          <Button className="gap-2 rounded-md bg-foreground text-background hover:bg-foreground/90">
            <Plus className="h-4 w-4" />
            新建组合
          </Button>
        </header>

        <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Metric title="组合总资产" value={`¥${totalValue.toLocaleString("zh-CN")}`} />
          <Metric title="组合数量" value={String(portfolios.length)} />
          <Metric
            title="平均收益率"
            value={`${averageReturn >= 0 ? "+" : ""}${averageReturn.toFixed(2)}%`}
            valueClassName={averageReturnClass}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {portfolios.map((portfolio) => {
            const returnClass = getChangeTextClass(portfolio.returnRate, colorConvention)
            const ReturnIcon = portfolio.returnRate >= 0 ? TrendingUp : TrendingDown

            return (
              <Card key={portfolio.name} className="rounded-[1.15rem] border-white/80 bg-card/78 p-4 shadow-[0_18px_56px_rgb(15_23_42_/_0.075)] backdrop-blur-xl">
                <CardContent className="space-y-5 p-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">{portfolio.name}</h2>
                      <p className="mt-1.5 text-xs text-muted-foreground">{portfolio.goal}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 text-sm font-semibold ${returnClass}`}>
                      <ReturnIcon className="h-4 w-4" />
                      {portfolio.returnRate >= 0 ? "+" : ""}
                      {portfolio.returnRate.toFixed(2)}%
                    </div>
                  </div>

                  <div>
                    <p className="label-tiny mb-2">当前市值</p>
                    <p className="text-3xl font-semibold">¥{portfolio.value.toLocaleString("zh-CN")}</p>
                  </div>

                  <div className="space-y-3">
                    {portfolio.allocation.map((item) => (
                      <div key={item.name}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">{item.value}%</span>
                        </div>
                        <Progress value={item.value} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>
      </div>
    </div>
  )
}

function Metric({
  title,
  value,
  tone,
  valueClassName,
}: {
  title: string
  value: string
  tone?: "positive" | "negative"
  valueClassName?: string
}) {
  const toneClass =
    valueClassName ??
    (tone === "positive"
      ? "text-success"
      : tone === "negative"
        ? "text-destructive"
        : "text-foreground")

  return (
    <div className="rounded-[1.15rem] border border-white/80 bg-card/78 p-4 shadow-[0_18px_56px_rgb(15_23_42_/_0.075)] backdrop-blur-xl">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-muted">
        <PieChart className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="label-tiny mb-2">{title}</p>
      <p className={`text-2xl font-semibold sm:text-3xl ${toneClass}`}>{value}</p>
    </div>
  )
}
