import { useCallback, useEffect, useState } from 'react';
import { errorHandler } from '@/lib/services/error-handler.service';

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  context: string | null;
  retryCount: number;
}

export interface ErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  context?: string;
  onError?: (error: Error, errorId: string) => void;
  onRetry?: (retryCount: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    context = 'Unknown',
    onError,
    onRetry,
    onMaxRetriesReached
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorId: null,
    context: null,
    retryCount: 0
  });

  // 处理错误
  const handleError = useCallback((error: Error, errorContext?: string) => {
    const errorId = errorHandler.reportError(
      error,
      errorContext || context,
      undefined,
      { retryCount: errorState.retryCount }
    );

    setErrorState(prev => ({
      hasError: true,
      error,
      errorId,
      context: errorContext || context,
      retryCount: prev.retryCount
    }));

    onError?.(error, errorId);
  }, [context, errorState.retryCount, onError]);

  // 重试操作
  const retry = useCallback(async (operation?: () => Promise<void> | void) => {
    if (errorState.retryCount >= maxRetries) {
      onMaxRetriesReached?.(errorState.error!);
      return false;
    }

    setErrorState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1
    }));

    onRetry?.(errorState.retryCount + 1);

    // 延迟重试
    if (retryDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    try {
      if (operation) {
        await operation();
      }
      
      // 重试成功，清除错误状态
      clearError();
      return true;
    } catch (error) {
      handleError(error as Error);
      return false;
    }
  }, [errorState.retryCount, maxRetries, retryDelay, onRetry, onMaxRetriesReached, handleError]);

  // 清除错误状态
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorId: null,
      context: null,
      retryCount: 0
    });
  }, []);

  // 包装异步操作
  const wrapAsync = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    errorContext?: string
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        const result = await fn(...args);
        // 成功时清除错误状态
        if (errorState.hasError) {
          clearError();
        }
        return result;
      } catch (error) {
        handleError(error as Error, errorContext);
        return null;
      }
    };
  }, [errorState.hasError, handleError, clearError]);

  // 包装同步操作
  const wrapSync = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    errorContext?: string
  ) => {
    return (...args: T): R | null => {
      try {
        const result = fn(...args);
        // 成功时清除错误状态
        if (errorState.hasError) {
          clearError();
        }
        return result;
      } catch (error) {
        handleError(error as Error, errorContext);
        return null;
      }
    };
  }, [errorState.hasError, handleError, clearError]);

  // 检查是否可以重试
  const canRetry = errorState.retryCount < maxRetries;

  // 获取错误信息
  const getErrorMessage = useCallback(() => {
    if (!errorState.error) return null;
    
    // 根据错误类型返回用户友好的消息
    if (errorState.error.name === 'NetworkError') {
      return '网络连接失败，请检查您的网络设置';
    }
    
    if (errorState.error.message.includes('fetch')) {
      return '数据获取失败，请稍后重试';
    }
    
    if (errorState.error.message.includes('permission')) {
      return '权限不足，请联系管理员';
    }
    
    return errorState.error.message || '发生了未知错误';
  }, [errorState.error]);

  return {
    // 错误状态
    ...errorState,
    canRetry,
    
    // 操作方法
    handleError,
    retry,
    clearError,
    wrapAsync,
    wrapSync,
    getErrorMessage
  };
}

// 网络错误专用Hook
export function useNetworkErrorHandler() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState<Error | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError(new Error('网络连接已断开'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkNetworkAndExecute = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    if (!isOnline) {
      setNetworkError(new Error('网络连接不可用'));
      return null;
    }

    try {
      const result = await operation();
      setNetworkError(null);
      return result;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setNetworkError(new Error('网络请求失败'));
      } else {
        setNetworkError(error as Error);
      }
      return null;
    }
  }, [isOnline]);

  return {
    isOnline,
    networkError,
    checkNetworkAndExecute,
    clearNetworkError: () => setNetworkError(null)
  };
}

// 数据加载错误Hook
export function useDataLoadingError() {
  const [loadingErrors, setLoadingErrors] = useState<Map<string, Error>>(new Map());

  const setLoadingError = useCallback((key: string, error: Error) => {
    setLoadingErrors(prev => new Map(prev).set(key, error));
  }, []);

  const clearLoadingError = useCallback((key: string) => {
    setLoadingErrors(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const clearAllLoadingErrors = useCallback(() => {
    setLoadingErrors(new Map());
  }, []);

  const hasLoadingError = useCallback((key: string) => {
    return loadingErrors.has(key);
  }, [loadingErrors]);

  const getLoadingError = useCallback((key: string) => {
    return loadingErrors.get(key) || null;
  }, [loadingErrors]);

  return {
    loadingErrors,
    setLoadingError,
    clearLoadingError,
    clearAllLoadingErrors,
    hasLoadingError,
    getLoadingError
  };
}
