"use client"

import React, { useState } from 'react'
import { ModernSidebar } from './modern-sidebar'
import { ModernHeader } from './modern-header'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
  className?: string
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  // 点击内容区域时自动收缩侧边栏（仅桌面端）
  const handleContentClick = (e: React.MouseEvent) => {
    // 确保点击的不是侧边栏本身
    const target = e.target as HTMLElement
    if (target.closest('[data-sidebar]')) {
      return
    }
    
    // 桌面端且侧边栏展开时才收缩
    if (window.innerWidth >= 1024 && !isCollapsed) {
      setIsCollapsed(true)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 移动端遮罩层 */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={handleMobileMenuClose}
        />
      )}
      
      {/* 侧边栏 */}
      <ModernSidebar 
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={handleMobileMenuClose}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      
      {/* 主内容区域 */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:pl-16" : "lg:pl-72",
        "pl-0" // 移动端无左边距
      )}>
        {/* 顶部标题栏 */}
        <ModernHeader 
          onMobileMenuToggle={handleMobileMenuToggle}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        
        {/* 页面内容 */}
        <main 
          className={cn(
            "container-padding section-padding min-h-[calc(100vh-4rem)]",
            "animate-fade-in",
            className
          )}
          onClick={handleContentClick}
        >
          {children}
        </main>
      </div>
    </div>
  )
}