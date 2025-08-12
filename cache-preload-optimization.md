# 缓存策略和数据预加载优化方案

## 概述

本文档详细说明了在AssetWise应用中实施缓存策略和数据预加载优化的具体方案。通过这些优化，我们旨在提高应用响应速度，减少服务器负载，改善用户体验，特别是在数据密集型操作和网络条件不佳的情况下。

## 当前问题

根据性能分析和数据同步测试报告，AssetWise应用存在以下问题：

1. **数据重复请求**：相同数据在短时间内多次请求，增加服务器负载
2. **缓存策略缺失**：未实现有效的客户端和服务器端缓存机制
3. **预加载不足**：用户可能需要的数据未提前加载，导致等待时间增加
4. **离线数据访问有限**：缺乏完善的离线数据缓存策略
5. **大型数据集加载慢**：未实现增量加载和虚拟化

## 优化目标

1. 减少API请求次数至少50%
2. 提高数据访问响应速度至少60%
3. 改善离线数据访问体验
4. 减少服务器负载
5. 优化大型数据集的加载和渲染性能

## 实施方案

### 1. 客户端缓存策略

实现多层次的客户端缓存策略，包括内存缓存、持久化缓存和请求合并。

#### 实施步骤：

1. **实现React Query缓存**：

```typescript
// src/lib/query-client.ts
import { QueryClient } from 'react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
      cacheTime: 30 * 60 * 1000, // 30分钟缓存过期
      refetchOnWindowFocus: false, // 窗口聚焦时不重新请求
      retry: 1, // 失败时重试一次
    },
  },
});
```

2. **创建自定义缓存钩子**：

```typescript
// src/hooks/useAssetData.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchAssets, updateAsset } from '../api/assets';

export function useAssetData(userId: string) {
  const queryClient = useQueryClient();
  
  // 查询资产数据，使用缓存
  const assetsQuery = useQuery(
    ['assets', userId],
    () => fetchAssets(userId),
    {
      staleTime: 10 * 60 * 1000, // 10分钟内数据视为新鲜
      cacheTime: 60 * 60 * 1000, // 1小时缓存过期
      onError: (error) => {
        console.error('获取资产数据失败:', error);
      }
    }
  );
  
  // 更新资产数据，并更新缓存
  const updateAssetMutation = useMutation(
    (assetData) => updateAsset(assetData),
    {
      // 乐观更新：立即更新UI，不等待服务器响应
      onMutate: async (newAsset) => {
        // 取消任何传出的重新获取，避免覆盖乐观更新
        await queryClient.cancelQueries(['assets', userId]);
        
        // 保存之前的数据
        const previousAssets = queryClient.getQueryData(['assets', userId]);
        
        // 乐观更新缓存
        queryClient.setQueryData(['assets', userId], (old) => {
          return old.map(asset => 
            asset.id === newAsset.id ? newAsset : asset
          );
        });
        
        return { previousAssets };
      },
      // 如果更新失败，回滚到之前的数据
      onError: (err, newAsset, context) => {
        queryClient.setQueryData(
          ['assets', userId],
          context.previousAssets
        );
      },
      // 无论成功或失败，都确保数据同步
      onSettled: () => {
        queryClient.invalidateQueries(['assets', userId]);
      },
    }
  );
  
  return {
    assets: assetsQuery.data || [],
    isLoading: assetsQuery.isLoading,
    isError: assetsQuery.isError,
    updateAsset: updateAssetMutation.mutate,
    refetch: assetsQuery.refetch,
  };
}
```

3. **实现IndexedDB持久化缓存**：

