'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Database, 
  Clock, 
  Wifi,
  HardDrive,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface SyncDashboardProps {
  className?: string;
}

interface SyncStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  partialSyncs: number;
  totalDataSynced: number; // in MB
  averageSyncTime: number; // in seconds
  lastSyncTime: string;
  syncFrequency: number; // syncs per day
}

interface DataTypeStats {
  name: string;
  value: number;
  color: string;
}

interface SyncTrendData {
  date: string;
  syncs: number;
  success: number;
  failed: number;
}

export function SyncDashboard({ className }: SyncDashboardProps) {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [dataTypeStats, setDataTypeStats] = useState<DataTypeStats[]>([]);
  const [trendData, setTrendData] = useState<SyncTrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        // 在实际应用中，这里会从syncService获取真实数据
        // 这里使用模拟数据进行演示
        const mockStats: SyncStats = {
          totalSyncs: 156,
          successfulSyncs: 142,
          failedSyncs: 8,
          partialSyncs: 6,
          totalDataSynced: 2.4, // GB
          averageSyncTime: 2.8,
          lastSyncTime: new Date(Date.now() - 3600000).toISOString(),
          syncFrequency: 12,
        };

        const mockDataTypeStats: DataTypeStats[] = [
          { name: '资产', value: 45, color: '#3B82F6' },
          { name: '交易', value: 30, color: '#10B981' },
          { name: '计划', value: 15, color: '#F59E0B' },
          { name: '评估', value: 10, color: '#EF4444' },
        ];

        const mockTrendData: SyncTrendData[] = [
          { date: '1/1', syncs: 8, success: 7, failed: 1 },
          { date: '1/2', syncs: 12, success: 11, failed: 1 },
          { date: '1/3', syncs: 15, success: 14, failed: 1 },
          { date: '1/4', syncs: 10, success: 9, failed: 1 },
          { date: '1/5', syncs: 18, success: 16, failed: 2 },
          { date: '1/6', syncs: 14, success: 13, failed: 1 },
          { date: '1/7', syncs: 16, success: 15, failed: 1 },
        ];

        setStats(mockStats);
        setDataTypeStats(mockDataTypeStats);
        setTrendData(mockTrendData);
      } catch (error) {
        console.error('加载同步统计失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const getSuccessRate = () => {
    if (!stats) return 0;
    return Math.round((stats.successfulSyncs / stats.totalSyncs) * 100);
  };

  const getNetworkStatus = () => {
    // 在实际应用中，这里会检查真实的网络状态
    return navigator.onLine ? 'online' : 'offline';
  };

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <p className="text-gray-400">加载统计数据中...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <p className="text-gray-400">无法加载统计数据</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">总同步次数</p>
                <p className="text-2xl font-bold text-blue-400">{stats.totalSyncs}</p>
              </div>
              <Database className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">成功率</p>
                <p className="text-2xl font-bold text-green-400">{getSuccessRate()}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">平均耗时</p>
                <p className="text-2xl font-bold text-amber-400">{stats.averageSyncTime}s</p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">数据总量</p>
                <p className="text-2xl font-bold text-purple-400">{stats.totalDataSynced} GB</p>
              </div>
              <HardDrive className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 状态指示器 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Wifi className="w-4 h-4 mr-2 text-blue-400" />
              网络状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                getNetworkStatus() === 'online' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm">
                {getNetworkStatus() === 'online' ? '在线' : '离线'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Activity className="w-4 h-4 mr-2 text-green-400" />
              同步状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm">正常运行</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Zap className="w-4 h-4 mr-2 text-amber-400" />
              同步频率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-sm">{stats.syncFrequency} 次/天</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 同步趋势图 */}
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
              同步趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="syncs" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="总同步"
                />
                <Line 
                  type="monotone" 
                  dataKey="success" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="成功"
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="失败"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 数据类型分布 */}
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2 text-green-400" />
              数据类型分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dataTypeStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataTypeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {dataTypeStats.map((item, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-300">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计 */}
      <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
        <CardHeader>
          <CardTitle>同步详细统计</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">成功同步</span>
                <span className="text-sm font-medium text-green-400">{stats.successfulSyncs}</span>
              </div>
              <Progress 
                value={(stats.successfulSyncs / stats.totalSyncs) * 100} 
                className="h-2 bg-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">部分成功</span>
                <span className="text-sm font-medium text-amber-400">{stats.partialSyncs}</span>
              </div>
              <Progress 
                value={(stats.partialSyncs / stats.totalSyncs) * 100} 
                className="h-2 bg-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">失败同步</span>
                <span className="text-sm font-medium text-red-400">{stats.failedSyncs}</span>
              </div>
              <Progress 
                value={(stats.failedSyncs / stats.totalSyncs) * 100} 
                className="h-2 bg-slate-700"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">上次同步时间:</span>
              <span className="text-white">
                {new Date(stats.lastSyncTime).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}