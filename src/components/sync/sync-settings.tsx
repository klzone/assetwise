'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Cloud, 
  Settings, 
  Clock, 
  Shield, 
  Activity, 
  Database,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  History,
  Download,
  Upload
} from 'lucide-react';
import { syncService } from '@/lib/services/sync.service';
import { supabaseSyncService } from '@/lib/services/supabase-sync.service';
import { subscriptionService } from '@/lib/services/subscription.service';
import { localStorageService } from '@/lib/services/local-storage.service';

interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // 分钟
  syncOnStartup: boolean;
  syncOnClose: boolean;
  dataTypes: {
    assets: boolean;
    transactions: boolean;
    plans: boolean;
    reviews: boolean;
  };
  conflictResolution: 'manual' | 'local' | 'remote' | 'merge';
  maxRetries: number;
  compressionEnabled: boolean;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  pendingItems: number;
  syncProgress: number;
  errors: string[];
}

export function SyncSettings() {
  const [settings, setSettings] = useState<SyncSettings>({
    autoSync: true,
    syncInterval: 30,
    syncOnStartup: true,
    syncOnClose: true,
    dataTypes: {
      assets: true,
      transactions: true,
      plans: true,
      reviews: false
    },
    conflictResolution: 'manual',
    maxRetries: 3,
    compressionEnabled: true
  });

  const [status, setStatus] = useState<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    lastSync: null,
    pendingItems: 0,
    syncProgress: 0,
    errors: []
  });

  const [hasPermission, setHasPermission] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    checkPermissions();
    updateStatus();
    
    // 定期更新状态
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    try {
      // 从本地存储加载设置
      const savedSettings = localStorage.getItem('assetwise_sync_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('加载同步设置失败:', error);
    }
  };

  const saveSettings = async (newSettings: SyncSettings) => {
    try {
      setSettings(newSettings);
      localStorage.setItem('assetwise_sync_settings', JSON.stringify(newSettings));
      
      // 应用设置到同步服务
      await syncService.updateSettings(newSettings);
    } catch (error) {
      console.error('保存同步设置失败:', error);
    }
  };

  const checkPermissions = async () => {
    try {
      const hasAccess = await subscriptionService.hasFeatureAccess('cloud_sync');
      const currentSub = await subscriptionService.getCurrentSubscription();
      setHasPermission(hasAccess);
      setSubscription(currentSub);
    } catch (error) {
      console.error('检查权限失败:', error);
    }
  };

  const updateStatus = async () => {
    try {
      const isOnline = supabaseSyncService.isNetworkAvailable();
      const isSyncing = syncService.isSyncInProgress();
      const lastSync = supabaseSyncService.getLastSyncTime();
      const pendingItems = localStorageService.getSyncQueue().length;
      const stats = await syncService.getSyncStats();

      setStatus({
        isOnline,
        isSyncing,
        lastSync,
        pendingItems,
        syncProgress: isSyncing ? Math.random() * 100 : 0, // 模拟进度
        errors: stats.sync_errors ? ['同步过程中发生错误'] : []
      });
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const handleManualSync = async () => {
    try {
      await syncService.syncAllData();
      updateStatus();
    } catch (error) {
      console.error('手动同步失败:', error);
    }
  };

  const handleForceSync = async () => {
    try {
      await supabaseSyncService.forceFullSync();
      updateStatus();
    } catch (error) {
      console.error('强制同步失败:', error);
    }
  };

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <CardTitle className="text-2xl text-white">云端同步功能</CardTitle>
              <CardDescription className="text-gray-300">
                此功能仅对专业版和旗舰版用户开放
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-200">
                  当前订阅: <Badge variant="outline" className="text-amber-300 border-amber-300">
                    {subscription?.plan || '免费版'}
                  </Badge>
                </p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                升级订阅
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">云端同步设置</h1>
          <p className="text-gray-300">管理您的数据同步偏好和监控同步状态</p>
        </div>

        {/* 同步状态卡片 */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${status.isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                <CardTitle className="text-white flex items-center space-x-2">
                  {status.isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                  <span>同步状态</span>
                </CardTitle>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleManualSync}
                  disabled={status.isSyncing}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${status.isSyncing ? 'animate-spin' : ''}`} />
                  {status.isSyncing ? '同步中...' : '立即同步'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleForceSync}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  强制同步
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">网络状态</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {status.isOnline ? '在线' : '离线'}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">最后同步</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {status.lastSync ? new Date(status.lastSync).toLocaleString() : '从未同步'}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">待同步项</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {status.pendingItems}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">同步进度</span>
                </div>
                <div className="space-y-2">
                  <Progress value={status.syncProgress} className="h-2" />
                  <p className="text-sm text-white">{Math.round(status.syncProgress)}%</p>
                </div>
              </div>
            </div>

            {status.errors.length > 0 && (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  {status.errors.join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 设置选项卡 */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-md border-white/20">
            <TabsTrigger value="general" className="data-[state=active]:bg-white/20 text-white">
              常规设置
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-white/20 text-white">
              数据类型
            </TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-white/20 text-white">
              高级选项
            </TabsTrigger>
          </TabsList>

          {/* 常规设置 */}
          <TabsContent value="general">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>常规设置</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  配置基本的同步行为和时间间隔
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">自动同步</h3>
                    <p className="text-sm text-gray-300">启用后将根据设定间隔自动同步数据</p>
                  </div>
                  <Switch
                    checked={settings.autoSync}
                    onCheckedChange={(checked) => 
                      saveSettings({ ...settings, autoSync: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white font-medium">同步间隔</label>
                  <Select
                    value={settings.syncInterval.toString()}
                    onValueChange={(value) => 
                      saveSettings({ ...settings, syncInterval: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 分钟</SelectItem>
                      <SelectItem value="15">15 分钟</SelectItem>
                      <SelectItem value="30">30 分钟</SelectItem>
                      <SelectItem value="60">1 小时</SelectItem>
                      <SelectItem value="180">3 小时</SelectItem>
                      <SelectItem value="360">6 小时</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">启动时同步</h3>
                    <p className="text-sm text-gray-300">应用启动时自动执行同步</p>
                  </div>
                  <Switch
                    checked={settings.syncOnStartup}
                    onCheckedChange={(checked) => 
                      saveSettings({ ...settings, syncOnStartup: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">关闭时同步</h3>
                    <p className="text-sm text-gray-300">应用关闭前自动执行同步</p>
                  </div>
                  <Switch
                    checked={settings.syncOnClose}
                    onCheckedChange={(checked) => 
                      saveSettings({ ...settings, syncOnClose: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 数据类型设置 */}
          <TabsContent value="data">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>数据类型</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  选择要同步的数据类型
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.dataTypes).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium capitalize">
                        {key === 'assets' && '资产数据'}
                        {key === 'transactions' && '交易记录'}
                        {key === 'plans' && '投资计划'}
                        {key === 'reviews' && '评估报告'}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {key === 'assets' && '包括股票、债券、基金等资产信息'}
                        {key === 'transactions' && '买入、卖出等交易历史记录'}
                        {key === 'plans' && '投资策略和计划配置'}
                        {key === 'reviews' && '定期评估和分析报告'}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => 
                        saveSettings({
                          ...settings,
                          dataTypes: { ...settings.dataTypes, [key]: checked }
                        })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 高级选项 */}
          <TabsContent value="advanced">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>高级选项</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  冲突解决和性能优化设置
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-white font-medium">冲突解决策略</label>
                  <Select
                    value={settings.conflictResolution}
                    onValueChange={(value: any) => 
                      saveSettings({ ...settings, conflictResolution: value })
                    }
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">手动解决</SelectItem>
                      <SelectItem value="local">优先本地</SelectItem>
                      <SelectItem value="remote">优先云端</SelectItem>
                      <SelectItem value="merge">智能合并</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-white font-medium">最大重试次数</label>
                  <Select
                    value={settings.maxRetries.toString()}
                    onValueChange={(value) => 
                      saveSettings({ ...settings, maxRetries: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 次</SelectItem>
                      <SelectItem value="3">3 次</SelectItem>
                      <SelectItem value="5">5 次</SelectItem>
                      <SelectItem value="10">10 次</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">数据压缩</h3>
                    <p className="text-sm text-gray-300">启用压缩以减少网络传输量</p>
                  </div>
                  <Switch
                    checked={settings.compressionEnabled}
                    onCheckedChange={(checked) => 
                      saveSettings({ ...settings, compressionEnabled: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}