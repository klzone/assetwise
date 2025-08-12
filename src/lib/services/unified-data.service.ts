import {
  User,
  Account,
  Asset,
  Transaction,
  ReviewLog,
  DashboardData
} from '@/lib/types/data.types';
import { localStorageService } from './local-storage.service';
import { localDataManagerService } from './local-data-manager.service';
import { storageManagerService } from './storage-manager.service';
import { safeTauriService } from './tauri-safe.service';

class UnifiedDataService {
  private isInTauriEnvironment(): boolean {
    if (typeof window === 'undefined') return false;

    // 检查是否在Tauri环境中
    const isTauri = window.location.protocol === 'tauri:' ||
                   window.navigator.userAgent.includes('Tauri') ||
                   (window as any).__TAURI__ !== undefined ||
                   (window as any).__TAURI_METADATA__ !== undefined;

    console.log('UnifiedDataService环境检测:', {
      protocol: window.location.protocol,
      userAgent: window.navigator.userAgent,
      hasTauriGlobal: (window as any).__TAURI__ !== undefined,
      hasTauriMetadata: (window as any).__TAURI_METADATA__ !== undefined,
      isTauri: isTauri
    });

    return isTauri;
  }

  // 检查用户是否可以使用云端同步功能
  private canUseCloudSync(): boolean {
    try {
      // 获取当前用户信息 - 从正确的store路径获取
      const { useUserStore } = require('@/store');
      const userStore = useUserStore.getState();
      const currentUser = userStore.user;

      if (!currentUser) {
        console.log('用户未登录，无法使用云端同步');
        return false;
      }

      // 检查订阅类型
      const subscriptionType = currentUser.subscription_type || 'basic';
      const allowedTypes = ['professional', 'flagship'];

      console.log('🔍 用户信息:', {
        id: currentUser.id,
        email: currentUser.email,
        subscriptionType: subscriptionType
      });
      console.log('✅ 允许的订阅类型:', allowedTypes);

      // 严格的权限检查
      const hasPermission = allowedTypes.includes(subscriptionType);
      console.log('🎯 云端同步权限检查结果:', hasPermission);

      return hasPermission;
    } catch (error) {
      console.error('检查云端同步权限失败:', error);
      return false;
    }
  }

  async getService() {
    // 桌面版强制使用本地数据管理器（本地优先策略）
    const isDesktop = this.isInTauriEnvironment() ||
                     window.location.protocol === 'file:' ||
                     window.location.hostname === 'tauri.localhost' ||
                     window.location.hostname === 'localhost' ||
                     navigator.userAgent.includes('Tauri') ||
                     navigator.userAgent.includes('Electron') ||
                     (typeof window !== 'undefined' && window.location.href.includes('tauri'));

    console.log('环境检测详情:', {
      isInTauriEnvironment: this.isInTauriEnvironment(),
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      href: window.location.href,
      userAgent: navigator.userAgent,
      isDesktop: isDesktop
    });

    // 强制使用本地数据管理器来解决问题
    console.log('使用本地数据管理器');
    return localDataManagerService;
  }

  // 初始化数据
  async initializeData(): Promise<void> {
    await storageManagerService.initialize();

    if (!this.isInTauriEnvironment()) {
      localStorageService.initializeData();
      // 清理demo数据
      localStorageService.clearDemoData();
    }
  }

  // 用户认证（已移除demo账户支持）
  async login(username: string, password: string): Promise<User | null> {
    console.warn('⚠️ 本地登录已弃用，请使用Supabase认证');
    return null;
  }

  async register(username: string, email: string, password: string): Promise<User | null> {
    console.warn('⚠️ 本地注册已弃用，请使用Supabase认证');
    return null;
  }

  getCurrentUser(): User | null {
    if (this.isInTauriEnvironment()) {
      // 在Tauri环境中，用户信息存储在Zustand中
      return null; // 由Zustand管理
    } else {
      return localStorageService.getCurrentUser();
    }
  }

  logout(): void {
    if (this.isInTauriEnvironment()) {
      // Tauri环境下只需要清除前端状态
      // 实际的登出逻辑由Zustand处理
    } else {
      localStorageService.logout();
    }
  }

