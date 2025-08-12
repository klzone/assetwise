/**
 * 全局同步管理器
 * 在应用启动时自动初始化同步功能，监听数据变化并自动同步
 */

import React, { useEffect } from 'react';
import { useAutoSync } from '@/hooks/useAutoSync';
import { SyncStatusIndicator } from './sync-status-indicator';
import { logger } from '@/lib/services/error-handler.service';
import { useUserStore } from '@/store';

export interface GlobalSyncManagerProps {
  /** 是否显示浮动同步指示器 */
  showFloatingIndicator?: boolean;
  /** 是否启用自动同步 */
  enableAutoSync?: boolean;
  /** 同步间隔（毫秒） */
  syncInterval?: number;
}

export function GlobalSyncManager({
  showFloatingIndicator = true,
  enableAutoSync = true,
  syncInterval = 60000
}: GlobalSyncManagerProps) {
  const { user } = useUserStore();
  
  const {
    isSyncing,
    lastSyncResult,
    lastSyncTime,
    hasChangesToSync,
    triggerSync,
    enableAutoSync: enableAutoSyncFunc,
    disableAutoSync
  } = useAutoSync({
    enableAutoSync,
    syncOnMount: true,
    syncOnDataChange: true,
    syncInterval
  });

  /**
   * 监听用户登录状态变化
   */
  useEffect(() => {
    if (user?.id) {
      logger.info('用户已登录，启用全局同步管理', 'GlobalSyncManager', { userId: user.id });

      // 用户登录后启用自动同步
      if (enableAutoSync) {
        enableAutoSyncFunc();
      }

      // 延迟检查是否有待同步的数据，避免页面加载时立即同步
      const initialSyncTimer = setTimeout(() => {
        // 检查变化并决定是否同步，但不依赖hasChangesToSync状态
        logger.info('检查是否需要初始同步', 'GlobalSyncManager');
        // 直接调用triggerSync，让它内部判断是否需要同步
        triggerSync();
      }, 5000); // 延迟5秒，确保页面完全加载

      return () => {
        clearTimeout(initialSyncTimer);
      };
    } else {
      logger.info('用户未登录，禁用全局同步管理', 'GlobalSyncManager');

      // 用户未登录时禁用自动同步
      disableAutoSync();
    }
  }, [user?.id, enableAutoSync, enableAutoSyncFunc, disableAutoSync, triggerSync]);

  /**
   * 监听页面可见性变化
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        logger.info('页面重新可见，触发同步检查', 'GlobalSyncManager');
        
        // 页面重新可见时检查同步
        setTimeout(() => {
          triggerSync();
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, triggerSync]);

  /**
   * 监听网络状态变化
   */
  useEffect(() => {
    const handleOnline = () => {
      if (user?.id) {
        logger.info('网络重新连接，触发同步', 'GlobalSyncManager');
        
        // 网络重新连接时立即同步
        setTimeout(() => {
          triggerSync();
        }, 1000);
      }
    };

    const handleOffline = () => {
      logger.info('网络断开连接，暂停自动同步', 'GlobalSyncManager');
      
      // 网络断开时暂停自动同步
      disableAutoSync();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.id, triggerSync, disableAutoSync]);

  /**
   * 定期报告同步状态
   */
  useEffect(() => {
    const reportTimer = setInterval(() => {
      if (user?.id) {
        logger.info('同步状态报告', 'GlobalSyncManager', {
          isSyncing,
          hasChangesToSync,
          lastSyncTime: lastSyncTime?.toISOString(),
          lastSyncSuccess: lastSyncResult?.success,
          autoSyncEnabled: enableAutoSync
        });
      }
    }, 300000); // 每5分钟报告一次

    return () => {
      clearInterval(reportTimer);
    };
  }, [user?.id, isSyncing, hasChangesToSync, lastSyncTime, lastSyncResult, enableAutoSync]);

  // 如果用户未登录，不显示任何内容
  if (!user?.id) {
    return null;
  }

  // 如果不显示浮动指示器，只返回空组件（后台运行同步逻辑）
  if (!showFloatingIndicator) {
    return null;
  }

  // 显示浮动同步指示器
  return (
    <SyncStatusIndicator
      showDetails={false}
      showSyncButton={true}
      enableAutoSync={enableAutoSync}
      size="sm"
      position="floating"
      className="fixed bottom-4 right-4 z-50"
    />
  );
}

/**
 * 简化版全局同步管理器，只在后台运行，不显示UI
 */
export function BackgroundSyncManager() {
  return (
    <GlobalSyncManager
      showFloatingIndicator={false}
      enableAutoSync={true}
      syncInterval={60000}
    />
  );
}

/**
 * 完整版全局同步管理器，包含浮动指示器
 */
export function FullGlobalSyncManager() {
  return (
    <GlobalSyncManager
      showFloatingIndicator={true}
      enableAutoSync={true}
      syncInterval={60000}
    />
  );
}
