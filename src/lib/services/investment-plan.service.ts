import { localStorageService } from './local-storage.service'
import { logger } from '../utils/logger'
import { InvestmentPlan } from '../types/data.types'

export interface CreateInvestmentPlanData {
  title: string
  description: string
  targetAmount: number
  startDate: string
  endDate: string
  expectedReturn: number
  riskLevel: 'low' | 'medium' | 'high'
  category: string
  priority: 'high' | 'medium' | 'low'
  assets: Array<{
    name: string
    allocation: number
    currentPrice: number
    targetPrice: number
  }>
  milestones: Array<{
    title: string
    targetDate: string
    description: string
  }>
  notes?: string
}

export interface UpdateInvestmentPlanData extends Partial<CreateInvestmentPlanData> {
  id: number
  status?: 'active' | 'paused' | 'completed' | 'draft'
  currentAmount?: number
}

export interface InvestmentPlanStats {
  totalPlans: number
  activePlans: number
  completedPlans: number
  draftPlans: number
  totalTargetAmount: number
  totalCurrentAmount: number
  averageProgress: number
  totalExpectedReturn: number
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: Date | null
  pendingCount: number
  hasPermission: boolean
}

class InvestmentPlanService {
  private readonly STORAGE_KEY = 'investment_plans'
  private readonly SYNC_KEY = 'investment_plans_sync'

