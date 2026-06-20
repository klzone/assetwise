import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { UserSettings } from '@/lib/types/data.types'
import { generateChecksum, generateDeviceId } from '@/lib/utils/crypto'
import { toast } from '@/hooks/use-toast'

export class SettingsService {
  private static instance: SettingsService
  private deviceId: string
  private syncInProgress = false
  private listeners: Set<() => void> = new Set()

  private constructor() {
    this.deviceId = generateDeviceId()
  }

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }
    return SettingsService.instance
  }

  // 添加监听器
  addListener(listener: () => void) {
    this.listeners.add(listener)
  }

  // 移除监听器
  removeListener(listener: () => void) {
    this.listeners.delete(listener)
  }

  // 通知监听器
  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  // 获取本地设置
  async getLocalSettings(): Promise<UserSettings | null> {
    try {
      const stored = localStorage.getItem('user_settings')
      if (!stored) return null
      
      const settings = JSON.parse(stored)
      return settings
    } catch (error) {
      console.error('获取本地设置失败:', error)
      return null
    }
  }

  // 保存本地设置
  async saveLocalSettings(settings: UserSettings): Promise<void> {
    try {
      // 添加元数据
      const settingsWithMeta = {
        ...settings,
        updatedAt: new Date().toISOString(),
        version: (settings.version || 0) + 1,
        checksum: generateChecksum(JSON.stringify(settings)),
        deviceId: this.deviceId
      }

      localStorage.setItem('user_settings', JSON.stringify(settingsWithMeta))
      this.notifyListeners()
      
      // 自动同步到云端
      setTimeout(() => {
        this.syncToCloud()
      }, 2000)
    } catch (error) {
      console.error('保存本地设置失败:', error)
      throw error
    }
  }

  // 获取云端设置
  async getCloudSettings(): Promise<UserSettings | null> {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 记录不存在
          return null
        }
        throw error
      }

      return data.settings_data
    } catch (error) {
      console.error('获取云端设置失败:', error)
      return null
    }
  }

  // 同步到云端
  async syncToCloud(): Promise<boolean> {
    if (this.syncInProgress) return false

    try {
      this.syncInProgress = true
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('用户未登录，跳过云端同步')
        return false
      }

      const localSettings = await this.getLocalSettings()
      if (!localSettings) return false

      // 检查是否有云端数据
      const cloudSettings = await this.getCloudSettings()
      
      if (cloudSettings) {
        // 比较版本，决定是否需要同步
        const localVersion = localSettings.version || 0
        const cloudVersion = cloudSettings.version || 0
        
        if (localVersion <= cloudVersion) {
          console.log('本地版本不新于云端版本，跳过同步')
          return false
        }
      }

      // 上传到云端
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings_data: localSettings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "设置已同步",
        description: "您的设置已成功同步到云端",
      })

      return true
    } catch (error) {
      console.error('同步到云端失败:', error)
      toast({
        title: "同步失败",
        description: "设置同步到云端时出现错误",
        variant: "destructive",
      })
      return false
    } finally {
      this.syncInProgress = false
    }
  }

  // 从云端拉取
  async pullFromCloud(): Promise<boolean> {
    if (this.syncInProgress) return false

    try {
      this.syncInProgress = true
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "同步失败",
          description: "请先登录后再同步设置",
          variant: "destructive",
        })
        return false
      }

      const cloudSettings = await this.getCloudSettings()
      if (!cloudSettings) {
        toast({
          title: "无云端数据",
          description: "云端暂无设置数据",
          variant: "destructive",
        })
        return false
      }

      const localSettings = await this.getLocalSettings()
      
      // 检查冲突
      if (localSettings) {
        const localVersion = localSettings.version || 0
        const cloudVersion = cloudSettings.version || 0
        
        if (localVersion > cloudVersion) {
          const shouldOverwrite = confirm(
            '本地设置比云端更新，是否要用云端设置覆盖本地设置？'
          )
          if (!shouldOverwrite) return false
        }
      }

      // 保存云端数据到本地
      localStorage.setItem('user_settings', JSON.stringify(cloudSettings))
      this.notifyListeners()

      toast({
        title: "设置已更新",
        description: "已从云端拉取最新设置",
      })

      return true
    } catch (error) {
      console.error('从云端拉取失败:', error)
      toast({
        title: "拉取失败",
        description: "从云端拉取设置时出现错误",
        variant: "destructive",
      })
      return false
    } finally {
      this.syncInProgress = false
    }
  }

  // 获取默认设置
  getDefaultSettings(): UserSettings {
    return {
      id: 0,
      // 个人信息
      name: '',
      email: '',
      phone: '',
      avatar: '',
      bio: '',
      
      // 通知设置
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      priceAlerts: true,
      newsAlerts: true,
      portfolioUpdates: true,
      
      // 安全设置
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: '30',
      
      // 显示设置
      language: 'zh-CN',
      currency: 'CNY',
      dateFormat: 'YYYY-MM-DD',
      numberFormat: 'comma',
      theme: 'system',
      
      // 数据设置
      dataRetention: '2years',
      autoBackup: true,
      exportFormat: 'excel',
      
      // 元数据
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      checksum: '',
      deviceId: this.deviceId
    }
  }

  // 重置设置
  async resetSettings(): Promise<void> {
    try {
      const defaultSettings = this.getDefaultSettings()
      await this.saveLocalSettings(defaultSettings)
      
      toast({
        title: "设置已重置",
        description: "所有设置已恢复为默认值",
      })
    } catch (error) {
      console.error('重置设置失败:', error)
      toast({
        title: "重置失败",
        description: "重置设置时出现错误",
        variant: "destructive",
      })
    }
  }

  // 导出设置
  async exportSettings(): Promise<void> {
    try {
      const settings = await this.getLocalSettings()
      if (!settings) {
        toast({
          title: "导出失败",
          description: "没有找到设置数据",
          variant: "destructive",
        })
        return
      }

      const dataStr = JSON.stringify(settings, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `assetwise-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "导出成功",
        description: "设置数据已导出到文件",
      })
    } catch (error) {
      console.error('导出设置失败:', error)
      toast({
        title: "导出失败",
        description: "导出设置时出现错误",
        variant: "destructive",
      })
    }
  }

  // 导入设置
  async importSettings(file: File): Promise<void> {
    try {
      const text = await file.text()
      const settings = JSON.parse(text) as UserSettings
      
      // 验证数据结构
      if (!settings || typeof settings !== 'object') {
        throw new Error('无效的设置文件格式')
      }

      await this.saveLocalSettings(settings)
      
      toast({
        title: "导入成功",
        description: "设置数据已成功导入",
      })
    } catch (error) {
      console.error('导入设置失败:', error)
      toast({
        title: "导入失败",
        description: "导入设置时出现错误，请检查文件格式",
        variant: "destructive",
      })
    }
  }

  // 清空所有数据
  async clearAllData(): Promise<void> {
    try {
      const confirmed = confirm(
        '此操作将永久删除所有设置数据，无法恢复。确定要继续吗？'
      )
      
      if (!confirmed) return

      // 清空本地数据
      localStorage.removeItem('user_settings')
      
      // 清空云端数据
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('user_settings')
          .delete()
          .eq('user_id', user.id)
      }

      this.notifyListeners()
      
      toast({
        title: "数据已清空",
        description: "所有设置数据已被永久删除",
      })
    } catch (error) {
      console.error('清空数据失败:', error)
      toast({
        title: "清空失败",
        description: "清空数据时出现错误",
        variant: "destructive",
      })
    }
  }

  // 获取同步状态
  isSyncInProgress(): boolean {
    return this.syncInProgress
  }

  // 检查网络状态
  isOnline(): boolean {
    return navigator.onLine
  }
}

export const settingsService = SettingsService.getInstance()