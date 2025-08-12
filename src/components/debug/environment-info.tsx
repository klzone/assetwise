'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { unifiedDataService } from '@/lib/services/unified-data.service';
import { storageManagerService } from '@/lib/services/storage-manager.service';
import { directDebugService } from '@/lib/services/direct-local.service';

export function EnvironmentInfo() {
  const [envInfo, setEnvInfo] = useState<{
    platform: string;
    supportsCloudSync: boolean;
    isTauri: boolean;
    hasWindow: boolean;
    hasTauriGlobal: boolean;
    hasTauriMetadata: boolean;
    userAgent: string;
    protocol: string;
    storageMode: string;
    storageService: string;
  } | null>(null);

  useEffect(() => {
    const checkEnvironment = async () => {
      const hasWindow = typeof window !== 'undefined';
      const hasTauriGlobal = hasWindow && '__TAURI__' in window;
      const hasTauriMetadata = hasWindow && '__TAURI_METADATA__' in window;
      const envData = unifiedDataService.getEnvironmentInfo();

      // 初始化存储管理器并获取当前配置
      await storageManagerService.initialize();
      const storageConfig = storageManagerService.getConfig();

      // 使用全新的直接本地服务
      console.log('使用DirectLocalService');
      const actualServiceName = directDebugService.getServiceInfo();

      setEnvInfo({
        platform: envData.platform,
        supportsCloudSync: envData.supportsCloudSync,
        isTauri: hasTauriGlobal || hasTauriMetadata,
        hasWindow,
        hasTauriGlobal,
        hasTauriMetadata,
        userAgent: hasWindow ? window.navigator.userAgent : 'N/A',
        protocol: hasWindow ? window.location.protocol : 'N/A',
        storageMode: storageConfig.mode,
        storageService: actualServiceName
      });
    };

    checkEnvironment();
  }, []);

  if (!envInfo) {
    return <div>检测环境中...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          环境信息
          <Badge variant={envInfo.isTauri ? "default" : "secondary"}>
            {envInfo.platform === 'desktop' ? '桌面版' : '网页版'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>平台：</strong> {envInfo.platform}
          </div>
          <div>
            <strong>协议：</strong> {envInfo.protocol}
          </div>
          <div>
            <strong>云端同步：</strong>
            <Badge variant={envInfo.supportsCloudSync ? "default" : "secondary"} className="ml-2">
              {envInfo.supportsCloudSync ? '支持' : '不支持'}
            </Badge>
          </div>
          <div>
            <strong>存储模式：</strong>
            <Badge variant={envInfo.storageMode === 'local' ? "default" : "secondary"} className="ml-2">
              {envInfo.storageMode}
            </Badge>
          </div>
          <div>
            <strong>Window对象：</strong>
            <Badge variant={envInfo.hasWindow ? "default" : "destructive"} className="ml-2">
              {envInfo.hasWindow ? '存在' : '不存在'}
            </Badge>
          </div>
          <div>
            <strong>__TAURI__：</strong>
            <Badge variant={envInfo.hasTauriGlobal ? "default" : "destructive"} className="ml-2">
              {envInfo.hasTauriGlobal ? '存在' : '不存在'}
            </Badge>
          </div>
          <div>
            <strong>__TAURI_METADATA__：</strong>
            <Badge variant={envInfo.hasTauriMetadata ? "default" : "destructive"} className="ml-2">
              {envInfo.hasTauriMetadata ? '存在' : '不存在'}
            </Badge>
          </div>
          <div>
            <strong>数据服务：</strong> {envInfo.storageService}
          </div>
        </div>
        
        <div className="mt-4">
          <strong>User Agent：</strong>
          <div className="text-xs text-muted-foreground mt-1 break-all">
            {envInfo.userAgent}
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="text-sm">
            <strong>当前使用的数据存储：</strong>
            <div className="mt-1">
              {envInfo.isTauri ? (
                <Badge variant="default">Tauri SQLite</Badge>
              ) : envInfo.storageMode === 'cloud' ? (
                <Badge variant="default">Supabase 云端</Badge>
              ) : (
                <Badge variant="secondary">localStorage</Badge>
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {envInfo.isTauri
                ? '桌面版使用Tauri SQLite数据库存储，数据安全保存在本地'
                : envInfo.storageMode === 'cloud'
                ? '使用Supabase云端数据库，支持多设备同步'
                : '网页版使用浏览器localStorage存储，数据仅保存在本地'
              }
            </div>
            <div className="mt-2 text-xs">
              <strong>数据服务类：</strong> {envInfo.storageService}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