```typescript
// src/lib/indexed-db.ts
import { openDB } from 'idb';

const DB_NAME = 'assetwise-cache';
const DB_VERSION = 1;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 创建资产存储
      if (!db.objectStoreNames.contains('assets')) {
        const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
        assetStore.createIndex('userId', 'userId', { unique: false });
        assetStore.createIndex('type', 'type', { unique: false });
      }
      
      // 创建交易记录存储
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('assetId', 'assetId', { unique: false });
        txStore.createIndex('date', 'date', { unique: false });
      }
      
      // 创建元数据存储
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    }
  });
}

// 保存资产数据到IndexedDB
export async function saveAssetsToCache(assets) {
  const db = await initDB();
  const tx = db.transaction('assets', 'readwrite');
  
  // 批量添加所有资产
  await Promise.all([
    ...assets.map(asset => tx.store.put(asset)),
    tx.done
  ]);
  
  // 更新元数据
  await db.put('metadata', {
    key: 'assets_last_updated',
    value: new Date().toISOString()
  });
}

// 从IndexedDB获取资产数据
export async function getAssetsFromCache(userId) {
  const db = await initDB();
  const assets = await db.getAllFromIndex('assets', 'userId', userId);
  return assets;
}

// 获取上次更新时间
export async function getLastUpdated(key) {
  const db = await initDB();
  try {
    const metadata = await db.get('metadata', `${key}_last_updated`);
    return metadata ? metadata.value : null;
  } catch (error) {
    console.error('获取上次更新时间失败:', error);
    return null;
  }
}
```

4. **实现请求合并和防抖**：

```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// 使用示例
function AssetSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // 只有当debouncedSearchTerm变化时才发起请求
  const { data, isLoading } = useQuery(
    ['searchAssets', debouncedSearchTerm],
    () => searchAssets(debouncedSearchTerm),
    {
      enabled: debouncedSearchTerm.length > 0,
    }
  );
  
  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="搜索资产..."
      />
      {isLoading ? (
        <div>加载中...</div>
      ) : (
        <AssetList assets={data || []} />
      )}
    </div>
  );
}
```

### 2. 服务器端缓存优化

优化服务器端缓存配置，减少数据库查询，提高API响应速度。

#### 实施步骤：

1. **配置Next.js API路由缓存**：

```typescript
// src/pages/api/assets/[userId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 设置缓存控制头
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=300'
  );
  
  const { userId } = req.query;
  
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('获取资产数据失败:', error);
    return res.status(500).json({ error: '获取资产数据失败' });
  }
}
```

2. **实现Redis缓存层**：

```typescript
// src/lib/redis-cache.ts
import Redis from 'ioredis';

// 创建Redis客户端
const redis = new Redis(process.env.REDIS_URL);

// 通用缓存函数
export async function cacheData(key, data, ttl = 3600) {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('缓存数据失败:', error);
    return false;
  }
}

// 获取缓存数据
export async function getCachedData(key) {
  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    console.error('获取缓存数据失败:', error);
    return null;
  }
}

// 使用示例
// src/pages/api/assets/[userId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { cacheData, getCachedData } from '../../../lib/redis-cache';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = req.query;
  const cacheKey = `assets:${userId}`;
  
  try {
    // 尝试从缓存获取数据
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }
    
    // 缓存未命中，从数据库获取
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // 存入缓存
    await cacheData(cacheKey, data, 300); // 5分钟缓存
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('获取资产数据失败:', error);
    return res.status(500).json({ error: '获取资产数据失败' });
  }
}
```

3. **优化Supabase查询缓存**：

```typescript
// src/lib/supabase-optimized.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 带缓存的查询函数
export async function cachedQuery(table, query, cacheTime = 5 * 60 * 1000) {
  const cacheKey = `${table}:${JSON.stringify(query)}`;
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    const isExpired = Date.now() - timestamp > cacheTime;
    
    if (!isExpired) {
      return { data, source: 'cache' };
    }
  }
  
  // 缓存未命中或已过期，从Supabase获取
  const { data, error } = await supabase
    .from(table)
    .select(query.select || '*')
    .eq(query.eq?.field, query.eq?.value);
    
  if (error) throw error;
  
  // 更新缓存
  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      data,
      timestamp: Date.now()
    })
  );
  
  return { data, source: 'api' };
}
```

### 3. 数据预加载策略

实现智能数据预加载，提前加载用户可能需要的数据，减少等待时间。

#### 实施步骤：

1. **路由预加载**：

