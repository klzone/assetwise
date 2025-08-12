'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  type: 'error' | 'warning' | 'info';
  source?: string;
}

export function ErrorLogger() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const errorLogs: ErrorLog[] = [];

    // 捕获全局错误
    const handleError = (event: ErrorEvent) => {
      const errorLog: ErrorLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: event.message,
        stack: event.error?.stack,
        type: 'error',
        source: event.filename
      };
      errorLogs.push(errorLog);
      setErrors([...errorLogs]);
      console.error('捕获到错误:', errorLog);
    };

    // 捕获未处理的Promise拒绝
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorLog: ErrorLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: `Unhandled Promise Rejection: ${event.reason}`,
        type: 'error',
        source: 'Promise'
      };
      errorLogs.push(errorLog);
      setErrors([...errorLogs]);
      console.error('捕获到Promise拒绝:', errorLog);
    };

    // 重写console.error来捕获所有错误
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorLog: ErrorLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: args.join(' '),
        type: 'error',
        source: 'console'
      };
      errorLogs.push(errorLog);
      setErrors([...errorLogs]);
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, []);

  const clearErrors = () => {
    setErrors([]);
  };

  const exportErrors = () => {
    const errorData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errors: errors
    };
    
    const blob = new Blob([JSON.stringify(errorData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assetwise-errors-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible && errors.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          🐛 调试工具
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden">
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-red-800">
              错误日志 ({errors.length})
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={exportErrors}
                className="h-6 px-2 text-xs"
                disabled={errors.length === 0}
              >
                导出
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearErrors}
                className="h-6 px-2 text-xs"
              >
                清空
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 px-2 text-xs"
              >
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 max-h-64 overflow-y-auto">
          {errors.length === 0 ? (
            <p className="text-sm text-gray-500">暂无错误</p>
          ) : (
            <div className="space-y-2">
              {errors.slice(-10).map((error) => (
                <div key={error.id} className="border-l-2 border-red-400 pl-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={error.type === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                      {error.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-red-700 break-words">
                    {error.message}
                  </p>
                  {error.source && (
                    <p className="text-xs text-gray-500 mt-1">
                      来源: {error.source}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
