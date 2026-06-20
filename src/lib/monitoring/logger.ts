/**
 * 结构化日志系统
 * 支持多级别日志记录、格式化输出和自动上报
 */

// 日志级别
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

// 日志记录接口
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  category?: string;
  data?: Record<string, any>;
  error?: Error;
  context?: {
    userId?: string;
    sessionId?: string;
    url?: string;
    userAgent?: string;
    component?: string;
    action?: string;
  };
  tags?: string[];
  duration?: number;
  metadata?: {
    source?: string;
    line?: number;
    column?: number;
    stack?: string;
  };
}

// 日志配置
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  apiKey?: string;
  maxStorageEntries: number;
  batchSize: number;
  flushInterval: number;
  enablePerformanceLogging: boolean;
  enableNetworkLogging: boolean;
  formatters?: {
    console?: (entry: LogEntry) => string;
    remote?: (entry: LogEntry) => any;
  };
  filters?: {
    categories?: string[];
    excludeCategories?: string[];
    enabledInProduction?: boolean;
  };
}

// 默认配置
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  enableConsole: true,
  enableStorage: true,
  enableRemote: process.env.NODE_ENV === 'production',
  maxStorageEntries: 1000,
  batchSize: 10,
  flushInterval: 30000, // 30秒
  enablePerformanceLogging: true,
  enableNetworkLogging: false,
  filters: {
    enabledInProduction: false,
  },
};

