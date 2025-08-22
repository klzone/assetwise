'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Cloud,
  Download,
  Database,
  TrendingUp,
  Calendar,
  FileText,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Play,
  RotateCcw,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useCloudDataDownload } from '@/hooks/useCloudDataDownload';
import { dataSyncHelper } from '@/lib/data-sync-helper';

interface CloudDataDownloadDialogProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
}

export function CloudDataDownloadDialog({ children, trigger }: CloudDataDownloadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    // 状态
    isDownloading,
    isPaused,
    isConnected,
    downloadItems,
    overallProgress,
    downloadStats,
    isLoading,
    error,
    
    // 操作
    initializeDownloadItems,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    resetDownload,
    retryFailedItems,
    refreshData,
    
    // 工具函数
    formatFileSize,
    formatTime,
    getTypeIcon,
    getStatusColor
  } = useCloudDataDownload();

  // 当对话框打开时初始化数据
  useEffect(() => {
    if (isOpen && downloadItems.length === 0) {
      initializeDownloadItems();
    }
  }, [isOpen, downloadItems.length, initializeDownloadItems]);

  // 检查是否所有项目都已完成
  const allCompleted = downloadItems.length > 0 && downloadItems.every(item => item.status === 'completed');

  // 当下载完成时自动加载数据到应用
  useEffect(() => {
    if (allCompleted && !isLoading) {
      const loadDataToApp = async () => {
        try {
          const result = await dataSyncHelper.loadCloudDataToApp();
          if (result.success) {
            console.log('✅ 云端数据已自动加载到应用:', result.message);
          } else {
            console.warn('⚠️ 加载云端数据时出现问题:', result.message);
          }
        } catch (error) {
          console.error('❌ 自动加载云端数据失败:', error);
        }
      };

      // 延迟一秒后加载，确保下载状态稳定
      const timer = setTimeout(loadDataToApp, 1000);
      return () => clearTimeout(timer);
    }
  }, [allCompleted, isLoading]);

  // 获取图标组件
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      Database,
      TrendingUp,
      Calendar,
      FileText,
      Cloud,
      Settings
    };
    const IconComponent = iconMap[iconName] || Database;
    return <IconComponent className="w-4 h-4" />;
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'downloading':
        return <Download className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  // 处理开始下载
  const handleStartDownload = async () => {
    console.log('点击开始下载按钮');
    console.log('当前状态:', { isDownloading, downloadItems: downloadItems.length, isConnected });
    
    try {
      await startDownload();
      console.log('下载开始成功');
    } catch (error) {
      console.error('开始下载失败:', error);
    }
  };

  // 处理刷新数据
  const handleRefreshData = async () => {
    try {
      await refreshData();
    } catch (error) {
      console.error('刷新数据失败:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Cloud className="w-5 h-5" />
            <span>下载云端数据</span>
            {!isConnected && <WifiOff className="w-4 h-4 text-red-500" />}
            {isConnected && <Wifi className="w-4 h-4 text-green-500" />}
          </DialogTitle>
          <DialogDescription>
            从 Supabase 云端同步您的账户数据和资源到本地设备
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col max-h-[calc(90vh-120px)]">
          {/* 可滚动内容区域 */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 font-medium">错误</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            )}

            {/* 加载状态 */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span>正在加载数据项目...</span>
              </div>
            )}

            {/* 整体进度 */}
            {!isLoading && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>同步进度</span>
                    <Badge variant={isDownloading ? "default" : "secondary"}>
                      {isDownloading ? '同步中' : isPaused ? '已暂停' : '就绪'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>整体进度</span>
                      <span>{Math.round(overallProgress)}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-lg">{downloadStats.totalItems}</div>
                      <div className="text-muted-foreground">总项目</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg text-green-600">{downloadStats.completedItems}</div>
                      <div className="text-muted-foreground">已完成</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg text-red-600">{downloadStats.failedItems}</div>
                      <div className="text-muted-foreground">失败</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg">{formatFileSize(downloadStats.totalSize)}</div>
                      <div className="text-muted-foreground">总大小</div>
                    </div>
                  </div>

                  {downloadStats.speed > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>下载速度: {formatFileSize(downloadStats.speed)}/s</span>
                      <span>预计剩余: {formatTime(downloadStats.estimatedTime)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 下载项目列表 */}
            {!isLoading && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>数据项目</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshData}
                      disabled={isDownloading}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      刷新
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {downloadItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>暂无可下载的数据项目</p>
                      <p className="text-sm mt-1">请确保您已登录并有数据存储在云端</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      <div className="space-y-3">
                        {downloadItems.map((item) => (
                          <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                            <div className="flex-shrink-0">
                              {getIconComponent(getTypeIcon(item.type))}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium truncate">{item.name}</h4>
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(item.status)}
                                  <Badge variant="outline" className="text-xs">
                                    {item.count > 0 ? `${item.count} 项` : ''}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                                <span>{formatFileSize(item.size)}</span>
                                {item.lastUpdated && (
                                  <span>更新于 {new Date(item.lastUpdated).toLocaleDateString()}</span>
                                )}
                              </div>
                              
                              {item.status === 'downloading' && (
                                <div className="mt-2">
                                  <Progress value={item.progress} className="h-1" />
                                </div>
                              )}
                              
                              {item.error && (
                                <div className="mt-1 text-xs text-red-500 truncate">
                                  错误: {item.error}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 固定在底部的操作区域 */}
          <div className="flex-shrink-0 pt-4 border-t bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {!isConnected && (
                  <Badge variant="destructive" className="flex items-center space-x-1">
                    <WifiOff className="w-3 h-3" />
                    <span>网络断开</span>
                  </Badge>
                )}
                
                {downloadStats.failedItems > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryFailedItems}
                    disabled={isDownloading}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重试失败项目
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isDownloading}
                >
                  关闭
                </Button>
                
                {isDownloading ? (
                  <Button onClick={pauseDownload} variant="secondary">
                    <Pause className="w-4 h-4 mr-2" />
                    暂停
                  </Button>
                ) : isPaused ? (
                  <Button onClick={resumeDownload}>
                    <Play className="w-4 h-4 mr-2" />
                    继续
                  </Button>
                ) : allCompleted ? (
                  <Button 
                    variant="outline"
                    disabled
                  >
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    下载完成
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStartDownload}
                    disabled={!isConnected || downloadStats.totalItems === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    开始下载
                  </Button>
                )}
                
                {(isPaused || downloadStats.completedItems > 0) && (
                  <Button
                    variant="outline"
                    onClick={resetDownload}
                    disabled={isDownloading}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重置
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}