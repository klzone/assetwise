/**
 * 数据同步状态管理
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  SyncConfig,
  SyncSession,
  SyncProgress,
  SyncStats,
  SyncConflict,
  SyncLog,
  SyncContextState,
  SyncActions,
  DataType,
  SyncStatus,
  SubscriptionTier,
  SubscriptionLimits,
  SyncEvent
} from '../types/sync.types';

// 订阅限制配置
const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
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

interface SyncStore extends SyncContextState, SyncActions {
  // 内部状态
  eventListeners: ((event: SyncEvent) => void)[];
  
  // 内部方法
  setConfig: (config: SyncConfig | null) => void;
  setCurrentSession: (session: SyncSession | null) => void;
  setProgress: (progress: SyncProgress | null) => void;
  setStats: (stats: SyncStats | null) => void;
  setConflicts: (conflicts: SyncConflict[]) => void;
  addConflict: (conflict: SyncConflict) => void;
  removeConflict: (conflictId: string) => void;
  setLogs: (logs: SyncLog[]) => void;
  addLog: (log: SyncLog) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setSubscriptionTier: (tier: SubscriptionTier) => void;
  
  // 事件系统
  addEventListener: (listener: (event: SyncEvent) => void) => void;
  removeEventListener: (listener: (event: SyncEvent) => void) => void;
  emitEvent: (event: SyncEvent) => void;
  
  // 初始化
  initialize: () => Promise<void>;
  cleanup: () => void;
}

export const useSyncStore = create<SyncStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    config: null,
    currentSession: null,
    progress: null,
    stats: null,
    conflicts: [],
    logs: [],
    isOnline: navigator.onLine,
    subscriptionTier: 'free',
    subscriptionLimits: SUBSCRIPTION_LIMITS.free,
    eventListeners: [],

    // 状态设置方法
    setConfig: (config) => set({ config }),
    setCurrentSession: (currentSession) => set({ currentSession }),
    setProgress: (progress) => set({ progress }),
    setStats: (stats) => set({ stats }),
    setConflicts: (conflicts) => set({ conflicts }),
    addConflict: (conflict) => set((state) => ({ 
      conflicts: [...state.conflicts, conflict] 
    })),
    removeConflict: (conflictId) => set((state) => ({ 
      conflicts: state.conflicts.filter(c => c.id !== conflictId) 
    })),
    setLogs: (logs) => set({ logs }),
    addLog: (log) => set((state) => ({ 
      logs: [...state.logs, log].slice(-100) // 保留最近100条日志
    })),
    setOnlineStatus: (isOnline) => set({ isOnline }),
    setSubscriptionTier: (tier) => set({ 
      subscriptionTier: tier,
      subscriptionLimits: SUBSCRIPTION_LIMITS[tier]
    }),

    // 事件系统
    addEventListener: (listener) => set((state) => ({
      eventListeners: [...state.eventListeners, listener]
    })),
    removeEventListener: (listener) => set((state) => ({
      eventListeners: state.eventListeners.filter(l => l !== listener)
    })),
    emitEvent: (event) => {
      const { eventListeners } = get();
      eventListeners.forEach(listener => listener(event));
    },

    // 同步操作
    startSync: async (dataTypes) => {
      const { config, subscriptionTier, isOnline, emitEvent, setCurrentSession, setProgress } = get();
      
      // 检查权限
      if (subscriptionTier === 'free') {
        throw new Error('数据同步功能仅对专业版和旗舰版用户开放');
      }
      
      if (!isOnline) {
        throw new Error('网络连接不可用，无法开始同步');
      }
      
      if (!config?.enabled) {
        throw new Error('同步功能未启用');
      }

      // 创建同步会话
      const session: SyncSession = {
        id: `sync_${Date.now()}`,
        user_id: 'current_user', // 实际应该从认证状态获取
        status: 'syncing',
        started_at: new Date().toISOString(),
        total_items: 0,
        synced_items: 0,
        failed_items: 0,
        data_types: dataTypes || config.data_types
      };

      setCurrentSession(session);
      setProgress({
        session_id: session.id,
        current_step: '准备同步...',
        progress_percentage: 0,
        items_processed: 0,
        total_items: 0
      });

      emitEvent({
        type: 'sync_started',
        session_id: session.id,
        timestamp: new Date().toISOString()
      });

      try {
        // 这里会调用实际的同步逻辑
        console.log('开始同步数据...', { dataTypes: session.data_types });
        
        // 模拟同步过程
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 更新会话状态
        const completedSession: SyncSession = {
          ...session,
          status: 'success',
          completed_at: new Date().toISOString(),
          synced_items: session.total_items
        };
        
        setCurrentSession(completedSession);
        setProgress(null);
        
        emitEvent({
          type: 'sync_completed',
          session_id: session.id,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        const failedSession: SyncSession = {
          ...session,
          status: 'error',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : '同步失败'
        };
        
        setCurrentSession(failedSession);
        setProgress(null);
        
        emitEvent({
          type: 'sync_failed',
          session_id: session.id,
          data: { error: failedSession.error_message },
          timestamp: new Date().toISOString()
        });
        
        throw error;
      }
    },

    pauseSync: async () => {
      const { currentSession, setCurrentSession } = get();
      if (currentSession && currentSession.status === 'syncing') {
        setCurrentSession({
          ...currentSession,
          status: 'paused'
        });
      }
    },

    resumeSync: async () => {
      const { currentSession, setCurrentSession } = get();
      if (currentSession && currentSession.status === 'paused') {
        setCurrentSession({
          ...currentSession,
          status: 'syncing'
        });
      }
    },

    cancelSync: async () => {
      const { currentSession, setCurrentSession, setProgress } = get();
      if (currentSession && ['syncing', 'paused'].includes(currentSession.status)) {
        setCurrentSession({
          ...currentSession,
          status: 'error',
          completed_at: new Date().toISOString(),
          error_message: '用户取消同步'
        });
        setProgress(null);
      }
    },

    resolveConflict: async (conflictId, resolution, data) => {
      const { conflicts, removeConflict } = get();
      const conflict = conflicts.find(c => c.id === conflictId);
      
      if (!conflict) {
        throw new Error('冲突不存在');
      }

      // 这里会调用实际的冲突解决逻辑
      console.log('解决冲突:', { conflictId, resolution, data });
      
      // 移除已解决的冲突
      removeConflict(conflictId);
    },

    updateConfig: async (configUpdate) => {
      const { config, setConfig } = get();
      if (config) {
        const updatedConfig = {
          ...config,
          ...configUpdate,
          updated_at: new Date().toISOString()
        };
        setConfig(updatedConfig);
        
        // 这里会调用API保存配置
        console.log('更新同步配置:', updatedConfig);
      }
    },

    getVersionHistory: async (dataType, dataId) => {
      // 这里会调用API获取版本历史
      console.log('获取版本历史:', { dataType, dataId });
      return [];
    },

    restoreVersion: async (versionId) => {
      // 这里会调用API恢复版本
      console.log('恢复版本:', { versionId });
    },

    clearSyncData: async () => {
      set({
        currentSession: null,
        progress: null,
        conflicts: [],
        logs: []
      });
    },

    // 初始化
    initialize: async () => {
      const { setOnlineStatus, setSubscriptionTier } = get();
      
      // 监听网络状态
      const handleOnline = () => setOnlineStatus(true);
      const handleOffline = () => setOnlineStatus(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // 获取用户订阅状态
      // 这里应该从API获取实际的订阅状态
      setSubscriptionTier('professional'); // 临时设置为专业版用于测试
      
      // 加载同步配置
      // 这里应该从API加载用户的同步配置
      console.log('同步模块初始化完成');
    },

    cleanup: () => {
      const { eventListeners } = get();
      
      // 清理事件监听器
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
      
      // 清理状态
      set({
        eventListeners: [],
        currentSession: null,
        progress: null,
        conflicts: [],
        logs: []
      });
    }
  }))
);

// 自动初始化
if (typeof window !== 'undefined') {
  useSyncStore.getState().initialize();
}