'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  resetError?: () => void;
  context?: string;
}

export function ErrorFallback({ error, errorInfo, resetError, context }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReportError = () => {
    // 这里可以实现错误报告功能
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    console.log('Error Report:', errorReport);
    
    // 可以发送到错误监控服务
    // errorReportingService.report(errorReport);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            应用遇到了问题
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {context ? `在 ${context} 中发生了错误` : '应用运行时发生了意外错误'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 错误信息 */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {error.message || '未知错误'}
            </AlertDescription>
          </Alert>

          {/* 开发环境下显示详细错误信息 */}
          {isDevelopment && (
            <div className="space-y-4">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                  查看错误详情
                </summary>
                <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                </div>
              </details>

              {errorInfo && (
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                    查看组件堆栈
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto max-h-40">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3">
            {resetError && (
              <Button onClick={resetError} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                重试
              </Button>
            )}
            
            <Button onClick={handleReload} variant="outline" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新页面
            </Button>
            
            <Button onClick={handleGoHome} variant="outline" className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>

          {/* 报告错误按钮 */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              onClick={handleReportError} 
              variant="ghost" 
              size="sm"
              className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <Bug className="w-4 h-4 mr-2" />
              报告此问题
            </Button>
          </div>

          {/* 帮助信息 */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>如果问题持续存在，请联系技术支持</p>
            <p className="mt-1">错误ID: {Date.now().toString(36)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 简化版错误回退组件
export function SimpleErrorFallback({ error, resetError }: { error: Error; resetError?: () => void }) {
  return (
    <div className="p-6 text-center">
      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        出现了问题
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {error.message || '发生了未知错误'}
      </p>
      {resetError && (
        <Button onClick={resetError} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          重试
        </Button>
      )}
    </div>
  );
}

// 网络错误专用组件
export function NetworkErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="p-6 text-center">
      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        网络连接问题
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        请检查您的网络连接并重试
      </p>
      {onRetry && (
        <Button onClick={onRetry} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          重新连接
        </Button>
      )}
    </div>
  );
}

// 数据加载错误组件
export function DataLoadErrorFallback({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="p-6 text-center">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        数据加载失败
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {message || '无法加载数据，请稍后重试'}
      </p>
      {onRetry && (
        <Button onClick={onRetry} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          重新加载
        </Button>
      )}
    </div>
  );
}
