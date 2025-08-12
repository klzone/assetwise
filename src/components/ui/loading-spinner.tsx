import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: 'primary' | 'secondary' | 'muted'
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  color = 'primary' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary-foreground',
    muted: 'text-muted-foreground'
  }

  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-current border-t-transparent',
      sizeClasses[size],
      colorClasses[color],
      className
    )}>
      <span className="sr-only">加载中...</span>
    </div>
  )
}

// 脉冲加载动画
export function PulseLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 bg-primary rounded-full animate-pulse"
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

// 骨架屏加载
export function SkeletonLoader({ 
  className,
  lines = 3 
}: { 
  className?: string
  lines?: number 
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted rounded animate-pulse"
          style={{
            width: `${Math.random() * 40 + 60}%`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  )
}

// 卡片骨架屏
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('modern-card p-6 space-y-4', className)}>
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
        <div className="h-3 bg-muted rounded animate-pulse w-4/6" />
      </div>
    </div>
  )
}