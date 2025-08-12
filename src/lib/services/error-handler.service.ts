/**
 * 全局错误处理和日志服务
 * 提供统一的错误处理、日志记录和性能监控功能
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  userId?: number;
  sessionId?: string;
  stack?: string;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: Error;
  context: string;
  userId?: number;
  userAgent?: string;
  url?: string;
  additionalData?: any;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  context?: string;
  metadata?: any;
}

class ErrorHandlerService {
  private logs: LogEntry[] = [];
  private errorReports: ErrorReport[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private maxLogEntries = 1000;
  private maxErrorReports = 100;
  private maxPerformanceMetrics = 500;

  /**
   * 记录日志
   */
  log(level: LogLevel, message: string, context?: string, data?: any, userId?: number): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data,
      userId,
      sessionId: this.getSessionId(),
    };

    this.logs.push(entry);
    this.trimLogs();

    // 在开发环境中输出到控制台
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(entry);
    }

    // 错误级别的日志需要特殊处理
    if (level >= LogLevel.ERROR) {
      this.handleErrorLog(entry);
    }
  }

  /**
   * 便捷的日志方法
   */
  debug(message: string, context?: string, data?: any, userId?: number): void {
    this.log(LogLevel.DEBUG, message, context, data, userId);
  }

  info(message: string, context?: string, data?: any, userId?: number): void {
    this.log(LogLevel.INFO, message, context, data, userId);
  }

  warn(message: string, context?: string, data?: any, userId?: number): void {
    this.log(LogLevel.WARN, message, context, data, userId);
  }

  error(message: string, context?: string, data?: any, userId?: number): void {
    this.log(LogLevel.ERROR, message, context, data, userId);
  }

  fatal(message: string, context?: string, data?: any, userId?: number): void {
    this.log(LogLevel.FATAL, message, context, data, userId);
  }

  /**
   * 报告错误
   */
  reportError(error: Error, context: string, userId?: number, additionalData?: any): string {
    const errorId = this.generateErrorId();
    const report: ErrorReport = {
      id: errorId,
      timestamp: new Date(),
      error,
      context,
      userId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server',
      additionalData,
    };

    this.errorReports.push(report);
    this.trimErrorReports();

    // 记录错误日志
    this.error(
      `Error reported: ${error.message}`,
      context,
      {
        errorId,
        stack: error.stack,
        additionalData,
      },
      userId
    );

    return errorId;
  }

  /**
   * 记录性能指标
   */
  recordPerformance(name: string, duration: number, context?: string, metadata?: any): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      context,
      metadata,
    };

    this.performanceMetrics.push(metric);
    this.trimPerformanceMetrics();

    // 如果性能较差，记录警告
    if (duration > 5000) { // 超过5秒
      this.warn(
        `Slow performance detected: ${name} took ${duration}ms`,
        context,
        metadata
      );
    }
  }

  /**
   * 性能监控装饰器
   */
  measurePerformance<T extends (...args: any[]) => any>(
    fn: T,
    name: string,
    context?: string
  ): T {
    return ((...args: any[]) => {
      const start = performance.now();
      try {
        const result = fn(...args);
        
        // 处理异步函数
        if (result instanceof Promise) {
          return result.finally(() => {
            const duration = performance.now() - start;
            this.recordPerformance(name, duration, context);
          });
        } else {
          const duration = performance.now() - start;
          this.recordPerformance(name, duration, context);
          return result;
        }
      } catch (error) {
        const duration = performance.now() - start;
        this.recordPerformance(name, duration, context, { error: true });
        throw error;
      }
    }) as T;
  }

  /**
   * 获取日志
   */
  getLogs(level?: LogLevel, context?: string, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }

    if (context) {
      filteredLogs = filteredLogs.filter(log => log.context === context);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 获取错误报告
   */
  getErrorReports(limit?: number): ErrorReport[] {
    const reports = limit ? this.errorReports.slice(-limit) : this.errorReports;
    return reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(name?: string, limit?: number): PerformanceMetric[] {
    let metrics = this.performanceMetrics;

    if (name) {
      metrics = metrics.filter(metric => metric.name === name);
    }

    if (limit) {
      metrics = metrics.slice(-limit);
    }

    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 清理日志
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 清理错误报告
   */
  clearErrorReports(): void {
    this.errorReports = [];
  }

  /**
   * 清理性能指标
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics = [];
  }

  /**
   * 导出日志数据
   */
  exportLogs(): {
    logs: LogEntry[];
    errorReports: ErrorReport[];
    performanceMetrics: PerformanceMetric[];
  } {
    return {
      logs: this.logs,
      errorReports: this.errorReports,
      performanceMetrics: this.performanceMetrics,
    };
  }

  // 私有方法
  private consoleLog(entry: LogEntry): void {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    const levelColors = ['#888', '#007acc', '#ff8c00', '#ff4444', '#cc0000'];
    
    const timestamp = entry.timestamp.toISOString();
    const level = levelNames[entry.level];
    const color = levelColors[entry.level];
    
    const message = `[${timestamp}] ${level}: ${entry.message}`;
    
    if (entry.level >= LogLevel.ERROR) {
      console.error(`%c${message}`, `color: ${color}`, entry.data);
    } else if (entry.level === LogLevel.WARN) {
      console.warn(`%c${message}`, `color: ${color}`, entry.data);
    } else {
      console.log(`%c${message}`, `color: ${color}`, entry.data);
    }
  }

  private handleErrorLog(entry: LogEntry): void {
    // 在生产环境中，可以发送到外部日志服务
    if (process.env.NODE_ENV === 'production') {
      // TODO: 发送到外部日志服务 (如 Sentry, LogRocket 等)
    }
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('assetwise_session_id');
      if (!sessionId) {
        sessionId = this.generateSessionId();
        sessionStorage.setItem('assetwise_session_id', sessionId);
      }
      return sessionId;
    }
    return 'server-session';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private trimLogs(): void {
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }
  }

  private trimErrorReports(): void {
    if (this.errorReports.length > this.maxErrorReports) {
      this.errorReports = this.errorReports.slice(-this.maxErrorReports);
    }
  }

  private trimPerformanceMetrics(): void {
    if (this.performanceMetrics.length > this.maxPerformanceMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxPerformanceMetrics);
    }
  }
}

// 导出单例实例
export const errorHandler = new ErrorHandlerService();

// 导出便捷的全局函数
export const logger = {
  debug: (message: string, context?: string, data?: any, userId?: number) =>
    errorHandler.debug(message, context, data, userId),
  info: (message: string, context?: string, data?: any, userId?: number) =>
    errorHandler.info(message, context, data, userId),
  warn: (message: string, context?: string, data?: any, userId?: number) =>
    errorHandler.warn(message, context, data, userId),
  error: (message: string, context?: string, data?: any, userId?: number) =>
    errorHandler.error(message, context, data, userId),
  fatal: (message: string, context?: string, data?: any, userId?: number) =>
    errorHandler.fatal(message, context, data, userId),
};

export default errorHandler;
