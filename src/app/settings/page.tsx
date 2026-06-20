"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { Database, Download, Lock, Palette, RotateCcw, Save, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader, PageShell, SectionPanel } from "@/components/ui/workspace"
import {
  defaultSettings,
  getStoredSettings,
  saveStoredSettings,
  settingsStorageKey,
  type MvpSettings,
} from "@/lib/mvp-store"

export default function SettingsPage() {
  const [settings, setSettings] = useState<MvpSettings>(defaultSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(getStoredSettings())
  }, [])

  const updateSetting = <K extends keyof MvpSettings>(key: K, value: MvpSettings[K]) => {
    const nextSettings = { ...settings, [key]: value }
    setSettings(nextSettings)
    setSaved(false)
  }

  const saveSettings = () => {
    saveStoredSettings(settings)
    setSaved(true)
  }

  const resetSettings = () => {
    window.localStorage.removeItem(settingsStorageKey)
    setSettings(defaultSettings)
    setSaved(false)
    window.dispatchEvent(new Event("assetwise-settings-updated"))
  }

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "assetwise-settings.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageShell size="narrow">
      <PageHeader
        eyebrow="Settings"
        title="设置"
        description="管理本地安全、示例数据、显示偏好和复盘提醒。"
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={exportSettings}>
              <Download className="h-4 w-4" aria-hidden="true" />
              导出
            </Button>
            <Button variant="outline" className="gap-2" onClick={resetSettings}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              重置
            </Button>
            <Button className="gap-2" onClick={saveSettings}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {saved ? "已保存" : "保存"}
            </Button>
          </>
        }
      />

      <section className="grid gap-3">
        <SettingCard
          icon={<Lock className="h-5 w-5" aria-hidden="true" />}
          title="本地加密"
          description="MVP 保留本地数据加密开关，后续接入桌面端安全存储时沿用这个配置。"
          control={
            <Switch
              checked={settings.encryptionEnabled}
              onCheckedChange={(checked) => updateSetting("encryptionEnabled", checked)}
              aria-label="开启或关闭本地加密"
            />
          }
        />

        <SettingCard
          icon={<Database className="h-5 w-5" aria-hidden="true" />}
          title="示例数据"
          description="首次体验时展示资产、交易、计划、复盘和分析样例。关闭后，新用户会看到空白工作台；已经手动创建的数据不会被删除。"
          control={
            <Switch
              checked={settings.sampleDataEnabled}
              onCheckedChange={(checked) => updateSetting("sampleDataEnabled", checked)}
              aria-label="开启或关闭示例数据"
            />
          }
        />

        <SettingCard
          icon={<Palette className="h-5 w-5" aria-hidden="true" />}
          title="显示偏好"
          description="配置主题、币种和桌面端显示习惯。"
          control={
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>主题</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => updateSetting("theme", value as MvpSettings["theme"])}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">浅色</SelectItem>
                    <SelectItem value="system">跟随系统</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>币种</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) => updateSetting("currency", value as MvpSettings["currency"])}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNY">人民币</SelectItem>
                    <SelectItem value="USD">美元</SelectItem>
                    <SelectItem value="HKD">港币</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
        />

        <SettingCard
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
          title="涨跌颜色习惯"
          description="中文市场通常红涨绿跌；英文/国际界面通常绿涨红跌。"
          control={
            <Select
              value={settings.colorConvention}
              onValueChange={(value) => updateSetting("colorConvention", value as MvpSettings["colorConvention"])}
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chinese">中文：红涨绿跌</SelectItem>
                <SelectItem value="western">英文：绿涨红跌</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <SettingCard
          icon={<Save className="h-5 w-5" aria-hidden="true" />}
          title="复盘提醒"
          description="交易完成后提醒记录情绪评分、标签和决策原因，避免只留下流水账。"
          control={
            <Switch
              checked={settings.reviewReminder}
              onCheckedChange={(checked) => updateSetting("reviewReminder", checked)}
              aria-label="开启或关闭复盘提醒"
            />
          }
        />
      </section>
    </PageShell>
  )
}

function SettingCard({
  icon,
  title,
  description,
  control,
}: {
  icon: ReactNode
  title: string
  description: string
  control: ReactNode
}) {
  return (
    <SectionPanel>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            {icon}
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="shrink-0">{control}</div>
      </div>
    </SectionPanel>
  )
}
