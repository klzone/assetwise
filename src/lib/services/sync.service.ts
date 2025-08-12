/**
 * 数据同步服务
 * 负责协调本地存储和云端同步
 */

import { DataType, SyncStatus, SyncResult, SyncConflict } from '../types/sync.types';
import { localStorageService } from './local-storage.service';
import { subscriptionService } from './subscription.service';
import { supabaseSyncService, SyncOptions as SupabaseSyncOptions, ConflictResolutionStrategy } from './supabase-sync.service';

export interface SyncOptions {
  dataTypes?: DataType[];
  forceSync?: boolean;
  conflictResolution?: ConflictResolutionStrategy;
  batchSize?: number;
  maxRetries?: number;
}

export interface SyncProgress {
  total: number;
  completed: number;
  current_operation: string;
  errors: string[];
}

export class SyncService {
  private syncInProgress: boolean = false;
  private lastSyncTime: Date | null = null;
  private progressCallback: ((progress: SyncProgress) => void) | null = null;

  constructor() {
    this.loadLastSyncTime();
    this.setupAutoSync();
  }

  private loadLastSyncTime(): void {
    const stored = localStorage.getItem('assetwise_last_sync');
    if (stored) {
      this.lastSyncTime = new Date(stored);
    }
  }

  private saveLastSyncTime(): void {
    this.lastSyncTime = new Date();
    localStorage.setItem('assetwise_last_sync', this.lastSyncTime.toISOString());
  }

