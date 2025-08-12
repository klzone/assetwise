'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/store';
import { unifiedDataService } from '@/lib/services/unified-data.service';
import { Cloud, CloudOff, RefreshCw, Upload, Download, Wifi, WifiOff } from 'lucide-react';

interface CloudSyncProps {
  className?: string;
}

export function CloudSync({ className }: CloudSyncProps) {
  const { user } = useUserStore();
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const environmentInfo = unifiedDataService.getEnvironmentInfo();
  const isCloudSyncAvailable = environmentInfo.supportsCloudSync;

  const handleUploadToCloud = async () => {
    if (!user?.id || !isCloudSyncAvailable) return;

    setIsUploading(true);
    setSyncStatus('syncing');

    try {
      const success = await unifiedDataService.syncToCloud(user.id);
      if (success) {
        setSyncStatus('success');
        setLastSyncTime(new Date().toLocaleString());
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Upload to cloud failed:', error);
      setSyncStatus('error');
    } finally {
      setIsUploading(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleDownloadFromCloud = async () => {
    if (!user?.id || !isCloudSyncAvailable) return;

    setIsDownloading(true);
    setSyncStatus('syncing');

    try {
      const success = await unifiedDataService.syncFromCloud(user.id);
      if (success) {
        setSyncStatus('success');
        setLastSyncTime(new Date().toLocaleString());
        // 刷新页面以显示同步的数据
        window.location.reload();
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Download from cloud failed:', error);
      setSyncStatus('error');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const getSyncStatusBadge = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />同步中</Badge>;
      case 'success':
        return <Badge variant="default"><Cloud className="h-3 w-3 mr-1" />同步成功</Badge>;
      case 'error':
        return <Badge variant="destructive"><CloudOff className="h-3 w-3 mr-1" />同步失败</Badge>;
      default:
        return null;
    }
  };

  if (!isCloudSyncAvailable) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            云端同步
          </CardTitle>
          <CardDescription>
            云端同步功能仅在桌面应用中可用
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CloudOff className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              当前运行在 {environmentInfo.platform === 'web' ? '网页版' : '桌面版'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              请下载桌面应用以使用云端同步功能
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          云端同步
          {getSyncStatusBadge()}
        </CardTitle>
        <CardDescription>
          在多设备间同步您的投资数据
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastSyncTime && (
          <div className="text-sm text-muted-foreground">
            上次同步：{lastSyncTime}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadToCloud}
            disabled={isUploading || isDownloading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            上传到云端
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadFromCloud}
            disabled={isUploading || isDownloading}
            className="flex items-center gap-2"
          >
            {isDownloading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            从云端下载
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• 上传：将本地数据备份到云端</p>
          <p>• 下载：从云端恢复数据到本地</p>
          <p>• 建议定期备份重要数据</p>
        </div>
      </CardContent>
    </Card>
  );
}

// 简化的同步按钮组件
export function CloudSyncButton() {
  const { user } = useUserStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const isCloudSyncAvailable = unifiedDataService.getEnvironmentInfo().supportsCloudSync;

  const handleQuickSync = async () => {
    if (!user?.id || !isCloudSyncAvailable) return;

    setIsSyncing(true);
    try {
      // 先从云端下载数据到本地
      console.log('🔄 开始从云端下载数据...');
      const downloadSuccess = await unifiedDataService.syncFromCloud(user.id);

      if (downloadSuccess) {
        console.log('✅ 云端数据下载成功');
        // 下载成功后，可以选择性地上传本地新数据到云端
        console.log('🔄 开始上传本地数据到云端...');
        await unifiedDataService.syncToCloud(user.id);
        console.log('✅ 双向同步完成');
      } else {
        console.log('⚠️ 云端数据下载失败，仅执行上传');
        await unifiedDataService.syncToCloud(user.id);
      }
    } catch (error) {
      console.error('Quick sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isCloudSyncAvailable) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleQuickSync}
      disabled={isSyncing}
      className="flex items-center gap-2"
    >
      {isSyncing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Cloud className="h-4 w-4" />
      )}
      {isSyncing ? '同步中...' : '云端同步'}
    </Button>
  );
}
