/**
 * 本地数据存储和版本控制系统
 */

import { DataType, DataVersion } from '../types/sync.types';
import { Asset, Transaction, InvestmentPlan } from '../types/core.types';

// 本地存储键名常量
const STORAGE_KEYS = {
  ASSETS: 'assetwise_assets',
  TRANSACTIONS: 'assetwise_transactions',
  PLANS: 'assetwise_plans',
  REVIEWS: 'assetwise_reviews',
  SETTINGS: 'assetwise_settings',
  VERSIONS: 'assetwise_versions',
  SYNC_QUEUE: 'assetwise_sync_queue',
  DEVICE_ID: 'assetwise_device_id',
  LAST_SYNC: 'assetwise_last_sync'
} as const;

// 数据项接口
export interface DataItem {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  checksum: string;
  is_deleted: boolean;
  [key: string]: any;
}

// 版本化数据项
export interface VersionedDataItem extends DataItem {
  versions: DataVersion[];
  local_changes: boolean;
  sync_status: 'synced' | 'pending' | 'conflict' | 'error';
  last_sync_at?: string;
}

// 存储统计信息
export interface StorageStats {
  total_items: number;
  total_size_mb: number;
  versions_count: number;
  pending_sync_count: number;
  last_cleanup_at: string;
}

export class LocalStorageService {
  private deviceId: string;
  private compressionEnabled: boolean = true;
  private maxVersionsPerItem: number = 10;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.initializeStorage();
  }

  // 设备ID管理
  private getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') {
      // 服务端环境，返回临时ID
      return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  // 存储初始化
  private initializeStorage(): void {
    // 仅在客户端环境初始化存储
    if (typeof window === 'undefined') {
      return;
    }
    
    // 检查并初始化各个数据类型的存储
    Object.values(STORAGE_KEYS).forEach(key => {
      if (!localStorage.getItem(key)) {
        if (key === STORAGE_KEYS.VERSIONS) {
          localStorage.setItem(key, JSON.stringify({}));
        } else if (key === STORAGE_KEYS.SYNC_QUEUE) {
          localStorage.setItem(key, JSON.stringify([]));
        } else if (key !== STORAGE_KEYS.DEVICE_ID && key !== STORAGE_KEYS.LAST_SYNC) {
          localStorage.setItem(key, JSON.stringify([]));
        }
      }
    });
  }

  // 数据CRUD操作
  async getData<T extends DataItem>(dataType: DataType): Promise<T[]> {
    try {
      const key = this.getStorageKey(dataType);
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`获取${dataType}数据失败:`, error);
      return [];
    }
  }

  async getDataById<T extends DataItem>(dataType: DataType, id: string): Promise<T | null> {
    const data = await this.getData<T>(dataType);
    return data.find(item => item.id === id) || null;
  }

  async saveData<T extends DataItem>(dataType: DataType, items: T[]): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      
      const key = this.getStorageKey(dataType);
      const processedItems = items.map(item => this.processDataItem(item));
      
      // 压缩数据（如果启用）
      const dataToStore = this.compressionEnabled ? 
        this.compressData(processedItems) : processedItems;
      
      localStorage.setItem(key, JSON.stringify(dataToStore));
      
      // 更新版本信息
      await this.updateVersions(dataType, processedItems);
      
    } catch (error) {
      console.error(`保存${dataType}数据失败:`, error);
      throw error;
    }
  }

  async saveDataItem<T extends DataItem>(dataType: DataType, item: T): Promise<void> {
    const existingData = await this.getData<T>(dataType);
    const index = existingData.findIndex(existing => existing.id === item.id);
    
    if (index >= 0) {
      existingData[index] = item;
    } else {
      existingData.push(item);
    }
    
    await this.saveData(dataType, existingData);
  }

  async deleteDataItem(dataType: DataType, id: string): Promise<void> {
    const existingData = await this.getData(dataType);
    const filteredData = existingData.filter(item => item.id !== id);
    await this.saveData(dataType, filteredData);
    
    // 标记为删除而不是物理删除，用于同步
    await this.markAsDeleted(dataType, id);
  }

  // 版本控制
  async createVersion<T extends DataItem>(
    dataType: DataType, 
    dataId: string, 
    data: T
  ): Promise<DataVersion> {
    const version: DataVersion = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: 'current_user', // 实际应该从认证状态获取
      data_type: dataType,
      data_id: dataId,
      version: await this.getNextVersion(dataType, dataId),
      data,
      checksum: await this.generateChecksum(data),
      device_id: this.deviceId,
      created_at: new Date().toISOString(),
      is_deleted: false
    };

    await this.saveVersion(version);
    return version;
  }

  async getVersions(dataType: DataType, dataId: string): Promise<DataVersion[]> {
    try {
      const versions = this.getAllVersions();
      return versions.filter(v => 
        v.data_type === dataType && 
        v.data_id === dataId
      ).sort((a, b) => b.version - a.version);
    } catch (error) {
      console.error('获取版本历史失败:', error);
      return [];
    }
  }

  async getLatestVersion(dataType: DataType, dataId: string): Promise<DataVersion | null> {
    const versions = await this.getVersions(dataType, dataId);
    return versions.length > 0 ? versions[0] : null;
  }

  async restoreVersion(versionId: string): Promise<void> {
    try {
      const versions = this.getAllVersions();
      const version = versions.find(v => v.id === versionId);
      
      if (!version) {
        throw new Error('版本不存在');
      }

      // 恢复数据
      await this.saveDataItem(version.data_type, version.data as any);
      
      // 创建新版本记录恢复操作
      await this.createVersion(version.data_type, version.data_id, version.data);
      
    } catch (error) {
      console.error('恢复版本失败:', error);
      throw error;
    }
  }

  // 同步队列管理
  async addToSyncQueue(dataType: DataType, dataId: string, operation: 'create' | 'update' | 'delete'): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      
      const queue = this.getSyncQueue();
      const existingIndex = queue.findIndex(item => 
        item.data_type === dataType && item.data_id === dataId
      );

      const queueItem = {
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data_type: dataType,
        data_id: dataId,
        operation,
        priority: operation === 'delete' ? 1 : 2,
        created_at: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3
      };

      if (existingIndex >= 0) {
        queue[existingIndex] = queueItem;
      } else {
        queue.push(queueItem);
      }

      // 按优先级排序
      queue.sort((a, b) => a.priority - b.priority);
      
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('添加到同步队列失败:', error);
    }
  }

  getSyncQueue(): any[] {
    try {
      if (typeof window === 'undefined') {
        return [];
      }
      
      const stored = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取同步队列失败:', error);
      return [];
    }
  }

  async clearSyncQueue(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
  }

  async removeFromSyncQueue(itemId: string): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    const queue = this.getSyncQueue();
    const filteredQueue = queue.filter(item => item.id !== itemId);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filteredQueue));
  }

  // 存储统计
  async getStorageStats(): Promise<StorageStats> {
    try {
      if (typeof window === 'undefined') {
        return {
          total_items: 0,
          total_size_mb: 0,
          versions_count: 0,
          pending_sync_count: 0,
          last_cleanup_at: new Date().toISOString()
        };
      }

      let totalItems = 0;
      let totalSizeBytes = 0;
      let pendingSyncCount = 0;

      // 计算各数据类型的统计
      for (const dataType of ['assets', 'transactions', 'plans', 'reviews', 'settings'] as DataType[]) {
        const data = await this.getData(dataType);
        totalItems += data.length;
        
        const key = this.getStorageKey(dataType);
        const stored = localStorage.getItem(key);
        if (stored) {
          totalSizeBytes += new Blob([stored]).size;
        }
      }

      // 计算版本数量
      const versions = this.getAllVersions();
      const versionsCount = versions.length;

      // 计算待同步项目数量
      const syncQueue = this.getSyncQueue();
      pendingSyncCount = syncQueue.length;

      return {
        total_items: totalItems,
        total_size_mb: totalSizeBytes / (1024 * 1024),
        versions_count: versionsCount,
        pending_sync_count: pendingSyncCount,
        last_cleanup_at: localStorage.getItem('last_cleanup_at') || new Date().toISOString()
      };
    } catch (error) {
      console.error('获取存储统计失败:', error);
      return {
        total_items: 0,
        total_size_mb: 0,
        versions_count: 0,
        pending_sync_count: 0,
        last_cleanup_at: new Date().toISOString()
      };
    }
  }

  // 数据清理
  async cleanupOldVersions(maxVersionsPerItem: number = this.maxVersionsPerItem): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      
      const versions = this.getAllVersions();
      const groupedVersions = new Map<string, DataVersion[]>();

      // 按数据类型和ID分组
      versions.forEach(version => {
        const key = `${version.data_type}_${version.data_id}`;
        if (!groupedVersions.has(key)) {
          groupedVersions.set(key, []);
        }
        groupedVersions.get(key)!.push(version);
      });

      // 清理每组中的旧版本
      const versionsToKeep: DataVersion[] = [];
      groupedVersions.forEach(groupVersions => {
        const sortedVersions = groupVersions.sort((a, b) => b.version - a.version);
        versionsToKeep.push(...sortedVersions.slice(0, maxVersionsPerItem));
      });

      // 保存清理后的版本
      localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(versionsToKeep));
      localStorage.setItem('last_cleanup_at', new Date().toISOString());

      console.log(`版本清理完成，保留 ${versionsToKeep.length} 个版本`);
    } catch (error) {
      console.error('版本清理失败:', error);
    }
  }

  async clearAllData(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      
      Object.values(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.DEVICE_ID) {
          localStorage.removeItem(key);
        }
      });
      this.initializeStorage();
      console.log('所有数据已清理');
    } catch (error) {
      console.error('清理数据失败:', error);
    }
  }

  // 私有辅助方法
  private getStorageKey(dataType: DataType): string {
    const keyMap: Record<DataType, string> = {
      assets: STORAGE_KEYS.ASSETS,
      transactions: STORAGE_KEYS.TRANSACTIONS,
      plans: STORAGE_KEYS.PLANS,
      reviews: STORAGE_KEYS.REVIEWS,
      settings: STORAGE_KEYS.SETTINGS
    };
    return keyMap[dataType];
  }

  private processDataItem<T extends DataItem>(item: T): T {
    const now = new Date().toISOString();
    return {
      ...item,
      updated_at: now,
      version: (item.version || 0) + 1,
      checksum: this.generateChecksumSync(item)
    };
  }

  private async generateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private generateChecksumSync(data: any): string {
    // 简化的同步校验和生成
    const jsonString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  }

  private compressData(data: any): any {
    // 简化的数据压缩（实际项目中可以使用更好的压缩算法）
    return data;
  }

  private async updateVersions(dataType: DataType, items: DataItem[]): Promise<void> {
    for (const item of items) {
      await this.createVersion(dataType, item.id, item);
    }
  }

  private async getNextVersion(dataType: DataType, dataId: string): Promise<number> {
    const versions = await this.getVersions(dataType, dataId);
    return versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1;
  }

  private getAllVersions(): DataVersion[] {
    try {
      if (typeof window === 'undefined') {
        return [];
      }
      
      const stored = localStorage.getItem(STORAGE_KEYS.VERSIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取所有版本失败:', error);
      return [];
    }
  }

  private async saveVersion(version: DataVersion): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      
      const versions = this.getAllVersions();
      versions.push(version);
      localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(versions));
    } catch (error) {
      console.error('保存版本失败:', error);
    }
  }

  private async markAsDeleted(dataType: DataType, dataId: string): Promise<void> {
    const deletedItem = {
      id: dataId,
      data_type: dataType,
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      device_id: this.deviceId
    };
    
    await this.addToSyncQueue(dataType, dataId, 'delete');
  }
}

// 导出单例实例
export const localStorageService = new LocalStorageService();