```typescript
// src/components/Navigation.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { queryClient } from '../lib/query-client';
import { fetchDashboardData, fetchAssetDetails } from '../api/data';

export function Navigation({ userId }) {
  const router = useRouter();
  
  // 预加载常用路由数据
  useEffect(() => {
    const preloadRouteData = () => {
      // 预加载仪表盘数据
      queryClient.prefetchQuery(
        ['dashboard', userId],
        () => fetchDashboardData(userId)
      );
      
      // 预加载用户最近访问的资产
      getRecentlyViewedAssets(userId).forEach(assetId => {
        queryClient.prefetchQuery(
          ['asset', assetId],
          () => fetchAssetDetails(assetId)
        );
      });
    };
    
    // 当用户已登录并停留一段时间后预加载
    const timer = setTimeout(preloadRouteData, 2000);
    
    return () => clearTimeout(timer);
  }, [userId]);
  
  return (
    <nav>
      {/* 导航菜单 */}
    </nav>
  );
}
```

2. **用户行为预测预加载**：

```typescript
// src/hooks/useSmartPreload.ts
import { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { fetchAssetDetails, fetchRelatedAssets } from '../api/assets';

export function useSmartPreload(currentAssetId, userId) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!currentAssetId) return;
    
    // 获取用户历史行为数据
    const userBehavior = getUserBehaviorData(userId);
    
    // 预测用户可能查看的下一个资产
    const predictedNextAssets = predictNextAssets(
      currentAssetId,
      userBehavior
    );
    
    // 预加载预测的资产数据
    predictedNextAssets.forEach(assetId => {
      queryClient.prefetchQuery(
        ['asset', assetId],
        () => fetchAssetDetails(assetId),
        { staleTime: 5 * 60 * 1000 } // 5分钟内不重新请求
      );
    });
    
    // 预加载相关资产
    queryClient.prefetchQuery(
      ['relatedAssets', currentAssetId],
      () => fetchRelatedAssets(currentAssetId),
      { staleTime: 10 * 60 * 1000 } // 10分钟内不重新请求
    );
  }, [currentAssetId, userId, queryClient]);
}

// 使用示例
function AssetDetailPage({ assetId, userId }) {
  // 使用智能预加载钩子
  useSmartPreload(assetId, userId);
  
  // 组件其余部分...
}
```

3. **基于视口的数据预加载**：

```typescript
// src/hooks/useInViewPreload.ts
import { useEffect, useRef } from 'react';
import { useQueryClient } from 'react-query';
import { fetchAssetDetails } from '../api/assets';

export function useInViewPreload(assetIds) {
  const queryClient = useQueryClient();
  const assetRefs = useRef({});
  
  useEffect(() => {
    if (!assetIds.length) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const assetId = entry.target.dataset.assetId;
            if (assetId) {
              // 当资产进入视口时预加载详情
              queryClient.prefetchQuery(
                ['asset', assetId],
                () => fetchAssetDetails(assetId)
              );
              
              // 已预加载，停止观察
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin: '200px' } // 提前200px开始预加载
    );
    
    // 开始观察所有资产元素
    Object.values(assetRefs.current).forEach(ref => {
      if (ref) {
        observer.observe(ref);
      }
    });
    
    return () => {
      observer.disconnect();
    };
  }, [assetIds, queryClient]);
  
  // 返回设置引用的函数
  const setAssetRef = (assetId) => (element) => {
    if (element) {
      element.dataset.assetId = assetId;
      assetRefs.current[assetId] = element;
    }
  };
  
  return setAssetRef;
}

// 使用示例
function AssetList({ assets }) {
  const setAssetRef = useInViewPreload(assets.map(a => a.id));
  
  return (
    <div>
      {assets.map(asset => (
        <div 
          key={asset.id} 
          ref={setAssetRef(asset.id)}
          className="asset-item"
        >
          {asset.name}
        </div>
      ))}
    </div>
  );
}
```

### 4. 离线数据访问优化

增强离线数据访问能力，确保在网络不可用时仍能访问关键数据。

#### 实施步骤：

1. **实现Service Worker缓存**：

