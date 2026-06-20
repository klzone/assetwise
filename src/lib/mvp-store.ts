export type RiskLevel = "低" | "中" | "高"
export type ColorConvention = "western" | "chinese"

export type MvpAsset = {
  id: string
  name: string
  symbol: string
  category: string
  value: number
  cost: number
  dayChange: number
  risk: RiskLevel
}

export type MvpSettings = {
  encryptionEnabled: boolean
  sampleDataEnabled: boolean
  theme: "light" | "system"
  currency: "CNY" | "USD" | "HKD"
  reviewReminder: boolean
  colorConvention: ColorConvention
}

export const assetStorageKey = "assetwise_mvp_assets"
export const settingsStorageKey = "assetwise_mvp_settings"

export const assetCategories = ["宽基指数", "红利资产", "个股", "现金", "债券", "主题机会", "基金", "黄金", "其他"]

export const defaultAssets: MvpAsset[] = [
  { id: "hs300", name: "沪深300 ETF", symbol: "510300", category: "宽基指数", value: 76840, cost: 71200, dayChange: 0.62, risk: "中" },
  { id: "dividend", name: "中证红利 ETF", symbol: "515080", category: "红利资产", value: 41150, cost: 38900, dayChange: 0.18, risk: "低" },
  { id: "catl", name: "宁德时代", symbol: "300750", category: "个股", value: 36240, cost: 39500, dayChange: -1.24, risk: "高" },
  { id: "money", name: "货币基金", symbol: "CASH", category: "现金", value: 36590, cost: 36590, dayChange: 0.01, risk: "低" },
  { id: "bond", name: "国债 ETF", symbol: "511010", category: "债券", value: 21810, cost: 21280, dayChange: 0.08, risk: "低" },
  { id: "tech", name: "科创50 ETF", symbol: "588000", category: "主题机会", value: 16000, cost: 15500, dayChange: 1.36, risk: "高" },
]

export const defaultSettings: MvpSettings = {
  encryptionEnabled: true,
  sampleDataEnabled: true,
  theme: "light",
  currency: "CNY",
  reviewReminder: true,
  colorConvention: "chinese",
}

export function getStoredAssets() {
  if (typeof window === "undefined") return defaultAssets

  try {
    const stored = window.localStorage.getItem(assetStorageKey)
    if (!stored) return shouldUseSampleData() ? defaultAssets : []

    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? normalizeAssets(parsed) : shouldUseSampleData() ? defaultAssets : []
  } catch {
    return shouldUseSampleData() ? defaultAssets : []
  }
}

export function saveStoredAssets(assets: MvpAsset[]) {
  window.localStorage.setItem(assetStorageKey, JSON.stringify(assets))
  window.dispatchEvent(new Event("assetwise-assets-updated"))
}

export function getStoredSettings() {
  if (typeof window === "undefined") return defaultSettings

  try {
    const stored = window.localStorage.getItem(settingsStorageKey)
    if (!stored) return defaultSettings

    return { ...defaultSettings, ...JSON.parse(stored) } as MvpSettings
  } catch {
    return defaultSettings
  }
}

export function saveStoredSettings(settings: MvpSettings) {
  window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings))
  window.dispatchEvent(new Event("assetwise-settings-updated"))
}

export function shouldUseSampleData() {
  if (typeof window === "undefined") return true

  try {
    const stored = window.localStorage.getItem(settingsStorageKey)
    if (!stored) return defaultSettings.sampleDataEnabled

    const parsed = JSON.parse(stored) as Partial<MvpSettings>
    return parsed.sampleDataEnabled ?? defaultSettings.sampleDataEnabled
  } catch {
    return defaultSettings.sampleDataEnabled
  }
}

export function getAssetSummary(assets: MvpAsset[]) {
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0)
  const totalCost = assets.reduce((sum, asset) => sum + asset.cost, 0)
  const totalProfit = totalValue - totalCost
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
  const todayProfit = assets.reduce((sum, asset) => sum + (asset.value * asset.dayChange) / 100, 0)
  const todayProfitPercent = totalValue > 0 ? (todayProfit / totalValue) * 100 : 0

  return {
    totalValue,
    totalCost,
    totalProfit,
    totalProfitPercent,
    todayProfit,
    todayProfitPercent,
    assetCount: assets.length,
    annualizedReturn: totalProfitPercent,
  }
}

export function getAllocationByCategory(assets: MvpAsset[]) {
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0)
  const categoryMap = new Map<string, number>()

  assets.forEach((asset) => {
    categoryMap.set(asset.category, (categoryMap.get(asset.category) ?? 0) + asset.value)
  })

  return Array.from(categoryMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      value: totalValue > 0 ? (amount / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function getChangeTextClass(value: number, convention: ColorConvention) {
  if (value === 0) return "text-foreground"

  if (convention === "chinese") {
    return value > 0 ? "text-destructive" : "text-success"
  }

  return value > 0 ? "text-success" : "text-destructive"
}

export function getChangeBadgeClass(value: number, convention: ColorConvention) {
  if (value === 0) return "bg-muted text-muted-foreground"

  if (convention === "chinese") {
    return value > 0 ? "bg-destructive-light text-destructive" : "bg-success-light text-success"
  }

  return value > 0 ? "bg-success-light text-success" : "bg-destructive-light text-destructive"
}

export function getChangeFillClass(value: number, convention: ColorConvention) {
  if (value === 0) return "bg-muted-foreground"

  if (convention === "chinese") {
    return value > 0 ? "bg-destructive" : "bg-success"
  }

  return value > 0 ? "bg-success" : "bg-destructive"
}

function normalizeAssets(value: unknown[]): MvpAsset[] {
  return value
    .map((item) => item as Partial<MvpAsset>)
    .filter((item) => item.id && item.name && item.symbol)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name),
      symbol: String(item.symbol),
      category: String(item.category || "其他"),
      value: Number(item.value || 0),
      cost: Number(item.cost || 0),
      dayChange: Number(item.dayChange || 0),
      risk: item.risk === "低" || item.risk === "中" || item.risk === "高" ? item.risk : "中",
    }))
}
