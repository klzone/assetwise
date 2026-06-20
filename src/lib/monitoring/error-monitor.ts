/**
 * 错误监控系统
 * 实现全面的错误追踪、收集和上报
 */

import { useEffect, useCallback, useState } from 'react';

// 错误类型定义
export enum ErrorType {
  JAVASCRIPT = 'javascript',
  UNHANDLED_REJECTION = 'unhandled_rejection',
  NETWORK = 'network',
  BUSINESS = 'business',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  UI = 'ui',
}

// 错误严重级别
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 错误信息接口
export interface ErrorInfo {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  context?: Record<string, any>;
  tags?: string[];
  fingerprint?: string;
  breadcrumbs?: Breadcrumb[];
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  device?: {
    type: string;
    os: string;
    browser: string;
    viewport: { width: number; height: number };
  };
  performance?: {
    memory?: MemoryInfo;
    timing?: PerformanceTiming;
    navigation?: PerformanceNavigation;
  };
}

// 面包屑接口
export interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

// 错误监控配置
export interface ErrorMonitorConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  maxBreadcrumbs: number;
  enablePerformanceMonitoring: boolean;
  enableConsoleCapture: boolean;
  enableNetworkCapture: boolean;
  sampleRate: number;
  environment: string;
  release?: string;
  beforeSend?: (error: ErrorInfo) => ErrorInfo | null;
  allowUrls?: string[];
  denyUrls?: string[];
}

// 默认配置
const DEFAULT_CONFIG: ErrorMonitorConfig = {
  enabled: true,
  maxBreadcrumbs: 100,
  enablePerformanceMonitoring: true,
  enableConsoleCapture: true,
  enableNetworkCapture: true,
  sampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION,
};

// 错误监控类
export class ErrorMonitor {
  private static instance: ErrorMonitor;
  private config: ErrorMonitorConfig;
  private breadcrumbs: Breadcrumb[] = [];
  private sessionId: string;
  private isInitialized = false;
  private errorQueue: ErrorInfo[] = [];
  private isOnline = true;

  private constructor(config: Partial<ErrorMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
  }

