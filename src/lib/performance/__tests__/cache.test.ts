/**
 * 缓存系统单元测试
 */

import {
  MemoryCache,
  useSmartFetch,
  useBatchFetch,
  globalCache,
  requestDeduplicator,
  prefetchManager,
} from '@/lib/performance/cache';
import { TestDataFactory, TestEnvironment, MockFactory } from '@/lib/testing/test-utils';
import { renderHook, waitFor } from '@testing-library/react';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    TestEnvironment.setup();
    cache = new MemoryCache({
      maxSize: 5,
      defaultTTL: 1000, // 1秒
      cleanupInterval: 100, // 100ms
    });
  });

  afterEach(() => {
    cache.destroy();
    TestEnvironment.cleanup();
  });

  describe('基本操作', () => {
    it('应该能够设置和获取缓存项', () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      cache.set(key, value);
      const result = cache.get(key);

      expect(result).toEqual(value);
    });

    it('应该正确检查缓存项是否存在', () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      expect(cache.has(key)).toBe(false);
      
      cache.set(key, value);
      expect(cache.has(key)).toBe(true);
    });

    it('应该能够删除缓存项', () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      cache.set(key, value);
      expect(cache.has(key)).toBe(true);

      const deleted = cache.delete(key);
      expect(deleted).toBe(true);
      expect(cache.has(key)).toBe(false);
    });

    it('应该能够清空所有缓存', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);

      cache.clear();
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('TTL（生存时间）', () => {
    it('应该在TTL过期后自动删除缓存项', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      cache.set(key, value, 50); // 50ms TTL
      expect(cache.has(key)).toBe(true);

      // 等待TTL过期
      await TestEnvironment.waitFor(60);
      expect(cache.has(key)).toBe(false);
    });

    it('应该在TTL内保持缓存项有效', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      cache.set(key, value, 100); // 100ms TTL
      expect(cache.has(key)).toBe(true);

      // 在TTL内检查
      await TestEnvironment.waitFor(50);
      expect(cache.has(key)).toBe(true);
    });
  });

  describe('LRU淘汰策略', () => {
    it('应该在达到最大容量时淘汰最久未访问的项', () => {
      // 填满缓存
      for (let i = 0; i < 5; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      // 访问一些项以更新访问时间
      cache.get('key1');
      cache.get('key3');

      // 添加新项，应该淘汰最久未访问的项
      cache.set('key5', 'value5');

      // key0和key2应该被淘汰（最久未访问）
      expect(cache.has('key0')).toBe(false);
      expect(cache.has('key1')).toBe(true); // 最近访问过
      expect(cache.has('key3')).toBe(true); // 最近访问过
      expect(cache.has('key5')).toBe(true); // 新添加的
    });
  });

  describe('统计信息', () => {
    it('应该提供正确的缓存统计', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1'); // 访问一次
      cache.get('key1'); // 再访问一次

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(5);
      expect(stats.items).toHaveLength(2);
      
      // 找到key1的统计信息
      const key1Stats = stats.items.find(item => item.key === 'key1');
      expect(key1Stats?.accessCount).toBe(2);
    });
  });

  describe('清理机制', () => {
    it('应该定期清理过期的缓存项', async () => {
      cache.set('key1', 'value1', 50); // 50ms TTL
      cache.set('key2', 'value2', 200); // 200ms TTL

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);

      // 等待第一个过期但第二个未过期
      await TestEnvironment.waitFor(150);

      // 触发清理（通过设置新项）
      cache.set('key3', 'value3');

      expect(cache.has('key1')).toBe(false); // 应该被清理
      expect(cache.has('key2')).toBe(true);  // 仍然有效
    });
  });
});

