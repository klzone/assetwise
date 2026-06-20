/**
 * 高级缓存系统
 * 实现数据缓存、请求去重、智能预取等功能
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// 缓存项接口
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // 生存时间（毫秒）
  lastAccessed: number;
  accessCount: number;
}

// 缓存配置
interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  enableLRU: boolean;
}

// 默认配置
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5分钟
  cleanupInterval: 60 * 1000, // 1分钟
  enableLRU: true,
};

// 内存缓存类
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanup();
  }

  /**
   * 设置缓存项
   */
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.config.defaultTTL,
      lastAccessed: now,
      accessCount: 0,
    };

    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, item);
  }

  /**
   * 获取缓存项
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    const now = Date.now();
    
    // 检查是否过期
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问信息
    item.lastAccessed = now;
    item.accessCount++;

    return item.data;
  }

  /**
   * 检查缓存是否存在且有效
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    items: Array<{ key: string; accessCount: number; age: number }>
  } {
    const now = Date.now();
    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      accessCount: item.accessCount,
      age: now - item.timestamp,
    }));

    const totalAccess = items.reduce((sum, item) => sum + item.accessCount, 0);
    const validItems = items.filter(item => item.accessCount > 0);
    const hitRate = validItems.length > 0 ? (totalAccess - validItems.length) / totalAccess : 0;

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate,
      items,
    };
  }

  /**
   * LRU淘汰策略
   */
  private evictLRU(): void {
    if (!this.config.enableLRU || this.cache.size === 0) {
      return;
    }

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 清理过期项
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 开始清理定时器
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * 销毁缓存
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}

// 全局缓存实例
const globalCache = new MemoryCache();

// 请求去重管理器
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * 执行去重请求
   */
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // 如果已有相同请求在进行中，直接返回
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // 创建新请求
    const promise = requestFn()
      .finally(() => {
        // 请求完成后清理
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * 取消请求
   */
  cancel(key: string): void {
    this.pendingRequests.delete(key);
  }

  /**
   * 清空所有请求
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}

const requestDeduplicator = new RequestDeduplicator();

// 智能数据获取Hook
interface UseSmartFetchOptions<T> {
  cacheKey?: string;
  cacheTTL?: number;
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  retry?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  transform?: (data: any) => T;
}

export function useSmartFetch<T>(
  fetcher: () => Promise<T>,
  options: UseSmartFetchOptions<T> = {}
) {
  const {
    cacheKey,
    cacheTTL,
    enabled = true,
    refetchOnWindowFocus = true,
    refetchInterval,
    retry = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    transform,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const retryCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 生成缓存键
  const effectiveCacheKey = cacheKey || `fetch_${JSON.stringify(fetcher.toString())}`;

  // 执行请求
  const executeRequest = useCallback(async () => {
    if (!enabled) return;

    // 检查缓存
    if (cacheKey) {
      const cachedData = globalCache.get(effectiveCacheKey);
      if (cachedData) {
        setData(cachedData);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // 使用请求去重
      const rawData = await requestDeduplicator.deduplicate(
        effectiveCacheKey,
        fetcher
      );

      const transformedData = transform ? transform(rawData) : rawData;

      // 缓存数据
      if (cacheKey) {
        globalCache.set(effectiveCacheKey, transformedData, cacheTTL);
      }

      setData(transformedData);
      retryCountRef.current = 0;
      onSuccess?.(transformedData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      // 重试逻辑
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        setTimeout(() => {
          executeRequest();
        }, retryDelay * Math.pow(2, retryCountRef.current - 1)); // 指数退避
      } else {
        setError(error);
        onError?.(error);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, effectiveCacheKey, cacheKey, cacheTTL, fetcher, transform, retry, retryDelay, onSuccess, onError]);

  // 手动刷新
  const refetch = useCallback(() => {
    if (cacheKey) {
      globalCache.delete(effectiveCacheKey);
    }
    return executeRequest();
  }, [effectiveCacheKey, cacheKey, executeRequest]);

  // 初始加载
  useEffect(() => {
    executeRequest();
  }, [executeRequest]);

  // 定时刷新
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(executeRequest, refetchInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, executeRequest]);

  // 窗口焦点刷新
  useEffect(() => {
    if (refetchOnWindowFocus && enabled) {
      const handleFocus = () => {
        executeRequest();
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [refetchOnWindowFocus, enabled, executeRequest]);

  return {
    data,
    loading,
    error,
    refetch,
    isSuccess: !loading && !error && data !== null,
    isError: !loading && error !== null,
  };
}

// 批量数据获取Hook
export function useBatchFetch<T>(
  requests: Array<{
    key: string;
    fetcher: () => Promise<T>;
    options?: UseSmartFetchOptions<T>;
  }>
) {
  const [results, setResults] = useState<Record<string, {
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>>({});

  // 初始化结果状态
  useEffect(() => {
    const initialResults: typeof results = {};
    requests.forEach(({ key }) => {
      initialResults[key] = {
        data: null,
        loading: true,
        error: null,
      };
    });
    setResults(initialResults);
  }, [requests]);

  // 执行批量请求
  useEffect(() => {
    const executeRequests = async () => {
      const promises = requests.map(async ({ key, fetcher, options = {} }) => {
        try {
          // 检查缓存
          const cacheKey = options.cacheKey || `batch_${key}`;
          const cachedData = globalCache.get(cacheKey);
          
          let data: T;
          if (cachedData) {
            data = cachedData;
          } else {
            data = await requestDeduplicator.deduplicate(cacheKey, fetcher);
            if (options.cacheKey) {
              globalCache.set(cacheKey, data, options.cacheTTL);
            }
          }

          return { key, data, error: null };
        } catch (error) {
          return {
            key,
            data: null,
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      });

      const results = await Promise.allSettled(promises);
      
      setResults(prev => {
        const newResults = { ...prev };
        results.forEach((result, index) => {
          const { key } = requests[index];
          if (result.status === 'fulfilled') {
            newResults[key] = {
              data: result.value.data,
              loading: false,
              error: result.value.error,
            };
          } else {
            newResults[key] = {
              data: null,
              loading: false,
              error: new Error(result.reason),
            };
          }
        });
        return newResults;
      });
    };

    executeRequests();
  }, [requests]);

  return results;
}

// 预取管理器
class PrefetchManager {
  private prefetchQueue = new Set<string>();
  private maxConcurrent = 3;
  private currentFetching = 0;

  /**
   * 添加预取任务
   */
  prefetch<T>(key: string, fetcher: () => Promise<T>, options: { ttl?: number } = {}): void {
    if (this.prefetchQueue.has(key) || globalCache.has(key)) {
      return;
    }

    this.prefetchQueue.add(key);
    this.processPrefetchQueue(key, fetcher, options);
  }

  /**
   * 处理预取队列
   */
  private async processPrefetchQueue<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number }
  ): Promise<void> {
    if (this.currentFetching >= this.maxConcurrent) {
      return;
    }

    this.currentFetching++;

    try {
      const data = await fetcher();
      globalCache.set(key, data, options.ttl);
    } catch (error) {
      console.warn(`Prefetch failed for key: ${key}`, error);
    } finally {
      this.prefetchQueue.delete(key);
      this.currentFetching--;
    }
  }

  /**
   * 清空预取队列
   */
  clear(): void {
    this.prefetchQueue.clear();
  }
}

const prefetchManager = new PrefetchManager();

// 导出工具函数
export {
  globalCache,
  requestDeduplicator,
  prefetchManager,
};"