  static getInstance(config?: Partial<ErrorMonitorConfig>): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor(config);
    }
    return ErrorMonitor.instance;
  }

  /**
   * 初始化错误监控
   */
  init(config?: Partial<ErrorMonitorConfig>): void {
    if (this.isInitialized) return;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (!this.config.enabled) return;

    this.setupGlobalErrorHandlers();
    this.setupUnhandledRejectionHandler();
    
    if (this.config.enableConsoleCapture) {
      this.setupConsoleCapture();
    }
    
    if (this.config.enableNetworkCapture) {
      this.setupNetworkCapture();
    }
    
    if (this.config.enablePerformanceMonitoring) {
      this.setupPerformanceMonitoring();
    }

    this.setupOnlineOfflineHandlers();
    this.setupVisibilityHandler();
    
    this.isInitialized = true;
    this.addBreadcrumb({
      category: 'system',
      message: 'Error monitor initialized',
      level: 'info',
    });
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandlers(): void {
    window.addEventListener('error', (event) => {
      const error: ErrorInfo = {
        id: this.generateErrorId(),
        type: ErrorType.JAVASCRIPT,
        severity: ErrorSeverity.HIGH,
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: event.filename || window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        context: {
          lineno: event.lineno,
          colno: event.colno,
          filename: event.filename,
        },
        fingerprint: this.generateFingerprint(event.message, event.filename),
        breadcrumbs: [...this.breadcrumbs],
        device: this.getDeviceInfo(),
        performance: this.getPerformanceInfo(),
      };

      this.captureError(error);
    });
  }

  /**
   * 设置未处理Promise拒绝处理器
   */
  private setupUnhandledRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      const error: ErrorInfo = {
        id: this.generateErrorId(),
        type: ErrorType.UNHANDLED_REJECTION,
        severity: ErrorSeverity.HIGH,
        message: String(event.reason),
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        context: {
          reason: event.reason,
        },
        fingerprint: this.generateFingerprint(String(event.reason)),
        breadcrumbs: [...this.breadcrumbs],
        device: this.getDeviceInfo(),
        performance: this.getPerformanceInfo(),
      };

      this.captureError(error);
    });
  }

  /**
   * 设置控制台捕获
   */
  private setupConsoleCapture(): void {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      this.addBreadcrumb({
        category: 'console',
        message: args.join(' '),
        level: 'error',
        data: { args },
      });
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      this.addBreadcrumb({
        category: 'console',
        message: args.join(' '),
        level: 'warning',
        data: { args },
      });
      originalConsoleWarn.apply(console, args);
    };
  }

  /**
   * 设置网络请求捕获
   */
  private setupNetworkCapture(): void {
    // 拦截fetch请求
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        this.addBreadcrumb({
          category: 'http',
          message: `${args[1]?.method || 'GET'} ${url}`,
          level: response.ok ? 'info' : 'warning',
          data: {
            url,
            method: args[1]?.method || 'GET',
            status: response.status,
            duration,
          },
        });
        
        // 捕获网络错误
        if (!response.ok) {
          this.captureError({
            id: this.generateErrorId(),
            type: ErrorType.NETWORK,
            severity: ErrorSeverity.MEDIUM,
            message: `Network request failed: ${response.status} ${response.statusText}`,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            sessionId: this.sessionId,
            context: {
              requestUrl: url,
              method: args[1]?.method || 'GET',
              status: response.status,
              statusText: response.statusText,
              duration,
            },
            fingerprint: this.generateFingerprint(`network_${response.status}_${url}`),
            breadcrumbs: [...this.breadcrumbs],
            device: this.getDeviceInfo(),
          });
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.addBreadcrumb({
          category: 'http',
          message: `${args[1]?.method || 'GET'} ${url} failed`,
          level: 'error',
          data: {
            url,
            method: args[1]?.method || 'GET',
            error: String(error),
            duration,
          },
        });
        
        this.captureError({
          id: this.generateErrorId(),
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.HIGH,
          message: `Network request failed: ${error}`,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          context: {
            requestUrl: url,
            method: args[1]?.method || 'GET',
            error: String(error),
            duration,
          },
          fingerprint: this.generateFingerprint(`network_error_${url}`),
          breadcrumbs: [...this.breadcrumbs],
          device: this.getDeviceInfo(),
        });
        
        throw error;
      }
    };
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    // 监控长任务
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // 超过50ms的任务
              this.addBreadcrumb({
                category: 'performance',
                message: `Long task detected: ${entry.duration.toFixed(2)}ms`,
                level: 'warning',
                data: {
                  duration: entry.duration,
                  startTime: entry.startTime,
                },
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // PerformanceObserver不支持longtask
      }
    }
  }

  /**
   * 设置在线/离线状态监听
   */
  private setupOnlineOfflineHandlers(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.addBreadcrumb({
        category: 'system',
        message: 'Network connection restored',
        level: 'info',
      });
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.addBreadcrumb({
        category: 'system',
        message: 'Network connection lost',
        level: 'warning',
      });
    });
  }

  /**
   * 设置页面可见性监听
   */
  private setupVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      const state = document.visibilityState;
      this.addBreadcrumb({
        category: 'system',
        message: `Page visibility changed to ${state}`,
        level: 'info',
        data: { visibilityState: state },
      });
    });
  }

  /**
   * 捕获错误
   */
  captureError(error: Partial<ErrorInfo>): void {
    if (!this.config.enabled) return;

    // 采样率检查
    if (Math.random() > this.config.sampleRate) return;

    const completeError: ErrorInfo = {
      id: this.generateErrorId(),
      type: ErrorType.BUSINESS,
      severity: ErrorSeverity.MEDIUM,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      breadcrumbs: [...this.breadcrumbs],
      device: this.getDeviceInfo(),
      ...error,
    };

    // URL过滤
    if (this.shouldIgnoreUrl(completeError.url)) return;

    // 自定义处理
    const processedError = this.config.beforeSend ? this.config.beforeSend(completeError) : completeError;
    if (!processedError) return;

    // 发送错误
    if (this.isOnline) {
      this.sendError(processedError);
    } else {
      this.errorQueue.push(processedError);
    }

    // 添加面包屑
    this.addBreadcrumb({
      category: 'error',
      message: `${processedError.type}: ${processedError.message}`,
      level: 'error',
      data: {
        errorId: processedError.id,
        severity: processedError.severity,
      },
    });
  }

  /**
   * 添加面包屑
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const completeBreadcrumb: Breadcrumb = {
      timestamp: Date.now(),
      ...breadcrumb,
    };

    this.breadcrumbs.push(completeBreadcrumb);

    // 限制面包屑数量
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }
  }

  /**
   * 设置用户信息
   */
  setUser(user: ErrorInfo['user']): void {
    this.addBreadcrumb({
      category: 'system',
      message: 'User information updated',
      level: 'info',
      data: { userId: user?.id },
    });
  }

  /**
   * 设置标签
   */
  setTag(key: string, value: string): void {
    // 实现标签设置逻辑
  }

  /**
   * 设置上下文
   */
  setContext(key: string, context: any): void {
    // 实现上下文设置逻辑
  }

  /**
   * 发送错误到服务器
   */
  private async sendError(error: ErrorInfo): Promise<void> {
    if (!this.config.endpoint || !this.config.apiKey) {
      console.warn('[ErrorMonitor] No endpoint or API key configured');
      return;
    }

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(error),
      });
    } catch (e) {
      console.error('[ErrorMonitor] Failed to send error:', e);
      // 如果发送失败，添加到队列中稍后重试
      this.errorQueue.push(error);
    }
  }

  /**
   * 刷新错误队列
   */
  private async flushErrorQueue(): Promise<void> {
    if (!this.isOnline || this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const error of errors) {
      try {
        await this.sendError(error);
      } catch (e) {
        // 如果还是失败，重新加入队列
        this.errorQueue.push(error);
      }
    }
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成错误指纹
   */
  private generateFingerprint(...parts: string[]): string {
    return parts.join('|');
  }

  /**
   * 获取设备信息
   */
  private getDeviceInfo(): ErrorInfo['device'] {
    const userAgent = navigator.userAgent;
    
    return {
      type: /Mobile|Android|iOS/.test(userAgent) ? 'mobile' : 'desktop',
      os: this.getOS(userAgent),
      browser: this.getBrowser(userAgent),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  /**
   * 获取操作系统
   */
  private getOS(userAgent: string): string {
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Mac OS X/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    if (/Android/.test(userAgent)) return 'Android';
    if (/iOS/.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  /**
   * 获取浏览器
   */
  private getBrowser(userAgent: string): string {
    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Safari/.test(userAgent)) return 'Safari';
    if (/Edge/.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  /**
   * 获取性能信息
   */
  private getPerformanceInfo(): ErrorInfo['performance'] {
    if (!('performance' in window)) return undefined;

    return {
      memory: (performance as any).memory,
      timing: performance.timing,
      navigation: performance.navigation,
    };
  }

  /**
   * 检查是否应该忽略URL
   */
  private shouldIgnoreUrl(url: string): boolean {
    if (this.config.allowUrls?.length) {
      return !this.config.allowUrls.some(pattern => new RegExp(pattern).test(url));
    }

    if (this.config.denyUrls?.length) {
      return this.config.denyUrls.some(pattern => new RegExp(pattern).test(url));
    }

    return false;
  }

  /**
   * 获取错误统计
   */
  getStats(): {
    sessionId: string;
    breadcrumbsCount: number;
    queuedErrorsCount: number;
    isOnline: boolean;
  } {
    return {
      sessionId: this.sessionId,
      breadcrumbsCount: this.breadcrumbs.length,
      queuedErrorsCount: this.errorQueue.length,
      isOnline: this.isOnline,
    };
  }
}

// 错误监控Hook
export function useErrorMonitor(config?: Partial<ErrorMonitorConfig>) {
  const [monitor] = useState(() => ErrorMonitor.getInstance(config));
  const [stats, setStats] = useState(monitor.getStats());

  useEffect(() => {
    monitor.init(config);
    
    const interval = setInterval(() => {
      setStats(monitor.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [monitor, config]);

  const captureError = useCallback((error: Error | string, context?: Record<string, any>) => {
    monitor.captureError({
      type: ErrorType.BUSINESS,
      severity: ErrorSeverity.MEDIUM,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
    });
  }, [monitor]);

  const addBreadcrumb = useCallback((breadcrumb: Omit<Breadcrumb, 'timestamp'>) => {
    monitor.addBreadcrumb(breadcrumb);
  }, [monitor]);

  return {
    captureError,
    addBreadcrumb,
    setUser: monitor.setUser.bind(monitor),
    setTag: monitor.setTag.bind(monitor),
    setContext: monitor.setContext.bind(monitor),
    stats,
  };
}

// 导出默认实例
export const errorMonitor = ErrorMonitor.getInstance();"