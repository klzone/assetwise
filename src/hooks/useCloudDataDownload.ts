import { useState, useEffect, useCallback, useRef } from 'react';
import { cloudDataDownloadService, DownloadItem, DownloadStats } from '@/lib/services/cloud-data-download.service';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const useCloudDataDownload = () => {
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [downloadStats, setDownloadStats] = useState<DownloadStats>({
    totalItems: 0,
    completedItems: 0,
    failedItems: 0,
    totalSize: 0,
    downloadedSize: 0,
    startTime: null,
    estimatedTime: 0,
    speed: 0
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 用于跟踪下载状态的引用
  const downloadRef = useRef({
    isDownloading: false,
    isPaused: false
  });

  // 检查网络连接状态
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
    };

    // 初始检查
    checkConnection();

    // 添加网络状态监听器
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  // 初始化下载项目
  const initializeDownloadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 检查用户是否已登录
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('请先登录后再下载云端数据');
        setDownloadItems([]);
        return;
      }
      
      const items = await cloudDataDownloadService.getAvailableItems();
      setDownloadItems(items);
      setDownloadStats(prev => ({
        ...prev,
        totalItems: items.length,
        totalSize: items.reduce((sum, item) => sum + item.size, 0)
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取下载项目失败';
      setError(errorMessage);
      console.error('初始化下载项目失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 监听下载进度
  useEffect(() => {
    const unsubscribe = cloudDataDownloadService.onProgress((progress) => {
      setDownloadItems(prev => prev.map(item => 
        item.id === progress.itemId 
          ? { ...item, status: progress.status, progress: progress.progress, error: progress.error }
          : item
      ));

      // 更新统计信息
      setDownloadStats(prev => {
        const completedItems = downloadItems.filter(item => item.status === 'completed').length;
        const failedItems = downloadItems.filter(item => item.status === 'error').length;
        const downloadedSize = downloadItems
          .filter(item => item.status === 'completed')
          .reduce((sum, item) => sum + item.size, 0);

        return {
          ...prev,
          completedItems,
          failedItems,
          downloadedSize
        };
      });
    });

    return unsubscribe;
  }, [downloadItems]);

  // 开始下载所有项目
  const startDownload = useCallback(async () => {
    if (isDownloading || !isConnected) return;

    setIsDownloading(true);
    setIsPaused(false);
    setError(null);
    
    // 更新引用值
    downloadRef.current = {
      isDownloading: true,
      isPaused: false
    };
    
    setDownloadStats(prev => ({
      ...prev,
      startTime: new Date(),
      completedItems: 0,
      failedItems: 0,
      downloadedSize: 0
    }));

    try {
      const pendingItems = downloadItems.filter(item => item.status === 'pending');
      await cloudDataDownloadService.downloadAll(pendingItems);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '下载失败';
      setError(errorMessage);
      console.error('下载失败:', err);
    } finally {
      if (!downloadRef.current.isPaused) {
        setIsDownloading(false);
      }
    }
  }, [downloadItems, isDownloading, isConnected]);

  // 下载单个项目
  const downloadSingleItem = useCallback(async (itemId: string) => {
    try {
      await cloudDataDownloadService.downloadItem(itemId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '下载失败';
      setError(errorMessage);
      console.error('下载单个项目失败:', err);
    }
  }, []);

  // 重试失败的项目
  const retryFailedItems = useCallback(async () => {
    const failedItems = downloadItems.filter(item => item.status === 'error');
    
    for (const item of failedItems) {
      // 重置状态为 pending
      setDownloadItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'pending', progress: 0, error: undefined } : i
      ));
      
      try {
        await cloudDataDownloadService.downloadItem(item.id);
      } catch (err) {
        console.error(`重试项目 ${item.id} 失败:`, err);
      }
    }
  }, [downloadItems]);

  // 暂停下载
  const pauseDownload = useCallback(() => {
    cloudDataDownloadService.cancelDownload();
    setIsDownloading(false);
    setIsPaused(true);
    
    // 更新引用值
    downloadRef.current = {
      isDownloading: false,
      isPaused: true
    };
    
    // 重置所有正在下载的项目状态
    setDownloadItems(prev => prev.map(item => 
      item.status === 'downloading' 
        ? { ...item, status: 'pending', progress: 0 }
        : item
    ));
  }, []);
  
  // 恢复下载
  const resumeDownload = useCallback(() => {
    if (!isConnected) return;
    
    setIsDownloading(true);
    setIsPaused(false);
    
    // 更新引用值
    downloadRef.current = {
      isDownloading: true,
      isPaused: false
    };
    
    // 重新开始下载
    startDownload();
  }, [isConnected, startDownload]);
  
  // 取消下载
  const cancelDownload = useCallback(() => {
    cloudDataDownloadService.cancelDownload();
    setIsDownloading(false);
    setIsPaused(false);
    
    // 更新引用值
    downloadRef.current = {
      isDownloading: false,
      isPaused: false
    };
    
    // 重置所有正在下载的项目状态
    setDownloadItems(prev => prev.map(item => 
      item.status === 'downloading' 
        ? { ...item, status: 'pending', progress: 0 }
        : item
    ));
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 重置所有状态
  const reset = useCallback(() => {
    setDownloadItems([]);
    setDownloadStats({
      totalItems: 0,
      completedItems: 0,
      failedItems: 0,
      totalSize: 0,
      downloadedSize: 0,
      startTime: null,
      estimatedTime: 0,
      speed: 0
    });
    setIsDownloading(false);
    setIsLoading(false);
    setError(null);
  }, []);

  // 计算总体进度
  const overallProgress = downloadItems.length > 0 
    ? Math.round((downloadItems.reduce((sum, item) => sum + item.progress, 0) / downloadItems.length))
    : 0;

  // 检查是否所有项目都已完成
  const isAllCompleted = downloadItems.length > 0 && 
    downloadItems.every(item => item.status === 'completed' || item.status === 'skipped');

  // 检查是否有失败的项目
  const hasFailedItems = downloadItems.some(item => item.status === 'error');

  // 格式化文件大小的工具函数
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 格式化时间的工具函数
  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
    return `${Math.round(seconds / 3600)}小时`;
  }, []);

  // 获取类型图标
  const getTypeIcon = useCallback((type: string): string => {
    const iconMap: { [key: string]: string } = {
      'assets': 'Database',
      'transactions': 'TrendingUp',
      'plans': 'Calendar',
      'reviews': 'FileText',
      'settings': 'Settings'
    };
    return iconMap[type] || 'Database';
  }, []);

  // 获取状态颜色
  const getStatusColor = useCallback((status: string): string => {
    const colorMap: { [key: string]: string } = {
      'pending': 'gray',
      'downloading': 'blue',
      'completed': 'green',
      'error': 'red',
      'skipped': 'yellow'
    };
    return colorMap[status] || 'gray';
  }, []);

  return {
    // 状态
    downloadItems,
    downloadStats,
    isDownloading,
    isPaused,
    isConnected,
    isLoading,
    error,
    overallProgress,
    isAllCompleted,
    hasFailedItems,

    // 操作
    initializeDownloadItems,
    startDownload,
    downloadSingleItem,
    retryFailedItems,
    cancelDownload,
    clearError,
    reset,
    pauseDownload,
    resumeDownload,
    resetDownload: reset,
    refreshData: initializeDownloadItems,

    // 工具函数
    formatFileSize,
    formatTime,
    getTypeIcon,
    getStatusColor
  };
};