  // 设置自动同步
  private setupAutoSync(): void {
    // 监听网络状态变化
    window.addEventListener('online', () => {
      console.log('网络连接恢复，准备自动同步');
      this.autoSyncIfNeeded();
    });

    // 页面可见性变化时检查同步
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.autoSyncIfNeeded();
      }
    });
  }

  // 自动同步检查
  private async autoSyncIfNeeded(): Promise<void> {
    try {
      // 检查是否有权限
      const hasPermission = await subscriptionService.hasFeatureAccess('cloud_sync');
      if (!hasPermission) return;

      // 检查是否需要同步
      const syncQueue = localStorageService.getSyncQueue();
      if (syncQueue.length === 0) return;

      // 检查最后同步时间
      const now = Date.now();
      const lastSync = this.lastSyncTime?.getTime() || 0;
      const timeSinceLastSync = now - lastSync;
      
      // 如果超过5分钟且有待同步项目，自动同步
      if (timeSinceLastSync > 5 * 60 * 1000) {
        console.log('触发自动同步');
        await this.syncData({ conflictResolution: 'merge' });
      }
    } catch (error) {
      console.error('自动同步检查失败:', error);
    }
  }

  // 主同步方法
  async syncData(options: SyncOptions = {}): Promise<SyncResult> {
    // 检查权限
    const hasPermission = await subscriptionService.hasFeatureAccess('cloud_sync');
    if (!hasPermission) {
      throw new Error('当前订阅计划不支持云端同步功能，请升级到专业版或旗舰版');
    }

    if (this.syncInProgress) {
      throw new Error('同步正在进行中，请稍后再试');
    }

    this.syncInProgress = true;

    try {
      // 转换选项格式
      const supabaseOptions: SupabaseSyncOptions = {
        dataTypes: options.dataTypes,
        conflictResolution: options.conflictResolution || 'merge',
        batchSize: options.batchSize,
        maxRetries: options.maxRetries
      };

      // 如果是强制同步，清除最后同步时间
      if (options.forceSync) {
        localStorage.removeItem('assetwise_last_sync');
      }

      // 执行同步
      const result = await supabaseSyncService.syncData(supabaseOptions);

      // 保存同步时间
      if (result.success) {
        this.saveLastSyncTime();
      }

      return result;

    } catch (error) {
      console.error('同步失败:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // 同步特定数据项
  async syncDataItem(dataType: DataType, dataId: string): Promise<boolean> {
    try {
      // 检查权限
      const hasPermission = await subscriptionService.hasFeatureAccess('cloud_sync');
      if (!hasPermission) {
        throw new Error('当前订阅计划不支持云端同步功能');
      }

      return await supabaseSyncService.syncDataItem(dataType, dataId);
    } catch (error) {
      console.error('同步数据项失败:', error);
      return false;
    }
  }

  // 强制全量同步
  async forceFullSync(options: SyncOptions = {}): Promise<SyncResult> {
    return this.syncData({ ...options, forceSync: true });
  }

  // 取消同步
  cancelSync(): void {
    if (this.syncInProgress) {
      supabaseSyncService.cancelSync();
      this.syncInProgress = false;
    }
  }

  // 获取同步状态
  isSyncInProgress(): boolean {
    return this.syncInProgress || supabaseSyncService.isSyncInProgress();
  }

  // 获取最后同步时间
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  // 获取网络状态
  isNetworkAvailable(): boolean {
    return supabaseSyncService.isNetworkAvailable();
  }

  // 获取同步统计
  async getSyncStats(): Promise<{
    pending_items: number;
    last_sync: string | null;
    sync_enabled: boolean;
    network_available: boolean;
  }> {
    const syncQueue = localStorageService.getSyncQueue();
    const hasPermission = await subscriptionService.hasFeatureAccess('cloud_sync');
    
    return {
      pending_items: syncQueue.length,
      last_sync: supabaseSyncService.getLastSyncTime(),
      sync_enabled: hasPermission,
      network_available: this.isNetworkAvailable()
    };
  }

  // 设置进度回调
  setProgressCallback(callback: (progress: SyncProgress) => void): void {
    this.progressCallback = callback;
  }

  // 清除进度回调
  clearProgressCallback(): void {
    this.progressCallback = null;
  }

  // 冲突解决
  async resolveConflict(
    conflictId: string, 
    resolution: ConflictResolutionStrategy,
    customData?: any
  ): Promise<void> {
    try {
      // 这里应该实现具体的冲突解决逻辑
      // 目前先记录日志
      console.log(`解决冲突 ${conflictId} 使用策略: ${resolution}`, customData);
      
      // TODO: 实现与Supabase的冲突解决API交互
      
    } catch (error) {
      console.error('解决冲突失败:', error);
      throw error;
    }
  }

  // 获取冲突列表
  async getConflicts(): Promise<SyncConflict[]> {
    try {
      // TODO: 从Supabase获取未解决的冲突
      return [];
    } catch (error) {
      console.error('获取冲突列表失败:', error);
      return [];
    }
  }

  // 数据备份
  async backupData(dataTypes?: DataType[]): Promise<{
    success: boolean;
    backup_id?: string;
    error?: string;
  }> {
    try {
      const hasPermission = await subscriptionService.hasFeatureAccess('cloud_sync');
      if (!hasPermission) {
        throw new Error('当前订阅计划不支持数据备份功能');
      }

      const typesToBackup = dataTypes || ['assets', 'transactions', 'plans', 'reviews', 'settings'] as DataType[];
      const backupData: Record<string, any> = {};

      // 收集所有数据
      for (const dataType of typesToBackup) {
        backupData[dataType] = await localStorageService.getData(dataType);
      }

      // 生成备份ID
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 保存到本地存储（临时方案）
      localStorage.setItem(`assetwise_backup_${backupId}`, JSON.stringify({
        id: backupId,
        created_at: new Date().toISOString(),
        data: backupData,
        device_id: localStorageService.getDeviceId()
      }));

      return {
        success: true,
        backup_id: backupId
      };

    } catch (error) {
      console.error('数据备份失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '数据备份失败'
      };
    }
  }

  // 数据恢复
  async restoreData(backupId: string): Promise<{
    success: boolean;
    restored_items?: number;
    error?: string;
  }> {
    try {
      const hasPermission = await subscriptionService.hasFeatureAccess('cloud_sync');
      if (!hasPermission) {
        throw new Error('当前订阅计划不支持数据恢复功能');
      }

      // 从本地存储获取备份（临时方案）
      const backupData = localStorage.getItem(`assetwise_backup_${backupId}`);
      if (!backupData) {
        throw new Error('备份不存在');
      }

      const backup = JSON.parse(backupData);
      let restoredItems = 0;

      // 恢复数据
      for (const [dataType, data] of Object.entries(backup.data)) {
        if (Array.isArray(data)) {
          await localStorageService.saveData(dataType as DataType, data);
          restoredItems += data.length;
        }
      }

      return {
        success: true,
        restored_items: restoredItems
      };

    } catch (error) {
      console.error('数据恢复失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '数据恢复失败'
      };
    }
  }

  // 清理同步数据
  async cleanupSyncData(): Promise<void> {
    try {
      // 清理本地同步队列
      await localStorageService.clearSyncQueue();
      
      // 清理旧版本数据
      await localStorageService.cleanupOldVersions();
      
      console.log('同步数据清理完成');
    } catch (error) {
      console.error('清理同步数据失败:', error);
    }
  }
}

export const syncService = new SyncService();