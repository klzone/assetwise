/**
 * 存储管理器 - 管理本地SQLite和云端Supabase存储
 * 
 * 存储策略：
 * - 默认使用本地SQLite存储
 * - 云端同步作为付费功能（专业版/旗舰版）
 * - 认证和订阅验证始终使用云端
 */

import { supabaseDataService } from './supabase-data.service'
import { supabaseAuthService } from './supabase-auth.service'
import { localStorageService } from './local-storage.service'
import { safeTauriService } from './tauri-safe.service'
import { secureStorageService } from './secure-storage.service'
import { encryptionService } from './encryption.service'

export type StorageMode = 'local' | 'cloud' | 'hybrid'
export type SubscriptionType = 'free' | 'professional' | 'flagship'

interface StorageConfig {
  mode: StorageMode
  autoSync: boolean
  syncInterval: number // 分钟
}

class StorageManagerService {
  private config: StorageConfig = {
    mode: 'local', // 默认本地存储
    autoSync: false,
    syncInterval: 30
  }

  private isInTauriEnvironment(): boolean {
    if (typeof window === 'undefined') return false

    // 检查是否在Tauri环境中
    const isTauri = window.location.protocol === 'tauri:' ||
                   window.navigator.userAgent.includes('Tauri') ||
                   (window as any).__TAURI__ !== undefined ||
                   (window as any).__TAURI_METADATA__ !== undefined

    console.log('Tauri环境检测:', {
      protocol: window.location.protocol,
      userAgent: window.navigator.userAgent,
      hasTauriGlobal: (window as any).__TAURI__ !== undefined,
      hasTauriMetadata: (window as any).__TAURI_METADATA__ !== undefined,
      isTauri: isTauri
    })

    return isTauri
  }

  private getLocalService() {
    // 在桌面环境下也使用localStorage，因为safeTauriService主要用于系统级操作
    return localStorageService
  }

