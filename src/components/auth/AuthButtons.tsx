'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type SessionInfo = {
  userId: string | null
  email: string | null
}

export default function AuthButtons() {
  const supabase = getSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({ userId: null, email: null })

  // 拉取初始会话并订阅变化
  useEffect(() => {
    // 首先获取当前会话状态
    const getCurrentSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user ?? null
        setSessionInfo({ userId: user?.id ?? null, email: (user?.email as string) ?? null })
        console.log('初始会话状态:', user?.id ? 'logged in' : 'logged out', user?.id)
      } catch (error) {
        console.error('获取会话失败:', error)
      }
    }

    getCurrentSession()

    // 订阅会话变化
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null
      setSessionInfo({ userId: user?.id ?? null, email: (user?.email as string) ?? null })
      console.log('auth event:', event, 'user:', user?.id ? 'logged in' : 'logged out')
    })

    return () => {
      try {
        data.subscription.unsubscribe()
      } catch (e) {
        console.error('unsubscribe error:', (e as any)?.message || e)
      }
    }
  }, [supabase.auth])

  // 匿名登录 - 直接使用客户端 API
  async function handleAnonSignIn() {
    setLoading(true)
    console.log('开始匿名登录...')
    
    try {
      console.log('调用 supabase.auth.signInAnonymously()')
      const { data, error } = await supabase.auth.signInAnonymously()
      
      if (error) {
        console.error('匿名登录失败:', error)
        alert(`匿名登录失败: ${error.message}`)
        
        // 如果是匿名登录未启用的错误，提供解决方案
        if (error.message.includes('Anonymous sign-ins are disabled')) {
          alert('匿名登录功能未启用。请在 Supabase 项目设置中启用匿名登录功能。')
        }
      } else {
        console.log('匿名登录成功:', data.user)
        // 会话状态会通过 onAuthStateChange 自动更新
      }
    } catch (error) {
      console.error('登录过程中发生错误:', error)
      alert(`登录过程中发生错误: ${error}`)
    } finally {
      setLoading(false)
      console.log('匿名登录流程结束')
    }
  }

  // 退出登录 - 使用服务器端 API
  async function handleSignOut() {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error('退出登录失败:', result.error)
      } else {
        console.log('退出登录成功')
        // 清除本地状态
        setSessionInfo({ userId: null, email: null })
        // 强制刷新页面以清除所有客户端状态
        window.location.reload()
      }
    } catch (error) {
      console.error('退出登录过程中发生错误:', error)
    } finally {
      setLoading(false)
    }
  }

  // 强制退出（客户端清除）
  const handleForceSignOut = () => {
    setSessionInfo({ userId: null, email: null })
    // 清除本地存储
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }

  const isAuthed = Boolean(sessionInfo.userId)

  return (
    <div className="w-full max-w-xl rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3">
        <div className="text-sm text-muted-foreground">Supabase 会话状态</div>
        <div className="mt-1 text-sm">
          <span className="font-medium">是否已登录：</span>
          <span className={isAuthed ? 'text-green-600' : 'text-gray-500'}>
            {isAuthed ? '是' : '否'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground break-all">
          <div><span className="font-medium">User ID：</span>{sessionInfo.userId ?? '-'}</div>
          <div><span className="font-medium">Email：</span>{sessionInfo.email ?? '-'}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={handleAnonSignIn}
          disabled={loading || isAuthed}
          className="min-w-[120px]"
        >
          {loading ? '登录中...' : '匿名登录'}
        </Button>
        <Button
          variant="outline"
          onClick={handleSignOut}
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading ? '退出中...' : '退出登录'}
        </Button>
        {isAuthed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleForceSignOut}
            className="text-xs"
          >
            强制退出
          </Button>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        提示：匿名登录将创建一个匿名用户会话；如需邮箱或第三方登录，可在此基础上扩展。现在请打开浏览器控制台查看详细日志。
      </p>
    </div>
  )
}