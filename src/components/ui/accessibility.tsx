"use client"

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// 跳转到主内容的链接
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
        "bg-primary text-primary-foreground px-4 py-2 rounded-md",
        "font-medium z-50 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
    >
      跳转到主内容
    </a>
  )
}

// 屏幕阅读器专用文本
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}

// 焦点陷阱组件
interface FocusTrapProps {
  children: React.ReactNode
  active?: boolean
  className?: string
}

export function FocusTrap({ children, active = true, className }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [active])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

// 实时区域组件，用于动态内容更新通知
interface LiveRegionProps {
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  className?: string
}

export function LiveRegion({ 
  children, 
  politeness = 'polite', 
  atomic = false,
  className 
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn("sr-only", className)}
    >
      {children}
    </div>
  )
}

// 高对比度模式检测
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrast(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isHighContrast
}

// 减少动画偏好检测
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// 键盘导航增强
export function useKeyboardNavigation() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true)
      }
    }

    const handleMouseDown = () => {
      setIsKeyboardUser(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return isKeyboardUser
}

// 可访问的按钮组件
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  loading?: boolean
  loadingText?: string
}

export function AccessibleButton({ 
  children, 
  loading = false, 
  loadingText = "加载中...",
  disabled,
  ...props 
}: AccessibleButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-describedby={loading ? `${props.id}-loading` : undefined}
    >
      {loading ? (
        <>
          <span aria-hidden="true">⏳</span>
          <ScreenReaderOnly>{loadingText}</ScreenReaderOnly>
        </>
      ) : (
        children
      )}
      {loading && (
        <ScreenReaderOnly id={`${props.id}-loading`}>
          {loadingText}
        </ScreenReaderOnly>
      )}
    </button>
  )
}

// 可访问的表单字段
interface AccessibleFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  id: string
}

export function AccessibleField({ 
  label, 
  error, 
  hint, 
  required, 
  children, 
  id 
}: AccessibleFieldProps) {
  const errorId = error ? `${id}-error` : undefined
  const hintId = hint ? `${id}-hint` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ')

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="必填">
            *
          </span>
        )}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      
      {React.cloneElement(children as React.ReactElement, {
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? 'true' : undefined,
        'aria-required': required
      })}
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// 可访问的模态框
interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function AccessibleModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className 
}: AccessibleModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      modalRef.current?.focus()
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <FocusTrap active={isOpen}>
        <div
          ref={modalRef}
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-lg p-6 bg-background border rounded-lg shadow-lg",
            "focus:outline-none",
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="modal-title" className="text-lg font-semibold mb-4">
            {title}
          </h2>
          {children}
        </div>
      </FocusTrap>
    </div>
  )
}