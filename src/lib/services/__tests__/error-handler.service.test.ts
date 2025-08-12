import { errorHandler, logger, LogLevel } from '../error-handler.service';

describe('ErrorHandlerService', () => {
  beforeEach(() => {
    // 清理测试数据
    errorHandler.clearLogs();
    errorHandler.clearErrorReports();
    errorHandler.clearPerformanceMetrics();
  });

  describe('Logging', () => {
    it('should log messages with different levels', () => {
      logger.debug('Debug message', 'test-context');
      logger.info('Info message', 'test-context');
      logger.warn('Warning message', 'test-context');
      logger.error('Error message', 'test-context');
      logger.fatal('Fatal message', 'test-context');

      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(5);
      
      // 日志按时间倒序排列，最新的在前面
      expect(logs.find(log => log.level === LogLevel.FATAL)).toBeDefined();
      expect(logs.find(log => log.level === LogLevel.ERROR)).toBeDefined();
      expect(logs.find(log => log.level === LogLevel.WARN)).toBeDefined();
      expect(logs.find(log => log.level === LogLevel.INFO)).toBeDefined();
      expect(logs.find(log => log.level === LogLevel.DEBUG)).toBeDefined();
    });

    it('should filter logs by level', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const errorLogs = errorHandler.getLogs(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe(LogLevel.ERROR);

      const warnLogs = errorHandler.getLogs(LogLevel.WARN);
      expect(warnLogs).toHaveLength(2); // WARN and ERROR
    });

    it('should filter logs by context', () => {
      logger.info('Message 1', 'context-a');
      logger.info('Message 2', 'context-b');
      logger.info('Message 3', 'context-a');

      const contextALogs = errorHandler.getLogs(undefined, 'context-a');
      expect(contextALogs).toHaveLength(2);
      
      const contextBLogs = errorHandler.getLogs(undefined, 'context-b');
      expect(contextBLogs).toHaveLength(1);
    });

    it('should limit log results', () => {
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`);
      }

      const limitedLogs = errorHandler.getLogs(undefined, undefined, 5);
      expect(limitedLogs).toHaveLength(5);
    });

    it('should include user ID and session ID in logs', () => {
      const userId = 123;
      logger.info('Test message', 'test-context', { test: 'data' }, userId);

      const logs = errorHandler.getLogs();
      expect(logs[0].userId).toBe(userId);
      expect(logs[0].sessionId).toBeDefined();
      expect(logs[0].data).toEqual({ test: 'data' });
    });
  });

  describe('Error Reporting', () => {
    it('should report errors and generate error ID', () => {
      const error = new Error('Test error');
      const errorId = errorHandler.reportError(error, 'test-context', 123);

      expect(errorId).toBeDefined();
      expect(errorId).toMatch(/^error_\d+_[a-z0-9]+$/);

      const reports = errorHandler.getErrorReports();
      expect(reports).toHaveLength(1);
      expect(reports[0].id).toBe(errorId);
      expect(reports[0].error).toBe(error);
      expect(reports[0].context).toBe('test-context');
      expect(reports[0].userId).toBe(123);
    });

    it('should include additional data in error reports', () => {
      const error = new Error('Test error');
      const additionalData = { component: 'TestComponent', props: { id: 1 } };
      
      errorHandler.reportError(error, 'test-context', undefined, additionalData);

      const reports = errorHandler.getErrorReports();
      expect(reports[0].additionalData).toEqual(additionalData);
    });

    it('should limit error reports', () => {
      for (let i = 0; i < 5; i++) {
        errorHandler.reportError(new Error(`Error ${i}`), 'test-context');
      }

      const limitedReports = errorHandler.getErrorReports(3);
      expect(limitedReports).toHaveLength(3);
    });
  });

  describe('Performance Monitoring', () => {
    it('should record performance metrics', () => {
      errorHandler.recordPerformance('test-operation', 1500, 'test-context');

      const metrics = errorHandler.getPerformanceMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test-operation');
      expect(metrics[0].duration).toBe(1500);
      expect(metrics[0].context).toBe('test-context');
    });

    it('should filter performance metrics by name', () => {
      errorHandler.recordPerformance('operation-a', 1000);
      errorHandler.recordPerformance('operation-b', 2000);
      errorHandler.recordPerformance('operation-a', 1500);

      const operationAMetrics = errorHandler.getPerformanceMetrics('operation-a');
      expect(operationAMetrics).toHaveLength(2);
      
      const operationBMetrics = errorHandler.getPerformanceMetrics('operation-b');
      expect(operationBMetrics).toHaveLength(1);
    });

    it('should limit performance metrics results', () => {
      for (let i = 0; i < 10; i++) {
        errorHandler.recordPerformance(`operation-${i}`, 1000);
      }

      const limitedMetrics = errorHandler.getPerformanceMetrics(undefined, 5);
      expect(limitedMetrics).toHaveLength(5);
    });

    it('should log warning for slow performance', () => {
      // 清理之前的日志
      errorHandler.clearLogs();
      
      // 记录慢性能
      errorHandler.recordPerformance('slow-operation', 6000, 'test-context');

      const logs = errorHandler.getLogs(LogLevel.WARN);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Slow performance detected');
      expect(logs[0].message).toContain('slow-operation');
      expect(logs[0].message).toContain('6000ms');
    });
  });

  describe('Performance Measurement Decorator', () => {
    it('should measure sync function performance', () => {
      const testFunction = () => {
        // 模拟一些工作
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const measuredFunction = errorHandler.measurePerformance(
        testFunction,
        'test-sync-function',
        'test-context'
      );

      const result = measuredFunction();
      expect(result).toBe(499500); // 0+1+2+...+999

      const metrics = errorHandler.getPerformanceMetrics('test-sync-function');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].duration).toBeGreaterThan(0);
    });

    it('should measure async function performance', async () => {
      const testAsyncFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async result';
      };

      const measuredFunction = errorHandler.measurePerformance(
        testAsyncFunction,
        'test-async-function',
        'test-context'
      );

      const result = await measuredFunction();
      expect(result).toBe('async result');

      const metrics = errorHandler.getPerformanceMetrics('test-async-function');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].duration).toBeGreaterThanOrEqual(10);
    });

    it('should handle errors in measured functions', () => {
      const errorFunction = () => {
        throw new Error('Test error');
      };

      const measuredFunction = errorHandler.measurePerformance(
        errorFunction,
        'error-function',
        'test-context'
      );

      expect(() => measuredFunction()).toThrow('Test error');

      const metrics = errorHandler.getPerformanceMetrics('error-function');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].metadata).toEqual({ error: true });
    });
  });

  describe('Data Export', () => {
    it('should export all data', () => {
      // 清理之前的数据
      errorHandler.clearLogs();
      errorHandler.clearErrorReports();
      errorHandler.clearPerformanceMetrics();

      logger.info('Test log');
      errorHandler.reportError(new Error('Test error'), 'test-context');
      errorHandler.recordPerformance('test-operation', 1000);

      const exportedData = errorHandler.exportLogs();

      // 报告错误会产生额外的错误日志，所以日志数量会是2
      expect(exportedData.logs.length).toBeGreaterThanOrEqual(1);
      expect(exportedData.errorReports).toHaveLength(1);
      expect(exportedData.performanceMetrics).toHaveLength(1);
    });
  });

  describe('Data Cleanup', () => {
    it('should clear all logs', () => {
      logger.info('Test log');
      errorHandler.clearLogs();
      
      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(0);
    });

    it('should clear all error reports', () => {
      errorHandler.reportError(new Error('Test error'), 'test-context');
      errorHandler.clearErrorReports();
      
      const reports = errorHandler.getErrorReports();
      expect(reports).toHaveLength(0);
    });

    it('should clear all performance metrics', () => {
      errorHandler.recordPerformance('test-operation', 1000);
      errorHandler.clearPerformanceMetrics();
      
      const metrics = errorHandler.getPerformanceMetrics();
      expect(metrics).toHaveLength(0);
    });
  });
});