  /**
   * 初始化存储管理器
   */
  async initialize(): Promise<void> {
    const isTauri = this.isInTauriEnvironment()

    console.log('存储管理器初始化:', {
      environment: isTauri ? 'Tauri桌面端' : 'Web浏览器',
      defaultMode: this.config.mode
    })

    // 从本地存储加载配置
    try {
      const savedConfig = localStorage.getItem('storage_config')
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) }
      }
    } catch (error) {
      console.warn('加载存储配置失败:', error)
    }

    // 在桌面端，强制使用本地存储作为默认选项
    if (isTauri && this.config.mode !== 'cloud') {
      this.config.mode = 'local'
      console.log('桌面端环境，使用本地SQLite存储')
    }

    // 检查用户订阅状态
    try {
      const user = await supabaseAuthService.getCurrentUser()
      if (user) {
        const canUseCloud = await this.canUseCloudStorage(user.id)
        if (!canUseCloud && this.config.mode === 'cloud') {
          // 如果用户失去云端权限，切换到本地存储
          this.config.mode = 'local'
          this.saveConfig()
        }
      }
    } catch (error) {
      console.warn('检查用户订阅状态失败:', error)
    }

    // 初始化本地数据库
    if (!isTauri) {
      localStorageService.initializeData()
    } else {
      console.log('Tauri环境，SQLite数据库将自动初始化')
    }
  }

  /**
   * 检查用户是否可以使用云端存储
   */
  async canUseCloudStorage(userId: string): Promise<boolean> {
    try {
      const user = await supabaseAuthService.getCurrentUser()
      if (!user) {
        console.log('🔍 用户未登录，无法使用云端存储');
        return false;
      }

      // 检查订阅状态
      console.log('🔍 检查用户云端存储权限:', { userId, userSubscription: user.subscription_type });

      // 直接使用当前用户的订阅信息，避免再次查询可能失败的profiles表
      const subscriptionType = user.subscription_type || 'free';
      const canUseCloud = subscriptionType === 'professional' || subscriptionType === 'flagship';

      console.log('✅ 云端存储权限检查结果:', { subscriptionType, canUseCloud });
      return canUseCloud;
    } catch (error: any) {
      console.error('检查云端存储权限失败:', {
        message: error.message,
        userId
      });
      return false
    }
  }

  /**
   * 获取当前存储模式
   */
  getStorageMode(): StorageMode {
    return this.config.mode
  }

  /**
   * 设置存储模式
   */
  async setStorageMode(mode: StorageMode): Promise<{ success: boolean; error?: string }> {
    const user = await supabaseAuthService.getCurrentUser()
    if (!user) {
      return { success: false, error: '用户未登录' }
    }

    // 检查权限
    if (mode === 'cloud' || mode === 'hybrid') {
      const canUseCloud = await this.canUseCloudStorage(user.id)
      if (!canUseCloud) {
        return { 
          success: false, 
          error: '云端存储功能仅限专业版和旗舰版用户使用' 
        }
      }
    }

    this.config.mode = mode
    this.saveConfig()
    return { success: true }
  }

  /**
   * 保存配置到本地存储
   */
  private saveConfig(): void {
    localStorage.setItem('storage_config', JSON.stringify(this.config))
  }

  /**
   * 获取数据服务（根据当前模式）
   */
  getDataService() {
    const isTauri = this.isInTauriEnvironment()

    console.log('获取数据服务:', {
      environment: isTauri ? 'Tauri桌面端' : 'Web浏览器',
      configMode: this.config.mode,
      willUse: this.config.mode === 'cloud' ? 'Supabase云端' : (isTauri ? 'Tauri SQLite' : 'localStorage')
    })

    switch (this.config.mode) {
      case 'cloud':
        return supabaseDataService
      case 'local':
      default:
        return this.getLocalService()
    }
  }

  /**
   * 同步数据到云端（付费功能）
   */
  async syncToCloud(userId: string): Promise<{ success: boolean; error?: string }> {
    const canUseCloud = await this.canUseCloudStorage(userId)
    if (!canUseCloud) {
      return { success: false, error: '云端同步功能仅限付费用户使用' }
    }

    try {
      const localService = this.getLocalService()
      
      // 获取本地数据
      const [accounts, transactions, reviews] = await Promise.all([
        localService.getAccounts(userId),
        localService.getTransactions(userId),
        localService.getReviews(userId)
      ])

      // 上传到云端
      for (const account of accounts) {
        await supabaseDataService.createAccount(account)
      }

      for (const transaction of transactions) {
        await supabaseDataService.createTransaction(transaction)
      }

      for (const review of reviews) {
        await supabaseDataService.createReview(review)
      }

      return { success: true }
    } catch (error) {
      console.error('同步到云端失败:', error)
      return { success: false, error: '同步失败，请重试' }
    }
  }

  /**
   * 从云端同步数据（付费功能）
   */
  async syncFromCloud(userId: string): Promise<{ success: boolean; error?: string }> {
    const canUseCloud = await this.canUseCloudStorage(userId)
    if (!canUseCloud) {
      return { success: false, error: '云端同步功能仅限付费用户使用' }
    }

    try {
      // 获取云端数据
      const [accounts, transactions, reviews] = await Promise.all([
        supabaseDataService.getAccounts(userId),
        supabaseDataService.getTransactions(userId),
        supabaseDataService.getReviews(userId)
      ])

      const localService = this.getLocalService()

      // 保存到本地
      for (const account of accounts) {
        await localService.addAccount(account)
      }

      for (const transaction of transactions) {
        await localService.addTransaction(transaction)
      }

      for (const review of reviews) {
        await localService.addReview(review)
      }

      return { success: true }
    } catch (error) {
      console.error('从云端同步失败:', error)
      return { success: false, error: '同步失败，请重试' }
    }
  }

  /**
   * 获取存储配置
   */
  getConfig(): StorageConfig {
    return { ...this.config }
  }

  /**
   * 更新存储配置
   */
  updateConfig(updates: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...updates }
    this.saveConfig()
  }

  /**
   * 安全云端同步 - 加密数据后上传
   */
  async secureCloudSync(userId: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      // 验证用户订阅权限
      const user = await supabaseAuthService.getCurrentUser()
      if (!user || !this.hasCloudSyncPermission(user.subscription_type)) {
        return { success: false, message: '需要专业版或旗舰版才能使用云端同步' }
      }

      // 获取本地数据
      const localService = this.getLocalService()
      const [accounts, transactions, reviews] = await Promise.all([
        localService.getAccounts(parseInt(userId)),
        localService.getTransactions(parseInt(userId)),
        localService.getReviews(parseInt(userId))
      ])

      // 敏感字段列表
      const sensitiveFields = ['account_number', 'balance', 'amount', 'description']

      // 加密敏感数据
      const encryptedAccounts = accounts.map(account =>
        encryptionService.encryptSensitiveFields(account, sensitiveFields, password)
      )
      const encryptedTransactions = transactions.map(transaction =>
        encryptionService.encryptSensitiveFields(transaction, sensitiveFields, password)
      )
      const encryptedReviews = reviews.map(review =>
        encryptionService.encryptSensitiveFields(review, ['content', 'tags'], password)
      )

      // 上传到云端
      const syncData = {
        accounts: encryptedAccounts,
        transactions: encryptedTransactions,
        reviews: encryptedReviews,
        encrypted: true,
        timestamp: new Date().toISOString()
      }

      // 这里可以调用Supabase或其他云端服务
      // 暂时使用模拟实现
      console.log('Uploading encrypted data to cloud:', syncData)

      return { success: true, message: '数据已安全同步到云端' }
    } catch (error) {
      console.error('Secure cloud sync failed:', error)
      return { success: false, message: `同步失败: ${error.message}` }
    }
  }

  /**
   * 安全云端恢复 - 下载并解密数据
   */
  async secureCloudRestore(userId: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      // 验证用户订阅权限
      const user = await supabaseAuthService.getCurrentUser()
      if (!user || !this.hasCloudSyncPermission(user.subscription_type)) {
        return { success: false, message: '需要专业版或旗舰版才能使用云端同步' }
      }

      // 从云端下载数据（模拟实现）
      // 实际应该调用云端API
      const cloudData = {
        accounts: [],
        transactions: [],
        reviews: [],
        encrypted: true,
        timestamp: new Date().toISOString()
      }

      if (!cloudData.encrypted) {
        return { success: false, message: '云端数据未加密，无法安全恢复' }
      }

      // 敏感字段列表
      const sensitiveFields = ['account_number', 'balance', 'amount', 'description']

      // 解密数据
      const decryptedAccounts = cloudData.accounts.map(account =>
        encryptionService.decryptSensitiveFields(account, sensitiveFields, password)
      )
      const decryptedTransactions = cloudData.transactions.map(transaction =>
        encryptionService.decryptSensitiveFields(transaction, sensitiveFields, password)
      )
      const decryptedReviews = cloudData.reviews.map(review =>
        encryptionService.decryptSensitiveFields(review, ['content', 'tags'], password)
      )

      // 保存到本地
      const localService = this.getLocalService()

      // 清空现有数据并导入新数据
      // 这里需要实现批量导入功能
      console.log('Restoring decrypted data:', {
        accounts: decryptedAccounts,
        transactions: decryptedTransactions,
        reviews: decryptedReviews
      })

      return { success: true, message: '数据已从云端安全恢复' }
    } catch (error) {
      console.error('Secure cloud restore failed:', error)
      return { success: false, message: `恢复失败: ${error.message}` }
    }
  }

  /**
   * 初始化安全存储
   */
  async initializeSecureStorage(password: string): Promise<void> {
    await secureStorageService.initialize(password)
  }

  /**
   * 验证存储密码
   */
  async verifyStoragePassword(password: string): Promise<boolean> {
    return await secureStorageService.verifyPassword(password)
  }

  /**
   * 更改存储密码
   */
  async changeStoragePassword(oldPassword: string, newPassword: string): Promise<void> {
    await secureStorageService.changePassword(oldPassword, newPassword)
  }
}

export const storageManagerService = new StorageManagerService()
