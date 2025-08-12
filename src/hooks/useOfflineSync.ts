import { useState, useEffect, useCallback } from 'react';
import { offlineService } from '@/lib/services/offline.service';
import { syncService, SyncResult } from '@/lib/services/sync.service';
import { indexedDBService } from '@/lib/services/indexeddb.service';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

interface SyncStatus {
  lastSyncTime: string | null;
  syncInProgress: boolean;
  unsyncedCount: number;
  queueSize: number;
}

interface OfflineHookState {
  networkStatus: NetworkStatus;
  syncStatus: SyncStatus;
  isInitialized: boolean;
  error: string | null;
}

export const useOfflineSync = (userId: string) => {
  const [state, setState] = useState<OfflineHookState>({
    networkStatus: {
      isOnline: navigator.onLine,
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0
    },
    syncStatus: {
      lastSyncTime: null,
      syncInProgress: false,
      unsyncedCount: 0,
      queueSize: 0
    },
    isInitialized: false,
    error: null
  });

  // 初始化离线服务
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // 初始化IndexedDB
        await indexedDBService.initialize();
        
        // 获取初始状态
        const networkStatus = offlineService.getNetworkStatus();
        const syncStatus = await syncService.getSyncStatus(userId);
        
        setState(prev => ({
          ...prev,
          networkStatus,
          syncStatus,
          isInitialized: true,
          error: null
        }));

        console.log('✅ 离线同步服务已初始化');
      } catch (error) {
        console.error('❌ 离线同步服务初始化失败:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '初始化失败',
          isInitialized: false
        }));
      }
    };

    initializeServices();
  }, [userId]);

  // 监听网络状态变化
  useEffect(() => {
    const unsubscribeNetwork = offlineService.onNetworkChange((networkStatus) => {
      setState(prev => ({
        ...prev,
        networkStatus
      }));
    });

    return unsubscribeNetwork;
  }, []);

  // 监听同步完成事件
  useEffect(() => {
    const unsubscribeSync = offlineService.onSyncComplete(async () => {
      try {
        const syncStatus = await syncService.getSyncStatus(userId);
        setState(prev => ({
          ...prev,
          syncStatus
        }));
      } catch (error) {
        console.error('更新同步状态失败:', error);
      }
    });

    return unsubscribeSync;
  }, [userId]);

  // 定期更新同步状态
  useEffect(() => {
    if (!state.isInitialized) return;

    const updateSyncStatus = async () => {
      try {
        const syncStatus = await syncService.getSyncStatus(userId);
        setState(prev => ({
          ...prev,
          syncStatus
        }));
      } catch (error) {
        console.error('获取同步状态失败:', error);
      }
    };

    // 每30秒更新一次状态
    const interval = setInterval(updateSyncStatus, 30000);
    
    return () => clearInterval(interval);
  }, [userId, state.isInitialized]);

  // 手动同步
  const manualSync = useCallback(async (): Promise<SyncResult> => {
    if (!state.networkStatus.isOnline) {
      throw new Error('网络未连接，无法同步');
    }

    setState(prev => ({
      ...prev,
      syncStatus: { ...prev.syncStatus, syncInProgress: true }
    }));

    try {
      const result = await syncService.fullSync(userId);
      
      // 更新同步状态
      const syncStatus = await syncService.getSyncStatus(userId);
      setState(prev => ({
        ...prev,
        syncStatus,
        error: result.success ? null : result.errors.join(', ')
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步失败';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        syncStatus: { ...prev.syncStatus, syncInProgress: false }
      }));
      throw error;
    }
  }, [userId, state.networkStatus.isOnline]);

  // 增量同步
  const incrementalSync = useCallback(async (): Promise<SyncResult> => {
    if (!state.networkStatus.isOnline) {
      throw new Error('网络未连接，无法同步');
    }

    setState(prev => ({
      ...prev,
      syncStatus: { ...prev.syncStatus, syncInProgress: true }
    }));

    try {
      const result = await syncService.incrementalSync(userId);
      
      // 更新同步状态
      const syncStatus = await syncService.getSyncStatus(userId);
      setState(prev => ({
        ...prev,
        syncStatus,
        error: result.success ? null : result.errors.join(', ')
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '增量同步失败';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        syncStatus: { ...prev.syncStatus, syncInProgress: false }
      }));
      throw error;
    }
  }, [userId, state.networkStatus.isOnline]);

  // 强制同步
  const forceSync = useCallback(async (): Promise<SyncResult> => {
    if (!state.networkStatus.isOnline) {
      throw new Error('网络未连接，无法同步');
    }

    setState(prev => ({
      ...prev,
      syncStatus: { ...prev.syncStatus, syncInProgress: true }
    }));

    try {
      const result = await syncService.forceSync(userId);
      
      // 更新同步状态
      const syncStatus = await syncService.getSyncStatus(userId);
      setState(prev => ({
        ...prev,
        syncStatus,
        error: result.success ? null : result.errors.join(', ')
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '强制同步失败';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        syncStatus: { ...prev.syncStatus, syncInProgress: false }
      }));
      throw error;
    }
  }, [userId, state.networkStatus.isOnline]);

  // 重置同步状态
  const resetSync = useCallback(async (): Promise<void> => {
    try {
      await syncService.resetSync(userId);
      
      // 重新获取状态
      const syncStatus = await syncService.getSyncStatus(userId);
      setState(prev => ({
        ...prev,
        syncStatus,
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重置同步状态失败';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
      throw error;
    }
  }, [userId]);

  // 获取离线队列状态
  const getQueueStatus = useCallback(async () => {
    try {
      return await offlineService.getQueueStatus();
    } catch (error) {
      console.error('获取队列状态失败:', error);
      throw error;
    }
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // 获取存储统计信息
  const getStorageStats = useCallback(async () => {
    try {
      return await indexedDBService.getStorageStats();
    } catch (error) {
      console.error('获取存储统计失败:', error);
      throw error;
    }
  }, []);

  return {
    // 状态
    networkStatus: state.networkStatus,
    syncStatus: state.syncStatus,
    isInitialized: state.isInitialized,
    error: state.error,
    
    // 计算属性
    isOnline: state.networkStatus.isOnline,
    isSyncing: state.syncStatus.syncInProgress,
    hasUnsyncedData: state.syncStatus.unsyncedCount > 0,
    hasQueuedItems: state.syncStatus.queueSize > 0,
    
    // 方法
    manualSync,
    incrementalSync,
    forceSync,
    resetSync,
    getQueueStatus,
    getStorageStats,
    clearError
  };
};

// 导出类型
export type { NetworkStatus, SyncStatus, OfflineHookState };