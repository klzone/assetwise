/**
 * 用户订阅级别验证服务
 */

import { createClient } from '@supabase/supabase-js';
import { SubscriptionTier, SubscriptionLimits } from '../types/sync.types';

// Supabase客户端配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 订阅计划配置
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    tier: 'free',
    max_storage_mb: 0,
    max_versions_per_item: 0,
    sync_frequency_options: [],
    realtime_sync: false,
    conflict_resolution: false,
    backup_retention_days: 0
  },
  professional: {
    tier: 'professional',
    max_storage_mb: 1024, // 1GB
    max_versions_per_item: 10,
    sync_frequency_options: ['manual', 'daily', 'weekly'],
    realtime_sync: false,
    conflict_resolution: true,
    backup_retention_days: 30
  },
  flagship: {
    tier: 'flagship',
    max_storage_mb: 10240, // 10GB
    max_versions_per_item: 50,
    sync_frequency_options: ['manual', 'hourly', 'daily', 'weekly'],
    realtime_sync: true,
    conflict_resolution: true,
    backup_retention_days: 90
  }
};

// 用户订阅信息
export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  started_at: string;
  expires_at?: string;
  auto_renew: boolean;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

// 使用统计
export interface UsageStats {
  user_id: string;
  storage_used_mb: number;
  sync_count_today: number;
  sync_count_month: number;
  last_sync_at?: string;
  data_versions_count: number;
  conflicts_resolved_count: number;
  updated_at: string;
}

export class SubscriptionService {
  private userId: string | null = null;
  private currentSubscription: UserSubscription | null = null;
  private usageStats: UsageStats | null = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id || null;
    
