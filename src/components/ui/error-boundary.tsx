"use client"

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// 默认错误回退组件
function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="modern-card max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">出现了一些问题</CardTitle>
          <CardDescription>
            应用遇到了意外错误，请尝试刷新页面或联系技术支持
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-mono text-muted-foreground">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="flex-1"
            >
              刷新页面
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 图表错误回退组件
export function ChartErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <Card className="modern-card">
      <CardContent className="p-6 text-center">
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">图表加载失败</h3>
        <p className="text-sm text-muted-foreground mb-4">
          无法显示图表数据，请检查网络连接或稍后重试
        </p>
        <Button size="sm" onClick={resetError}>
          <RefreshCw className="h-4 w-4 mr-2" />
          重新加载
        </Button>
      </CardContent>
    </Card>
  )
}

// 页面错误回退组件
export function PageErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">页面加载失败</h2>
          <p className="text-muted-foreground">
            页面内容无法正常显示，请尝试刷新或返回首页
          </p>
        </div>
        {error && (
          <div className="max-w-md mx-auto p-3 bg-muted rounded-lg">
            <p className="text-sm font-mono text-muted-foreground">
              {error.message}
            </p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={resetError}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            返回首页
          </Button>
        </div>
      </div>
    </div>
  )
}