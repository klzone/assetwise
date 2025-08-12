"use client"

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// 性能指标接口
interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

// 性能监控Hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 监控 First Contentful Paint
    const observeFCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
        if (fcpEntry) {
          setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }))
        }
      })
      observer.observe({ entryTypes: ['paint'] })
      return observer
    }

    // 监控 Largest Contentful Paint
    const observeLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }))
        }
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      return observer
    }

    // 监控 First Input Delay
    const observeFID = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            const fid = entry.processingStart - entry.startTime
            setMetrics(prev => ({ ...prev, fid }))
          }
        })
      })
      observer.observe({ entryTypes: ['first-input'] })
      return observer
    }

    // 监控 Cumulative Layout Shift
    const observeCLS = () => {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            setMetrics(prev => ({ ...prev, cls: clsValue }))
          }
        })
      })
      observer.observe({ entryTypes: ['layout-shift'] })
      return observer
    }

    // 获取 Time to First Byte
    const getTTFB = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart
        setMetrics(prev => ({ ...prev, ttfb }))
      }
    }

    const observers: PerformanceObserver[] = []

    try {
      observers.push(observeFCP())
      observers.push(observeLCP())
      observers.push(observeFID())
      observers.push(observeCLS())
      getTTFB()
    } catch (error) {
      console.warn('Performance monitoring not supported:', error)
    }

    setIsLoading(false)

    return () => {
      observers.forEach(observer => observer.disconnect())
    }
  }, [])

  return { metrics, isLoading }
}

// 性能评分函数
export function getPerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100
  
  // FCP 评分 (理想 < 1.8s)
  if (metrics.fcp) {
    if (metrics.fcp > 3000) score -= 20
    else if (metrics.fcp > 1800) score -= 10
  }
  
  // LCP 评分 (理想 < 2.5s)
  if (metrics.lcp) {
    if (metrics.lcp > 4000) score -= 25
    else if (metrics.lcp > 2500) score -= 15
  }
  
  // FID 评分 (理想 < 100ms)
  if (metrics.fid) {
    if (metrics.fid > 300) score -= 20
    else if (metrics.fid > 100) score -= 10
  }
  
  // CLS 评分 (理想 < 0.1)
  if (metrics.cls) {
    if (metrics.cls > 0.25) score -= 25
    else if (metrics.cls > 0.1) score -= 15
  }
  
  // TTFB 评分 (理想 < 600ms)
  if (metrics.ttfb) {
    if (metrics.ttfb > 1500) score -= 10
    else if (metrics.ttfb > 600) score -= 5
  }
  
  return Math.max(0, score)
}

// 性能状态组件
interface PerformanceStatusProps {
  className?: string
  showDetails?: boolean
}

export function PerformanceStatus({ className, showDetails = false }: PerformanceStatusProps) {
  const { metrics, isLoading } = usePerformanceMonitor()
  const score = getPerformanceScore(metrics)

  if (isLoading) return null

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return '优秀'
    if (score >= 70) return '良好'
    return '需要优化'
  }

  if (!showDetails) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <div className={cn('w-2 h-2 rounded-full', {
          'bg-green-500': score >= 90,
          'bg-yellow-500': score >= 70 && score < 90,
          'bg-red-500': score < 70
        })} />
        <span className={getScoreColor(score)}>
          性能: {getScoreLabel(score)} ({score})
        </span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="font-medium">性能评分</span>
        <span className={cn('font-bold', getScoreColor(score))}>
          {score} - {getScoreLabel(score)}
        </span>
      </div>
      
      <div className="space-y-1 text-sm">
        {metrics.fcp && (
          <div className="flex justify-between">
            <span>首次内容绘制 (FCP)</span>
            <span>{(metrics.fcp / 1000).toFixed(2)}s</span>
          </div>
        )}
        {metrics.lcp && (
          <div className="flex justify-between">
            <span>最大内容绘制 (LCP)</span>
            <span>{(metrics.lcp / 1000).toFixed(2)}s</span>
          </div>
        )}
        {metrics.fid && (
          <div className="flex justify-between">
            <span>首次输入延迟 (FID)</span>
            <span>{metrics.fid.toFixed(2)}ms</span>
          </div>
        )}
        {metrics.cls && (
          <div className="flex justify-between">
            <span>累积布局偏移 (CLS)</span>
            <span>{metrics.cls.toFixed(3)}</span>
          </div>
        )}
        {metrics.ttfb && (
          <div className="flex justify-between">
            <span>首字节时间 (TTFB)</span>
            <span>{metrics.ttfb.toFixed(2)}ms</span>
          </div>
        )}
      </div>
    </div>
  )
}

// 图片懒加载组件
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  className?: string
}

export function LazyImage({ src, alt, placeholder, className, ...props }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && placeholder && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={isInView ? src : placeholder}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  )
}

// 虚拟滚动组件
interface VirtualScrollProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )

  const visibleItems = items.slice(startIndex, endIndex)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) =>
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  )
}

// 内存使用监控
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null)

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory)
      }
    }

    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000)

    return () => clearInterval(interval)
  }, [])

  return memoryInfo
}