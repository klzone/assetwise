'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  X,
  Database,
  Upload,
  Download,
  Wifi,
  WifiOff
} from 'lucide-react';

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SyncItem {
  id: string;
  type: 'assets' | 'transactions' | 'plans' | 'reviews';
  name: string;
  status: 'pending' | 'syncing' | 'completed' | 'error';
  progress: number;
  error?: string;
  timestamp: string;
}

interface SyncLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export function SyncStatusModal({ isOpen, onClose }: SyncStatusModalProps) {
  const [syncItems, setSyncItems] = useState<SyncItem[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [completedItems, setCompletedItems] = useState(0);

  useEffect(() => {
    if (isOpen) {
      initializeSyncData();
      const interval = setInterval(updateSyncStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const initializeSyncData = () => {
    // 模拟同步项目
    const mockItems: SyncItem[] = [
      {
        id: '1',
        type: 'assets',
        name: '资产数据 (15项)',
        status: 'pending',
        progress: 0,
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'transactions',
        name: '交易记录 (8项)',
        status: 'pending',
        progress: 0,
        timestamp: new Date().toISOString()
      },
      {
        id: '3',
        type: 'plans',
        name: '投资计划 (3项)',
        status: 'pending',
        progress: 0,
        timestamp: new Date().toISOString()
      }
    ];

    setSyncItems(mockItems);
    setTotalItems(mockItems.length);
    setCompletedItems(0);
    setOverallProgress(0);
    setSyncLogs([
      {
        id: '1',
        timestamp: new Date().toISOString(),
        type: 'info',
        message: '开始同步数据到云端...'
      }
    ]);

    // 开始模拟同步过程
    setTimeout(() => {
      setIsSyncing(true);
      simulateSync();
    }, 500);
  };

  const simulateSync = () => {
    let currentIndex = 0;
    const items = [...syncItems];

    const syncNextItem = () => {
      if (currentIndex >= items.length) {
        // 所有项目完成
        setIsSyncing(false);
        setOverallProgress(100);
        addLog('success', '所有数据同步完成！');
        return;
      }

      const currentItem = items[currentIndex];
      currentItem.status = 'syncing';
      setSyncItems([...items]);
      addLog('info', `正在同步 ${currentItem.name}...`);

      // 模拟同步进度
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(progressInterval);
          
          // 随机决定是否成功
          const isSuccess = Math.random() > 0.2; // 80% 成功率
          
          if (isSuccess) {
            currentItem.status = 'completed';
            currentItem.progress = 100;
            addLog('success', `${currentItem.name} 同步成功`);
            setCompletedItems(prev => prev + 1);
          } else {
            currentItem.status = 'error';
            currentItem.error = '网络连接超时';
            addLog('error', `${currentItem.name} 同步失败: 网络连接超时`);
          }

          setSyncItems([...items]);
          setOverallProgress(((currentIndex + 1) / items.length) * 100);
          
          currentIndex++;
          setTimeout(syncNextItem, 1000);
        } else {
          currentItem.progress = progress;
          setSyncItems([...items]);
        }
      }, 200);
    };

    syncNextItem();
  };

  const updateSyncStatus = () => {
    // 模拟网络状态变化
    setIsOnline(Math.random() > 0.1); // 90% 在线率
  };

  const addLog = (type: SyncLog['type'], message: string) => {
    const newLog: SyncLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message
    };
    setSyncLogs(prev => [newLog, ...prev].slice(0, 50)); // 保留最近50条日志
  };

  const getStatusIcon = (status: SyncItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: SyncItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'syncing':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
    }
  };

  const getLogIcon = (type: SyncLog['type']) => {
    switch (type) {
      case 'info':
        return <Database className="w-3 h-3 text-blue-400" />;
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-3 h-3 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900/95 backdrop-blur-md border-white/20 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <span>数据同步状态</span>
            </DialogTitle>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 总体进度 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">总体进度</h3>
              <span className="text-sm text-gray-300">
                {completedItems} / {totalItems} 完成
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <div className="flex justify-between text-sm text-gray-300">
              <span>{Math.round(overallProgress)}% 完成</span>
              <span>{isOnline ? '网络正常' : '网络异常'}</span>
            </div>
          </div>

          {/* 同步项目列表 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">同步项目</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {syncItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.error && (
                        <p className="text-sm text-red-300">{item.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {item.status === 'syncing' && (
                      <div className="w-20">
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    )}
                    <Badge className={getStatusColor(item.status)}>
                      {item.status === 'pending' && '等待中'}
                      {item.status === 'syncing' && '同步中'}
                      {item.status === 'completed' && '已完成'}
                      {item.status === 'error' && '失败'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 同步日志 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">同步日志</h3>
            <ScrollArea className="h-32 bg-black/20 rounded-lg border border-white/10">
              <div className="p-3 space-y-2">
                {syncLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2 text-sm">
                    {getLogIcon(log.type)}
                    <div className="flex-1">
                      <span className="text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="ml-2">{log.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              后台运行
            </Button>
            {!isSyncing && (
              <Button
                onClick={() => {
                  initializeSyncData();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                重新同步
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}