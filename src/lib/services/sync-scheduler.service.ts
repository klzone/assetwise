/**
 * 定时同步调度器服务
 * 负责管理自动同步任务的调度和执行
 */

import { syncService } from './sync.service';
import { subscriptionService } from './subscription.service';
import { SyncResult, SyncOptions } from '../types/sync.types';

export interface SyncScheduleConfig {
  enabled: boolean;
  interval: number; // 同步间隔（分钟）
  autoSyncOnStart: boolean; // 应用启动时自动同步
  autoSyncOnNetworkRestore: boolean; // 网络恢复时自动同步
  autoSyncOnFocus: boolean; // 窗口获得焦点时自动同步
  maxRetries: number; // 最大重试次数
  retryDelay: number; // 重试延迟（秒）
  syncOnlyWhenIdle: boolean; // 仅在空闲时同步
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM 格式
    endTime: string; // HH:MM 格式
  };
}

export interface ScheduledSyncStatus {
  isEnabled: boolean;
  nextSyncTime: Date | null;
  lastSyncTime: Date | null;
  lastSyncResult: SyncResult | null;
  retryCount: number;
  isRunning: boolean;
}

export class SyncSchedulerService {
  private config: SyncScheduleConfig;
  private timerId: NodeJS.Timeout | null = null;
  private retryTimerId: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;
  private isIdle: boolean = true;
  private lastActivity: Date = new Date();
  private retryCount: number = 0;
  private listeners: Array<(status: ScheduledSyncStatus) => void> = [];

  constructor() {
    this.config = this.loadConfig();
    this.setupEventListeners();
    this.startIdleDetection();
    
    if (this.config.autoSyncOnStart) {
      this.scheduleImmediate();
    }
  }

  private loadConfig(): SyncScheduleConfig {
    const defaultConfig: SyncScheduleConfig = {
      enabled: true,
      interval: 30, // 30分钟
      autoSyncOnStart: true,
      autoSyncOnNetworkRestore: true,
      autoSyncOnFocus: true,
      maxRetries: 3,
      retryDelay: 60, // 60秒
      syncOnlyWhenIdle: false,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      }
    };

    if (typeof window === 'undefined') {
      // 服务端环境，返回默认配置
      return defaultConfig;
    }

    const stored = localStorage.getItem('assetwise_sync_schedule_config');
    if (stored) {
      try {
        return { ...defaultConfig, ...JSON.parse(stored) };
      } catch (error) {
        console.error('加载同步调度配置失败:', error);
        return defaultConfig;
      }
    }

