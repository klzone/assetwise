import { useState, useEffect, useCallback } from 'react'
import { UserSettings } from '@/lib/types/data.types'
import { settingsService } from '@/lib/services/settings.service'
import { toast } from '@/hooks/use-toast'

interface UseSettingsReturn {
  settings: UserSettings | null
  loading: boolean
  saving: boolean
  syncing: boolean
  isOnline: boolean
  updateSetting: (key: keyof UserSettings, value: any) => Promise<void>
  saveSettings: (newSettings: UserSettings) => Promise<void>
  syncToCloud: () => Promise<void>
  pullFromCloud: () => Promise<void>
  resetSettings: () => Promise<void>
  exportSettings: () => Promise<void>
  importSettings: (file: File) => Promise<void>
  clearAllData: () => Promise<void>
  refreshSettings: () => Promise<void>
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // 加载设置
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      let userSettings = await settingsService.getLocalSettings()
      
      if (!userSettings) {
        // 如果没有本地设置，使用默认设置
        userSettings = settingsService.getDefaultSettings()
        await settingsService.saveLocalSettings(userSettings)
      }
      
      setSettings(userSettings)
    } catch (error) {
      console.error('加载设置失败:', error)
      toast({
        title: "加载失败",
        description: "加载设置时出现错误",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // 更新单个设置
  const updateSetting = useCallback(async (key: keyof UserSettings, value: any) => {
    if (!settings) return

    try {
      setSaving(true)
      const updatedSettings = {
        ...settings,
        [key]: value,
        updatedAt: new Date().toISOString()
      }
      
      await settingsService.saveLocalSettings(updatedSettings)
      setSettings(updatedSettings)
    } catch (error) {
      console.error('更新设置失败:', error)
      toast({
        title: "保存失败",
        description: "保存设置时出现错误",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [settings])

  // 保存完整设置
  const saveSettings = useCallback(async (newSettings: UserSettings) => {
    try {
      setSaving(true)
      await settingsService.saveLocalSettings(newSettings)
      setSettings(newSettings)
      
      toast({
        title: "保存成功",
        description: "设置已保存",
      })
    } catch (error) {
      console.error('保存设置失败:', error)
      toast({
        title: "保存失败",
        description: "保存设置时出现错误",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [])

  // 同步到云端
  const syncToCloud = useCallback(async () => {
    try {
      setSyncing(true)
      const success = await settingsService.syncToCloud()
      if (success) {
        // 重新加载设置以获取最新状态
        await loadSettings()
      }
    } catch (error) {
      console.error('同步失败:', error)
    } finally {
      setSyncing(false)
    }
  }, [loadSettings])

  // 从云端拉取
  const pullFromCloud = useCallback(async () => {
    try {
      setSyncing(true)
      const success = await settingsService.pullFromCloud()
      if (success) {
        // 重新加载设置
        await loadSettings()
      }
    } catch (error) {
      console.error('拉取失败:', error)
    } finally {
      setSyncing(false)
    }
  }, [loadSettings])

  // 重置设置
  const resetSettings = useCallback(async () => {
    try {
      setSaving(true)
      await settingsService.resetSettings()
      await loadSettings()
    } catch (error) {
      console.error('重置失败:', error)
    } finally {
      setSaving(false)
    }
  }, [loadSettings])

  // 导出设置
  const exportSettings = useCallback(async () => {
    try {
      await settingsService.exportSettings()
    } catch (error) {
      console.error('导出失败:', error)
    }
  }, [])

  // 导入设置
  const importSettings = useCallback(async (file: File) => {
    try {
      setSaving(true)
      await settingsService.importSettings(file)
      await loadSettings()
    } catch (error) {
      console.error('导入失败:', error)
    } finally {
      setSaving(false)
    }
  }, [loadSettings])

  // 清空所有数据
  const clearAllData = useCallback(async () => {
    try {
      setSaving(true)
      await settingsService.clearAllData()
      await loadSettings()
    } catch (error) {
      console.error('清空失败:', error)
    } finally {
      setSaving(false)
    }
  }, [loadSettings])

  // 刷新设置
  const refreshSettings = useCallback(async () => {
    await loadSettings()
  }, [loadSettings])

  // 监听网络状态变化
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 监听设置变化
  useEffect(() => {
    const handleSettingsChange = () => {
      loadSettings()
    }

    settingsService.addListener(handleSettingsChange)

    return () => {
      settingsService.removeListener(handleSettingsChange)
    }
  }, [loadSettings])

  // 初始加载
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    loading,
    saving,
    syncing: syncing || settingsService.isSyncInProgress(),
    isOnline,
    updateSetting,
    saveSettings,
    syncToCloud,
    pullFromCloud,
    resetSettings,
    exportSettings,
    importSettings,
    clearAllData,
    refreshSettings
  }
}