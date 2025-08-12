import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Database,
  CloudSync,
  Zap
} from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

interface SyncStatusBarProps {
  userId: string;
  className?: string;
  compact?: boolean;
}

export const SyncStatusBar: React.FC<SyncStatusBarProps> = ({
  userId,
  className,
  compact = false
}) => {
  const {
    networkStatus,
    syncStatus,
    isInitialized,
    error,
    isOnline,
    isSyncing,
    hasUnsyncedData,
    hasQueuedItems,
    manualSync,
    incrementalSync,
    clearError
  } = useOfflineSync(userId);

  const handleSync = async () => {
    try {
      clearError();
      if (hasUnsyncedData) {
        await manualSync();
      } else {
        await incrementalSync();
      }
    } catch (error) {
      console.error('同步失败:', error);
    }
  };

  const getConnectionQuality = (): 'excellent' | 'good' | 'poor' | 'offline' => {
    if (!isOnline) return 'offline';
    
    const { effectiveType, downlink } = networkStatus;
    
    if (effectiveType === '4g' && downlink > 10) return 'excellent';
    if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 5)) return 'good';
    return 'poor';
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4 text-red-500" />;
    
    const quality = getConnectionQuality();
    const iconClass = quality === 'excellent' ? 'text-green-500' : 
                     quality === 'good' ? 'text-yellow-500' : 'text-orange-500';
    
    return <Wifi className={cn("h-4 w-4", iconClass)} />;
  };

  const getSyncStatusIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    
    if (error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (hasUnsyncedData || hasQueuedItems) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getSyncStatusText = (): string => {
    if (!isInitialized) return '初始化中...';
    if (isSyncing) return '同步中...';
    if (error) return '同步错误';
    if (hasUnsyncedData) return `${syncStatus.unsyncedCount} 项待同步`;
    if (hasQueuedItems) return `${syncStatus.queueSize} 项队列中`;
    
    const lastSync = syncStatus.lastSyncTime;
    if (lastSync) {
      const timeDiff = Date.now() - new Date(lastSync).getTime();
      const minutes = Math.floor(timeDiff / 60000);
      if (minutes < 1) return '刚刚同步';
      if (minutes < 60) return `${minutes}分钟前同步`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}小时前同步`;
      return '需要同步';
    }
    
    return '未同步';
  };

  const getNetworkStatusText = (): string => {
    if (!isOnline) return '离线';
    
    const quality = getConnectionQuality();
    const type = networkStatus.effectiveType.toUpperCase();
    
    switch (quality) {
      case 'excellent': return `${type} 优秀`;
      case 'good': return `${type} 良好`;
      case 'poor': return `${type} 较差`;
      default: return type;
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {getConnectionIcon()}
        {getSyncStatusIcon()}
        
        {(hasUnsyncedData || hasQueuedItems || error) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={!isOnline || isSyncing}
            className="h-6 px-2"
          >
            <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("border-l-4", 
      error ? "border-l-red-500" : 
      hasUnsyncedData || hasQueuedItems ? "border-l-yellow-500" : 
      "border-l-green-500", 
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 网络状态 */}
            <div className="flex items-center space-x-2">
              {getConnectionIcon()}
              <div className="text-sm">
                <div className="font-medium">网络状态</div>
                <div className="text-muted-foreground">
                  {getNetworkStatusText()}
                </div>
              </div>
            </div>

            {/* 同步状态 */}
            <div className="flex items-center space-x-2">
              {getSyncStatusIcon()}
              <div className="text-sm">
                <div className="font-medium">同步状态</div>
                <div className="text-muted-foreground">
                  {getSyncStatusText()}
                </div>
              </div>
            </div>

            {/* 数据统计 */}
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-500" />
              <div className="text-sm">
                <div className="font-medium">本地数据</div>
                <div className="text-muted-foreground">
                  {syncStatus.unsyncedCount > 0 ? 
                    `${syncStatus.unsyncedCount} 项未同步` : 
                    '已同步'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center space-x-2">
            {error && (
              <Badge variant="destructive" className="text-xs">
                错误
              </Badge>
            )}
            
            {hasUnsyncedData && (
              <Badge variant="secondary" className="text-xs">
                {syncStatus.unsyncedCount} 待同步
              </Badge>
            )}
            
            {hasQueuedItems && (
              <Badge variant="outline" className="text-xs">
                {syncStatus.queueSize} 队列中
              </Badge>
            )}

            <Button
              variant={hasUnsyncedData || hasQueuedItems ? "default" : "outline"}
              size="sm"
              onClick={handleSync}
              disabled={!isOnline || isSyncing || !isInitialized}
              className="flex items-center space-x-1"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>同步中</span>
                </>
              ) : hasUnsyncedData ? (
                <>
                  <CloudSync className="h-3 w-3" />
                  <span>同步</span>
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3" />
                  <span>检查更新</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 同步进度条 */}
        {isSyncing && (
          <div className="mt-3">
            <Progress value={undefined} className="h-1" />
            <div className="text-xs text-muted-foreground mt-1">
              正在同步数据...
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-auto h-6 px-2 text-red-600 hover:text-red-700"
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {/* 网络质量详情 */}
        {isOnline && networkStatus.downlink > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            连接速度: {networkStatus.downlink.toFixed(1)} Mbps | 
            延迟: {networkStatus.rtt}ms | 
            类型: {networkStatus.connectionType}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SyncStatusBar;