    return defaultConfig;
  }

  private saveConfig(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('assetwise_sync_schedule_config', JSON.stringify(this.config));
    }
  }

  private setupEventListeners(): void {
    // 网络状态监听
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        if (this.config.autoSyncOnNetworkRestore) {
          this.scheduleImmediate();
        }
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.stopScheduler();
      });

      // 窗口焦点监听
      window.addEventListener('focus', () => {
        if (this.config.autoSyncOnFocus) {
          const lastSync = syncService.getLastSyncTime();
          const now = new Date();
          
          // 如果超过配置的间隔时间，则触发同步
          if (!lastSync || (now.getTime() - lastSync.getTime()) > (this.config.interval * 60 * 1000)) {
            this.scheduleImmediate();
          }
        }
      });

      // 页面可见性监听
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.config.autoSyncOnFocus) {
          this.scheduleImmediate();
        }
      });
    }
  }

  private startIdleDetection(): void {
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetIdleTimer = () => {
      this.lastActivity = new Date();
      this.isIdle = false;
      
      // 5分钟后认为用户空闲
      setTimeout(() => {
        const now = new Date();
        if (now.getTime() - this.lastActivity.getTime() >= 5 * 60 * 1000) {
          this.isIdle = true;
        }
      }, 5 * 60 * 1000);
    };

    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });
  }

  private isInQuietHours(): boolean {
    if (!this.config.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { startTime, endTime } = this.config.quietHours;
    
    if (startTime <= endTime) {
      // 同一天内的时间范围
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // 跨天的时间范围
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private canSync(): boolean {
    // 检查权限
    if (!subscriptionService.hasFeatureAccess('cloud_sync')) {
      return false;
    }

    // 检查网络状态
    if (!this.isOnline) {
      return false;
    }

    // 检查静默时间
    if (this.isInQuietHours()) {
      return false;
    }

    // 检查空闲状态
    if (this.config.syncOnlyWhenIdle && !this.isIdle) {
      return false;
    }

    // 检查是否已在同步
    if (syncService.isSyncInProgress()) {
      return false;
    }

    return true;
  }

  private async executeSync(): Promise<void> {
    if (!this.canSync()) {
      this.scheduleNext();
      return;
    }

    try {
      console.log('🔄 执行定时同步...');
      
      const options: SyncOptions = {
        forceSync: false,
        conflictResolution: 'merge'
      };

      const result = await syncService.syncData(options);
      
      if (result.success) {
        console.log('✅ 定时同步成功', result);
        this.retryCount = 0;
        this.scheduleNext();
      } else {
        throw new Error('同步失败');
      }

      this.notifyListeners();
      
    } catch (error) {
      console.error('❌ 定时同步失败:', error);
      this.handleSyncError();
    }
  }

  private handleSyncError(): void {
    this.retryCount++;
    
    if (this.retryCount <= this.config.maxRetries) {
      console.log(`🔄 ${this.config.retryDelay}秒后重试 (${this.retryCount}/${this.config.maxRetries})`);
      
      this.retryTimerId = setTimeout(() => {
        this.executeSync();
      }, this.config.retryDelay * 1000);
    } else {
      console.error('❌ 达到最大重试次数，停止重试');
      this.retryCount = 0;
      this.scheduleNext();
    }

    this.notifyListeners();
  }

  private scheduleNext(): void {
    if (!this.config.enabled) return;

    this.stopScheduler();
    
    const nextSyncTime = new Date(Date.now() + this.config.interval * 60 * 1000);
    const delay = nextSyncTime.getTime() - Date.now();
    
    this.timerId = setTimeout(() => {
      this.executeSync();
    }, delay);

    console.log(`⏰ 下次同步时间: ${nextSyncTime.toLocaleString()}`);
    this.notifyListeners();
  }

  private scheduleImmediate(): void {
    if (!this.config.enabled) return;

    // 取消当前的定时器
    this.stopScheduler();
    
    // 立即执行同步
    setTimeout(() => {
      this.executeSync();
    }, 1000); // 1秒延迟，避免频繁触发
  }

  private stopScheduler(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    
    if (this.retryTimerId) {
      clearTimeout(this.retryTimerId);
      this.retryTimerId = null;
    }
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('通知监听器失败:', error);
      }
    });
  }

  // 公共方法

  /**
   * 启动定时同步
   */
  start(): void {
    this.config.enabled = true;
    this.saveConfig();
    this.scheduleNext();
    console.log('✅ 定时同步已启动');
  }

  /**
   * 停止定时同步
   */
  stop(): void {
    this.config.enabled = false;
    this.saveConfig();
    this.stopScheduler();
    console.log('⏹️ 定时同步已停止');
  }

  /**
   * 立即执行同步
   */
  syncNow(): Promise<void> {
    return this.executeSync();
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<SyncScheduleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    
    // 重新启动调度器以应用新配置
    if (this.config.enabled) {
      this.stop();
      this.start();
    }
    
    console.log('⚙️ 同步调度配置已更新', this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): SyncScheduleConfig {
    return { ...this.config };
  }

  /**
   * 获取调度状态
   */
  getStatus(): ScheduledSyncStatus {
    const nextSyncTime = this.timerId ? 
      new Date(Date.now() + this.config.interval * 60 * 1000) : null;

    return {
      isEnabled: this.config.enabled,
      nextSyncTime,
      lastSyncTime: syncService.getLastSyncTime(),
      lastSyncResult: null, // TODO: 从syncService获取
      retryCount: this.retryCount,
      isRunning: syncService.isSyncInProgress()
    };
  }

  /**
   * 添加状态监听器
   */
  addStatusListener(listener: (status: ScheduledSyncStatus) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除状态监听器
   */
  removeStatusListener(listener: (status: ScheduledSyncStatus) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 获取下次同步时间
   */
  getNextSyncTime(): Date | null {
    if (!this.config.enabled || !this.timerId) return null;
    return new Date(Date.now() + this.config.interval * 60 * 1000);
  }

  /**
   * 重置重试计数
   */
  resetRetryCount(): void {
    this.retryCount = 0;
  }

  /**
   * 检查是否可以同步
   */
  canSyncNow(): boolean {
    return this.canSync();
  }

  /**
   * 销毁调度器
   */
  destroy(): void {
    this.stop();
    this.listeners = [];
    
    // 移除事件监听器
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.setupEventListeners);
      window.removeEventListener('offline', this.setupEventListeners);
      window.removeEventListener('focus', this.setupEventListeners);
    }
  }
}

export const syncSchedulerService = new SyncSchedulerService();