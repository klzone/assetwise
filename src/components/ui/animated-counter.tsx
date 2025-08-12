"use client"

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCounterProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  separator?: string
}

export function AnimatedCounter({
  value,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  separator = ','
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsAnimating(true)
    let startTime: number
    let startValue = displayValue

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // 使用缓动函数
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + (value - startValue) * easeOutQuart
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, duration, displayValue])

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals)
    const parts = fixed.split('.')
    
    // 添加千位分隔符
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    
    return parts.join('.')
  }

  return (
    <span className={cn(
      'font-mono transition-all duration-200',
      isAnimating && 'text-primary',
      className
    )}>
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  )
}

// 百分比动画组件
export function AnimatedPercentage({
  value,
  showSign = true,
  className
}: {
  value: number
  showSign?: boolean
  className?: string
}) {
  const isPositive = value >= 0
  const displayValue = Math.abs(value)
  
  return (
    <span className={cn(
      'font-medium transition-colors duration-200',
      isPositive ? 'text-success' : 'text-destructive',
      className
    )}>
      {showSign && (isPositive ? '+' : '-')}
      <AnimatedCounter 
        value={displayValue} 
        decimals={2} 
        suffix="%" 
        duration={1000}
      />
    </span>
  )
}

// 货币动画组件
export function AnimatedCurrency({
  value,
  currency = '¥',
  className
}: {
  value: number
  currency?: string
  className?: string
}) {
  return (
    <AnimatedCounter
      value={value}
      prefix={currency}
      decimals={2}
      separator=","
      duration={1500}
      className={cn('text-2xl font-bold', className)}
    />
  )
}