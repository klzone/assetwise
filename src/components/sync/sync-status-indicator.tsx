/**
 * 同步状态指示器组件
 * 显示同步状态、提供手动同步按钮、显示同步结果
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react';
import { useAutoSync } from '@/hooks/useAutoSync';
import { cn } from '@/lib/utils';

export interface SyncStatusIndicatorProps {
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 是否显示手动同步按钮 */
  showSyncButton?: boolean;
  /** 是否启用自动同步 */
  enableAutoSync?: boolean;
  /** 组件大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 显示位置 */
  position?: 'inline' | 'floating';
  /** 自定义类名 */
  className?: string;
}

export function SyncStatusIndicator({
  showDetails = true,
  showSyncButton = true,
  enableAutoSync = false,
  size = 'md',
  position = 'inline',
  className
}: SyncStatusIndicatorProps) {
  const {
    isSyncing,
    lastSyncResult,
    lastSyncTime,
    hasChangesToSync,
    triggerSync,
    enableAutoSync: enableAutoSyncFunc,
    disableAutoSync,
    resetSyncState
  } = useAutoSync({
    enableAutoSync,
    syncOnMount: false,
    syncOnDataChange: true
  });

  /**
   * 获取同步状态信息
   */
  const getSyncStatus = () => {
    if (isSyncing) {
      return {
        status: 'syncing',
        icon: RefreshCw,
        color: 'blue',
        text: '同步中...',
        description: '正在同步数据到云端'
      };
    }

    if (hasChangesToSync) {
      return {
        status: 'pending',
        icon: AlertTriangle,
        color: 'yellow',
        text: '待同步',
        description: '有数据变化需要同步'
      };
    }

    if (lastSyncResult?.success) {
      return {
        status: 'success',
        icon: CheckCircle,
        color: 'green',
        text: '已同步',
        description: '数据已成功同步'
      };
    }

    if (lastSyncResult?.success === false) {
      return {
        status: 'error',
        icon: XCircle,
        color: 'red',
        text: '同步失败',
        description: '数据同步失败'
      };
    }

    return {
      status: 'idle',
      icon: Cloud,
      color: 'gray',
      text: '未同步',
      description: '尚未进行数据同步'
    };
  };

  const syncStatus = getSyncStatus();
  const StatusIcon = syncStatus.icon;

  /**
   * 格式化时间
   */
  const formatTime = (date: Date | null) => {
    if (!date) return '从未';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // 小于1分钟
      return '刚刚';
    } else if (diff < 3600000) { // 小于1小时
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 小于1天
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  /**
   * 处理手动同步
   */
  const handleManualSync = async () => {
    await triggerSync();
  };

  /**
   * 切换自动同步
   */
  const toggleAutoSync = () => {
    if (enableAutoSync) {
      disableAutoSync();
    } else {
      enableAutoSyncFunc();
    }
  };

  // 根据大小设置样式
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  // 简化版本（只显示状态图标）
  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={showSyncButton ? handleManualSync : undefined}
              disabled={isSyncing}
              className={cn(
                'p-1',
                position === 'floating' && 'fixed bottom-4 right-4 z-50 rounded-full shadow-lg',
                className
              )}
            >
              <StatusIcon 
                className={cn(
                  iconSizes[size],
                  isSyncing && 'animate-spin',
                  syncStatus.color === 'blue' && 'text-blue-500',
                  syncStatus.color === 'green' && 'text-green-500',
                  syncStatus.color === 'yellow' && 'text-yellow-500',
                  syncStatus.color === 'red' && 'text-red-500',
                  syncStatus.color === 'gray' && 'text-gray-500'
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{syncStatus.text}</p>
              <p className="text-xs text-muted-foreground">{syncStatus.description}</p>
              {lastSyncTime && (
                <p className="text-xs text-muted-foreground">
                  最后同步: {formatTime(lastSyncTime)}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 详细版本
  return (
    <Card className={cn(
      'w-full',
      position === 'floating' && 'fixed bottom-4 right-4 z-50 w-80 shadow-lg',
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon 
              className={cn(
                iconSizes[size],
                isSyncing && 'animate-spin',
                syncStatus.color === 'blue' && 'text-blue-500',
                syncStatus.color === 'green' && 'text-green-500',
                syncStatus.color === 'yellow' && 'text-yellow-500',
                syncStatus.color === 'red' && 'text-red-500',
                syncStatus.color === 'gray' && 'text-gray-500'
              )}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className={cn('font-medium', sizeClasses[size])}>
                  {syncStatus.text}
                </span>
                <Badge 
                  variant={
                    syncStatus.color === 'green' ? 'default' :
                    syncStatus.color === 'red' ? 'destructive' :
                    syncStatus.color === 'yellow' ? 'secondary' :
                    'outline'
                  }
                  className="text-xs"
                >
                  {hasChangesToSync ? '有变化' : '已同步'}
                </Badge>
              </div>
              <p className={cn('text-muted-foreground', sizeClasses[size])}>
                最后同步: {formatTime(lastSyncTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showSyncButton && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
                  同步
                </Button>
                {(lastSyncResult?.success === false && lastSyncResult?.message?.includes('同步正在进行中')) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetSyncState}
                    className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                    title="重置同步状态"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    重置
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 同步结果详情 */}
        {lastSyncResult && (
          <div className="mt-3 space-y-2">
            {lastSyncResult.success ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  同步成功: {lastSyncResult.message}
                  {lastSyncResult.successCount > 0 && (
                    <span className="ml-2 text-green-600">
                      ({lastSyncResult.successCount} 项已同步)
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  同步失败: {lastSyncResult.message}
                  {lastSyncResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm">查看错误详情</summary>
                      <ul className="mt-1 text-xs space-y-1">
                        {lastSyncResult.errors.map((error, index) => (
                          <li key={index} className="text-red-600">• {error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* 自动同步状态 */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {enableAutoSync ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span>自动同步已启用</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-gray-500" />
                <span>自动同步已禁用</span>
              </>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAutoSync}
            className="h-6 px-2 text-xs"
          >
            {enableAutoSync ? '禁用' : '启用'}自动同步
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
