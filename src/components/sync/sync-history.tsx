'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  RefreshCwIcon
} from 'lucide-react';

interface SyncHistoryItem {
  id: string;
  timestamp: string;
  type: 'assets' | 'portfolios' | 'transactions';
  status: 'success' | 'failed' | 'pending';
  message: string;
  duration?: number;
}

export function SyncHistory() {
  // 模拟同步历史数据
  const syncHistory: SyncHistoryItem[] = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      type: 'assets',
      status: 'success',
      message: '资产数据同步成功',
      duration: 1200
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      type: 'portfolios',
      status: 'success',
      message: '投资组合数据同步成功',
      duration: 800
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      type: 'transactions',
      status: 'failed',
      message: '交易记录同步失败：网络连接超时',
      duration: 5000
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <RefreshCwIcon className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="text-green-700 bg-green-100">成功</Badge>;
      case 'failed':
        return <Badge variant="destructive">失败</Badge>;
      case 'pending':
        return <Badge variant="default">进行中</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'assets':
        return '资产数据';
      case 'portfolios':
        return '投资组合';
      case 'transactions':
        return '交易记录';
      default:
        return '未知类型';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>同步历史</CardTitle>
        <CardDescription>查看最近的数据同步记录</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {syncHistory.map((item) => (
              <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(item.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{getTypeLabel(item.type)}</p>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{item.message}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>{new Date(item.timestamp).toLocaleString('zh-CN')}</span>
                    {item.duration && (
                      <span>耗时: {item.duration}ms</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}