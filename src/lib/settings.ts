export interface AppSettings {
  language: 'zh-CN' | 'en-US'
  currency: 'CNY' | 'USD'
  theme: 'light' | 'dark' | 'system'
  defaultView: 'grid' | 'list'
  autoSync: boolean
  syncInterval: number // 分钟
  notifications: {
    priceAlerts: boolean
    syncStatus: boolean
    dailyReport: boolean
  }
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'zh-CN',
  currency: 'CNY',
  theme: 'system',
  defaultView: 'grid',
  autoSync: true,
  syncInterval: 5,
  notifications: {
    priceAlerts: true,
    syncStatus: true,
    dailyReport: false
  }
}

const SETTINGS_KEY = 'assetwise_settings'

export class SettingsManager {
  private static instance: SettingsManager
  private settings: AppSettings
  private listeners: ((settings: AppSettings) => void)[] = []

  private constructor() {
    this.settings = this.loadSettings()
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager()
    }
    return SettingsManager.instance
  }

  private loadSettings(): AppSettings {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(SETTINGS_KEY)
        if (stored) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
        }
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
    return DEFAULT_SETTINGS
  }

  private saveSettings(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
      }
      this.notifyListeners()
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  getSettings(): AppSettings {
    return { ...this.settings }
  }

  updateSettings(updates: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...updates }
    this.saveSettings()
  }

  updateNotificationSettings(updates: Partial<AppSettings['notifications']>): void {
    this.settings.notifications = { ...this.settings.notifications, ...updates }
    this.saveSettings()
  }

  subscribe(listener: (settings: AppSettings) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.settings))
  }

  // 重置为默认设置
  resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS }
    this.saveSettings()
  }
}

export const settingsManager = SettingsManager.getInstance()