"use client"

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)

  useEffect(() => {
    setIsLoading(true)
    
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setIsLoading(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <div className={cn('relative', className)}>
      {/* 加载遮罩 */}
      <div className={cn(
        'absolute inset-0 bg-background/80 backdrop-blur-sm z-50 transition-all duration-300',
        'flex items-center justify-center',
        isLoading ? 'opacity-100 visible' : 'opacity-0 invisible'
      )}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
      
      {/* 页面内容 */}
      <div className={cn(
        'transition-all duration-300 ease-out',
        isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      )}>
        {displayChildren}
      </div>
    </div>
  )
}

// 卡片进入动画
export function CardEnterAnimation({ 
  children, 
  delay = 0,
  className 
}: { 
  children: React.ReactNode
  delay?: number
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={cn(
      'transition-all duration-500 ease-out',
      isVisible 
        ? 'opacity-100 translate-y-0 scale-100' 
        : 'opacity-0 translate-y-8 scale-95',
      className
    )}>
      {children}
    </div>
  )
}

// 渐入动画
export function FadeInAnimation({ 
  children, 
  delay = 0,
  direction = 'up',
  className 
}: { 
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const getTransform = () => {
    if (isVisible) return 'translate-x-0 translate-y-0'
    
    switch (direction) {
      case 'up': return 'translate-y-4'
      case 'down': return '-translate-y-4'
      case 'left': return 'translate-x-4'
      case 'right': return '-translate-x-4'
      default: return 'translate-y-4'
    }
  }

  return (
    <div className={cn(
      'transition-all duration-700 ease-out',
      isVisible ? 'opacity-100' : 'opacity-0',
      getTransform(),
      className
    )}>
      {children}
    </div>
  )
}

// 脉冲动画
export function PulseAnimation({ 
  children, 
  className,
  intensity = 'normal'
}: { 
  children: React.ReactNode
  className?: string
  intensity?: 'light' | 'normal' | 'strong'
}) {
  const getIntensity = () => {
    switch (intensity) {
      case 'light': return 'animate-pulse opacity-75'
      case 'strong': return 'animate-pulse opacity-90'
      default: return 'animate-pulse opacity-80'
    }
  }

  return (
    <div className={cn(getIntensity(), className)}>
      {children}
    </div>
  )
}