'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Database, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  Bell,
  Settings
} from 'lucide-react';
import { syncService } from '@/lib/services/sync.service';
import { notificationService } from '@/lib/services/notification.service';
import { NotificationCenter } from './notification-center';

interface SyncMonitorProps {
  className?: string;
}

interface SyncStatus {
  isActive: boolean;
  isOnline: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  currentOperation: string | null;
  progress: number;
  queueSize: number;
  errors: string[];
}

export function SyncMonitor({ className }: SyncMonitorProps) {
  const [status, setStatus] = useState<SyncStatus>({
    isActive: false,
    isOnline: navigator.onLine,
    lastSync: null,
    nextSync: null,
    currentOperation: null,
    progress: 0,
    queueSize: 0,
    errors: []
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 监听网络状态
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      notificationService.notify({
        title: '网络已连接',
        message: '同步服务已恢复',
        type: 'success',
        duration: 3000
      });
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
      notificationService.notifyNetworkError();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听通知变化
    const unsubscribeNotifications = notificationService.subscribe((notifications) => {
      setUnreadCount(notificationService.getUnreadCount());
    });

    // 模拟同步状态更新
    const statusInterval = setInterval(() => {
      setStatus(prev => {
        const now = new Date();
        const isActive = Math.random() > 0.7; // 30% 概率正在同步
        
        return {
          ...prev,
          isActive,
          lastSync: prev.lastSync || new Date(now.getTime() - 3600000), // 1小时前
          nextSync: new Date(now.getTime() + 1800000), // 30分钟后
          currentOperation: isActive ? '正在同步资产数据...' : null,
          progress: isActive ? Math.floor(Math.random() * 100) : 0,
          queueSize: Math.floor(Math.random() * 5),
          errors: prev.errors
        };
      });
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeNotifications();
      clearInterval(statusInterval);
    };
  }, []);

  const handlePauseResume = () => {
    if (status.isActive) {
      // 暂停同步
      setStatus(prev => ({ 
        ...prev, 
        isActive: false, 
        currentOperation: null, 
        progress: 0 
      }));
      notificationService.notify({
        title: '同步已暂停',
        message: '您可以随时恢复同步服务',
        type: 'info',
        duration: 3000
      });
    } else {
      // 恢复同步
      setStatus(prev => ({ 
        ...prev, 
        isActive: true, 
        currentOperation: '正在恢复同步...' 
      }));
      notificationService.notify({
        title: '同步已恢复',
        message: '同步服务正在运行',
        type: 'success',
        duration: 3000
      });
    }
  };

  const handleForceSync = () => {
    setStatus(prev => ({ 
      ...prev, 
      isActive: true, 
      currentOperation: '正在执行手动同步...',
      progress: 0
    }));
    
    notificationService.notifySyncStarted();
    
    // 模拟同步过程
    setTimeout(() => {
      setStatus(prev => ({ 
        ...prev, 
        isActive: false, 
        currentOperation: null,
        progress: 0,
        lastSync: new Date()
      }));
      notificationService.notifySyncSuccess(12, 2.4);
    }, 3000);
  };

  const getStatusColor = () => {
    if (!status.isOnline) return 'text-red-400';
    if (status.isActive) return 'text-blue-400';
    if (status.errors.length > 0) return 'text-amber-400';
    return 'text-green-400';
  };

  const getStatusText = () => {
    if (!status.isOnline) return '离线';
    if (status.isActive) return '同步中';
    if (status.errors.length > 0) return '有警告';
    return '正常';
  };

  const getStatusIcon = () => {
    if (!status.isOnline) return <WifiOff className="w-4 h-4" />;
    if (status.isActive) return <Activity className="w-4 h-4 animate-pulse" />;
    if (status.errors.length > 0) return <AlertTriangle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <>
      <Card className={`bg-slate-900/80 backdrop-blur-md border-white/10 text-white ${className}`}>
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>同步监控</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white relative"
                onClick={() => setShowNotifications(true)}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 状态概览 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={getStatusColor()}>
                  {getStatusIcon()}
                </div>
                <span className="text-sm text-gray-300">同步状态</span>
              </div>
              <div className={`text-lg font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Wifi className={status.isOnline ? 'text-green-400' : 'text-red-400'} />
                <span className="text-sm text-gray-300">网络状态</span>
              </div>
              <div className={`text-lg font-medium ${status.isOnline ? 'text-green-400' : 'text-red-400'}`}>
                {status.isOnline ? '在线' : '离线'}
              </div>
            </div>
          </div>

          {/* 当前操作 */}
          {status.currentOperation && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{status.currentOperation}</span>
                <span className="text-sm text-blue-400">{status.progress}%</span>
              </div>
              <Progress value={status.progress} className="h-2 bg-slate-700" />
            </div>
          )}

          {/* 时间信息 */}
          <div className="grid grid-cols-1 gap-3">
            {status.lastSync && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">上次同步:</span>
                <span className="text-white">{status.lastSync.toLocaleString()}</span>
              </div>
            )}
            
            {status.nextSync && !status.isActive && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">下次同步:</span>
                <span className="text-white">{status.nextSync.toLocaleString()}</span>
              </div>
            )}
            
            {status.queueSize > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">队列中:</span>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {status.queueSize} 个任务
                </Badge>
              </div>
            )}
          </div>

          {/* 错误信息 */}
          {status.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-400">警告信息</span>
              </div>
              <div className="space-y-1">
                {status.errors.map((error, index) => (
                  <div key={index} className="text-xs text-red-300 bg-red-500/10 p-2 rounded border border-red-500/20">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-2 pt-4 border-t border-white/10">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white"
              onClick={handlePauseResume}
              disabled={!status.isOnline}
            >
              {status.isActive ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  暂停同步
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  恢复同步
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white"
              onClick={handleForceSync}
              disabled={!status.isOnline || status.isActive}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              立即同步
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 通知中心 */}
      <NotificationCenter 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}