  // 账户管理
  async getAccounts(userId: string): Promise<Account[]> {
    try {
      const service = await this.getService();
      return await service.getAccounts(userId);
    } catch (error) {
      console.error('获取账户失败:', error);
      return [];
    }
  }

  async createAccount(accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string; data?: Account }> {
    try {
      const service = await this.getService();
      return await service.createAccount(accountData);
    } catch (error) {
      console.error('创建账户失败:', error);
      return { success: false, error: '创建账户失败' };
    }
  }

  async updateAccount(accountId: string, updates: Partial<Account>): Promise<{ success: boolean; error?: string; data?: Account }> {
    try {
      const service = await this.getService();
      return await service.updateAccount(accountId, updates);
    } catch (error) {
      console.error('更新账户失败:', error);
      return { success: false, error: '更新账户失败' };
    }
  }

  async deleteAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const service = await this.getService();
      return await service.deleteAccount(accountId);
    } catch (error) {
      console.error('删除账户失败:', error);
      return { success: false, error: '删除账户失败' };
    }
  }

  // 资产管理
  async getAssets(userId: string): Promise<Asset[]> {
    try {
      const service = await this.getService();
      return await service.getAssets ? await service.getAssets(userId) : [];
    } catch (error) {
      console.error('获取资产失败:', error);
      return [];
    }
  }

  async addAsset(asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>): Promise<Asset | null> {
    try {
      const service = await this.getService();
      if (service.addAsset) {
        return await service.addAsset(asset);
      }
      return null;
    } catch (error) {
      console.error('添加资产失败:', error);
      return null;
    }
  }

  async updateAsset(assetId: string, updates: Partial<Asset>): Promise<Asset | null> {
    try {
      const service = await this.getService();
      if (service.updateAsset) {
        return await service.updateAsset(assetId, updates);
      }
      return null;
    } catch (error) {
      console.error('更新资产失败:', error);
      return null;
    }
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    try {
      const service = await this.getService();
      if (service.deleteAsset) {
        return await service.deleteAsset(assetId);
      }
      return false;
    } catch (error) {
      console.error('删除资产失败:', error);
      return false;
    }
  }

  async calculateAssetsFromTransactions(userId: string): Promise<boolean> {
    try {
      const service = await this.getService();
      if (service.calculateAssetsFromTransactions) {
        return await service.calculateAssetsFromTransactions(userId);
      }
      return false;
    } catch (error) {
      console.error('计算资产失败:', error);
      return false;
    }
  }

  // 交易记录
  async getTransactions(userId: string): Promise<Transaction[]> {
    try {
      const service = await this.getService();
      return await service.getTransactions(userId);
    } catch (error) {
      console.error('获取交易记录失败:', error);
      return [];
    }
  }

  async createTransaction(transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string; data?: Transaction }> {
    try {
      console.log('UnifiedDataService.createTransaction 开始:', transactionData);
      const service = await this.getService();
      console.log('获取到的服务:', service.constructor.name);

      const result = await service.createTransaction(transactionData);
      console.log('createTransaction 结果:', result);

      return result;
    } catch (error) {
      console.error('创建交易记录失败:', error);
      return { success: false, error: '创建交易记录失败' };
    }
  }

  // 复盘日志
  async getReviews(userId: string): Promise<ReviewLog[]> {
    try {
      const service = await this.getService();
      return await service.getReviews(userId);
    } catch (error) {
      console.error('获取复盘日志失败:', error);
      return [];
    }
  }

  async createReview(reviewData: Omit<ReviewLog, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string; data?: ReviewLog }> {
    try {
      const service = await this.getService();
      return await service.createReview(reviewData);
    } catch (error) {
      console.error('创建复盘日志失败:', error);
      return { success: false, error: '创建复盘日志失败' };
    }
  }

  // 仪表板数据
  async getDashboardData(userId: string): Promise<DashboardData> {
    try {
      const service = await this.getService();
      if (service.getDashboardData) {
        return await service.getDashboardData(userId);
      }
      
      // 返回默认的空数据
      return {
        totalAssets: 0,
        totalValue: 0,
        totalProfit: 0,
        profitPercentage: 0,
        recentTransactions: [],
        assetDistribution: [],
        performanceData: []
      };
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
      return {
        totalAssets: 0,
        totalValue: 0,
        totalProfit: 0,
        profitPercentage: 0,
        recentTransactions: [],
        assetDistribution: [],
        performanceData: []
      };
    }
  }

  // 云端同步功能
  async syncToCloud(userId: string): Promise<boolean> {
    console.log('🚀 开始云端同步，用户ID:', userId);

    // 检查用户权限
    if (!this.canUseCloudSync()) {
      console.warn('云端同步功能仅限专业版和旗舰版用户使用');
      throw new Error('云端同步功能仅限专业版和旗舰版用户使用');
    }

    console.log('✅ 权限检查通过');

    try {
      // Web版本使用云端同步服务
      console.log('🌐 使用云端同步服务');
      const { cloudSyncService } = await import('./cloud-sync.service');
      console.log('📦 云端同步服务导入成功');
      const result = await cloudSyncService.manualSync();
      console.log('🎯 同步结果:', result);
      return result.success;
    } catch (error) {
      console.error('❌ 云端同步失败:', error);
      return false;
    }
  }

  async syncFromCloud(userId: string): Promise<boolean> {
    // 检查用户权限
    if (!this.canUseCloudSync()) {
      console.warn('云端同步功能仅限专业版和旗舰版用户使用');
      throw new Error('云端同步功能仅限专业版和旗舰版用户使用');
    }

    try {
      // Web版本使用云端同步服务
      console.log('🌐 使用云端同步服务');
      const { cloudSyncService } = await import('./cloud-sync.service');
      const result = await cloudSyncService.pullFromCloud();
      return result.success;
    } catch (error) {
      console.error('云端同步失败:', error);
      return false;
    }
  }

  // 检查是否支持云端同步
  isCloudSyncAvailable(): boolean {
    return true; // 所有环境都支持云端同步（付费功能）
  }

  // 获取当前环境信息
  getEnvironmentInfo(): { platform: string; supportsCloudSync: boolean } {
    const isDesktop = this.isInTauriEnvironment();
    return {
      platform: isDesktop ? 'desktop' : 'web',
      supportsCloudSync: true // 所有环境都支持云端同步（付费功能）
    };
  }

  // 投资计划管理
  async getInvestmentPlans(userId: string): Promise<any[]> {
    try {
      const service = await this.getService();

      // 检查服务是否支持投资计划功能
      if (service && typeof service.getInvestmentPlans === 'function') {
        return await service.getInvestmentPlans(userId);
      }

      // 降级到本地存储
      console.log('使用本地存储获取投资计划');
      return this.getLocalInvestmentPlans(userId);
    } catch (error) {
      console.error('获取投资计划失败，使用本地存储:', error);
      return this.getLocalInvestmentPlans(userId);
    }
  }

  async createInvestmentPlan(planData: any): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const service = await this.getService();

      // 检查服务是否支持投资计划功能
      if (service && typeof service.createInvestmentPlan === 'function') {
        return await service.createInvestmentPlan(planData);
      }

      // 降级到本地存储
      console.log('使用本地存储创建投资计划');
      return this.createLocalInvestmentPlan(planData);
    } catch (error) {
      console.error('创建投资计划失败，使用本地存储:', error);
      return this.createLocalInvestmentPlan(planData);
    }
  }

  // 本地投资计划存储（临时解决方案）
  private getLocalInvestmentPlans(userId: string): any[] {
    try {
      const key = `investment_plans_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取本地投资计划失败:', error);
      return [];
    }
  }

  private createLocalInvestmentPlan(planData: any): { success: boolean; error?: string; data?: any } {
    try {
      const key = `investment_plans_${planData.user_id}`;
      const stored = localStorage.getItem(key);
      const plans = stored ? JSON.parse(stored) : [];

      const newPlan = {
        ...planData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      plans.push(newPlan);
      localStorage.setItem(key, JSON.stringify(plans));

      return { success: true, data: newPlan };
    } catch (error) {
      console.error('创建本地投资计划失败:', error);
      return { success: false, error: '创建投资计划失败' };
    }
  }

  /**
   * 获取所有账户数据（合并多个存储源）
   */
  getAllAccounts(): any[] {
    try {
      const standardAccounts = JSON.parse(localStorage.getItem('assetwise_accounts') || '[]');
      const directAccounts = JSON.parse(localStorage.getItem('assetwise_accounts_direct') || '[]');

      console.log(`UnifiedDataService - 标准存储账户: ${standardAccounts.length} 个`);
      console.log(`UnifiedDataService - 直接存储账户: ${directAccounts.length} 个`);

      // 合并所有账户
      const allAccounts = [...standardAccounts, ...directAccounts];

      // 去重（以ID为准）
      const uniqueAccounts = allAccounts.filter((account, index, self) =>
        index === self.findIndex(a => a.id === account.id)
      );

      console.log(`UnifiedDataService - 合并后账户: ${uniqueAccounts.length} 个`);
      return uniqueAccounts;
    } catch (error) {
      console.error('UnifiedDataService - 获取账户数据失败:', error);
      return [];
    }
  }

  /**
   * 获取所有交易数据（合并多个存储源）
   */
  getAllTransactions(): any[] {
    try {
      const standardTransactions = JSON.parse(localStorage.getItem('assetwise_transactions') || '[]');
      const directTransactions = JSON.parse(localStorage.getItem('assetwise_transactions_direct') || '[]');

      console.log(`UnifiedDataService - 标准存储交易: ${standardTransactions.length} 个`);
      console.log(`UnifiedDataService - 直接存储交易: ${directTransactions.length} 个`);

      // 合并所有交易
      const allTransactions = [...standardTransactions, ...directTransactions];

      // 去重（以ID为准）
      const uniqueTransactions = allTransactions.filter((transaction, index, self) =>
        index === self.findIndex(t => t.id === transaction.id)
      );

      console.log(`UnifiedDataService - 合并后交易: ${uniqueTransactions.length} 个`);
      return uniqueTransactions;
    } catch (error) {
      console.error('UnifiedDataService - 获取交易数据失败:', error);
      return [];
    }
  }

  /**
   * 统一数据到标准存储键
   */
  unifyDataToStandardStorage(): void {
    try {
      console.log('UnifiedDataService - 开始统一数据到标准存储...');

      const allAccounts = this.getAllAccounts();
      const allTransactions = this.getAllTransactions();

      // 标准化用户ID
      const targetUserId = '11ed58fc-b9cc-4c6b-ba81-b9c9f5190f37';

      const normalizedAccounts = allAccounts.map(account => ({
        ...account,
        user_id: targetUserId
      }));

      const normalizedTransactions = allTransactions.map(transaction => ({
        ...transaction,
        user_id: targetUserId
      }));

      // 更新标准存储
      localStorage.setItem('assetwise_accounts', JSON.stringify(normalizedAccounts));
      localStorage.setItem('assetwise_transactions', JSON.stringify(normalizedTransactions));

      console.log(`UnifiedDataService - 已统一 ${normalizedAccounts.length} 个账户和 ${normalizedTransactions.length} 个交易到标准存储`);
    } catch (error) {
      console.error('UnifiedDataService - 统一数据到标准存储失败:', error);
    }
  }

  /**
   * 清理所有demo相关数据
   */
  clearAllDemoData(): void {
    try {
      console.log('UnifiedDataService - 开始清理所有demo数据...');

      // 清理localStorage中的demo数据
      localStorageService.clearDemoData();

      // 清理可能的demo相关键
      const demoKeys = [
        'demo-user',
        'demo_user',
        'assetwise_demo_user',
        'assetwise_demo_accounts',
        'assetwise_demo_assets',
        'assetwise_demo_transactions',
        'assetwise_demo_reviews',
        'assetwise_demo_plans'
      ];

      demoKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('✅ UnifiedDataService - demo数据清理完成');
    } catch (error) {
      console.error('UnifiedDataService - 清理demo数据失败:', error);
    }
  }
}

export const unifiedDataService = new UnifiedDataService();