```javascript
// public/service-worker.js
const CACHE_NAME = 'assetwise-cache-v1';
const ASSETS_CACHE_NAME = 'assetwise-assets-cache-v1';
const API_CACHE_NAME = 'assetwise-api-cache-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/static/media/logo.png',
  '/manifest.json',
  '/favicon.ico'
];

// 安装Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('assetwise-') && 
                   name !== CACHE_NAME &&
                   name !== ASSETS_CACHE_NAME &&
                   name !== API_CACHE_NAME;
          })
          .map((name) => {
            return caches.delete(name);
          })
      );
    })
  );
});

// 处理请求
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 处理API请求
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
  } 
  // 处理静态资源
  else {
    event.respondWith(handleStaticRequest(event.request));
  }
});

// 处理API请求
async function handleApiRequest(request) {
  // 尝试从网络获取
  try {
    const response = await fetch(request);
    
    // 如果成功，克隆响应并存入缓存
    if (response.ok) {
      const clonedResponse = response.clone();
      caches.open(API_CACHE_NAME).then((cache) => {
        cache.put(request, clonedResponse);
      });
    }
    
    return response;
  } catch (error) {
    // 网络请求失败，尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 如果缓存也没有，返回离线API响应
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: '您当前处于离线状态，无法获取最新数据'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 处理静态资源请求
async function handleStaticRequest(request) {
  // 先查缓存
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // 缓存未命中，从网络获取
  try {
    const response = await fetch(request);
    
    // 如果成功，克隆响应并存入缓存
    if (response.ok) {
      const clonedResponse = response.clone();
      caches.open(ASSETS_CACHE_NAME).then((cache) => {
        cache.put(request, clonedResponse);
      });
    }
    
    return response;
  } catch (error) {
    // 如果是HTML请求，返回离线页面
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    // 其他资源请求失败
    return new Response('资源不可用', { status: 503 });
  }
}
```

2. **注册Service Worker**：

```typescript
// src/lib/register-sw.ts
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker注册成功:', registration);
        })
        .catch((error) => {
          console.error('Service Worker注册失败:', error);
        });
    });
  }
}

// 在_app.tsx中调用
import { useEffect } from 'react';
import { registerServiceWorker } from '../lib/register-sw';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  
  return <Component {...pageProps} />;
}
```

3. **实现离线数据同步队列**：

```typescript
// src/lib/offline-sync-queue.ts
import { openDB } from 'idb';

const DB_NAME = 'assetwise-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'sync-queue';

// 初始化数据库
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    }
  });
}

// 添加操作到同步队列
export async function addToSyncQueue(operation) {
  const db = await initDB();
  return db.add(STORE_NAME, {
    ...operation,
    status: 'pending',
    timestamp: Date.now(),
    retries: 0
  });
}

// 获取待同步的操作
export async function getPendingSyncOperations() {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'status', 'pending');
}

// 更新操作状态
export async function updateSyncOperation(id, updates) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const operation = await tx.store.get(id);
  
  if (!operation) {
    throw new Error(`操作ID ${id} 不存在`);
  }
  
  await tx.store.put({
    ...operation,
    ...updates,
    lastUpdated: Date.now()
  });
  
  await tx.done;
}

// 删除已完成的操作
export async function removeCompletedOperations() {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const index = tx.store.index('status');
  let cursor = await index.openCursor('completed');
  
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  
  await tx.done;
}

// 处理同步队列
export async function processSyncQueue() {
  // 检查网络连接
  if (!navigator.onLine) {
    console.log('离线状态，稍后再同步');
    return;
  }
  
  const operations = await getPendingSyncOperations();
  console.log(`开始处理 ${operations.length} 个待同步操作`);
  
  for (const operation of operations) {
    try {
      // 根据操作类型执行不同的同步逻辑
      switch (operation.type) {
        case 'create':
          await handleCreateOperation(operation);
          break;
        case 'update':
          await handleUpdateOperation(operation);
          break;
        case 'delete':
          await handleDeleteOperation(operation);
          break;
        default:
          console.warn(`未知操作类型: ${operation.type}`);
      }
      
      // 更新操作状态为已完成
      await updateSyncOperation(operation.id, {
        status: 'completed',
        syncedAt: Date.now()
      });
    } catch (error) {
      console.error(`同步操作失败:`, error);
      
      // 更新重试次数和状态
      const retries = (operation.retries || 0) + 1;
      const status = retries >= 5 ? 'failed' : 'pending';
      
      await updateSyncOperation(operation.id, {
        status,
        retries,
        lastError: error.message
      });
    }
  }
  
  // 清理已完成的操作
  await removeCompletedOperations();
}

// 监听在线状态变化
export function setupSyncListener() {
  window.addEventListener('online', () => {
    console.log('网络已恢复，开始同步数据');
    processSyncQueue();
  });
}

// 在应用启动时调用
export function initOfflineSync() {
  setupSyncListener();
  
  // 应用启动时检查并处理同步队列
  if (navigator.onLine) {
    processSyncQueue();
  }
}
```

