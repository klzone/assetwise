"use client"

import React, { useState, useEffect } from 'react'
import { 
  User, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Database,
  Upload,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

interface AuthStatus {
  isLoggedIn: boolean
  user: any
  error: string | null
}

interface SyncStatus {
  localAssets: number
  cloudAssets: number
  lastSync: string
  canSync: boolean
}

export function AuthStatusChecker() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isLoggedIn: false,
    user: null,
    error: null
  })
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    localAssets: 0,
    cloudAssets: 0,
    lastSync: '从未同步',
    canSync: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  // 检查认证状态
  const checkAuthStatus = async () => {
    setIsLoading(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        setAuthStatus({
          isLoggedIn: false,
          user: null,
          error: error.message
        })
      } else if (user) {
        setAuthStatus({
          isLoggedIn: true,
          user: user,
          error: null
        })
        
        // 如果用户已登录，检查同步状态
        await checkSyncStatus(supabase, user)
      } else {
        setAuthStatus({
          isLoggedIn: false,
          user: null,
          error: '用户未登录'
        })
      }
    } catch (error) {
      setAuthStatus({
        isLoggedIn: false,
        user: null,
        error: `检查失败: ${error}`
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 检查同步状态
  const checkSyncStatus = async (supabase: any, user: any) => {
    try {
      // 检查本地数据
      const localData = localStorage.getItem('assetwise_assets')
      const localAssets = localData ? JSON.parse(localData).assets?.length || 0 : 0
      
      // 检查云端数据
      const { data: cloudAssets, error } = await supabase
        .from('assets')
        .select('id')
        .eq('user_id', user.id)
      
      const cloudCount = error ? 0 : (cloudAssets?.length || 0)
      
      // 检查最后同步时间
      const lastSyncTime = localStorage.getItem('assetwise_sync_timestamp')
      const lastSync = lastSyncTime 
        ? new Date(parseInt(lastSyncTime)).toLocaleString('zh-CN')
        : '从未同步'
      
      setSyncStatus({
        localAssets,
        cloudAssets: cloudCount,
        lastSync,
        canSync: localAssets > 0 && !error
      })
    } catch (error) {
      console.error('检查同步状态失败:', error)
    }
  }

  // 测试同步功能
  const testSync = async () => {
    if (!authStatus.isLoggedIn) {
      alert('请先登录后再测试同步功能')
      return
    }

    setIsTesting(true)
    try {
      const { assetStorage } = await import('@/lib/asset-storage')
      const localAssets = assetStorage.getLocalAssets()
      
      if (localAssets.length === 0) {
        alert('本地没有资产数据，无法测试同步')
        return
      }

      console.log('开始测试同步，本地资产数量:', localAssets.length)
      const success = await assetStorage.syncToCloud(localAssets)
      
      if (success) {
        alert('同步测试成功！请检查云端数据库')
        // 重新检查状态
        await checkAuthStatus()
      } else {
        alert('同步测试失败，请查看控制台日志')
      }
    } catch (error) {
      console.error('测试同步失败:', error)
      alert(`测试同步失败: ${error}`)
    } finally {
      setIsTesting(false)
    }
  }

  // 组件加载时检查状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            用户认证状态
          </CardTitle>
          <CardDescription>
            检查用户登录状态和 Supabase 连接
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">登录状态</span>
            <Badge variant={authStatus.isLoggedIn ? "default" : "destructive"}>
              {authStatus.isLoggedIn ? "已登录" : "未登录"}
            </Badge>
          </div>
          
          {authStatus.user && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">用户邮箱</span>
                <span className="text-sm text-muted-foreground">{authStatus.user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">用户ID</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {authStatus.user.id.substring(0, 8)}...
                </span>
              </div>
            </>
          )}
          
          {authStatus.error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authStatus.error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={checkAuthStatus} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            刷新状态
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            数据同步状态
          </CardTitle>
          <CardDescription>
            检查本地和云端数据同步情况
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{syncStatus.localAssets}</div>
              <div className="text-sm text-muted-foreground">本地资产</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{syncStatus.cloudAssets}</div>
              <div className="text-sm text-muted-foreground">云端资产</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">最后同步</span>
            <span className="text-sm text-muted-foreground">{syncStatus.lastSync}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">同步状态</span>
            <Badge variant={syncStatus.localAssets === syncStatus.cloudAssets ? "default" : "secondary"}>
              {syncStatus.localAssets === syncStatus.cloudAssets ? "已同步" : "需要同步"}
            </Badge>
          </div>
          
          {syncStatus.localAssets !== syncStatus.cloudAssets && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                本地有 {syncStatus.localAssets} 个资产，云端有 {syncStatus.cloudAssets} 个资产。
                数据不一致，建议执行同步操作。
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={testSync} 
              disabled={!syncStatus.canSync || isTesting || !authStatus.isLoggedIn}
              size="sm"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              测试同步
            </Button>
            
            <Button 
              onClick={checkAuthStatus} 
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              刷新数据
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>调试建议</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p className="font-medium">如果同步失败，请按以下步骤排查：</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>确保用户已登录（上方显示"已登录"状态）</li>
              <li>检查网络连接是否正常</li>
              <li>查看浏览器控制台是否有错误信息</li>
              <li>确认 Supabase 项目配置正确</li>
              <li>检查数据库表结构是否最新</li>
            </ol>
          </div>
          
          <Separator />
          
          <div className="text-sm">
            <p className="font-medium mb-2">开发者工具调试：</p>
            <code className="text-xs bg-muted p-2 rounded block">
              打开控制台 → 运行: localStorage.getItem('assetwise_assets')
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}