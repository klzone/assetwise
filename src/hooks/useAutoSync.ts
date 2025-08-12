/**
 * 自动同步Hook - 在各个页面中使用的数据同步功能
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { autoSyncService, SyncResult } from '@/lib/services/auto-sync.service';
import { logger } from '@/lib/services/error-handler.service';

export interface UseAutoSyncOptions {
  /** 是否启用自动同步 */
  enableAutoSync?: boolean;
  /** 是否在组件挂载时立即同步 */
  syncOnMount?: boolean;
  /** 是否在数据变化时自动触发同步 */
  syncOnDataChange?: boolean;
  /** 同步间隔（毫秒），默认60秒 */
  syncInterval?: number;
}

export interface UseAutoSyncReturn {
  /** 是否正在同步 */
  isSyncing: boolean;
  /** 最后一次同步结果 */
  lastSyncResult: SyncResult | null;
  /** 最后一次同步时间 */
  lastSyncTime: Date | null;
  /** 是否有待同步的数据 */
  hasChangesToSync: boolean;
  /** 手动触发同步 */
  triggerSync: () => Promise<SyncResult>;
  /** 启用自动同步 */
  enableAutoSync: () => void;
  /** 禁用自动同步 */
  disableAutoSync: () => void;
  /** 检查是否有变化 */
  checkForChanges: () => boolean;
  /** 重置同步状态 */
  resetSyncState: () => void;
}