### 5. 大型数据集优化

优化大型数据集的加载和渲染，实现增量加载和虚拟化。

#### 实施步骤：

1. **实现数据分页加载**：

```typescript
// src/hooks/usePaginatedData.ts
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'react-query';

export function usePaginatedData(
  queryKey,
  fetchFn,
  options = { pageSize: 20, initialPage: 1 }
) {
  const [page, setPage] = useState(options.initialPage);
  const [allData, setAllData] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  
  // 获取当前页数据
  const { data, isLoading, error } = useQuery(
    [...queryKey, page],
    () => fetchFn({ page, pageSize: options.pageSize }),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
      onSuccess: (newData) => {
        if (page === 1) {
          // 第一页，重置所有数据
          setAllData(newData.items);
        } else {
          // 后续页，追加数据
          setAllData(prev => [...prev, ...newData.items]);
        }
        
        // 检查是否还有更多数据
        setHasMore(newData.hasMore);
      }
    }
  );
  
  // 加载下一页
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);
  
  // 重置数据
  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
    setHasMore(true);
  }, []);
  
  return {
    data: allData,
    isLoading,
    error,
    hasMore,
    loadMore,
    reset,
    currentPage: page
  };
}

// 使用示例
function AssetList() {
  const {
    data: assets,
    isLoading,
    hasMore,
    loadMore
  } = usePaginatedData(
    ['assets'],
    ({ page, pageSize }) => fetchAssets({ page, pageSize })
  );
  
  return (
    <div>
      {assets.map(asset => (
        <AssetItem key={asset.id} asset={asset} />
      ))}
      
      {hasMore && (
        <button onClick={loadMore} disabled={isLoading}>
          {isLoading ? '加载中...' : '加载更多'}
        </button>
      )}
    </div>
  );
}
```

2. **实现虚拟滚动**：

```typescript
// src/components/VirtualizedList.tsx
import { FixedSizeList as List } from 'react-window';
import { memo } from 'react';

interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  height: number;
  renderItem: (props: any) => JSX.Element;
}

const VirtualizedList = memo<VirtualizedListProps>(({
  items,
  itemHeight,
  height,
  renderItem
}) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      {renderItem({ item: items[index], index })}
    </div>
  );
  
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
});

// 使用示例
function LargeAssetList({ assets }) {
  const renderAssetItem = ({ item: asset, index }) => (
    <div className="asset-item">
      <h3>{asset.name}</h3>
      <p>{asset.description}</p>
      <span>{asset.value}</span>
    </div>
  );
  
  return (
    <VirtualizedList
      items={assets}
      itemHeight={80}
      height={600}
      renderItem={renderAssetItem}
    />
  );
}
```

3. **实现无限滚动**：

```typescript
// src/hooks/useInfiniteScroll.ts
import { useEffect, useCallback, useRef } from 'react';

export function useInfiniteScroll(
  loadMore: () => void,
  hasMore: boolean,
  isLoading: boolean,
  threshold = 100
) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    },
    [loadMore, hasMore, isLoading]
  );
  
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: `${threshold}px`
    });
    
    observer.observe(sentinel);
    
    return () => {
      observer.disconnect();
    };
  }, [handleIntersection, threshold]);
  
  return sentinelRef;
}

// 使用示例
function InfiniteAssetList() {
  const {
    data: assets,
    isLoading,
    hasMore,
    loadMore
  } = usePaginatedData(['assets'], fetchAssets);
  
  const sentinelRef = useInfiniteScroll(loadMore, hasMore, isLoading);
  
  return (
    <div>
      {assets.map(asset => (
        <AssetItem key={asset.id} asset={asset} />
      ))}
      
      {hasMore && (
        <div ref={sentinelRef} className="loading-sentinel">
          {isLoading && <div>加载中...</div>}
        </div>
      )}
    </div>
  );
}
```

