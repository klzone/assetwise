/**
 * Service Worker for AssetWise
 * 实现离线缓存、后台同步和推送通知
 */

const CACHE_NAME = 'assetwise-v1.0.0';
const STATIC_CACHE = 'assetwise-static-v1.0.0';
const DATA_CACHE = 'assetwise-data-v1.0.0';

// 需要缓存的静态资源
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',
  // 添加更多需要缓存的静态资源
];

// 需要缓存的API路径
const API_ROUTES = [
  '/api/assets',
  '/api/transactions',
  '/api/accounts',
  '/api/dashboard',
];

// 缓存策略
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

// 安装事件
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      // 跳过等待，立即激活
      self.skipWaiting(),
    ])
  );
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    Promise.all([
      // 清理旧版本缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 立即控制所有页面
      self.clients.claim(),
    ])
  );
});

// 请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // 根据请求类型选择缓存策略
  if (isStaticFile(request)) {
    event.respondWith(handleStaticRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  }
});

// 后台同步
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-data') {
    event.waitUntil(syncData());
  }
});

// 推送消息
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/android-chrome-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.data,
    actions: [
      {
        action: 'view',
        title: '查看',
        icon: '/icons/view-24x24.png',
      },
      {
        action: 'dismiss',
        title: '忽略',
        icon: '/icons/close-24x24.png',
      },
    ],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: true,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知点击
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // 检查是否已有窗口打开
        for (const client of clients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // 打开新窗口
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// 工具函数
function isStaticFile(request) {
  const url = new URL(request.url);
  return (
    request.method === 'GET' &&
    (url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.webp'))
  );
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isNavigationRequest(request) {
  return (
    request.method === 'GET' &&
    request.headers.get('accept')?.includes('text/html')
  );
}

// 处理静态文件请求（缓存优先）
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static request failed:', error);
    
    // 返回缓存的fallback页面或资源
    const cache = await caches.open(STATIC_CACHE);
    return cache.match('/offline.html') || new Response('离线状态', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// 处理API请求（网络优先，带缓存备份）
async function handleAPIRequest(request) {
  try {
    // 尝试网络请求
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 缓存成功的响应
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', error);
    
    // 网络失败，尝试缓存
    const cache = await caches.open(DATA_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // 添加离线标识
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'ServiceWorker-Cache');
      return response;
    }
    
    // 返回离线响应
    return new Response(
      JSON.stringify({
        error: '网络连接失败，请检查网络设置',
        offline: true,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'ServiceWorker-Offline',
        },
      }
    );
  }
}

// 处理导航请求
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation request failed, serving offline page');
    
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/offline.html');
    
    if (offlinePage) {
      return offlinePage;
    }
    
    // 创建简单的离线页面
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AssetWise - 离线模式</title>
        <meta charset=\"utf-8\">
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f8fafc;
            color: #334155;
          }
          .container {
            text-align: center;
            max-width: 400px;
            padding: 2rem;
          }
          .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          h1 {
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
            font-weight: 600;
          }
          p {
            margin: 0 0 2rem 0;
            color: #64748b;
            line-height: 1.6;
          }
          .button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s;
          }
          .button:hover {
            background: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class=\"container\">
          <div class=\"icon\">📱</div>
          <h1>AssetWise</h1>
          <p>当前处于离线模式。请检查网络连接后重试。</p>
          <button class=\"button\" onclick=\"window.location.reload()\">重新连接</button>
        </div>
      </body>
      </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html',
          'X-Served-By': 'ServiceWorker-Offline',
        },
      }
    );
  }
}

// 后台数据同步
async function syncData() {
  console.log('[SW] Starting background sync');
  
  try {
    // 获取待同步的数据
    const syncQueue = await getSyncQueue();
    
    for (const item of syncQueue) {
      try {
        await syncDataItem(item);
        await removeSyncItem(item.id);
      } catch (error) {
        console.error('[SW] Failed to sync item:', item, error);
      }
    }
    
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    throw error;
  }
}

// 获取同步队列
async function getSyncQueue() {
  try {
    const cache = await caches.open(DATA_CACHE);
    const syncQueueResponse = await cache.match('/sync-queue');
    
    if (syncQueueResponse) {
      return await syncQueueResponse.json();
    }
    
    return [];
  } catch (error) {
    console.error('[SW] Failed to get sync queue:', error);
    return [];
  }
}

// 同步单个数据项
async function syncDataItem(item) {
  const response = await fetch(item.url, {
    method: item.method,
    headers: {
      'Content-Type': 'application/json',
      ...item.headers,
    },
    body: item.body,
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  
  return response;
}

// 从同步队列中移除项目
async function removeSyncItem(id) {
  try {
    const cache = await caches.open(DATA_CACHE);
    const syncQueue = await getSyncQueue();
    const updatedQueue = syncQueue.filter(item => item.id !== id);
    
    await cache.put(
      '/sync-queue',
      new Response(JSON.stringify(updatedQueue), {
        headers: { 'Content-Type': 'application/json' },
      })
    );
  } catch (error) {
    console.error('[SW] Failed to remove sync item:', error);
  }
}

// 消息处理
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(
        cacheUrls(payload.urls).then(() => {
          event.ports[0].postMessage({ success: true });
        })
      );
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        clearCaches().then(() => {
          event.ports[0].postMessage({ success: true });
        })
      );
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// 缓存指定URLs
async function cacheUrls(urls) {
  const cache = await caches.open(DATA_CACHE);
  return Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.error('[SW] Failed to cache URL:', url, error);
      }
    })
  );
}

// 清理缓存
async function clearCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}"