// 日志器类
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private storageKey = 'assetwise_logs';
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string;

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.setupFlushTimer();
    this.loadStoredLogs();
  }

  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * 记录TRACE级别日志
   */
  trace(message: string, data?: Record<string, any>, category?: string): void {
    this.log(LogLevel.TRACE, message, data, category);
  }

  /**
   * 记录DEBUG级别日志
   */
  debug(message: string, data?: Record<string, any>, category?: string): void {
    this.log(LogLevel.DEBUG, message, data, category);
  }

  /**
   * 记录INFO级别日志
   */
  info(message: string, data?: Record<string, any>, category?: string): void {
    this.log(LogLevel.INFO, message, data, category);
  }

  /**
   * 记录WARN级别日志
   */
  warn(message: string, data?: Record<string, any>, category?: string): void {
    this.log(LogLevel.WARN, message, data, category);
  }

  /**
   * 记录ERROR级别日志
   */
  error(message: string, error?: Error, data?: Record<string, any>, category?: string): void {
    this.log(LogLevel.ERROR, message, data, category, error);
  }

  /**
   * 记录FATAL级别日志
   */
  fatal(message: string, error?: Error, data?: Record<string, any>, category?: string): void {
    this.log(LogLevel.FATAL, message, data, category, error);
  }

  /**
   * 核心日志记录方法
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    category?: string,
    error?: Error
  ): void {
    // 级别过滤
    if (level < this.config.level) {
      return;
    }

    // 分类过滤
    if (!this.shouldLogCategory(category)) {
      return;
    }

    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      level,
      message,
      category,
      data,
      error,
      context: this.getContext(),
      metadata: this.getMetadata(),
    };

    // 控制台输出
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // 存储到本地
    if (this.config.enableStorage) {
      this.logToStorage(entry);
    }

    // 添加到缓冲区（用于远程发送）
    if (this.config.enableRemote) {
      this.logBuffer.push(entry);
      
      // 如果缓冲区达到批量大小，立即发送
      if (this.logBuffer.length >= this.config.batchSize) {
        this.flush();
      }
    }
  }

  /**
   * 控制台输出
   */
  private logToConsole(entry: LogEntry): void {
    const formatter = this.config.formatters?.console || this.defaultConsoleFormatter;
    const formatted = formatter(entry);
    
    const consoleMethod = this.getConsoleMethod(entry.level);
    const styles = this.getConsoleStyles(entry.level);
    
    if (entry.data) {
      consoleMethod(formatted, entry.data);
    } else {
      consoleMethod(formatted);
    }
    
    if (entry.error) {
      console.error(entry.error);
    }
  }

  /**
   * 存储到本地存储
   */
  private logToStorage(entry: LogEntry): void {
    try {
      const stored = this.getStoredLogs();
      stored.push(entry);
      
      // 限制存储数量
      if (stored.length > this.config.maxStorageEntries) {
        stored.splice(0, stored.length - this.config.maxStorageEntries);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(stored));
    } catch (error) {
      console.warn('Failed to store log entry:', error);
    }
  }

  /**
   * 刷新日志缓冲区
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.config.enableRemote) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.sendLogsToRemote(logsToSend);
    } catch (error) {
      console.error('Failed to send logs to remote:', error);
      // 如果发送失败，重新加入缓冲区
      this.logBuffer.unshift(...logsToSend);
    }
  }

  /**
   * 发送日志到远程服务器
   */
  private async sendLogsToRemote(logs: LogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) {
      throw new Error('Remote endpoint not configured');
    }

    const formatter = this.config.formatters?.remote || ((entry) => entry);
    const formattedLogs = logs.map(formatter);

    const response = await fetch(this.config.remoteEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify({
        logs: formattedLogs,
        metadata: {
          sessionId: this.sessionId,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Remote logging failed: ${response.status}`);
    }
  }

  /**
   * 计时器开始
   */
  time(label: string, category?: string): void {
    const key = `timer_${label}`;
    const startTime = performance.now();
    
    if (typeof window !== 'undefined') {
      (window as any)[key] = startTime;
    }
    
    this.debug(`Timer started: ${label}`, { startTime }, category || 'performance');
  }

  /**
   * 计时器结束
   */
  timeEnd(label: string, category?: string): number {
    const key = `timer_${label}`;
    const startTime = (window as any)?.[key];
    
    if (startTime === undefined) {
      this.warn(`Timer not found: ${label}`, undefined, category || 'performance');
      return 0;
    }
    
    const duration = performance.now() - startTime;
    delete (window as any)[key];
    
    this.info(`Timer ended: ${label}`, { duration }, category || 'performance');
    return duration;
  }

  /**
   * 异步函数计时装饰器
   */
  async timeAsync<T>(
    label: string,
    asyncFn: () => Promise<T>,
    category?: string
  ): Promise<T> {
    this.time(label, category);
    try {
      const result = await asyncFn();
      const duration = this.timeEnd(label, category);
      return result;
    } catch (error) {
      const duration = this.timeEnd(label, category);
      this.error(`Async operation failed: ${label}`, error as Error, { duration }, category);
      throw error;
    }
  }

  /**
   * 创建子日志器
   */
  child(context: Partial<LogEntry['context']>): ChildLogger {
    return new ChildLogger(this, context);
  }

  /**
   * 获取存储的日志
   */
  getStoredLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to get stored logs:', error);
      return [];
    }
  }

  /**
   * 清除存储的日志
   */
  clearStoredLogs(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear stored logs:', error);
    }
  }

  /**
   * 导出日志
   */
  exportLogs(): string {
    const logs = this.getStoredLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * 获取日志统计
   */
  getStats(): {
    totalLogs: number;
    bufferedLogs: number;
    logsByLevel: Record<string, number>;
    logsByCategory: Record<string, number>;
  } {
    const logs = this.getStoredLogs();
    const logsByLevel: Record<string, number> = {};
    const logsByCategory: Record<string, number> = {};

    logs.forEach(log => {
      const levelName = LogLevel[log.level];
      logsByLevel[levelName] = (logsByLevel[levelName] || 0) + 1;
      
      const category = log.category || 'uncategorized';
      logsByCategory[category] = (logsByCategory[category] || 0) + 1;
    });

    return {
      totalLogs: logs.length,
      bufferedLogs: this.logBuffer.length,
      logsByLevel,
      logsByCategory,
    };
  }

  // 私有方法
  private setupFlushTimer(): void {
    if (this.config.enableRemote && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  private loadStoredLogs(): void {
    // 在应用启动时可能需要发送之前存储的日志
    // 这里可以实现相关逻辑
  }

  private generateLogId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getContext(): LogEntry['context'] {
    return {
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
  }

  private getMetadata(): LogEntry['metadata'] {
    const error = new Error();
    const stack = error.stack;
    const stackLines = stack?.split('\n') || [];
    const callerLine = stackLines[4]; // 跳过当前方法的调用栈
    
    return {
      source: callerLine,
      stack,
    };
  }

  private shouldLogCategory(category?: string): boolean {
    const { categories, excludeCategories } = this.config.filters || {};
    
    if (excludeCategories?.includes(category || '')) {
      return false;
    }
    
    if (categories?.length && !categories.includes(category || '')) {
      return false;
    }
    
    return true;
  }

  private getConsoleMethod(level: LogLevel): Console['log'] {
    switch (level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private getConsoleStyles(level: LogLevel): string {
    switch (level) {
      case LogLevel.TRACE:
        return 'color: #6b7280;';
      case LogLevel.DEBUG:
        return 'color: #3b82f6;';
      case LogLevel.INFO:
        return 'color: #10b981;';
      case LogLevel.WARN:
        return 'color: #f59e0b;';
      case LogLevel.ERROR:
        return 'color: #ef4444;';
      case LogLevel.FATAL:
        return 'color: #dc2626; font-weight: bold;';
      default:
        return '';
    }
  }

  private defaultConsoleFormatter(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = LogLevel[entry.level].padEnd(5);
    const category = entry.category ? `[${entry.category}]` : '';
    
    return `${timestamp} ${level} ${category} ${entry.message}`;
  }

  // 清理资源
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // 发送剩余的日志
  }
}

// 子日志器类
export class ChildLogger {
  constructor(
    private parent: Logger,
    private context: Partial<LogEntry['context']>
  ) {}

  trace(message: string, data?: Record<string, any>, category?: string): void {
    this.log('trace', message, data, category);
  }

  debug(message: string, data?: Record<string, any>, category?: string): void {
    this.log('debug', message, data, category);
  }

  info(message: string, data?: Record<string, any>, category?: string): void {
    this.log('info', message, data, category);
  }

  warn(message: string, data?: Record<string, any>, category?: string): void {
    this.log('warn', message, data, category);
  }

  error(message: string, error?: Error, data?: Record<string, any>, category?: string): void {
    this.parent.error(this.formatMessage(message), error, { ...data, ...this.context }, category);
  }

  fatal(message: string, error?: Error, data?: Record<string, any>, category?: string): void {
    this.parent.fatal(this.formatMessage(message), error, { ...data, ...this.context }, category);
  }

  private log(
    method: 'trace' | 'debug' | 'info' | 'warn',
    message: string,
    data?: Record<string, any>,
    category?: string
  ): void {
    this.parent[method](this.formatMessage(message), { ...data, ...this.context }, category);
  }

  private formatMessage(message: string): string {
    const contextStr = this.context.component ? `[${this.context.component}] ` : '';
    return `${contextStr}${message}`;
  }
}

// React Hook
export function useLogger(context?: Partial<LogEntry['context']>) {
  const logger = Logger.getInstance();
  const childLogger = context ? logger.child(context) : logger;
  
  return {
    trace: childLogger.trace.bind(childLogger),
    debug: childLogger.debug.bind(childLogger),
    info: childLogger.info.bind(childLogger),
    warn: childLogger.warn.bind(childLogger),
    error: childLogger.error.bind(childLogger),
    fatal: childLogger.fatal.bind(childLogger),
    time: logger.time.bind(logger),
    timeEnd: logger.timeEnd.bind(logger),
    timeAsync: logger.timeAsync.bind(logger),
    getStats: logger.getStats.bind(logger),
  };
}

// 导出默认实例
export const logger = Logger.getInstance();"