import { indexedDBService } from './indexeddb.service';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

interface OfflineQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table_name: string;
  data: any;
  timestamp: string;
  retry_count: number;
}

class OfflineService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncCallbacks: Set<() => void> = new Set();
  private networkCallbacks: Set<(status: NetworkStatus) => void> = new Set();
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1秒

  constructor() {
    this.initializeNetworkListeners();
    this.startPeriodicSync();
  }

  // 初始化网络状态监听
  private initializeNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    // 监听网络状态变化
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    console.log('✅ 网络状态监听器已初始化');
  }

  private handleOnline(): void {
    console.log('🌐 网络已连接');
    this.isOnline = true;
    this.notifyNetworkChange();
    this.syncOfflineQueue();
  }

  private handleOffline(): void {
    console.log('📴 网络已断开');
    this.isOnline = false;
    this.notifyNetworkChange();
  }

  private handleVisibilityChange(): void {
    if (!document.hidden && this.isOnline) {
      // 页面重新可见且有网络时，尝试同步
      this.syncOfflineQueue();
    }
  }

  // 获取网络状态
  getNetworkStatus(): NetworkStatus {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      isOnline: this.isOnline,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    };
  }

  // 检查是否在线
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  // 添加网络状态变化监听器
  onNetworkChange(callback: (status: NetworkStatus) => void): () => void {
    this.networkCallbacks.add(callback);
    return () => this.networkCallbacks.delete(callback);
  }

  // 通知网络状态变化
  private notifyNetworkChange(): void {
    const status = this.getNetworkStatus();
    this.networkCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('网络状态回调执行失败:', error);
      }
    });
  }

  // 添加同步完成监听器
  onSyncComplete(callback: () => void): () => void {
    this.syncCallbacks.add(callback);
    return () => this.syncCallbacks.delete(callback);
  }

  // 通知同步完成
  private notifySyncComplete(): void {
    this.syncCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('同步回调执行失败:', error);
      }
    });
  }

  // 同步离线队列
  async syncOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 开始同步离线队列...');

    try {
      const queue = await indexedDBService.getOfflineQueue();
      const sortedQueue = queue.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      let successCount = 0;
      let failureCount = 0;

      for (const item of sortedQueue) {
        try {
          const success = await this.processQueueItem(item);
          if (success) {
            await indexedDBService.removeFromOfflineQueue(item.id);
            successCount++;
          } else {
            if (item.retry_count < this.maxRetries) {
              await indexedDBService.incrementRetryCount(item.id);
            } else {
              // 超过最大重试次数，移除该项
              await indexedDBService.removeFromOfflineQueue(item.id);
              console.warn('队列项超过最大重试次数，已移除:', item);
            }
            failureCount++;
          }
        } catch (error) {
          console.error('处理队列项失败:', item, error);
          failureCount++;
        }

        // 添加延迟避免过于频繁的请求
        if (failureCount > 0) {
          await this.delay(this.retryDelay);
        }
      }

      console.log(`✅ 离线队列同步完成: 成功 ${successCount}, 失败 ${failureCount}`);
      
      if (successCount > 0) {
        this.notifySyncComplete();
      }
    } catch (error) {
      console.error('❌ 离线队列同步失败:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // 处理单个队列项
  private async processQueueItem(item: OfflineQueueItem): Promise<boolean> {
    try {
      // 这里应该调用实际的API同步服务
      // 暂时模拟API调用
      console.log(`处理队列项: ${item.operation} ${item.table_name}`, item.data);
      
      // 模拟网络请求
      await this.delay(100);
      
      // 模拟成功率（90%成功）
      const success = Math.random() > 0.1;
      
      if (success) {
        // 标记本地数据为已同步
        if (item.operation !== 'delete' && item.data.id) {
          await indexedDBService.markAsSynced(item.table_name as any, item.data.id);
        }
      }
      
      return success;
    } catch (error) {
      console.error('处理队列项时发生错误:', error);
      return false;
    }
  }

  // 启动定期同步
  private startPeriodicSync(): void {
    // 每5分钟尝试同步一次
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncOfflineQueue();
      }
    }, 5 * 60 * 1000);

    console.log('✅ 定期同步已启动');
  }

  // 手动触发同步
  async forcSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('网络未连接，无法同步');
    }
    
    await this.syncOfflineQueue();
  }

  // 获取离线队列状态
  async getQueueStatus(): Promise<{
    totalItems: number;
    pendingItems: number;
    failedItems: number;
    oldestItem: string | null;
  }> {
    const queue = await indexedDBService.getOfflineQueue();
    
    const pendingItems = queue.filter(item => item.retry_count < this.maxRetries).length;
    const failedItems = queue.filter(item => item.retry_count >= this.maxRetries).length;
    
    let oldestItem: string | null = null;
    if (queue.length > 0) {
      const oldest = queue.reduce((prev, current) => 
        new Date(prev.timestamp) < new Date(current.timestamp) ? prev : current
      );
      oldestItem = oldest.timestamp;
    }

    return {
      totalItems: queue.length,
      pendingItems,
      failedItems,
      oldestItem
    };
  }

  // 清空离线队列
  async clearQueue(): Promise<void> {
    const queue = await indexedDBService.getOfflineQueue();
    for (const item of queue) {
      await indexedDBService.removeFromOfflineQueue(item.id);
    }
    console.log('✅ 离线队列已清空');
  }

  // 获取同步统计信息
  async getSyncStats(): Promise<{
    lastSyncTime: string | null;
    unsyncedCount: number;
    queueSize: number;
    isOnline: boolean;
    syncInProgress: boolean;
  }> {
    const stats = await indexedDBService.getStorageStats();
    
    return {
      lastSyncTime: null, // TODO: 从同步元数据中获取
      unsyncedCount: stats.unsyncedCount,
      queueSize: stats.queueSize,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 检查网络连接质量
  async checkConnectionQuality(): Promise<{
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    latency: number;
    bandwidth: number;
  }> {
    if (!this.isOnline) {
      return { quality: 'poor', latency: Infinity, bandwidth: 0 };
    }

    try {
      const startTime = performance.now();
      
      // 发送一个小的测试请求
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const endTime = performance.now();
      const latency = endTime - startTime;

      const connection = (navigator as any).connection;
      const bandwidth = connection?.downlink || 0;

      let quality: 'excellent' | 'good' | 'fair' | 'poor';
      if (latency < 100 && bandwidth > 10) {
        quality = 'excellent';
      } else if (latency < 300 && bandwidth > 5) {
        quality = 'good';
      } else if (latency < 1000 && bandwidth > 1) {
        quality = 'fair';
      } else {
        quality = 'poor';
      }

      return { quality, latency, bandwidth };
    } catch (error) {
      console.error('网络质量检测失败:', error);
      return { quality: 'poor', latency: Infinity, bandwidth: 0 };
    }
  }

  // 智能同步策略
  async smartSync(): Promise<void> {
    const connectionQuality = await this.checkConnectionQuality();
    
    if (connectionQuality.quality === 'poor') {
      console.log('网络质量较差，延迟同步');
      return;
    }

    // 根据网络质量调整同步策略
    if (connectionQuality.quality === 'excellent') {
      // 网络良好，立即同步所有数据
      await this.syncOfflineQueue();
    } else if (connectionQuality.quality === 'good') {
      // 网络一般，优先同步重要数据
      await this.syncPriorityData();
    } else {
      // 网络较差，只同步关键数据
      await this.syncCriticalData();
    }
  }

  // 优先级同步
  private async syncPriorityData(): Promise<void> {
    const queue = await indexedDBService.getOfflineQueue();
    
    // 按优先级排序：用户数据 > 交易数据 > 资产数据 > 其他
    const priorityOrder = ['users', 'transactions', 'accounts', 'assets', 'portfolios', 'portfolio_assets'];
    
    const sortedQueue = queue.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.table_name);
      const bPriority = priorityOrder.indexOf(b.table_name);
      return aPriority - bPriority;
    });

    // 只同步前50%的数据
    const itemsToSync = sortedQueue.slice(0, Math.ceil(sortedQueue.length / 2));
    
    for (const item of itemsToSync) {
      try {
        const success = await this.processQueueItem(item);
        if (success) {
          await indexedDBService.removeFromOfflineQueue(item.id);
        }
      } catch (error) {
        console.error('优先级同步失败:', error);
        break; // 遇到错误时停止同步
      }
    }
  }

  // 关键数据同步
  private async syncCriticalData(): Promise<void> {
    const queue = await indexedDBService.getOfflineQueue();
    
    // 只同步用户和交易数据
    const criticalItems = queue.filter(item => 
      ['users', 'transactions'].includes(item.table_name)
    );

    for (const item of criticalItems.slice(0, 10)) { // 最多同步10项
      try {
        const success = await this.processQueueItem(item);
        if (success) {
          await indexedDBService.removeFromOfflineQueue(item.id);
        }
      } catch (error) {
        console.error('关键数据同步失败:', error);
        break;
      }
    }
  }

  // 预加载关键数据
  async preloadCriticalData(): Promise<void> {
    if (!this.isOnline) return;

    try {
      // 预加载用户配置、账户信息等关键数据
      console.log('🔄 预加载关键数据...');
      
      // 这里应该调用实际的API来预加载数据
      // 暂时模拟
      await this.delay(500);
      
      console.log('✅ 关键数据预加载完成');
    } catch (error) {
      console.error('❌ 关键数据预加载失败:', error);
    }
  }

  // 数据压缩（用于减少存储空间）
  compressData(data: any): string {
    try {
      // 简单的JSON压缩（移除空格）
      return JSON.stringify(data);
    } catch (error) {
      console.error('数据压缩失败:', error);
      return JSON.stringify(data);
    }
  }

  // 数据解压缩
  decompressData(compressedData: string): any {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('数据解压缩失败:', error);
      return null;
    }
  }

  // 销毁服务
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    
    this.syncCallbacks.clear();
    this.networkCallbacks.clear();
    
    console.log('✅ 离线服务已销毁');
  }
}

// 创建单例实例
export const offlineService = new OfflineService();

// 导出类型
export type { NetworkStatus, OfflineQueueItem };