describe('useSmartFetch', () => {
  let mockFetcher: jest.MockedFunction<() => Promise<any>>;

  beforeEach(() => {
    TestEnvironment.setup();
    mockFetcher = MockFactory.createMockFn(() => 
      Promise.resolve({ success: true, data: 'test-data' })
    );
    
    // 清空全局缓存
    globalCache.clear();
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  it('应该成功获取数据', async () => {
    const { result } = renderHook(() =>
      useSmartFetch(mockFetcher, {
        cacheKey: 'test-key',
        enabled: true,
      })
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ success: true, data: 'test-data' });
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(true);
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  it('应该使用缓存避免重复请求', async () => {
    const cacheKey = 'test-cache-key';
    
    // 第一次渲染
    const { result: result1 } = renderHook(() =>
      useSmartFetch(mockFetcher, { cacheKey })
    );

    await waitFor(() => {
      expect(result1.current.loading).toBe(false);
    });

    // 第二次渲染，应该直接从缓存获取
    const { result: result2 } = renderHook(() =>
      useSmartFetch(mockFetcher, { cacheKey })
    );

    expect(result2.current.loading).toBe(false);
    expect(result2.current.data).toEqual({ success: true, data: 'test-data' });
    expect(mockFetcher).toHaveBeenCalledTimes(1); // 只调用一次
  });

  it('应该处理请求错误', async () => {
    const errorFetcher = MockFactory.createMockFn(() =>
      Promise.reject(new Error('Fetch failed'))
    );

    const { result } = renderHook(() =>
      useSmartFetch(errorFetcher, {
        retry: 0, // 不重试
      })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Fetch failed');
    expect(result.current.isError).toBe(true);
  });

  it('应该支持重试机制', async () => {
    let callCount = 0;
    const flakyFetcher = MockFactory.createMockFn(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.reject(new Error('Temporary failure'));
      }
      return Promise.resolve({ success: true, data: 'finally-success' });
    });

    const { result } = renderHook(() =>
      useSmartFetch(flakyFetcher, {
        retry: 3,
        retryDelay: 10, // 很短的延迟以加快测试
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 1000 });

    expect(result.current.data).toEqual({ success: true, data: 'finally-success' });
    expect(flakyFetcher).toHaveBeenCalledTimes(3);
  });

  it('应该支持数据转换', async () => {
    const { result } = renderHook(() =>
      useSmartFetch(mockFetcher, {
        transform: (data: any) => ({
          ...data,
          transformed: true,
        }),
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({
      success: true,
      data: 'test-data',
      transformed: true,
    });
  });

  it('应该支持成功和错误回调', async () => {
    const onSuccess = MockFactory.createMockFn();
    const onError = MockFactory.createMockFn();

    const { result } = renderHook(() =>
      useSmartFetch(mockFetcher, {
        onSuccess,
        onError,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(onSuccess).toHaveBeenCalledWith({ success: true, data: 'test-data' });
    expect(onError).not.toHaveBeenCalled();
  });

  it('应该支持手动刷新', async () => {
    const { result } = renderHook(() =>
      useSmartFetch(mockFetcher, {
        cacheKey: 'test-refresh',
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetcher).toHaveBeenCalledTimes(1);

    // 手动刷新
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetcher).toHaveBeenCalledTimes(2);
  });
});

describe('useBatchFetch', () => {
  beforeEach(() => {
    TestEnvironment.setup();
    globalCache.clear();
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  it('应该并行执行多个请求', async () => {
    const fetcher1 = MockFactory.createMockFn(() => 
      Promise.resolve({ data: 'data1' })
    );
    const fetcher2 = MockFactory.createMockFn(() => 
      Promise.resolve({ data: 'data2' })
    );

    const requests = [
      { key: 'request1', fetcher: fetcher1 },
      { key: 'request2', fetcher: fetcher2 },
    ];

    const { result } = renderHook(() => useBatchFetch(requests));

    // 初始状态
    expect(result.current.request1.loading).toBe(true);
    expect(result.current.request2.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.request1.loading).toBe(false);
      expect(result.current.request2.loading).toBe(false);
    });

    expect(result.current.request1.data).toEqual({ data: 'data1' });
    expect(result.current.request2.data).toEqual({ data: 'data2' });
    expect(fetcher1).toHaveBeenCalledTimes(1);
    expect(fetcher2).toHaveBeenCalledTimes(1);
  });

  it('应该正确处理部分请求失败', async () => {
    const successFetcher = MockFactory.createMockFn(() => 
      Promise.resolve({ data: 'success' })
    );
    const failureFetcher = MockFactory.createMockFn(() => 
      Promise.reject(new Error('Request failed'))
    );

    const requests = [
      { key: 'success', fetcher: successFetcher },
      { key: 'failure', fetcher: failureFetcher },
    ];

    const { result } = renderHook(() => useBatchFetch(requests));

    await waitFor(() => {
      expect(result.current.success.loading).toBe(false);
      expect(result.current.failure.loading).toBe(false);
    });

    expect(result.current.success.data).toEqual({ data: 'success' });
    expect(result.current.success.error).toBeNull();
    
    expect(result.current.failure.data).toBeNull();
    expect(result.current.failure.error).toBeInstanceOf(Error);
  });
});

describe('requestDeduplicator', () => {
  beforeEach(() => {
    TestEnvironment.setup();
    requestDeduplicator.clear();
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  it('应该去重相同的请求', async () => {
    const fetcher = MockFactory.createMockFn(() => 
      new Promise(resolve => setTimeout(() => resolve('result'), 50))
    );

    const key = 'test-request';

    // 同时发起多个相同的请求
    const promise1 = requestDeduplicator.deduplicate(key, fetcher);
    const promise2 = requestDeduplicator.deduplicate(key, fetcher);
    const promise3 = requestDeduplicator.deduplicate(key, fetcher);

    const [result1, result2, result3] = await Promise.all([
      promise1,
      promise2,
      promise3,
    ]);

    expect(result1).toBe('result');
    expect(result2).toBe('result');
    expect(result3).toBe('result');
    expect(fetcher).toHaveBeenCalledTimes(1); // 只调用一次
  });

  it('应该在请求完成后清理', async () => {
    const fetcher = MockFactory.createMockFn(() => Promise.resolve('result'));
    const key = 'test-request';

    await requestDeduplicator.deduplicate(key, fetcher);

    // 再次请求应该重新执行
    await requestDeduplicator.deduplicate(key, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('应该支持取消请求', async () => {
    const fetcher = MockFactory.createMockFn(() => 
      new Promise(resolve => setTimeout(() => resolve('result'), 100))
    );

    const key = 'test-request';
    const promise = requestDeduplicator.deduplicate(key, fetcher);

    // 取消请求
    requestDeduplicator.cancel(key);

    // 新的请求应该重新执行
    const newPromise = requestDeduplicator.deduplicate(key, fetcher);

    const result = await newPromise;
    expect(result).toBe('result');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe('性能测试', () => {
  it('缓存操作应该在合理时间内完成', () => {
    const cache = new MemoryCache();
    const start = performance.now();

    // 执行大量缓存操作
    for (let i = 0; i < 10000; i++) {
      cache.set(`key${i}`, `value${i}`);
    }

    for (let i = 0; i < 10000; i++) {
      cache.get(`key${i}`);
    }

    const end = performance.now();
    const duration = end - start;

    // 应该在100ms内完成
    expect(duration).toBeLessThan(100);

    cache.destroy();
  });

  it('请求去重应该高效处理大量并发请求', async () => {
    const fetcher = MockFactory.createMockFn(() => 
      Promise.resolve('result')
    );

    const start = performance.now();
    const promises = [];

    // 创建1000个相同的请求
    for (let i = 0; i < 1000; i++) {
      promises.push(requestDeduplicator.deduplicate('test', fetcher));
    }

    await Promise.all(promises);

    const end = performance.now();
    const duration = end - start;

    // 应该在50ms内完成（因为去重，实际只执行一次）
    expect(duration).toBeLessThan(50);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});