export function useAutoSync(options: UseAutoSyncOptions = {}): UseAutoSyncReturn {
  const {
    enableAutoSync: autoSyncEnabled = false,
    syncOnMount = false,
    syncOnDataChange = true,
    syncInterval = 60000
  } = options;

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [hasChangesToSync, setHasChangesToSync] = useState(false);

  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dataChangeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoSyncEnabledRef = useRef(false);

  /**
   * 检查是否有变化
   */
  const checkForChanges = useCallback(() => {
    const hasChanges = autoSyncService.hasChangesToSync();
    setHasChangesToSync(prev => {
      // 只有当状态真正改变时才更新，避免不必要的重渲染
      if (prev !== hasChanges) {
        return hasChanges;
      }
      return prev;
    });
    return hasChanges;
  }, []);

  /**
   * 手动触发同步
   */
  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    // 检查服务层的同步状态
    const serviceStatus = autoSyncService.getSyncStatus();
    if (serviceStatus.isInProgress) {
      logger.warn('服务层同步正在进行中，跳过此次同步', 'useAutoSync');
      return { success: false, successCount: 0, errorCount: 0, errors: ['同步正在进行中'], message: '同步正在进行中' };
    }

    if (isSyncing) {
      logger.warn('Hook层同步正在进行中，跳过此次同步', 'useAutoSync');
      return { success: false, successCount: 0, errorCount: 0, errors: ['同步正在进行中'], message: '同步正在进行中' };
    }

    setIsSyncing(true);
    logger.info('手动触发同步...', 'useAutoSync');

    try {
      const result = await autoSyncService.runSync();
      setLastSyncResult(result);
      setLastSyncTime(new Date());

      // 同步后重新检查变化（使用setTimeout避免在渲染过程中更新状态）
      setTimeout(() => {
        checkForChanges();
      }, 0);

      if (result.success) {
        logger.info(`同步成功: ${result.message}`, 'useAutoSync');
      } else {
        logger.error(`同步失败: ${result.message}`, 'useAutoSync', result.errors);
      }

      return result;
    } catch (error: any) {
      const errorResult: SyncResult = {
        success: false,
        successCount: 0,
        errorCount: 1,
        errors: [error.message],
        message: error.message
      };
      setLastSyncResult(errorResult);
      logger.error('同步异常', 'useAutoSync', error);

      // 重置服务层状态以防止死锁
      autoSyncService.resetSyncState();

      return errorResult;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]); // 移除checkForChanges依赖，避免循环

  /**
   * 启用自动同步
   */
  const enableAutoSyncFunc = useCallback(() => {
    if (isAutoSyncEnabledRef.current) {
      return;
    }

    isAutoSyncEnabledRef.current = true;
    logger.info(`启用自动同步，间隔: ${syncInterval}ms`, 'useAutoSync');

    // 清除现有定时器
    if (autoSyncTimerRef.current) {
      clearInterval(autoSyncTimerRef.current);
    }

    // 设置新的定时器 - 改为3分钟间隔
    const threeMinutes = 3 * 60 * 1000; // 3分钟 = 180000ms
    autoSyncTimerRef.current = setInterval(async () => {
      if (!isAutoSyncEnabledRef.current) {
        return;
      }

      logger.info('定时同步检查...', 'useAutoSync');

      // 检查是否有变化
      if (checkForChanges()) {
        await triggerSync();
      } else {
        logger.info('没有数据变化，跳过同步', 'useAutoSync');
      }
    }, threeMinutes);

    logger.info('自动同步已启用，间隔: 3分钟', 'useAutoSync');
  }, [syncInterval, triggerSync]); // 移除checkForChanges依赖，避免循环

  /**
   * 禁用自动同步
   */
  const disableAutoSyncFunc = useCallback(() => {
    isAutoSyncEnabledRef.current = false;

    if (autoSyncTimerRef.current) {
      clearInterval(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }

    logger.info('自动同步已禁用', 'useAutoSync');
  }, []);

  /**
   * 监听localStorage变化，检测数据变化
   */
  useEffect(() => {
    if (!syncOnDataChange) {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      // 只监听AssetWise相关的数据变化
      if (e.key && (e.key.startsWith('assetwise_accounts') || e.key.startsWith('assetwise_transactions'))) {
        logger.info(`检测到数据变化: ${e.key}`, 'useAutoSync');

        // 防抖：延迟检查变化，避免频繁触发
        if (dataChangeTimerRef.current) {
          clearTimeout(dataChangeTimerRef.current);
        }

        dataChangeTimerRef.current = setTimeout(() => {
          // 使用setTimeout避免在事件处理过程中更新状态
          setTimeout(() => {
            checkForChanges();
          }, 0);

          // 如果启用了自动同步，立即触发同步
          if (isAutoSyncEnabledRef.current) {
            triggerSync();
          }
        }, 1000); // 1秒防抖
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (dataChangeTimerRef.current) {
        clearTimeout(dataChangeTimerRef.current);
      }
    };
  }, [syncOnDataChange, triggerSync]); // 移除checkForChanges依赖，避免无限循环

  /**
   * 组件挂载时的初始化
   */
  useEffect(() => {
    // 初始检查变化（使用setTimeout避免在挂载过程中更新状态）
    setTimeout(() => {
      checkForChanges();
    }, 0);

    // 如果启用了挂载时同步
    if (syncOnMount) {
      logger.info('组件挂载时触发同步...', 'useAutoSync');
      triggerSync();
    }

    // 如果启用了自动同步
    if (autoSyncEnabled) {
      enableAutoSyncFunc();
    }

    // 清理函数
    return () => {
      disableAutoSyncFunc();
      if (dataChangeTimerRef.current) {
        clearTimeout(dataChangeTimerRef.current);
      }
    };
  }, [syncOnMount, autoSyncEnabled, triggerSync, enableAutoSyncFunc, disableAutoSyncFunc]);

  /**
   * 定期检查变化（即使没有自动同步）
   */
  useEffect(() => {
    const checkTimer = setInterval(() => {
      // 使用setTimeout避免在定时器回调中直接更新状态
      setTimeout(() => {
        checkForChanges();
      }, 0);
    }, 10000); // 每10秒检查一次变化

    return () => {
      clearInterval(checkTimer);
    };
  }, []); // 移除checkForChanges依赖，避免无限循环

  /**
   * 重置同步状态
   */
  const resetSyncState = useCallback(() => {
    logger.info('重置同步状态...', 'useAutoSync');

    // 重置Hook层状态
    setIsSyncing(false);

    // 重置服务层状态
    autoSyncService.resetSyncState();

    // 重新检查变化
    checkForChanges();

    logger.info('同步状态已重置', 'useAutoSync');
  }, []); // 移除checkForChanges依赖，避免无限循环

  return {
    isSyncing,
    lastSyncResult,
    lastSyncTime,
    hasChangesToSync,
    triggerSync,
    enableAutoSync: enableAutoSyncFunc,
    disableAutoSync: disableAutoSyncFunc,
    checkForChanges,
    resetSyncState
  };
}

/**
 * 简化版Hook，只提供基本的同步功能
 */
export function useBasicSync() {
  return useAutoSync({
    enableAutoSync: false,
    syncOnMount: false,
    syncOnDataChange: true
  });
}

/**
 * 完整版Hook，启用所有同步功能
 */
export function useFullAutoSync() {
  return useAutoSync({
    enableAutoSync: true,
    syncOnMount: true,
    syncOnDataChange: true,
    syncInterval: 60000 // 1分钟
  });
}
