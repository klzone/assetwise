'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { errorHandler, logger } from '@/lib/services/error-handler.service';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
  userId?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { context = 'ErrorBoundary', userId } = this.props;
    
    // 报告错误到错误处理服务
    const errorId = errorHandler.reportError(
      error,
      context,
      userId,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      }
    );

    // 记录详细的错误信息
    logger.error(
      `Error caught by ErrorBoundary: ${error.message}`,
      context,
      {
        errorId,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
      userId
    );

    this.setState({
      error,
      errorId,
      errorInfo,
    });
  }

  handleRetry = () => {
    logger.info('User triggered error boundary retry', this.props.context);
    this.setState({ hasError: false, error: undefined, errorId: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    logger.info('User navigated home from error boundary', this.props.context);
    window.location.href = '/dashboard';
  };

  handleReportBug = () => {
    const { error, errorId } = this.state;
    logger.info('User reported bug from error boundary', this.props.context, { errorId });
    
    // 在实际应用中，这里可以打开bug报告表单或发送到外部服务
    if (errorId) {
      alert(`错误已记录，错误ID: ${errorId}\n请联系技术支持并提供此ID。`);
    }
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-red-600">
                应用程序遇到错误
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  很抱歉，应用程序遇到了意外错误。我们已经记录了这个问题，并会尽快修复。
                </AlertDescription>
              </Alert>

              {errorId && (
                <Alert>
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    错误ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{errorId}</code>
                    <br />
                    请保存此ID以便技术支持协助您解决问题。
                  </AlertDescription>
                </Alert>
              )}

              {isDevelopment && error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">开发模式 - 错误详情:</h4>
                  <div className="text-sm text-red-700 space-y-2">
                    <div>
                      <strong>错误消息:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>堆栈跟踪:</strong>
                        <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4" />
                  重试
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Home className="h-4 w-4" />
                  返回首页
                </Button>
                
                <Button
                  onClick={this.handleReportBug}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Bug className="h-4 w-4" />
                  报告问题
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                如果问题持续存在，请联系技术支持：support@assetwise.com
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// 便捷的HOC包装器
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: string
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary context={context}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// 用于函数组件的Hook
export function useErrorHandler(context?: string) {
  const reportError = React.useCallback(
    (error: Error, additionalData?: any) => {
      return errorHandler.reportError(error, context || 'useErrorHandler', undefined, additionalData);
    },
    [context]
  );

  const handleAsyncError = React.useCallback(
    async (
      asyncFn: () => Promise<unknown>,
      errorMessage?: string
    ): Promise<unknown | null> => {
      try {
        return await asyncFn();
      } catch (error) {
        const errorId = reportError(
          error instanceof Error ? error : new Error(String(error)),
          { asyncOperation: true, customMessage: errorMessage }
        );

        logger.error(
          errorMessage || 'Async operation failed',
          context,
          { errorId }
        );

        return null;
      }
    },
    [reportError, context]
  );

  return {
    reportError,
    handleAsyncError,
  };
}

export default ErrorBoundary;
