/**
 * 简单的日志工具
 * 提供统一的日志记录接口
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // 最多保存1000条日志

  /**
   * 记录调试信息
   */
  debug(message: string, context?: string, data?: any): void {
    this.log('debug', message, context, data);
  }

  /**
   * 记录一般信息
   */
  info(message: string, context?: string, data?: any): void {
    this.log('info', message, context, data);
  }

  /**
   * 记录警告信息
   */
  warn(message: string, context?: string, data?: any): void {
    this.log('warn', message, context, data);
  }

  /**
   * 记录错误信息
   */
  error(message: string, context?: string, data?: any): void {
    this.log('error', message, context, data);
  }

  /**
   * 内部日志记录方法
   */
  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data
    };

    // 添加到内存日志
    this.logs.push(entry);
    
    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 在开发环境中输出到控制台
    if (this.isDevelopment || typeof window !== 'undefined') {
      this.outputToConsole(entry);
    }
  }

  /**
   * 输出到浏览器控制台
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toLocaleTimeString();
    const contextStr = entry.context ? `[${entry.context}]` : '';
    const logMessage = `${timestamp} ${contextStr} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(logMessage, entry.data || '');
        break;
      case 'info':
        console.info(logMessage, entry.data || '');
        break;
      case 'warn':
        console.warn(logMessage, entry.data || '');
        break;
      case 'error':
        console.error(logMessage, entry.data || '');
        break;
    }
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取指定级别的日志
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 获取指定上下文的日志
   */
  getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter(log => log.context === context);
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 导出日志为JSON字符串
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 获取日志统计信息
   */
  getLogStats(): { [key in LogLevel]: number } {
    const stats = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };

    this.logs.forEach(log => {
      stats[log.level]++;
    });

    return stats;
  }
}

// 导出单例实例
export const logger = new Logger();

// 导出类型
export type { Logger };
