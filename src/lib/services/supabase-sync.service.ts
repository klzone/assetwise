/**
 * Supabase数据同步API服务
 * 负责与Supabase后端进行数据同步操作
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DataType, SyncOperation, SyncConflict, SyncResult } from '../types/sync.types';
import { localStorageService, DataItem } from './local-storage.service';
import { subscriptionService } from './subscription.service';

// Supabase配置
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 同步表名映射
const SYNC_TABLES = {
  assets: 'sync_assets',
  transactions: 'sync_transactions', 
  plans: 'sync_plans',
  reviews: 'sync_reviews',
  settings: 'sync_settings'
} as const;

// 同步批次大小
const SYNC_BATCH_SIZE = 50;

// 同步冲突解决策略
export type ConflictResolutionStrategy = 'local_wins' | 'remote_wins' | 'merge' | 'manual';

export interface SyncOptions {
  dataTypes?: DataType[];
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

export class SupabaseSyncService {
  private supabase: SupabaseClient;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private abortController: AbortController | null = null;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.setupNetworkListeners();
  }

  // 网络状态监听
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('网络连接已恢复');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('网络连接已断开');
    });
  }

  // 检查同步权限
  private async checkSyncPermission(): Promise<boolean> {
    try {
      const hasPermission = await subscriptionService.hasFeatureAccess('cloud_sync');
      if (!hasPermission) {
        throw new Error('当前订阅计划不支持云端同步功能，请升级到专业版或旗舰版');
      }
      return true;
    } catch (error) {
      console.error('同步权限检查失败:', error);
      throw error;
    }
  }

  // 主同步方法
  async syncData(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('同步正在进行中，请稍后再试');
    }

    if (!this.isOnline) {
      throw new Error('网络连接不可用，无法进行同步');
    }

    try {
      // 检查权限
      await this.checkSyncPermission();

      this.syncInProgress = true;
      this.abortController = new AbortController();

      const {
        dataTypes = ['assets', 'transactions', 'plans', 'reviews', 'settings'] as DataType[],
        conflictResolution = 'merge',
        batchSize = SYNC_BATCH_SIZE,
        maxRetries = 3
      } = options;

      const syncResult: SyncResult = {
        success: true,
        synced_count: 0,
        conflict_count: 0,
        error_count: 0,
        conflicts: [],
        errors: [],
        started_at: new Date().toISOString(),
        completed_at: '',
        duration_ms: 0
      };

      const startTime = Date.now();

      // 执行双向同步
      for (const dataType of dataTypes) {
        if (this.abortController.signal.aborted) {
          throw new Error('同步已被取消');
        }

        try {
          // 1. 推送本地更改到远程
          const pushResult = await this.pushLocalChanges(dataType, batchSize);
          syncResult.synced_count += pushResult.synced_count;
          syncResult.conflict_count += pushResult.conflicts.length;
          syncResult.conflicts.push(...pushResult.conflicts);

          // 2. 拉取远程更改到本地
          const pullResult = await this.pullRemoteChanges(dataType, conflictResolution);
          syncResult.synced_count += pullResult.synced_count;
          syncResult.conflict_count += pullResult.conflicts.length;
          syncResult.conflicts.push(...pullResult.conflicts);

        } catch (error) {
          console.error(`同步${dataType}数据失败:`, error);
          syncResult.error_count++;
          syncResult.errors.push(`${dataType}: ${error.message}`);
        }
      }

      // 清理已同步的队列项
      await this.cleanupSyncQueue();

      // 更新最后同步时间
      localStorage.setItem('assetwise_last_sync', new Date().toISOString());

      syncResult.completed_at = new Date().toISOString();
      syncResult.duration_ms = Date.now() - startTime;
      syncResult.success = syncResult.error_count === 0;

      return syncResult;

    } catch (error) {
      console.error('数据同步失败:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
      this.abortController = null;
    }
  }

  // 推送本地更改到远程
  private async pushLocalChanges(dataType: DataType, batchSize: number): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced_count: 0,
      conflict_count: 0,
      error_count: 0,
      conflicts: [],
      errors: [],
      started_at: new Date().toISOString(),
      completed_at: '',
      duration_ms: 0
    };

    try {
      // 获取待同步的本地数据
      const syncQueue = localStorageService.getSyncQueue()
        .filter(item => item.data_type === dataType)
        .slice(0, batchSize);

      if (syncQueue.length === 0) {
        return result;
      }

      const tableName = SYNC_TABLES[dataType];

      for (const queueItem of syncQueue) {
        try {
          const localData = await localStorageService.getDataById(dataType, queueItem.data_id);
          
          if (queueItem.operation === 'delete') {
            // 删除操作
            await this.supabase
              .from(tableName)
              .delete()
              .eq('id', queueItem.data_id);
            
            result.synced_count++;
            await localStorageService.removeFromSyncQueue(queueItem.id);

          } else if (localData) {
            // 创建或更新操作
            const syncData = this.prepareSyncData(localData);
            
            // 检查远程是否存在
            const { data: remoteData } = await this.supabase
              .from(tableName)
              .select('*')
              .eq('id', queueItem.data_id)
              .single();

            if (remoteData) {
              // 检查冲突
              const conflict = await this.detectConflict(localData, remoteData);
              if (conflict) {
                result.conflicts.push(conflict);
                result.conflict_count++;
                continue;
              }

              // 更新远程数据
              await this.supabase
                .from(tableName)
                .update(syncData)
                .eq('id', queueItem.data_id);
            } else {
              // 创建新的远程数据
              await this.supabase
                .from(tableName)
                .insert(syncData);
            }

            result.synced_count++;
            await localStorageService.removeFromSyncQueue(queueItem.id);
          }

        } catch (error) {
          console.error(`推送${queueItem.data_id}失败:`, error);
          result.error_count++;
          result.errors.push(`${queueItem.data_id}: ${error.message}`);
        }
      }

    } catch (error) {
      console.error('推送本地更改失败:', error);
      result.errors.push(error.message);
      result.error_count++;
    }

    return result;
  }

  // 拉取远程更改到本地
  private async pullRemoteChanges(
    dataType: DataType, 
    conflictResolution: ConflictResolutionStrategy
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced_count: 0,
      conflict_count: 0,
      error_count: 0,
      conflicts: [],
      errors: [],
      started_at: new Date().toISOString(),
      completed_at: '',
      duration_ms: 0
    };

    try {
      const tableName = SYNC_TABLES[dataType];
      const lastSync = localStorage.getItem('assetwise_last_sync');
      
      // 构建查询条件
      let query = this.supabase.from(tableName).select('*');
      
      if (lastSync) {
        query = query.gt('updated_at', lastSync);
      }

      const { data: remoteData, error } = await query;

      if (error) {
        throw error;
      }

      if (!remoteData || remoteData.length === 0) {
        return result;
      }

      // 处理每个远程数据项
      for (const remoteItem of remoteData) {
        try {
          const localItem = await localStorageService.getDataById(dataType, remoteItem.id);

          if (!localItem) {
            // 本地不存在，直接添加
            await localStorageService.saveDataItem(dataType, remoteItem);
            result.synced_count++;
          } else {
            // 检查冲突
            const conflict = await this.detectConflict(localItem, remoteItem);
            
            if (conflict) {
              // 根据策略解决冲突
              const resolved = await this.resolveConflict(conflict, conflictResolution);
              if (resolved) {
                await localStorageService.saveDataItem(dataType, resolved.resolved_data);
                result.synced_count++;
              } else {
                result.conflicts.push(conflict);
                result.conflict_count++;
              }
            } else {
              // 无冲突，更新本地数据
              await localStorageService.saveDataItem(dataType, remoteItem);
              result.synced_count++;
            }
          }

        } catch (error) {
          console.error(`拉取${remoteItem.id}失败:`, error);
          result.error_count++;
          result.errors.push(`${remoteItem.id}: ${error.message}`);
        }
      }

    } catch (error) {
      console.error('拉取远程更改失败:', error);
      result.errors.push(error.message);
      result.error_count++;
    }

    return result;
  }

  // 冲突检测
  private async detectConflict(localData: DataItem, remoteData: DataItem): Promise<SyncConflict | null> {
    // 检查版本号和更新时间
    const localTime = new Date(localData.updated_at).getTime();
    const remoteTime = new Date(remoteData.updated_at).getTime();
    
    // 如果校验和不同且更新时间相近（5分钟内），认为是冲突
    if (localData.checksum !== remoteData.checksum && 
        Math.abs(localTime - remoteTime) < 5 * 60 * 1000) {
      
      return {
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data_type: localData.data_type || 'unknown' as DataType,
        data_id: localData.id,
        local_data: localData,
        remote_data: remoteData,
        conflict_type: 'data_mismatch',
        detected_at: new Date().toISOString(),
        resolved: false
      };
    }

    return null;
  }

  // 冲突解决
  private async resolveConflict(
    conflict: SyncConflict, 
    strategy: ConflictResolutionStrategy
  ): Promise<{ resolved_data: DataItem } | null> {
    
    switch (strategy) {
      case 'local_wins':
        return { resolved_data: conflict.local_data };
        
      case 'remote_wins':
        return { resolved_data: conflict.remote_data };
        
      case 'merge':
        // 简单的合并策略：使用最新的更新时间
        const localTime = new Date(conflict.local_data.updated_at).getTime();
        const remoteTime = new Date(conflict.remote_data.updated_at).getTime();
        
        const mergedData = {
          ...conflict.local_data,
          ...conflict.remote_data,
          updated_at: localTime > remoteTime ? 
            conflict.local_data.updated_at : 
            conflict.remote_data.updated_at
        };
        
        return { resolved_data: mergedData };
        
      case 'manual':
        // 手动解决，返回null等待用户处理
        return null;
        
      default:
        return null;
    }
  }

  // 准备同步数据
  private prepareSyncData(data: DataItem): any {
    const { id, created_at, updated_at, version, checksum, ...syncData } = data;
    
    return {
      id,
      data: syncData,
      checksum,
      version,
      device_id: localStorageService.getDeviceId(),
      created_at,
      updated_at,
      synced_at: new Date().toISOString()
    };
  }

  // 清理同步队列
  private async cleanupSyncQueue(): Promise<void> {
    try {
      const queue = localStorageService.getSyncQueue();
      const failedItems = queue.filter(item => item.retry_count >= item.max_retries);
      
      // 移除失败次数过多的项目
      for (const item of failedItems) {
        await localStorageService.removeFromSyncQueue(item.id);
        console.warn(`移除失败的同步项目: ${item.data_type}:${item.data_id}`);
      }
    } catch (error) {
      console.error('清理同步队列失败:', error);
    }
  }

  // 取消同步
  cancelSync(): void {
    if (this.abortController) {
      this.abortController.abort();
      console.log('同步已取消');
    }
  }

  // 获取同步状态
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  // 获取网络状态
  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  // 获取最后同步时间
  getLastSyncTime(): string | null {
    return localStorage.getItem('assetwise_last_sync');
  }

  // 强制全量同步
  async forceFullSync(options: SyncOptions = {}): Promise<SyncResult> {
    // 清除最后同步时间以触发全量同步
    localStorage.removeItem('assetwise_last_sync');
    return this.syncData(options);
  }

  // 同步特定数据项
  async syncDataItem(dataType: DataType, dataId: string): Promise<boolean> {
    try {
      await this.checkSyncPermission();
      
      if (!this.isOnline) {
        throw new Error('网络不可用');
      }

      const localData = await localStorageService.getDataById(dataType, dataId);
      if (!localData) {
        throw new Error('本地数据不存在');
      }

      const tableName = SYNC_TABLES[dataType];
      const syncData = this.prepareSyncData(localData);

      // 检查远程是否存在
      const { data: remoteData } = await this.supabase
        .from(tableName)
        .select('*')
        .eq('id', dataId)
        .single();

      if (remoteData) {
        // 更新
        await this.supabase
          .from(tableName)
          .update(syncData)
          .eq('id', dataId);
      } else {
        // 创建
        await this.supabase
          .from(tableName)
          .insert(syncData);
      }

      return true;
    } catch (error) {
      console.error(`同步数据项失败:`, error);
      return false;
    }
  }
}

// 导出单例实例
export const supabaseSyncService = new SupabaseSyncService();