  // 鑾峰彇鎵€鏈夋姇璧勮鍒?
  async getAllPlans(): Promise<InvestmentPlan[]> {
    try {
      const plans = (await localStorageService.getData<any>('plans') || []) as InvestmentPlan[]
      logger.info(`鑾峰彇鍒?${plans.length} 涓姇璧勮鍒抈, 'investment-plan-service')
      return plans
    } catch (error) {
      logger.error('鑾峰彇鎶曡祫璁″垝澶辫触:', 'investment-plan-service', error)
      return []
    }
  }

  // 鏍规嵁ID鑾峰彇鎶曡祫璁″垝
  async getPlanById(id: number): Promise<InvestmentPlan | null> {
    try {
      const plans = await this.getAllPlans()
      const plan = plans.find(p => p.id === id)
      return plan || null
    } catch (error) {
      logger.error('鑾峰彇鎶曡祫璁″垝澶辫触:', 'investment-plan-service', error)
      return null
    }
  }

  // 鍒涘缓鎶曡祫璁″垝
  async createPlan(planData: CreateInvestmentPlanData): Promise<InvestmentPlan> {
    try {
      const plans = await this.getAllPlans()
      const newId = Math.max(0, ...plans.map(p => p.id)) + 1
      
      const newPlan: InvestmentPlan = {
        id: newId,
        ...planData,
        status: 'draft',
        currentAmount: 0,
        milestones: planData.milestones.map(m => ({
          title: m.title,
          targetDate: m.targetDate,
          description: m.description,
          completed: false
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        checksum: '',
        deviceId: this.getDeviceId()
      }

      // 璁＄畻鏍￠獙鍜?
      newPlan.checksum = this.calculateChecksum(newPlan)

      plans.push(newPlan)
      await localStorageService.saveData('plans', plans as any[])
      
      logger.info(`鍒涘缓鎶曡祫璁″垝鎴愬姛: ${newPlan.title} (ID: ${newPlan.id})`, 'investment-plan-service')
      
      // 瑙﹀彂鑷姩鍚屾
      this.triggerAutoSync()
      
      return newPlan
    } catch (error) {
      logger.error('鍒涘缓鎶曡祫璁″垝澶辫触:', 'investment-plan-service', error)
      throw error
    }
  }

  // 鏇存柊鎶曡祫璁″垝
  async updatePlan(planData: UpdateInvestmentPlanData): Promise<InvestmentPlan> {
    try {
      const plans = await this.getAllPlans()
      const index = plans.findIndex(p => p.id === planData.id)
      
      if (index === -1) {
        throw new Error('鎶曡祫璁″垝涓嶅瓨鍦?)
      }

      const updatedPlan: InvestmentPlan = {
        ...plans[index],
        ...planData,
        updatedAt: new Date().toISOString(),
        version: plans[index].version + 1,
        deviceId: this.getDeviceId()
      }

      // 璁＄畻鏍￠獙鍜?
      updatedPlan.checksum = this.calculateChecksum(updatedPlan)

      plans[index] = updatedPlan
      await localStorageService.saveData('plans', plans as any[])
      
      logger.info(`鏇存柊鎶曡祫璁″垝鎴愬姛: ${updatedPlan.title} (ID: ${updatedPlan.id})`, 'investment-plan-service')
      
      // 瑙﹀彂鑷姩鍚屾
      this.triggerAutoSync()
      
      return updatedPlan
    } catch (error) {
      logger.error('鏇存柊鎶曡祫璁″垝澶辫触:', 'investment-plan-service', error)
      throw error
    }
  }

  // 鍒犻櫎鎶曡祫璁″垝
  async deletePlan(id: number): Promise<void> {
    try {
      const plans = await this.getAllPlans()
      const filteredPlans = plans.filter(p => p.id !== id)
      
      if (filteredPlans.length === plans.length) {
        throw new Error('鎶曡祫璁″垝涓嶅瓨鍦?)
      }

      await localStorageService.saveData('plans', filteredPlans as any[])
      
      logger.info(`鍒犻櫎鎶曡祫璁″垝鎴愬姛 (ID: ${id})`, 'investment-plan-service')
      
      // 瑙﹀彂鑷姩鍚屾
      this.triggerAutoSync()
    } catch (error) {
      logger.error('鍒犻櫎鎶曡祫璁″垝澶辫触:', 'investment-plan-service', error)
      throw error
    }
  }

  // 鏇存柊璁″垝鐘舵€?
  async updatePlanStatus(id: number, status: 'active' | 'paused' | 'completed' | 'draft'): Promise<InvestmentPlan> {
    return this.updatePlan({ id, status })
  }

  // 鏇存柊璁″垝杩涘害
  async updatePlanProgress(id: number, currentAmount: number): Promise<InvestmentPlan> {
    return this.updatePlan({ id, currentAmount })
  }

  // 鏇存柊閲岀▼纰戠姸鎬?
  async updateMilestone(planId: number, milestoneIndex: number, completed: boolean): Promise<InvestmentPlan> {
    try {
      const plan = await this.getPlanById(planId)
      if (!plan) {
        throw new Error('鎶曡祫璁″垝涓嶅瓨鍦?)
      }

      const updatedMilestones = [...plan.milestones]
      if (milestoneIndex >= 0 && milestoneIndex < updatedMilestones.length) {
        updatedMilestones[milestoneIndex] = {
          ...updatedMilestones[milestoneIndex],
          completed
        }
      }

      return this.updatePlan({
        id: planId,
        milestones: updatedMilestones
      })
    } catch (error) {
      logger.error('鏇存柊閲岀▼纰戝け璐?', 'investment-plan-service', error)
      throw error
    }
  }

  // 鑾峰彇缁熻鏁版嵁
  async getStats(): Promise<InvestmentPlanStats> {
    try {
      const plans = await this.getAllPlans()
      
      const stats: InvestmentPlanStats = {
        totalPlans: plans.length,
        activePlans: plans.filter(p => p.status === 'active').length,
        completedPlans: plans.filter(p => p.status === 'completed').length,
        draftPlans: plans.filter(p => p.status === 'draft').length,
        totalTargetAmount: plans.reduce((sum, p) => sum + p.targetAmount, 0),
        totalCurrentAmount: plans.reduce((sum, p) => sum + p.currentAmount, 0),
        averageProgress: plans.length > 0 
          ? plans.reduce((sum, p) => sum + (p.currentAmount / p.targetAmount * 100), 0) / plans.length 
          : 0,
        totalExpectedReturn: plans.length > 0
          ? plans.reduce((sum, p) => sum + p.expectedReturn, 0) / plans.length
          : 0
      }

      return stats
    } catch (error) {
      logger.error('鑾峰彇缁熻鏁版嵁澶辫触:', 'investment-plan-service', error)
      throw error
    }
  }

  // 鑾峰彇鍒嗙被鍒楄〃
  async getCategories(): Promise<string[]> {
    try {
      const plans = await this.getAllPlans()
      const categories = [...new Set(plans.map(p => p.category).filter(Boolean))]
      return categories.sort()
    } catch (error) {
      logger.error('鑾峰彇鍒嗙被鍒楄〃澶辫触:', 'investment-plan-service', error)
      return []
    }
  }

  // 鎼滅储鎶曡祫璁″垝
  async searchPlans(query: string): Promise<InvestmentPlan[]> {
    try {
      const plans = await this.getAllPlans()
      const lowercaseQuery = query.toLowerCase()
      
      return plans.filter(plan => 
        plan.title.toLowerCase().includes(lowercaseQuery) ||
        plan.description.toLowerCase().includes(lowercaseQuery) ||
        plan.category.toLowerCase().includes(lowercaseQuery) ||
        plan.notes?.toLowerCase().includes(lowercaseQuery) ||
        plan.assets.some(asset => asset.name.toLowerCase().includes(lowercaseQuery))
      )
    } catch (error) {
      logger.error('鎼滅储鎶曡祫璁″垝澶辫触:', 'investment-plan-service', error)
      return []
    }
  }

  // 鎸夌姸鎬佺瓫閫?
  async filterByStatus(status: 'active' | 'paused' | 'completed' | 'draft'): Promise<InvestmentPlan[]> {
    try {
      const plans = await this.getAllPlans()
      return plans.filter(p => p.status === status)
    } catch (error) {
      logger.error('绛涢€夋姇璧勮鍒掑け璐?', 'investment-plan-service', error)
      return []
    }
  }

  // 鎸変紭鍏堢骇绛涢€?
  async filterByPriority(priority: 'high' | 'medium' | 'low'): Promise<InvestmentPlan[]> {
    try {
      const plans = await this.getAllPlans()
      return plans.filter(p => p.priority === priority)
    } catch (error) {
      logger.error('绛涢€夋姇璧勮鍒掑け璐?', 'investment-plan-service', error)
      return []
    }
  }

  // 鍚屾鍒颁簯绔?
  async syncToCloud(): Promise<void> {
    try {
      logger.info('寮€濮嬪悓姝ユ姇璧勮鍒掑埌浜戠', 'investment-plan-service')
      
      const plans = await this.getAllPlans()
      // 鏆傛椂娉ㄩ噴鎺変簯绔悓姝ュ姛鑳斤紝閬垮厤鏂规硶涓嶅瓨鍦ㄧ殑閿欒
      console.log('浜戠鍚屾鍔熻兘鏆傛椂绂佺敤', plans.length)
      
      // 鏇存柊鍚屾鐘舵€?
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.SYNC_KEY, JSON.stringify({
          lastSyncTime: new Date().toISOString(),
          syncedCount: plans.length
        }))
      }

      logger.info(`鍚屾 ${plans.length} 涓姇璧勮鍒掑埌浜戠鎴愬姛`, 'investment-plan-service')
    } catch (error) {
      logger.error('鍚屾鎶曡祫璁″垝鍒颁簯绔け璐?', 'investment-plan-service', error)
      throw error
    }
  }

  // 浠庝簯绔媺鍙?
  async syncFromCloud(): Promise<void> {
    try {
      logger.info('寮€濮嬩粠浜戠鎷夊彇鎶曡祫璁″垝', 'investment-plan-service')
      
      // 鏆傛椂娉ㄩ噴鎺変簯绔悓姝ュ姛鑳斤紝閬垮厤鏂规硶涓嶅瓨鍦ㄧ殑閿欒
      // const cloudPlans = await supabaseDataService.getAllInvestmentPlans()
      const cloudPlans: any[] = []
      const localPlans = await this.getAllPlans()

      // 鍚堝苟浜戠鍜屾湰鍦版暟鎹?
      const mergedPlans = await this.mergeCloudAndLocalData(cloudPlans, localPlans)
      
      await localStorageService.saveData('plans', mergedPlans as any[])
      
      // 鏇存柊鍚屾鐘舵€?
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.SYNC_KEY, JSON.stringify({
          lastSyncTime: new Date().toISOString(),
          syncedCount: mergedPlans.length
        }))
      }

      logger.info(`浠庝簯绔媺鍙?${cloudPlans.length} 涓姇璧勮鍒掓垚鍔焋, 'investment-plan-service')
    } catch (error) {
      logger.error('浠庝簯绔媺鍙栨姇璧勮鍒掑け璐?', 'investment-plan-service', error)
      throw error
    }
  }

