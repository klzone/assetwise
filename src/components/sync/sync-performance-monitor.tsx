'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Zap, 
  Clock, 
  Database, 
  Cpu, 
  MemoryStick,
  HardDrive,
  Wifi,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface PerformanceMetrics {
  timestamp: Date;
  syncDuration: number; // 毫秒
  throughput: number; // 记录/秒
  memoryUsage: number; // MB
  cpuUsage: number; // 百分比
  networkLatency: number; // 毫秒
  errorRate: number; // 百分比
  queueSize: number; // 待同步项目数
}

interface PerformanceStats {
  avgSyncDuration: number;
  avgThroughput: number;
  avgMemoryUsage: number;
  avgCpuUsage: number;
  avgNetworkLatency: number;
  totalSyncs: number;
  successRate: number;
  peakMemoryUsage: number;
  peakCpuUsage: number;
}

export function SyncPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [stats, setStats] = useState<PerformanceStats>({
    avgSyncDuration: 0,
    avgThroughput: 0,
    avgMemoryUsage: 0,
    avgCpuUsage: 0,
    avgNetworkLatency: 0,
    totalSyncs: 0,
    successRate: 0,
    peakMemoryUsage: 0,
    peakCpuUsage: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>>([]);

  // 收集性能指标
  const collectMetrics = useCallback(async () => {
    try {
      // 模拟性能数据收集
      const newMetric: PerformanceMetrics = {
        timestamp: new Date(),
        syncDuration: Math.random() * 5000 + 1000, // 1-6秒
        throughput: Math.random() * 50 + 10, // 10-60 记录/秒
        memoryUsage: Math.random() * 100 + 50, // 50-150 MB
        cpuUsage: Math.random() * 30 + 10, // 10-40%
        networkLatency: Math.random() * 200 + 50, // 50-250ms
        errorRate: Math.random() * 5, // 0-5%
        queueSize: Math.floor(Math.random() * 20) // 0-20项
      };

      // 检查性能警告
      checkPerformanceAlerts(newMetric);

      setMetrics(prev => {
        const updated = [...prev, newMetric].slice(-50); // 保留最近50个数据点
        updateStats(updated);
        return updated;
      });

    } catch (error) {
      console.error('收集性能指标失败:', error);
    }
  }, []);

  // 检查性能警告
  const checkPerformanceAlerts = (metric: PerformanceMetrics) => {
    const newAlerts = [];

    // 同步时间过长警告
    if (metric.syncDuration > 10000) {
      newAlerts.push({
        id: `sync_duration_${Date.now()}`,
        type: 'warning' as const,
        message: `同步时间过长: ${(metric.syncDuration / 1000).toFixed(1)}秒`,
        timestamp: new Date()
      });
    }

    // 内存使用过高警告
    if (metric.memoryUsage > 200) {
      newAlerts.push({
        id: `memory_${Date.now()}`,
        type: 'error' as const,
        message: `内存使用过高: ${metric.memoryUsage.toFixed(1)}MB`,
        timestamp: new Date()
      });
    }

    // CPU使用过高警告
    if (metric.cpuUsage > 80) {
      newAlerts.push({
        id: `cpu_${Date.now()}`,
        type: 'error' as const,
        message: `CPU使用过高: ${metric.cpuUsage.toFixed(1)}%`,
        timestamp: new Date()
      });
    }

    // 网络延迟过高警告
    if (metric.networkLatency > 1000) {
      newAlerts.push({
        id: `latency_${Date.now()}`,
        type: 'warning' as const,
        message: `网络延迟过高: ${metric.networkLatency}ms`,
        timestamp: new Date()
      });
    }

    // 错误率过高警告
    if (metric.errorRate > 10) {
      newAlerts.push({
        id: `error_rate_${Date.now()}`,
        type: 'error' as const,
        message: `错误率过高: ${metric.errorRate.toFixed(1)}%`,
        timestamp: new Date()
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 20)); // 保留最近20个警告
    }
  };

  // 更新统计信息
  const updateStats = (metricsData: PerformanceMetrics[]) => {
    if (metricsData.length === 0) return;

    const totalMetrics = metricsData.length;
    const avgSyncDuration = metricsData.reduce((sum, m) => sum + m.syncDuration, 0) / totalMetrics;
    const avgThroughput = metricsData.reduce((sum, m) => sum + m.throughput, 0) / totalMetrics;
    const avgMemoryUsage = metricsData.reduce((sum, m) => sum + m.memoryUsage, 0) / totalMetrics;
    const avgCpuUsage = metricsData.reduce((sum, m) => sum + m.cpuUsage, 0) / totalMetrics;
    const avgNetworkLatency = metricsData.reduce((sum, m) => sum + m.networkLatency, 0) / totalMetrics;
    const avgErrorRate = metricsData.reduce((sum, m) => sum + m.errorRate, 0) / totalMetrics;
    const peakMemoryUsage = Math.max(...metricsData.map(m => m.memoryUsage));
    const peakCpuUsage = Math.max(...metricsData.map(m => m.cpuUsage));

    setStats({
      avgSyncDuration,
      avgThroughput,
      avgMemoryUsage,
      avgCpuUsage,
      avgNetworkLatency,
      totalSyncs: totalMetrics,
      successRate: 100 - avgErrorRate,
      peakMemoryUsage,
      peakCpuUsage
    });
  };

  // 开始/停止监控
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isMonitoring) {
      interval = setInterval(collectMetrics, 2000); // 每2秒收集一次数据
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isMonitoring, collectMetrics]);

  // 清除警告
  const clearAlerts = () => {
    setAlerts([]);
  };

  // 重置监控数据
  const resetMonitoring = () => {
    setMetrics([]);
    setAlerts([]);
    setStats({
      avgSyncDuration: 0,
      avgThroughput: 0,
      avgMemoryUsage: 0,
      avgCpuUsage: 0,
      avgNetworkLatency: 0,
      totalSyncs: 0,
      successRate: 0,
      peakMemoryUsage: 0,
      peakCpuUsage: 0
    });
  };

  // 格式化图表数据
  const chartData = metrics.map((metric, index) => ({
    time: index,
    syncDuration: metric.syncDuration / 1000, // 转换为秒
    throughput: metric.throughput,
    memoryUsage: metric.memoryUsage,
    cpuUsage: metric.cpuUsage,
    networkLatency: metric.networkLatency,
    errorRate: metric.errorRate
  }));

  const getPerformanceStatus = () => {
    if (stats.avgCpuUsage > 70 || stats.avgMemoryUsage > 150) return 'error';
    if (stats.avgCpuUsage > 50 || stats.avgMemoryUsage > 100) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-amber-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">性能监控</h3>
          <p className="text-gray-400">实时监控数据同步的性能指标</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={isMonitoring ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
          >
            {isMonitoring ? '停止监控' : '开始监控'}
          </Button>
          <Button
            onClick={resetMonitoring}
            variant="outline"
            className="bg-white/10 border-white/20 text-white"
          >
            重置数据
          </Button>
        </div>
      </div>

      {/* 性能状态概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">平均同步时间</p>
                <p className="text-2xl font-bold text-blue-400">
                  {(stats.avgSyncDuration / 1000).toFixed(1)}s
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">平均吞吐量</p>
                <p className="text-2xl font-bold text-green-400">
                  {stats.avgThroughput.toFixed(0)}/s
                </p>
              </div>
              <Zap className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">内存使用</p>
                <p className="text-2xl font-bold text-purple-400">
                  {stats.avgMemoryUsage.toFixed(0)}MB
                </p>
              </div>
              <MemoryStick className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">成功率</p>
                <p className="text-2xl font-bold text-amber-400">
                  {stats.successRate.toFixed(1)}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 性能警告 */}
      {alerts.length > 0 && (
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-400" />
                性能警告 ({alerts.length})
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white"
                onClick={clearAlerts}
              >
                清除警告
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.type === 'error' 
                    ? 'bg-red-500/10 border-red-500/20 text-red-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{alert.message}</span>
                  <span className="text-xs opacity-70">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 性能图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 同步性能趋势 */}
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white">同步性能趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
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
                  dataKey="syncDuration" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="同步时间(s)"
                />
                <Line 
                  type="monotone" 
                  dataKey="throughput" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="吞吐量(/s)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 资源使用情况 */}
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white">资源使用情况</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="memoryUsage" 
                  stackId="1"
                  stroke="#8B5CF6" 
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                  name="内存(MB)"
                />
                <Area 
                  type="monotone" 
                  dataKey="cpuUsage" 
                  stackId="2"
                  stroke="#F59E0B" 
                  fill="#F59E0B"
                  fillOpacity={0.3}
                  name="CPU(%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计 */}
      <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white">详细性能统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="text-white font-medium">同步性能</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">平均同步时间:</span>
                  <span className="text-white">{(stats.avgSyncDuration / 1000).toFixed(2)}s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">平均吞吐量:</span>
                  <span className="text-white">{stats.avgThroughput.toFixed(1)} 记录/秒</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">总同步次数:</span>
                  <span className="text-white">{stats.totalSyncs}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-medium">资源使用</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">平均内存使用:</span>
                  <span className="text-white">{stats.avgMemoryUsage.toFixed(1)}MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">峰值内存使用:</span>
                  <span className="text-white">{stats.peakMemoryUsage.toFixed(1)}MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">平均CPU使用:</span>
                  <span className="text-white">{stats.avgCpuUsage.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-medium">网络性能</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">平均网络延迟:</span>
                  <span className="text-white">{stats.avgNetworkLatency.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">成功率:</span>
                  <span className="text-white">{stats.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">整体状态:</span>
                  <Badge className={`${getStatusColor(performanceStatus)} border-current`}>
                    {performanceStatus === 'good' ? '良好' : 
                     performanceStatus === 'warning' ? '警告' : '异常'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}