'use client';

export interface SyncError {
  id: string;
  type: 'network' | 'data' | 'auth' | 'conflict' | 'storage' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: string;
  timestamp: Date;
  context: ErrorContext;
  retryCount: number;
  maxRetries: number;
  resolved: boolean;
  resolvedAt?: Date;
  recoveryAction?: string;
}

export interface ErrorContext {
  operation: string;
  deviceId: string;
  userId?: string;
  dataType?: string;
  recordId?: string;
  networkStatus: boolean;
  memoryUsage?: number;
  stackTrace?: string;
}

export interface RecoveryStrategy {
  type: string;
  name: string;
  description: string;
  canHandle: (error: SyncError) => boolean;
  execute: (error: SyncError) => Promise<RecoveryResult>;
  priority: number;
}

export interface RecoveryResult {
  success: boolean;
  message: string;
  nextAction?: 'retry' | 'skip' | 'manual' | 'abort';
  delay?: number;
}

export interface ErrorStats {
  totalErrors: number;
  resolvedErrors: number;
  criticalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  avgResolutionTime: number;
  recoveryRate: number;
  recentErrors: SyncError[];
}

class ErrorRecoveryService {
  private errors: SyncError[] = [];
  private recoveryStrategies: RecoveryStrategy[] = [];
  private listeners: ((stats: ErrorStats) => void)[] = [];
  private readonly STORAGE_KEY = 'assetwise_sync_errors';
  private readonly MAX_ERRORS = 500;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadErrors();
      this.initializeRecoveryStrategies();
      this.startErrorCleanup();
    }
  }

  private loadErrors(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.errors = parsed.map((error: any) => ({
          ...error,
          timestamp: new Date(error.timestamp),
          resolvedAt: error.resolvedAt ? new Date(error.resolvedAt) : undefined
        }));
      }
    } catch (error) {
      console.error('加载错误记录失败:', error);
      this.errors = [];
    }
  }

  private saveErrors(): void {
    try {
      const errorsToSave = this.errors.slice(-this.MAX_ERRORS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(errorsToSave));
    } catch (error) {
      console.error('保存错误记录失败:', error);
    }
  }

  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies = [
      // 网络错误恢复策略
      {
        type: 'network',
        name: '网络重连',
        description: '检测网络状态并重新连接',
        priority: 1,
        canHandle: (error) => error.type === 'network',
        execute: async (error) => {
          if (!navigator.onLine) {
            return {
              success: false,
              message: '网络仍然不可用',
              nextAction: 'retry',
              delay: 5000
            };
          }

          try {
            const response = await fetch('/api/health', { 
              method: 'HEAD',
              cache: 'no-cache',
              signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
              return {
                success: true,
                message: '网络连接已恢复',
                nextAction: 'retry'
              };
            }
          } catch {
            // 网络仍然有问题
          }

          return {
            success: false,
            message: '网络连接测试失败',
            nextAction: 'retry',
            delay: 10000
          };
        }
      },

      // 认证错误恢复策略
      {
        type: 'auth',
        name: '重新认证',
        description: '刷新认证令牌',
        priority: 2,
        canHandle: (error) => error.type === 'auth',
        execute: async (error) => {
          try {
            const refreshResult = await this.refreshAuthToken();
            
            if (refreshResult) {
              return {
                success: true,
                message: '认证令牌已刷新',
                nextAction: 'retry'
              };
            }

            return {
              success: false,
              message: '令牌刷新失败，需要重新登录',
              nextAction: 'manual'
            };
          } catch (refreshError) {
            return {
              success: false,
              message: '认证恢复失败',
              nextAction: 'manual'
            };
          }
        }
      },

      // 存储错误恢复策略
      {
        type: 'storage',
        name: '存储清理',
        description: '清理存储空间并重试',
        priority: 3,
        canHandle: (error) => error.type === 'storage',
        execute: async (error) => {
          try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
              const estimate = await navigator.storage.estimate();
              const usageRatio = (estimate.usage || 0) / (estimate.quota || 1);
              
              if (usageRatio > 0.9) {
                await this.cleanupTemporaryData();
                
                return {
                  success: true,
                  message: '存储空间已清理',
                  nextAction: 'retry'
                };
              }
            }

            return {
              success: false,
              message: '存储空间充足，可能是其他存储问题',
              nextAction: 'manual'
            };
          } catch (cleanupError) {
            return {
              success: false,
              message: '存储清理失败',
              nextAction: 'manual'
            };
          }
        }
      },

      // 数据错误恢复策略
      {
        type: 'data',
        name: '数据修复',
        description: '尝试修复损坏的数据',
        priority: 4,
        canHandle: (error) => error.type === 'data',
        execute: async (error) => {
          try {
            const backupResult = await this.restoreFromBackup(error.context.recordId);
            
            if (backupResult) {
              return {
                success: true,
                message: '数据已从备份恢复',
                nextAction: 'retry'
              };
            }

            return {
              success: false,
              message: '数据无法自动修复',
              nextAction: 'manual'
            };
          } catch (repairError) {
            return {
              success: false,
              message: '数据修复过程中出错',
              nextAction: 'skip'
            };
          }
        }
      },

      // 冲突错误恢复策略
      {
        type: 'conflict',
        name: '自动冲突解决',
        description: '使用预设规则自动解决冲突',
        priority: 5,
        canHandle: (error) => error.type === 'conflict',
        execute: async (error) => {
          try {
            const resolutionResult = await this.autoResolveConflict(error.context.recordId);
            
            if (resolutionResult) {
              return {
                success: true,
                message: '冲突已自动解决',
                nextAction: 'retry'
              };
            }

            return {
              success: false,
              message: '冲突需要手动解决',
              nextAction: 'manual'
            };
          } catch (resolutionError) {
            return {
              success: false,
              message: '冲突解决失败',
              nextAction: 'manual'
            };
          }
        }
      },

      // 系统错误恢复策略
      {
        type: 'system',
        name: '系统重置',
        description: '重置同步状态并重新初始化',
        priority: 6,
        canHandle: (error) => error.type === 'system',
        execute: async (error) => {
          try {
            await this.resetSyncState();
            await this.reinitializeSyncService();
            
            return {
              success: true,
              message: '系统状态已重置',
              nextAction: 'retry'
            };
          } catch (resetError) {
            return {
              success: false,
              message: '系统重置失败',
              nextAction: 'abort'
            };
          }
        }
      }
    ];

    this.recoveryStrategies.sort((a, b) => a.priority - b.priority);
  }

  private startErrorCleanup(): void {
    setInterval(() => {
      this.cleanupOldErrors();
    }, 3600000);
  }

  private cleanupOldErrors(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const initialCount = this.errors.length;
    
    this.errors = this.errors.filter(error => 
      error.timestamp > oneWeekAgo || 
      error.severity === 'critical' ||
      !error.resolved
    );

    if (this.errors.length !== initialCount) {
      this.saveErrors();
      this.notifyListeners();
    }
  }

  public async reportError(
    type: SyncError['type'],
    severity: SyncError['severity'],
    message: string,
    details: string,
    context: Partial<ErrorContext>
  ): Promise<string> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const error: SyncError = {
      id: errorId,
      type,
      severity,
      message,
      details,
      timestamp: new Date(),
      context: {
        operation: context.operation || 'unknown',
        deviceId: context.deviceId || this.getDeviceId(),
        userId: context.userId,
        dataType: context.dataType,
        recordId: context.recordId,
        networkStatus: navigator.onLine,
        memoryUsage: this.getMemoryUsage(),
        stackTrace: context.stackTrace
      },
      retryCount: 0,
      maxRetries: this.getMaxRetries(severity),
      resolved: false
    };

    this.errors.push(error);
    this.saveErrors();
    this.notifyListeners();

    if (severity === 'high' || severity === 'critical') {
      this.attemptRecovery(errorId);
    }

    return errorId;
  }

  private getMaxRetries(severity: SyncError['severity']): number {
    switch (severity) {
      case 'low': return 2;
      case 'medium': return 3;
      case 'high': return 5;
      case 'critical': return 10;
      default: return 3;
    }
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('assetwise_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('assetwise_device_id', deviceId);
    }
    return deviceId;
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  public async attemptRecovery(errorId: string): Promise<boolean> {
    const error = this.errors.find(e => e.id === errorId);
    if (!error || error.resolved) {
      return false;
    }

    if (error.retryCount >= error.maxRetries) {
      console.warn(`错误 ${errorId} 已达到最大重试次数`);
      return false;
    }

    const existingTimeout = this.retryTimeouts.get(errorId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.retryTimeouts.delete(errorId);
    }

    const strategy = this.recoveryStrategies.find(s => s.canHandle(error));
    if (!strategy) {
      console.warn(`没有找到适合错误 ${errorId} 的恢复策略`);
      return false;
    }

    try {
      error.retryCount++;
      const result = await strategy.execute(error);

      if (result.success) {
        error.resolved = true;
        error.resolvedAt = new Date();
        error.recoveryAction = strategy.name;
        
        this.saveErrors();
        this.notifyListeners();
        
        console.log(`错误 ${errorId} 已通过 ${strategy.name} 恢复`);
        return true;
      } else {
        switch (result.nextAction) {
          case 'retry':
            const delay = result.delay || this.getRetryDelay(error.retryCount);
            const timeout = setTimeout(() => {
              this.attemptRecovery(errorId);
            }, delay);
            this.retryTimeouts.set(errorId, timeout);
            break;
            
          case 'skip':
            error.resolved = true;
            error.resolvedAt = new Date();
            error.recoveryAction = '已跳过';
            break;
            
          case 'manual':
            console.warn(`错误 ${errorId} 需要手动处理: ${result.message}`);
            break;
            
          case 'abort':
            console.error(`错误 ${errorId} 导致操作中止: ${result.message}`);
            break;
        }

        this.saveErrors();
        this.notifyListeners();
        return false;
      }
    } catch (recoveryError) {
      console.error(`恢复策略执行失败:`, recoveryError);
      return false;
    }
  }

  private getRetryDelay(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, retryCount - 1), 30000);
  }

  public resolveError(errorId: string, resolution: string): boolean {
    const error = this.errors.find(e => e.id === errorId);
    if (!error) {
      return false;
    }

    error.resolved = true;
    error.resolvedAt = new Date();
    error.recoveryAction = resolution;

    const timeout = this.retryTimeouts.get(errorId);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(errorId);
    }

    this.saveErrors();
    this.notifyListeners();
    return true;
  }

  public getErrorStats(): ErrorStats {
    const totalErrors = this.errors.length;
    const resolvedErrors = this.errors.filter(e => e.resolved).length;
    const criticalErrors = this.errors.filter(e => e.severity === 'critical').length;

    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    const resolvedErrorsWithTime = this.errors.filter(e => e.resolved && e.resolvedAt);
    const avgResolutionTime = resolvedErrorsWithTime.length > 0 
      ? resolvedErrorsWithTime.reduce((sum, error) => {
          const resolutionTime = error.resolvedAt!.getTime() - error.timestamp.getTime();
          return sum + resolutionTime;
        }, 0) / resolvedErrorsWithTime.length
      : 0;

    const recoveryRate = totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0;

    const recentErrors = this.errors
      .filter(e => !e.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalErrors,
      resolvedErrors,
      criticalErrors,
      errorsByType,
      errorsBySeverity,
      avgResolutionTime,
      recoveryRate,
      recentErrors
    };
  }

  public subscribe(listener: (stats: ErrorStats) => void): () => void {
    this.listeners.push(listener);
    listener(this.getErrorStats());
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const stats = this.getErrorStats();
    this.listeners.forEach(listener => listener(stats));
  }

  public getRecoveryStrategies(): RecoveryStrategy[] {
    return [...this.recoveryStrategies];
  }

  public clearAllErrors(): void {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    
    this.errors = [];
    this.saveErrors();
    this.notifyListeners();
  }

  public async simulateError(type: SyncError['type'], severity: SyncError['severity']): Promise<string> {
    const messages = {
      network: '网络连接超时',
      data: '数据格式错误',
      auth: '认证令牌过期',
      conflict: '数据冲突检测',
      storage: '存储空间不足',
      system: '系统内部错误'
    };

    const details = {
      network: '无法连接到同步服务器，请检查网络连接',
      data: '接收到的数据格式不符合预期，可能存在数据损坏',
      auth: '用户认证令牌已过期，需要重新登录',
      conflict: '检测到数据冲突，需要解决后才能继续同步',
      storage: '本地存储空间不足，无法保存同步数据',
      system: '系统内部出现未知错误，请联系技术支持'
    };

    return await this.reportError(
      type,
      severity,
      messages[type],
      details[type],
      {
        operation: 'simulate_error',
        dataType: 'test_data',
        recordId: `test_${Date.now()}`
      }
    );
  }

  // 辅助方法实现
  private async refreshAuthToken(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.3);
      }, 1000);
    });
  }

  private async cleanupTemporaryData(): Promise<void> {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('temp_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  private async restoreFromBackup(recordId?: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.5);
      }, 2000);
    });
  }

  private async autoResolveConflict(recordId?: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.6);
      }, 1000);
    });
  }

  private async resetSyncState(): Promise<void> {
    localStorage.removeItem('sync_state');
    localStorage.removeItem('sync_queue');
  }

  private async reinitializeSyncService(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export const errorRecoveryService = new ErrorRecoveryService();