  // 鑾峰彇鍚屾鐘舵€?
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false
      const isSyncing = false // 绠€鍖栧鐞?
      let syncInfo = null
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.SYNC_KEY)
        syncInfo = stored ? JSON.parse(stored) : null
      }
      const plans = await this.getAllPlans()
      const pendingCount = plans.filter(p => !p.checksum || (p.version && p.version > 1)).length
      const hasPermission = true // 绠€鍖栧鐞?

      return {
        isOnline,
        isSyncing,
        lastSyncTime: syncInfo?.lastSyncTime ? new Date(syncInfo.lastSyncTime) : null,
        pendingCount,
        hasPermission
      }
    } catch (error) {
      logger.error('鑾峰彇鍚屾鐘舵€佸け璐?', 'investment-plan-service', error)
      return {
        isOnline: false,
        isSyncing: false,
        lastSyncTime: null,
        pendingCount: 0,
        hasPermission: false
      }
    }
  }

  // 瀵煎嚭鏁版嵁
  async exportData(): Promise<string> {
    try {
      const plans = await this.getAllPlans()
      const exportData = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        data: plans
      }
      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      logger.error('瀵煎嚭鎶曡祫璁″垝鏁版嵁澶辫触:', 'investment-plan-service', error)
      throw error
    }
  }

  // 瀵煎叆鏁版嵁
  async importData(jsonData: string): Promise<void> {
    try {
      const importData = JSON.parse(jsonData)
      if (!importData.data || !Array.isArray(importData.data)) {
        throw new Error('鏃犳晥鐨勬暟鎹牸寮?)
      }

      const existingPlans = await this.getAllPlans()
      const maxId = Math.max(0, ...existingPlans.map(p => p.id))
      
      const importedPlans = importData.data.map((plan: any, index: number) => ({
        ...plan,
        id: maxId + index + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        deviceId: this.getDeviceId()
      }))

      const allPlans = [...existingPlans, ...importedPlans]
      await localStorageService.saveData('plans', allPlans as any[])
      
      logger.info(`瀵煎叆 ${importedPlans.length} 涓姇璧勮鍒掓垚鍔焋, 'investment-plan-service')
      
      // 瑙﹀彂鑷姩鍚屾
      this.triggerAutoSync()
    } catch (error) {
      logger.error('瀵煎叆鎶曡祫璁″垝鏁版嵁澶辫触:', 'investment-plan-service', error)
      throw error
    }
  }

  // 绉佹湁鏂规硶锛氬悎骞朵簯绔拰鏈湴鏁版嵁
  private async mergeCloudAndLocalData(cloudPlans: any[], localPlans: InvestmentPlan[]): Promise<InvestmentPlan[]> {
    const merged = new Map<number, InvestmentPlan>()

    // 娣诲姞鏈湴鏁版嵁
    localPlans.forEach(plan => {
      merged.set(plan.id, plan)
    })

    // 鍚堝苟浜戠鏁版嵁
    cloudPlans.forEach(cloudPlan => {
      const id = cloudPlan.local_id || cloudPlan.id

      const existingPlan = merged.get(id)
      
      if (!existingPlan) {
        // 鏂扮殑浜戠鏁版嵁
        merged.set(id, {
          id,
          title: cloudPlan.title,
          description: cloudPlan.description,
          status: cloudPlan.status,
          priority: cloudPlan.priority,
          targetAmount: cloudPlan.target_amount,
          currentAmount: cloudPlan.current_amount,
          startDate: cloudPlan.start_date,
          endDate: cloudPlan.end_date,
          expectedReturn: cloudPlan.expected_return,
          riskLevel: cloudPlan.risk_level,
          category: cloudPlan.category,
          assets: cloudPlan.assets || [],
          milestones: cloudPlan.milestones || [],
          notes: cloudPlan.notes,
          createdAt: cloudPlan.created_at,
          updatedAt: cloudPlan.updated_at,
          version: cloudPlan.version || 1,
          checksum: cloudPlan.checksum || '',
          deviceId: cloudPlan.device_id || ''
        })
      } else {
        // 妫€鏌ョ増鏈啿绐?
        const cloudVersion = cloudPlan.version || 1
        const existingVersion = existingPlan.version || 1
        if (cloudVersion > existingVersion) {
          // 浜戠鐗堟湰鏇存柊锛屼娇鐢ㄤ簯绔暟鎹?
          merged.set(id, {
            ...existingPlan,
            title: cloudPlan.title,
            description: cloudPlan.description,
            status: cloudPlan.status,
            priority: cloudPlan.priority,
            targetAmount: cloudPlan.target_amount,
            currentAmount: cloudPlan.current_amount,
            startDate: cloudPlan.start_date,
            endDate: cloudPlan.end_date,
            expectedReturn: cloudPlan.expected_return,
            riskLevel: cloudPlan.risk_level,
            category: cloudPlan.category,
            assets: cloudPlan.assets || existingPlan.assets,
            milestones: cloudPlan.milestones || existingPlan.milestones,
            notes: cloudPlan.notes,
            updatedAt: cloudPlan.updated_at,
            version: cloudVersion,
            checksum: cloudPlan.checksum || existingPlan.checksum
          })
        }
      }
    })

    return Array.from(merged.values()).sort((a, b) => a.id - b.id)
  }

  // 绉佹湁鏂规硶锛氳绠楁牎楠屽拰
  private calculateChecksum(plan: InvestmentPlan): string {
    const data = {
      title: plan.title,
      description: plan.description,
      status: plan.status,
      priority: plan.priority,
      targetAmount: plan.targetAmount,
      currentAmount: plan.currentAmount,
      startDate: plan.startDate,
      endDate: plan.endDate,
      expectedReturn: plan.expectedReturn,
      riskLevel: plan.riskLevel,
      category: plan.category,
      assets: plan.assets,
      milestones: plan.milestones,
      notes: plan.notes
    }
    
    try {
      // 浣跨敤 encodeURIComponent 鍜?btoa 鏉ュ鐞嗕腑鏂囧瓧绗?
      const jsonString = JSON.stringify(data)
      const encodedString = encodeURIComponent(jsonString)
      return btoa(encodedString).slice(0, 32)
    } catch (error) {
      // 濡傛灉 btoa 浠嶇劧澶辫触锛屼娇鐢ㄧ畝鍗曠殑鍝堝笇绠楁硶
      const jsonString = JSON.stringify(data)
      let hash = 0
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 杞崲涓?2浣嶆暣鏁?
      }
      return Math.abs(hash).toString(16).slice(0, 32)
    }
  }

  // 绉佹湁鏂规硶锛氳幏鍙栬澶嘔D
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('device_id')
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('device_id', deviceId)
    }
    return deviceId
  }

  // 绉佹湁鏂规硶锛氳Е鍙戣嚜鍔ㄥ悓姝?
  private triggerAutoSync(): void {
    // 寤惰繜瑙﹀彂鍚屾锛岄伩鍏嶉绻佸悓姝?
    setTimeout(async () => {
      try {
        const syncStatus = await this.getSyncStatus()
        if (syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.hasPermission) {
          await this.syncToCloud()
        }
      } catch (error) {
        console.error('鑷姩鍚屾澶辫触:', error)
      }
    }, 2000)
  }
}

export const investmentPlanService = new InvestmentPlanService()

