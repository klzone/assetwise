'use client';

import { useCallback, useEffect, useRef } from 'react';
import { errorHandler, logger } from '@/lib/services/error-handler.service';

interface PerformanceHookOptions {
  context?: string;
  threshold?: number; // 性能警告阈值（毫秒）
  autoLog?: boolean; // 是否自动记录性能日志
}

interface PerformanceTimer {
  start: () => void;
  end: (name?: string) => number;
  measure: <T>(fn: () => T, name?: string) => T;
  measureAsync: <T>(fn: () => Promise<T>, name?: string) => Promise<T>;
}

/**
 * 性能监控Hook
 * 提供便捷的性能测量和监控功能
 */
export function usePerformance(options: PerformanceHookOptions = {}): PerformanceTimer {
  const {
    context = 'usePerformance',
    threshold = 1000, // 默认1秒阈值
    autoLog = true,
  } = options;

  const startTimeRef = useRef<number | null>(null);
  // const timersRef = useRef<Map<string, number>>(new Map()); // 保留以备将来使用

  // 开始计时
  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  // 结束计时并返回耗时
  const end = useCallback((name?: string) => {
    const endTime = performance.now();
    const startTime = startTimeRef.current;
    
    if (startTime === null) {
      logger.warn('Performance timer end() called without start()', context);
      return 0;
    }

    const duration = endTime - startTime;
    startTimeRef.current = null;

    // 记录性能指标
    if (autoLog) {
      errorHandler.recordPerformance(
        name || 'unnamed-operation',
        duration,
        context
      );

      // 如果超过阈值，记录警告
      if (duration > threshold) {
        logger.warn(
          `Slow operation detected: ${name || 'unnamed-operation'} took ${duration.toFixed(2)}ms`,
          context,
          { duration, threshold }
        );
      }
    }

    return duration;
  }, [context, threshold, autoLog]);

  // 测量同步函数的执行时间
  const measure = useCallback(<T>(fn: () => T, name?: string): T => {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      
      if (autoLog) {
        errorHandler.recordPerformance(
          name || 'sync-function',
          duration,
          context
        );

        if (duration > threshold) {
          logger.warn(
            `Slow sync function: ${name || 'sync-function'} took ${duration.toFixed(2)}ms`,
            context,
            { duration, threshold }
          );
        }
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (autoLog) {
        errorHandler.recordPerformance(
          name || 'sync-function',
          duration,
          context,
          { error: true }
        );
      }
      
      throw error;
    }
  }, [context, threshold, autoLog]);

  // 测量异步函数的执行时间
  const measureAsync = useCallback(async <T>(fn: () => Promise<T>, name?: string): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      if (autoLog) {
        errorHandler.recordPerformance(
          name || 'async-function',
          duration,
          context
        );

        if (duration > threshold) {
          logger.warn(
            `Slow async function: ${name || 'async-function'} took ${duration.toFixed(2)}ms`,
            context,
            { duration, threshold }
          );
        }
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (autoLog) {
        errorHandler.recordPerformance(
          name || 'async-function',
          duration,
          context,
          { error: true }
        );
      }
      
      throw error;
    }
  }, [context, threshold, autoLog]);

  return {
    start,
    end,
    measure,
    measureAsync,
  };
}

/**
 * 页面加载性能监控Hook
 */
export function usePagePerformance(pageName: string) {
  const { measureAsync } = usePerformance({
    context: `page-${pageName}`,
    threshold: 2000, // 页面加载2秒阈值
  });

  useEffect(() => {
    // 记录页面加载开始
    const navigationStart = performance.timing?.navigationStart || Date.now();
    const loadStart = performance.now();

    logger.info(`Page load started: ${pageName}`, `page-${pageName}`);

    // 监听页面加载完成
    const handleLoad = () => {
      const loadEnd = performance.now();
      const loadDuration = loadEnd - loadStart;
      
      errorHandler.recordPerformance(
        `page-load-${pageName}`,
        loadDuration,
        `page-${pageName}`,
        {
          navigationStart,
          loadStart,
          loadEnd,
        }
      );

      logger.info(
        `Page loaded: ${pageName} in ${loadDuration.toFixed(2)}ms`,
        `page-${pageName}`,
        { loadDuration }
      );
    };

    // 如果页面已经加载完成
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad, { once: true });
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [pageName]);

  return { measureAsync };
}

/**
 * API请求性能监控Hook
 */
export function useApiPerformance() {
  const { measureAsync } = usePerformance({
    context: 'api-request',
    threshold: 3000, // API请求3秒阈值
  });

  const measureApiCall = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      endpoint: string,
      method: string = 'GET'
    ): Promise<T> => {
      return measureAsync(
        apiCall,
        `${method.toUpperCase()}-${endpoint}`
      );
    },
    [measureAsync]
  );

  return { measureApiCall };
}

/**
 * 组件渲染性能监控Hook
 */
export function useRenderPerformance(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRenderTimeRef.current;
    lastRenderTimeRef.current = currentTime;

    // 记录渲染性能
    errorHandler.recordPerformance(
      `render-${componentName}`,
      timeSinceLastRender,
      `component-${componentName}`,
      {
        renderCount: renderCountRef.current,
      }
    );

    // 如果渲染过于频繁，记录警告
    if (renderCountRef.current > 1 && timeSinceLastRender < 16) { // 少于一帧时间
      logger.warn(
        `Frequent re-render detected: ${componentName} rendered ${renderCountRef.current} times`,
        `component-${componentName}`,
        {
          renderCount: renderCountRef.current,
          timeSinceLastRender,
        }
      );
    }
  });

  return {
    renderCount: renderCountRef.current,
  };
}

export default usePerformance;
