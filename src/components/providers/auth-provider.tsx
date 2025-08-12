'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initializeAuth } = useUserStore()

  useEffect(() => {
    // 初始化认证状态
    initializeAuth()
  }, [initializeAuth])

  return <>{children}</>
}
