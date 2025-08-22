'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Zap, 
  Clock, 
  Wifi, 
  Monitor, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Smartphone,
  Laptop,
  Tablet,
  Globe,
  Database,
  RefreshCw,
  Download,
  Upload,
  TestTube,
  Target
} from 'lucide-react';
import { 
  performanceService, 
  SyncPerformanceReport, 
  SyncTestCase,
  DevicePerformanceStats 
} from '@/lib/services/performance.service';
import { notificationService } from '@/lib/services/notification.service';

interface PerformanceMonitorProps {
  className?: string;
}

export function PerformanceMonitor({ className }: PerformanceMonitorProps) {
  const [report, setReport] = useState<SyncPerformanceReport | null>(null);
  const [testCases, setTestCases] = useState<SyncTestCase[]>([]);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 订阅性能报告更新
    const unsubscribe = performanceService.subscribe((updatedReport) => {
      setReport(updatedReport);
      setIsLoading(false);
    });

    // 加载测试用例
    setTestCases(performanceService.getTestCases());

    // 生成一些模拟数据
    generateMockData();

    return unsubscribe;
  }, []);

  const generateMockData = async () => {
    // 生成一些模拟的性能数据
    const mockData = [
      { duration: 1200, data: 2048, conflicts: 0, resolved: 0, type: 'auto' as const, success: true },
      { duration: 2800, data: 5120, conflicts: 1, resolved: 1, type: 'manual' as const, success: true },
      { duration: 4500, data: 10240, conflicts: 2, resolved: 2, type: 'scheduled' as const, success: true },
      { duration: 8200, data: 20480, conflicts: 3, resolved: 2, type: 'auto' as const, success: false },
      { duration: 1800, data: 3072, conflicts: 0, resolved: 0, type: 'manual' as const, success: true }
    ];

    for (const data of mockData) {
      await performanceService.recordSyncMetrics(
        data.duration,
        data.data,
        data.conflicts,
        data.resolved,
        data.type,
        data.success,
        data.success ? 0 : 1
      );
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const runPerformanceTest = async (testCase: SyncTestCase) => {
    setRunningTests(prev => new Set(prev).add(testCase.id));
    
    try {
      const result = await performanceService.runPerformanceTest(testCase);
      setTestResults(prev => ({ ...prev, [testCase.id]: result }));
      
      notificationService.notify({
        title: '性能测试完成',
        message: `${testCase.name}: ${result.passed ? '通过' : '未通过'}`,
        type: result.passed ? 'success' : 'warning',
        duration: 3000
      });
    } catch (error) {
      notificationService.notify({
        title: '测试失败',
        message: error instanceof Error ? error.message : '未知错误',
        type: 'error',
        duration: 5000
      });
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(testCase.id);
        return newSet;
      });
    }
  };

  const runAllTests = async () => {
    for (const testCase of testCases) {
      if (!runningTests.has(testCase.id)) {
        await runPerformanceTest(testCase);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 测试间隔
      }
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.toLowerCase().includes('mobile') || deviceName.toLowerCase().includes('android') || deviceName.toLowerCase().includes('ios')) {
      return <Smartphone className="w-4 h-4" />;
    }
    if (deviceName.toLowerCase().includes('tablet') || deviceName.toLowerCase().includes('ipad')) {
      return <Tablet className="w-4 h-4" />;
    }
    return <Laptop className="w-4 h-4" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.warning) return 'text-amber-400';
    return 'text-red-400';
  };

  const getTestCaseColor = (dataSize: string, conflictLevel: string, networkCondition: string) => {
    if (dataSize === 'large' || conflictLevel === 'high' || networkCondition === 'slow') {
      return 'border-red-500/30 bg-red-500/10';
    }
    if (dataSize === 'medium' || conflictLevel === 'medium' || networkCondition === 'unstable') {
      return 'border-amber-500/30 bg-amber-500/10';
    }
    return 'border-green-500/30 bg-green-500/10';
  };

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <p className="text-gray-400">加载性能数据中...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 ${className}`}>
        <Activity className="w-12 h-12 mb-2 opacity-50 text-gray-400" />
        <p className="text-gray-400">暂无性能数据</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 性能概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{report.totalSyncs}</div>
            <div className="text-sm text-gray-400">总同步次数</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getPerformanceColor(report.successRate, { good: 95, warning: 85 })}`}>
              {report.successRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">成功率</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getPerformanceColor(report.avgSyncDuration, { good: 2000, warning: 5000 })}`}>
              {formatDuration(report.avgSyncDuration)}
            </div>
            <div className="text-sm text-gray-400">平均耗时</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getPerformanceColor(report.avgNetworkLatency, { good: 200, warning: 500 })}`}>
              {report.avgNetworkLatency.toFixed(0)}ms
            </div>
            <div className="text-sm text-gray-400">网络延迟</div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span>性能监控与测试</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700/50 text-white">
                概览
              </TabsTrigger>
              <TabsTrigger value="devices" className="data-[state=active]:bg-slate-700/50 text-white">
                设备性能
              </TabsTrigger>
              <TabsTrigger value="tests" className="data-[state=active]:bg-slate-700/50 text-white">
                性能测试
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="data-[state=active]:bg-slate-700/50 text-white">
                优化建议
              </TabsTrigger>
            </TabsList>
            
            {/* 概览标签页 */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 时间范围统计 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">时间范围统计</h3>
                  {report.timeRangeStats.map((stat, index) => (
                    <div key={index} className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{stat.period}</span>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {stat.syncCount} 次
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-300">
                        <div>
                          <div>平均耗时: {formatDuration(stat.avgDuration)}</div>
                          <div>成功率: {stat.successRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div>数据量: {formatBytes(stat.dataVolume)}</div>
                          <div className="flex items-center space-x-1">
                            {stat.successRate >= 95 ? (
                              <CheckCircle className="w-3 h-3 text-green-400" />
                            ) : stat.successRate >= 85 ? (
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                            )}
                            <span>状态正常</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 性能指标 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">关键指标</h3>
                  
                  <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center space-x-2 mb-3">
                      <Database className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">数据传输</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">平均传输量</span>
                        <span className="text-white">{formatBytes(report.avgDataTransferred)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">峰值内存使用</span>
                        <span className="text-white">{formatBytes(report.peakMemoryUsage)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-white">冲突处理</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">总冲突数</span>
                        <span className="text-white">{report.totalConflicts}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">解决率</span>
                        <span className={`${getPerformanceColor(report.conflictResolutionRate, { good: 95, warning: 85 })}`}>
                          {report.conflictResolutionRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center space-x-2 mb-3">
                      <Globe className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-white">网络性能</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">平均延迟</span>
                        <span className={`${getPerformanceColor(report.avgNetworkLatency, { good: 200, warning: 500 })}`}>
                          {report.avgNetworkLatency.toFixed(0)}ms
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (500 - report.avgNetworkLatency) / 5)} 
                        className="h-2 bg-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 设备性能标签页 */}
            <TabsContent value="devices" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">设备性能统计</h3>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    {Object.keys(report.devicePerformance).length} 台设备
                  </Badge>
                </div>
                
                {Object.values(report.devicePerformance).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>暂无设备性能数据</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(report.devicePerformance).map((device: DevicePerformanceStats) => (
                      <div key={device.deviceId} className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center space-x-2 mb-3">
                          {getDeviceIcon(device.deviceName)}
                          <span className="text-sm font-medium text-white">{device.deviceName}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-300">同步次数</span>
                              <span className="text-white">{device.syncCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">平均耗时</span>
                              <span className={`${getPerformanceColor(device.avgDuration, { good: 2000, warning: 5000 })}`}>
                                {formatDuration(device.avgDuration)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-300">成功率</span>
                              <span className={`${getPerformanceColor(100 - device.successRate, { good: 5, warning: 15 })}`}>
                                {device.successRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">网络延迟</span>
                              <span className={`${getPerformanceColor(device.avgLatency, { good: 200, warning: 500 })}`}>
                                {device.avgLatency.toFixed(0)}ms
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="text-xs text-gray-400">
                            最后同步: {device.lastSync.toLocaleString()}
                          </div>
                          {device.issues.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {device.issues.map((issue, index) => (
                                <Badge key={index} className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                                  {issue}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 性能测试标签页 */}
            <TabsContent value="tests" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">性能测试套件</h3>
                  <Button
                    onClick={runAllTests}
                    disabled={runningTests.size > 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    运行所有测试
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testCases.map((testCase) => {
                    const isRunning = runningTests.has(testCase.id);
                    const result = testResults[testCase.id];
                    
                    return (
                      <div 
                        key={testCase.id} 
                        className={`rounded-lg p-4 border ${getTestCaseColor(testCase.dataSize, testCase.conflictLevel, testCase.networkCondition)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-white">{testCase.name}</h4>
                          <Button
                            size="sm"
                            onClick={() => runPerformanceTest(testCase)}
                            disabled={isRunning}
                            className="bg-white/10 border-white/20 text-white"
                          >
                            {isRunning ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Target className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        
                        <p className="text-xs text-gray-300 mb-3">{testCase.description}</p>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                          <div>
                            <span className="text-gray-400">数据量: </span>
                            <span className="text-white">{testCase.dataSize}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">冲突: </span>
                            <span className="text-white">{testCase.conflictLevel}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">网络: </span>
                            <span className="text-white">{testCase.networkCondition}</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-400 mb-3">
                          <div>预期耗时: {formatDuration(testCase.expectedDuration)}</div>
                          <div>最大耗时: {formatDuration(testCase.maxAcceptableDuration)}</div>
                        </div>
                        
                        {result && (
                          <div className={`text-xs p-2 rounded border ${result.passed ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                            <div className="flex items-center space-x-2 mb-1">
                              {result.passed ? (
                                <CheckCircle className="w-3 h-3 text-green-400" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-red-400" />
                              )}
                              <span className={result.passed ? 'text-green-300' : 'text-red-300'}>
                                {result.passed ? '测试通过' : '测试未通过'}
                              </span>
                            </div>
                            <div className="text-gray-300">
                              实际耗时: {formatDuration(result.duration)}
                            </div>
                            <div className="text-gray-400 mt-1">{result.details}</div>
                          </div>
                        )}
                        
                        {isRunning && (
                          <div className="text-xs text-blue-300 p-2 rounded border border-blue-500/30 bg-blue-500/10">
                            <div className="flex items-center space-x-2">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>测试进行中...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* 优化建议标签页 */}
            <TabsContent value="recommendations" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-4">性能优化建议</h3>
                
                {report.recommendations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-400" />
                    <p>系统性能良好，暂无优化建议</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {report.recommendations.map((recommendation, index) => {
                      const getRecommendationColor = (type: string) => {
                        switch (type) {
                          case 'error': return 'border-red-500/30 bg-red-500/10';
                          case 'warning': return 'border-amber-500/30 bg-amber-500/10';
                          case 'optimization': return 'border-blue-500/30 bg-blue-500/10';
                          default: return 'border-gray-500/30 bg-gray-500/10';
                        }
                      };

                      const getRecommendationIcon = (type: string) => {
                        switch (type) {
                          case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />;
                          case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
                          case 'optimization': return <TrendingUp className="w-4 h-4 text-blue-400" />;
                          default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
                        }
                      };

                      return (
                        <div 
                          key={index}
                          className={`rounded-lg p-4 border ${getRecommendationColor(recommendation.type)}`}
                        >
                          <div className="flex items-start space-x-3">
                            {getRecommendationIcon(recommendation.type)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-white">{recommendation.title}</h4>
                                <Badge className={`${recommendation.impact === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                                  recommendation.impact === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 
                                  'bg-gray-500/20 text-gray-300 border-gray-500/30'} text-xs`}>
                                  {recommendation.impact === 'high' ? '高影响' : 
                                   recommendation.impact === 'medium' ? '中影响' : '低影响'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-300 mb-2">{recommendation.description}</p>
                              <p className="text-xs text-gray-400">
                                <span className="font-medium">建议操作: </span>
                                {recommendation.action}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}