    if (this.userId) {
      await this.loadSubscription();
      await this.loadUsageStats();
    }
  }

  // 获取当前用户订阅信息
  async getCurrentSubscription(): Promise<UserSubscription | null> {
    if (!this.userId) {
      return null;
    }

    if (this.currentSubscription) {
      return this.currentSubscription;
    }

    await this.loadSubscription();
    return this.currentSubscription;
  }

  // 获取订阅级别
  async getSubscriptionTier(): Promise<SubscriptionTier> {
    const subscription = await this.getCurrentSubscription();
    
    if (!subscription || subscription.status !== 'active') {
      return 'free';
    }

    // 检查是否过期
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      return 'free';
    }

    return subscription.tier;
  }

  // 获取订阅限制
  async getSubscriptionLimits(): Promise<SubscriptionLimits> {
    const tier = await this.getSubscriptionTier();
    return SUBSCRIPTION_PLANS[tier];
  }

  // 验证功能权限
  async hasFeatureAccess(feature: 'sync' | 'cloud_sync' | 'realtime' | 'conflict_resolution' | 'version_history'): Promise<boolean> {
    const limits = await this.getSubscriptionLimits();
    
    switch (feature) {
      case 'sync':
      case 'cloud_sync':
        return limits.tier !== 'free';
      case 'realtime':
        return limits.realtime_sync;
      case 'conflict_resolution':
        return limits.conflict_resolution;
      case 'version_history':
        return limits.max_versions_per_item > 0;
      default:
        return false;
    }
  }

  // 检查存储限制
  async checkStorageLimit(additionalMB: number = 0): Promise<{
    withinLimit: boolean;
    currentUsage: number;
    maxStorage: number;
    availableStorage: number;
  }> {
    const limits = await getSubscriptionLimits();
    const usage = await this.getUsageStats();
    
    const currentUsage = usage?.storage_used_mb || 0;
    const maxStorage = limits.max_storage_mb;
    const availableStorage = Math.max(0, maxStorage - currentUsage);
    const withinLimit = (currentUsage + additionalMB) <= maxStorage;

    return {
      withinLimit,
      currentUsage,
      maxStorage,
      availableStorage
    };
  }

  // 检查同步频率限制
  async checkSyncFrequencyLimit(): Promise<{
    canSync: boolean;
    reason?: string;
    nextAllowedSync?: Date;
  }> {
    const limits = await this.getSubscriptionLimits();
    const usage = await this.getUsageStats();
    
    if (limits.tier === 'free') {
      return {
        canSync: false,
        reason: '免费用户不支持数据同步功能'
      };
    }

    // 检查每日同步次数限制
    const dailyLimit = limits.tier === 'professional' ? 10 : 50;
    const todayCount = usage?.sync_count_today || 0;
    
    if (todayCount >= dailyLimit) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      return {
        canSync: false,
        reason: `今日同步次数已达上限 (${dailyLimit}次)`,
        nextAllowedSync: tomorrow
      };
    }

    return { canSync: true };
  }

  // 获取使用统计
  async getUsageStats(): Promise<UsageStats | null> {
    if (!this.userId) {
      return null;
    }

    if (this.usageStats) {
      return this.usageStats;
    }

    await this.loadUsageStats();
    return this.usageStats;
  }

  // 更新使用统计
  async updateUsageStats(updates: Partial<UsageStats>): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      const { error } = await supabase
        .from('usage_stats')
        .upsert({
          user_id: this.userId,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // 更新本地缓存
      if (this.usageStats) {
        this.usageStats = {
          ...this.usageStats,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('更新使用统计失败:', error);
    }
  }

  // 记录同步操作
  async recordSyncOperation(storageDelta: number = 0): Promise<void> {
    const usage = await this.getUsageStats();
    const today = new Date().toISOString().split('T')[0];
    const lastSyncDate = usage?.last_sync_at?.split('T')[0];
    
    const updates: Partial<UsageStats> = {
      storage_used_mb: (usage?.storage_used_mb || 0) + storageDelta,
      sync_count_month: (usage?.sync_count_month || 0) + 1,
      sync_count_today: today === lastSyncDate ? (usage?.sync_count_today || 0) + 1 : 1,
      last_sync_at: new Date().toISOString()
    };

    await this.updateUsageStats(updates);
  }

  // 升级订阅
  async upgradeSubscription(newTier: SubscriptionTier): Promise<{
    success: boolean;
    message: string;
    paymentUrl?: string;
  }> {
    if (!this.userId) {
      return {
        success: false,
        message: '用户未登录'
      };
    }

    // 这里应该集成支付系统
    // 暂时返回模拟结果
    return {
      success: true,
      message: `订阅升级到${newTier}版本成功`,
      paymentUrl: `https://payment.assetwise.com/upgrade?tier=${newTier}&user=${this.userId}`
    };
  }

  // 获取订阅历史
  async getSubscriptionHistory(): Promise<UserSubscription[]> {
    if (!this.userId) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取订阅历史失败:', error);
      return [];
    }
  }

  // 私有方法
  private async loadSubscription(): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', this.userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      this.currentSubscription = data || null;
    } catch (error) {
      console.error('加载订阅信息失败:', error);
      this.currentSubscription = null;
    }
  }

  private async loadUsageStats(): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      this.usageStats = data || {
        user_id: this.userId,
        storage_used_mb: 0,
        sync_count_today: 0,
        sync_count_month: 0,
        data_versions_count: 0,
        conflicts_resolved_count: 0,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('加载使用统计失败:', error);
      this.usageStats = null;
    }
  }
}

// 导出单例实例
export const subscriptionService = new SubscriptionService();

// 导出便捷函数
export const getSubscriptionTier = () => subscriptionService.getSubscriptionTier();
export const getSubscriptionLimits = () => subscriptionService.getSubscriptionLimits();
export const hasFeatureAccess = (feature: 'sync' | 'cloud_sync' | 'realtime' | 'conflict_resolution' | 'version_history') => 
  subscriptionService.hasFeatureAccess(feature);
export const checkStorageLimit = (additionalMB?: number) => 
  subscriptionService.checkStorageLimit(additionalMB);
export const checkSyncFrequencyLimit = () => subscriptionService.checkSyncFrequencyLimit();