## 实施计划

### 第一阶段（1-3天）

1. **客户端缓存基础设施**：
   - 配置React Query
   - 实现IndexedDB持久化缓存
   - 添加请求合并和防抖

2. **服务器端缓存配置**：
   - 配置Next.js API路由缓存
   - 设置适当的缓存控制头

### 第二阶段（3-5天）

1. **数据预加载策略**：
   - 实现路由预加载
   - 添加用户行为预测预加载
   - 实现基于视口的预加载

2. **离线数据访问**：
   - 注册Service Worker
   - 实现离线数据同步队列

### 第三阶段（5-7天）

1. **大型数据集优化**：
   - 实现数据分页加载
   - 添加虚拟滚动
   - 实现无限滚动

2. **高级缓存策略**：
   - 配置Redis缓存层（如果需要）
   - 优化Supabase查询缓存
   - 实现智能缓存失效策略

## 性能指标监控

为了评估缓存和预加载优化的效果，我们将监控以下指标：

1. **缓存命中率**：
   - 客户端缓存命中率
   - 服务器端缓存命中率
   - IndexedDB缓存使用情况

2. **数据加载性能**：
   - API响应时间
   - 数据获取延迟
   - 首次数据加载时间

3. **用户体验指标**：
   - 页面切换时间
   - 数据刷新延迟
   - 离线功能可用性

## 监控实现

```typescript
// src/lib/cache-analytics.ts
class CacheAnalytics {
  private metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    apiRequests: 0,
    offlineRequests: 0
  };
  
  recordCacheHit() {
    this.metrics.cacheHits++;
    this.sendMetric('cache_hit');
  }
  
  recordCacheMiss() {
    this.metrics.cacheMisses++;
    this.sendMetric('cache_miss');
  }
  
  recordApiRequest(duration: number) {
    this.metrics.apiRequests++;
    this.sendMetric('api_request', { duration });
  }
  
  recordOfflineRequest() {
    this.metrics.offlineRequests++;
    this.sendMetric('offline_request');
  }
  
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? this.metrics.cacheHits / total : 0;
  }
  
  private sendMetric(event: string, data?: any) {
    // 发送到分析服务
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, data);
    }
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.getCacheHitRate()
    };
  }
}

export const cacheAnalytics = new CacheAnalytics();
```

## 预期效果

通过实施上述缓存策略和数据预加载优化方案，我们预期达到以下效果：

1. **性能提升**：
   - API请求次数减少50%以上
   - 数据访问响应速度提升60%以上
   - 页面切换时间减少40%

2. **用户体验改善**：
   - 减少加载等待时间
   - 改善离线使用体验
   - 提高大型数据集浏览流畅度

3. **资源优化**：
   - 减少服务器负载
   - 降低网络带宽使用
   - 提高应用在低性能设备上的表现

## 风险与缓解措施

1. **缓存一致性问题**：
   - 风险：缓存数据与服务器数据不一致
   - 缓解：实现适当的缓存失效策略，使用版本控制

2. **存储空间占用**：
   - 风险：大量缓存数据占用设备存储空间
   - 缓解：设置缓存大小限制，定期清理过期缓存

3. **复杂性增加**：
   - 风险：缓存逻辑增加代码复杂性
   - 缓解：使用成熟的缓存库，编写完善的测试用例

## 结论

缓存策略和数据预加载优化是提升AssetWise应用性能的关键措施。通过实施多层次的缓存策略、智能数据预加载和离线数据访问优化，我们可以显著提升应用的响应速度和用户体验。

这些优化对于处理大量资产数据、提供流畅的用户交互体验以及支持离线使用场景具有重要意义。随着用户数据量的增长，这些优化策略将变得越来越重要。

## 参考资料

- [React Query文档](https://react-query.tanstack.com/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [React Window文档](https://react-window.vercel.app/)
- [Web缓存最佳实践](https://web.dev/http-cache/)
- [Next.js缓存策略](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration)
