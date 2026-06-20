/**
 * 性能优化工具
 * 实现代码分割、懒加载、组件记忆化等性能优化策略
 */

import React, { lazy, Suspense, memo, useMemo, useCallback, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 懒加载包装器组件
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorBoundary?: boolean;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback = <div className=\"flex items-center justify-center p-4\">Loading...</div>,
  errorBoundary = true 
}) => {
  if (errorBoundary) {
    return (
      <ErrorBoundary>
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className=\"p-4 text-center text-red-500\">
          <p>组件加载失败</p>
          <button 
            onClick={() => window.location.reload()}
            className=\"mt-2 px-4 py-2 bg-blue-500 text-white rounded\"
          >
            重新加载
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 创建懒加载组件的工厂函数
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ReactNode;
    errorBoundary?: boolean;
    retryAttempts?: number;
  } = {}
): React.ComponentType<React.ComponentProps<T>> {
  const {
    fallback = <div className=\"animate-pulse bg-gray-200 h-32 rounded\"></div>,
    errorBoundary = true,
    retryAttempts = 3,
  } = options;

  let attempts = 0;
  
  const LazyComponent = lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      attempts++;
      if (attempts < retryAttempts) {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        return await importFn();
      }
      throw error;
    }
  });

  return (props: React.ComponentProps<T>) => (
    <LazyWrapper fallback={fallback} errorBoundary={errorBoundary}>
      <LazyComponent {...props} />
    </LazyWrapper>
  );
}

// Next.js 动态导入工具
export function createDynamicComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    loading?: React.ComponentType;
    ssr?: boolean;
  } = {}
): React.ComponentType<React.ComponentProps<T>> {
  const {
    loading: LoadingComponent = () => (
      <div className=\"animate-pulse bg-gray-200 h-32 rounded\"></div>
    ),
    ssr = false,
  } = options;

  return dynamic(importFn, {
    loading: LoadingComponent,
    ssr,
  });
}

// 预加载工具
export class PreloadManager {
  private static preloadedComponents = new Set<string>();

  /**
   * 预加载组件
   */
  static async preloadComponent(
    key: string,
    importFn: () => Promise<any>
  ): Promise<void> {
    if (this.preloadedComponents.has(key)) {
      return;
    }

    try {
      await importFn();
      this.preloadedComponents.add(key);
    } catch (error) {
      console.warn(`Failed to preload component: ${key}`, error);
    }
  }

  /**
   * 预加载路由
   */
  static preloadRoute(href: string): void {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
      });
    }
  }

  /**
   * 预加载多个路由
   */
  static preloadRoutes(routes: string[]): void {
    routes.forEach(route => this.preloadRoute(route));
  }
}

// 记忆化组件工厂
export function createMemoizedComponent<T extends React.ComponentType<any>>(
  Component: T,
  areEqual?: (
    prevProps: React.ComponentProps<T>,
    nextProps: React.ComponentProps<T>
  ) => boolean
): React.ComponentType<React.ComponentProps<T>> {
  return memo(Component, areEqual);
}

// 性能监控Hook
export function usePerformanceMonitor(componentName: string) {
  const [renderCount, setRenderCount] = useState(0);
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    setRenderCount(prev => prev + 1);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setRenderTime(duration);

      if (duration > 16) { // 超过一帧的时间
        console.warn(`${componentName} render took ${duration.toFixed(2)}ms`);
      }
    };
  });

  return { renderCount, renderTime };
}

// 虚拟化列表Hook
export function useVirtualization(
  items: any[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = useMemo(() => {
    return Math.floor(scrollTop / itemHeight);
  }, [scrollTop, itemHeight]);

  const endIndex = useMemo(() => {
    return Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length - 1
    );
  }, [startIndex, containerHeight, itemHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
  };
}

// 图片懒加载Hook
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver;

    if (imageRef && src) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imageRef);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(imageRef);
    }

    return () => {
      if (observer && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, src]);

  return [imageSrc, setImageRef] as const;
}

// 防抖Hook
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

// 节流Hook
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [inThrottle, setInThrottle] = useState<boolean>(false);

  useEffect(() => {
    if (!inThrottle) {
      setThrottledValue(value);
      setInThrottle(true);
      setTimeout(() => setInThrottle(false), limit);
    }
  }, [value, limit, inThrottle]);

  return throttledValue;
}

// 资源预加载工具
export class ResourcePreloader {
  private static cache = new Map<string, Promise<any>>();

  /**
   * 预加载图片
   */
  static preloadImage(src: string): Promise<void> {
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });

    this.cache.set(src, promise);
    return promise;
  }

  /**
   * 预加载多个图片
   */
  static preloadImages(sources: string[]): Promise<void[]> {
    return Promise.all(sources.map(src => this.preloadImage(src)));
  }

  /**
   * 预加载字体
   */
  static preloadFont(fontUrl: string, fontFamily: string): Promise<void> {
    if (this.cache.has(fontUrl)) {
      return this.cache.get(fontUrl)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const font = new FontFace(fontFamily, `url(${fontUrl})`);
      font.load()
        .then(() => {
          document.fonts.add(font);
          resolve();
        })
        .catch(reject);
    });

    this.cache.set(fontUrl, promise);
    return promise;
  }
}

// 性能分析工具
export class PerformanceAnalyzer {
  private static metrics = new Map<string, number[]>();

  /**
   * 记录性能指标
   */
  static record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  /**
   * 获取性能统计
   */
  static getStats(name: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  /**
   * 清除指标
   */
  static clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * 测量函数执行时间
   */
  static measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    this.record(name, end - start);
    return result;
  }

  /**
   * 测量异步函数执行时间
   */
  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    this.record(name, end - start);
    return result;
  }
}