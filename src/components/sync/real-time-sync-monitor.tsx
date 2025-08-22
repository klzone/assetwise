'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Zap,
  Upload,
  Download,
  Sync,
  Timer
} from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface SyncEvent {
  id: string;
  timestamp: Date;
  type: 'sync_start' | 'sync_progress' | 'sync_complete' | 'sync_error' | 'conflict_detected' | 'network_change';
  message: string;
  details?: any;
  severity: 'info' | 'success' | 'warning' | 'error';
}

interface RealTimeSyncStats {
  totalOperations: number;
  completedOperations: number;
  failedOperations: number;
  currentOperation: string | null;
  estimatedTimeRemaining: number; // 秒
  throughput: number; // 操作/秒
  networkLatency: number; // 毫秒
}

export function RealTimeSyncMonitor() {
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);
  const [realTimeStats, setRealTimeStats] = useState<RealTimeSyncStats>({
    totalOperations: 0,
    completedOperations: 0,
    failedOperations: 0,
    currentOperation: null,
    estimatedTimeRemaining: 0,
    throughput: 0,
    networkLatency: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  const { 
    networkStatus, 
    syncStatus, 
    isOnline,
    isSyncing,
    manualSync,
    incrementalSync 
  } = useOfflineSync('current_user');

  // 添加同步事件
  const addSyncEvent = useCallback((event: Omit<SyncEvent, 'id' | 'timestamp'>) => {
    const newEvent: SyncEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };

    setSyncEvents(prev => {
      const updated = [newEvent, ...prev].slice(0, 100); // 保留最近100条记录
      return updated;
    });
  }, []);

  // 模拟实时同步事件
  useEffect(() => {
    if (!isMonitoring) return;

    const eventInterval = setInterval(() => {
      // 模拟各种同步事件
      const eventTypes = [
        {
          type: 'sync_progress' as const,
          message: '正在同步资产数据...',
          severity: 'info' as const,
          weight: 0.4
        },
        {
          type: 'sync_complete' as const,
          message: '资产数据同步完成',
          severity: 'success' as const,
          weight: 0.2
        },
        {
          type: 'conflict_detected' as const,
          message: '检测到数据冲突，正在解决...',
          severity: 'warning' as const,
          weight: 0.1
        },
        {
          type: 'sync_error' as const,
          message: '同步失败：网络超时',
          severity: 'error' as const,
          weight: 0.05
        }
      ];

      // 根据权重随机选择事件类型
      const random = Math.random();
      let cumulativeWeight = 0;
      
      for (const eventType of eventTypes) {
        cumulativeWeight += eventType.weight;
        if (random <= cumulativeWeight) {
          addSyncEvent({
            type: eventType.type,
            message: eventType.message,
            severity: eventType.severity,
            details: {
              networkLatency: Math.floor(Math.random() * 200) + 50,
              dataSize: Math.floor(Math.random() * 1000) + 100
            }
          });
          break;
        }
      }

      // 更新实时统计
      setRealTimeStats(prev => ({
        ...prev,
        totalOperations: prev.totalOperations + 1,
        completedOperations: prev.completedOperations + (Math.random() > 0.1 ? 1 : 0),
        failedOperations: prev.failedOperations + (Math.random() > 0.9 ? 1 : 0),
        currentOperation: isSyncing ? '正在同步数据...' : null,
        throughput: Math.floor(Math.random() * 10) + 5,
        networkLatency: Math.floor(Math.random() * 200) + 50
      }));

    }, 3000 + Math.random() * 2000); // 3-5秒随机间隔

    return () => clearInterval(eventInterval);
  }, [isMonitoring, isSyncing, addSyncEvent]);

  // 监听网络状态变化
  useEffect(() => {
    const handleNetworkChange = () => {
      addSyncEvent({
        type: 'network_change',
        message: isOnline ? '网络连接已恢复' : '网络连接已断开',
        severity: isOnline ? 'success' : 'error'
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleNetworkChange);
      window.addEventListener('offline', handleNetworkChange);

      return () => {
        window.removeEventListener('online', handleNetworkChange);
        window.removeEventListener('offline', handleNetworkChange);
      };
    }
  }, [isOnline, addSyncEvent]);

  // 手动触发同步
  const handleManualSync = async () => {
    addSyncEvent({
      type: 'sync_start',
      message: '开始手动同步...',
      severity: 'info'
    });

    try {
      await manualSync();
      addSyncEvent({
        type: 'sync_complete',
        message: '手动同步完成',
        severity: 'success'
      });
    } catch (error) {
      addSyncEvent({
        type: 'sync_error',
        message: `手动同步失败: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // 增量同步
  const handleIncrementalSync = async () => {
    addSyncEvent({
      type: 'sync_start',
      message: '开始增量同步...',
      severity: 'info'
    });

    try {
      await incrementalSync();
      addSyncEvent({
        type: 'sync_complete',
        message: '增量同步完成',
        severity: 'success'
      });
    } catch (error) {
      addSyncEvent({
        type: 'sync_error',
        message: `增量同步失败: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // 清除事件日志
  const clearEvents = () => {
    setSyncEvents([]);
    addSyncEvent({
      type: 'sync_start',
      message: '事件日志已清除',
      severity: 'info'
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sync_start': return <Play className="w-4 h-4 text-blue-400" />;
      case 'sync_progress': return <Sync className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'sync_complete': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'sync_error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'conflict_detected': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'network_change': return isOnline ? 
        <Wifi className="w-4 h-4 text-green-400" /> : 
        <WifiOff className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'text-green-400 border-green-400/20 bg-green-400/10';
      case 'warning': return 'text-amber-400 border-amber-400/20 bg-amber-400/10';
      case 'error': return 'text-red-400 border-red-400/20 bg-red-400/10';
      default: return 'text-blue-400 border-blue-400/20 bg-blue-400/10';
    }
  };

  const successRate = realTimeStats.totalOperations > 0 ? 
    ((realTimeStats.completedOperations / realTimeStats.totalOperations) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* 实时统计面板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">总操作数</p>
                <p className="text-2xl font-bold text-blue-400">{realTimeStats.totalOperations}</p>
              </div>
              <Database className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">成功率</p>
                <p className="text-2xl font-bold text-green-400">{successRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">吞吐量</p>
                <p className="text-2xl font-bold text-purple-400">{realTimeStats.throughput}/s</p>
              </div>
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">网络延迟</p>
                <p className="text-2xl font-bold text-amber-400">{realTimeStats.networkLatency}ms</p>
              </div>
              <Timer className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 当前操作状态 */}
      {realTimeStats.currentOperation && (
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Sync className="w-5 h-5 text-blue-400 animate-spin" />
              <div className="flex-1">
                <p className="text-white font-medium">{realTimeStats.currentOperation}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Progress 
                    value={(realTimeStats.completedOperations / realTimeStats.totalOperations) * 100} 
                    className="flex-1 h-2 bg-slate-700" 
                  />
                  <span className="text-sm text-gray-400">
                    {realTimeStats.completedOperations}/{realTimeStats.totalOperations}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 控制面板 */}
      <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              实时同步监控
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge className={`${isOnline ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                {isOnline ? '在线' : '离线'}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white"
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isMonitoring ? '暂停' : '开始'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-blue-600/20 border-blue-500/30 text-blue-300"
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing}
            >
              <Upload className="w-4 h-4 mr-1" />
              手动同步
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-green-600/20 border-green-500/30 text-green-300"
              onClick={handleIncrementalSync}
              disabled={!isOnline || isSyncing}
            >
              <Download className="w-4 h-4 mr-1" />
              增量同步
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-gray-600/20 border-gray-500/30 text-gray-300"
              onClick={clearEvents}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              清除日志
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-purple-600/20 border-purple-500/30 text-purple-300"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              <Clock className="w-4 h-4 mr-1" />
              {autoScroll ? '关闭' : '开启'}自动滚动
            </Button>
          </div>

          {/* 事件日志 */}
          <div className="border border-white/10 rounded-lg">
            <div className="p-3 border-b border-white/10 bg-slate-800/50">
              <h4 className="text-white font-medium">同步事件日志</h4>
              <p className="text-sm text-gray-400">实时显示同步过程中的所有事件</p>
            </div>
            <ScrollArea className="h-96">
              <div className="p-3 space-y-2">
                {syncEvents.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">暂无同步事件</p>
                ) : (
                  syncEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border ${getSeverityColor(event.severity)}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{event.message}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-400">
                            {event.timestamp.toLocaleTimeString()}
                          </span>
                          {event.details && (
                            <span className="text-xs text-gray-400">
                              延迟: {event.details.networkLatency}ms
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                        {event.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}