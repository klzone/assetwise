'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cloudSyncService, SyncStatus } from '@/lib/services/cloud-sync.service';

interface SyncStatusComponentProps {
  compact?: boolean;
  className?: string;
}

export function SyncStatusComponent({ compact = false, className = '' }: SyncStatusComponentProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(cloudSyncService.getSyncStatus());
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const handleSyncStatusChange = (status: SyncStatus) => {
      setSyncStatus(status);
      setIsManualSyncing(false);
    };

    cloudSyncService.addSyncListener(handleSyncStatusChange);

    return () => {
      cloudSyncService.removeSyncListener(handleSyncStatusChange);
    };
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      const result = await cloudSyncService.manualSync();
      if (!result.success) {
        console.error('手动同步失败:', result.error);
      }
    } catch (error) {
      console.error('手动同步错误:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleAutoSyncToggle = (enabled: boolean) => {
    if (enabled) {
      cloudSyncService.startAutoSync();
    } else {
      cloudSyncService.stopAutoSync();
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return '从未同步';
    
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
    return date.toLocaleDateString();
  };

  const getSyncStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
    
    if (syncStatus.isSyncing || isManualSyncing) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    
    if (syncStatus.error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (syncStatus.pendingChanges > 0) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getSyncStatusText = () => {
    if (!syncStatus.isOnline) {
      return '离线';
    }
    
    if (syncStatus.isSyncing || isManualSyncing) {
      return '同步中...';
    }
    
    if (syncStatus.error) {
      return '同步失败';
    }
    
    if (syncStatus.pendingChanges > 0) {
      return `${syncStatus.pendingChanges} 项待同步`;
    }
    
    return '已同步';
  };

  const getSyncStatusColor = () => {
    if (!syncStatus.isOnline) return 'secondary';
    if (syncStatus.isSyncing || isManualSyncing) return 'default';
    if (syncStatus.error) return 'destructive';
    if (syncStatus.pendingChanges > 0) return 'secondary';
    return 'default';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getSyncStatusIcon()}
        <Badge variant={getSyncStatusColor()} className="text-xs">
          {getSyncStatusText()}
        </Badge>
        {syncStatus.isOnline && !syncStatus.isSyncing && !isManualSyncing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualSync}
            className="h-6 px-2"
            disabled={isManualSyncing}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          云端同步
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 网络状态 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {syncStatus.isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm">
              {syncStatus.isOnline ? '在线' : '离线'}
            </span>
          </div>
          <Badge variant={syncStatus.isOnline ? 'default' : 'secondary'}>
            {syncStatus.isOnline ? '已连接' : '未连接'}
          </Badge>
        </div>

        {/* 同步状态 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSyncStatusIcon()}
            <span className="text-sm">{getSyncStatusText()}</span>
          </div>
          <Badge variant={getSyncStatusColor()}>
            {syncStatus.pendingChanges > 0 ? `${syncStatus.pendingChanges} 待同步` : '已同步'}
          </Badge>
        </div>

        {/* 最后同步时间 */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>最后同步:</span>
          <span>{formatLastSync(syncStatus.lastSync)}</span>
        </div>

        {/* 错误信息 */}
        {syncStatus.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {syncStatus.error}
          </div>
        )}

        {/* 控制按钮 */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Switch
              checked={syncStatus.isAutoSyncEnabled}
              onCheckedChange={handleAutoSyncToggle}
              disabled={!syncStatus.isOnline}
            />
            <span className="text-sm">自动同步</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={!syncStatus.isOnline || syncStatus.isSyncing || isManualSyncing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${(syncStatus.isSyncing || isManualSyncing) ? 'animate-spin' : ''}`} />
            {syncStatus.isSyncing || isManualSyncing ? '同步中' : '立即同步'}
          </Button>
        </div>

        {/* 同步说明 */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>• 数据优先保存到本地，确保离线可用</p>
          <p>• 自动同步每分钟检查一次待同步数据</p>
          <p>• 手动同步可立即将本地数据上传到云端</p>
        </div>
      </CardContent>
    </Card>
  );
}
