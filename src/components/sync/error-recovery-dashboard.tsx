'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Clock, 
  Zap,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Download,
  Bug,
  Wifi,
  Database,
  Lock,
  HardDrive,
  Cpu
} from 'lucide-react';
import { 
  errorRecoveryService, 
  SyncError, 
  ErrorStats,
  RecoveryStrategy 
} from '@/lib/services/error-recovery.service';
import { notificationService } from '@/lib/services/notification.service';

interface ErrorRecoveryDashboardProps {
  className?: string;
}

export function ErrorRecoveryDashboard({ className }: ErrorRecoveryDashboardProps) {
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [strategies, setStrategies] = useState<RecoveryStrategy[]>([]);
  const [selectedError, setSelectedError] = useState<SyncError | null>(null);
  const [isRecovering, setIsRecovering] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 订阅错误统计更新
    const unsubscribe = errorRecoveryService.subscribe((updatedStats) => {
      setStats(updatedStats);
      setIsLoading(false);
    });

    // 加载恢复策略
    setStrategies(errorRecoveryService.getRecoveryStrategies());

    return unsubscribe;
  }, []);

  const generateMockErrors = async () => {
    // 生成一些模拟错误用于演示
    const mockErrors = [
      { type: 'network' as const, severity: 'medium' as const },
      { type: 'auth' as const, severity: 'high' as const },
      { type: 'data' as const, severity: 'low' as const },
      { type: 'conflict' as const, severity: 'medium' as const },
      { type: 'storage' as const, severity: 'critical' as const }
    ];

    for (const error of mockErrors) {
      await errorRecoveryService.simulateError(error.type, error.severity);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  const handleRecoveryAttempt = async (errorId: string) => {
    setIsRecovering(prev => new Set(prev).add(errorId));
    
    try {
      const success = await errorRecoveryService.attemptRecovery(errorId);
      
      notificationService.notify({
        title: '恢复尝试完成',
        message: success ? '错误已成功恢复' : '恢复尝试失败',
        type: success ? 'success' : 'warning',
        duration: 3000
      });
    } catch (error) {
      notificationService.notify({
        title: '恢复失败',
        message: error instanceof Error ? error.message : '未知错误',
        type: 'error',
        duration: 5000
      });
    } finally {
      setIsRecovering(prev => {
        const newSet = new Set(prev);
        newSet.delete(errorId);
        return newSet;
      });
    }
  };

  const handleManualResolve = (errorId: string) => {
    const success = errorRecoveryService.resolveError(errorId, '手动解决');
    
    if (success) {
      notificationService.notify({
        title: '错误已解决',
        message: '错误已标记为手动解决',
        type: 'success',
        duration: 3000
      });
      setSelectedError(null);
    }
  };

  const handleClearAllErrors = () => {
    errorRecoveryService.clearAllErrors();
    notificationService.notify({
      title: '错误记录已清空',
      message: '所有错误记录已被清除',
      type: 'info',
      duration: 3000
    });
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'network': return <Wifi className="w-4 h-4" />;
      case 'auth': return <Lock className="w-4 h-4" />;
      case 'data': return <Database className="w-4 h-4" />;
      case 'conflict': return <AlertTriangle className="w-4 h-4" />;
      case 'storage': return <HardDrive className="w-4 h-4" />;
      case 'system': return <Cpu className="w-4 h-4" />;
      default: return <Bug className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'medium': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'low': return '低';
      case 'medium': return '中';
      case 'high': return '高';
      case 'critical': return '严重';
      default: return '未知';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'network': return '网络';
      case 'auth': return '认证';
      case 'data': return '数据';
      case 'conflict': return '冲突';
      case 'storage': return '存储';
      case 'system': return '系统';
      default: return '未知';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <p className="text-gray-400">加载错误恢复数据中...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 ${className}`}>
        <Shield className="w-12 h-12 mb-2 opacity-50 text-gray-400" />
        <p className="text-gray-400">暂无错误数据</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 错误概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.totalErrors}</div>
            <div className="text-sm text-gray-400">总错误数</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.resolvedErrors}</div>
            <div className="text-sm text-gray-400">已解决</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.criticalErrors}</div>
            <div className="text-sm text-gray-400">严重错误</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.recoveryRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">恢复率</div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span>错误处理与恢复</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={generateMockErrors}
                className="bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
              >
                <Bug className="w-4 h-4 mr-1" />
                生成测试错误
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearAllErrors}
                className="bg-white/10 border-white/20 text-white"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                清空记录
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white"
              >
                <Download className="w-4 h-4 mr-1" />
                导出日志
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="errors" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
              <TabsTrigger value="errors" className="data-[state=active]:bg-slate-700/50 text-white">
                错误列表
              </TabsTrigger>
              <TabsTrigger value="statistics" className="data-[state=active]:bg-slate-700/50 text-white">
                统计分析
              </TabsTrigger>
              <TabsTrigger value="strategies" className="data-[state=active]:bg-slate-700/50 text-white">
                恢复策略
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700/50 text-white">
                设置
              </TabsTrigger>
            </TabsList>
            
            {/* 错误列表标签页 */}
            <TabsContent value="errors" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">最近错误</h3>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                    {stats.recentErrors.length} 个未解决
                  </Badge>
                </div>
                
                {stats.recentErrors.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-400" />
                    <p>暂无未解决的错误</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.recentErrors.map((error) => {
                      const isRecoveringThis = isRecovering.has(error.id);
                      
                      return (
                        <div 
                          key={error.id}
                          className="bg-slate-800/30 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                          onClick={() => setSelectedError(error)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`p-2 rounded-lg ${getSeverityColor(error.severity)}`}>
                                {getErrorIcon(error.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="text-sm font-medium text-white truncate">
                                    {error.message}
                                  </h4>
                                  <Badge className={`${getSeverityColor(error.severity)} text-xs`}>
                                    {getSeverityText(error.severity)}
                                  </Badge>
                                  <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs">
                                    {getTypeText(error.type)}
                                  </Badge>
                                </div>
                                
                                <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                                  {error.details}
                                </p>
                                
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{error.timestamp.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <RotateCcw className="w-3 h-3" />
                                    <span>{error.retryCount}/{error.maxRetries}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Activity className="w-3 h-3" />
                                    <span>{error.context.operation}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRecoveryAttempt(error.id);
                                }}
                                disabled={isRecoveringThis || error.retryCount >= error.maxRetries}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {isRecoveringThis ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Zap className="w-3 h-3" />
                                )}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManualResolve(error.id);
                                }}
                                className="bg-white/10 border-white/20 text-white"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {error.retryCount >= error.maxRetries && (
                            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
                              已达到最大重试次数，需要手动处理
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 统计分析标签页 */}
            <TabsContent value="statistics" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 错误类型分布 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">错误类型分布</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.errorsByType).map(([type, count]) => (
                      <div key={type} className="bg-slate-800/30 rounded-lg p-3 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getErrorIcon(type)}
                            <span className="text-sm font-medium text-white">{getTypeText(type)}</span>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {count}
                          </Badge>
                        </div>
                        <Progress 
                          value={(count / stats.totalErrors) * 100} 
                          className="h-2 bg-slate-700"
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          {((count / stats.totalErrors) * 100).toFixed(1)}% 占比
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 严重程度分布 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">严重程度分布</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.errorsBySeverity).map(([severity, count]) => (
                      <div key={severity} className="bg-slate-800/30 rounded-lg p-3 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{getSeverityText(severity)}</span>
                          <Badge className={getSeverityColor(severity)}>
                            {count}
                          </Badge>
                        </div>
                        <Progress 
                          value={(count / stats.totalErrors) * 100} 
                          className="h-2 bg-slate-700"
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          {((count / stats.totalErrors) * 100).toFixed(1)}% 占比
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 恢复性能指标 */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-medium text-white">恢复性能指标</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-white">恢复率</span>
                      </div>
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {stats.recoveryRate.toFixed(1)}%
                      </div>
                      <Progress value={stats.recoveryRate} className="h-2 bg-slate-700" />
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">平均解决时间</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        {formatDuration(stats.avgResolutionTime)}
                      </div>
                      <div className="text-xs text-gray-400">
                        基于已解决错误统计
                      </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-white">待处理错误</span>
                      </div>
                      <div className="text-2xl font-bold text-amber-400 mb-1">
                        {stats.totalErrors - stats.resolvedErrors}
                      </div>
                      <div className="text-xs text-gray-400">
                        需要关注和处理
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 恢复策略标签页 */}
            <TabsContent value="strategies" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-4">可用恢复策略</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {strategies.map((strategy, index) => (
                    <div key={index} className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getErrorIcon(strategy.type)}
                          <h4 className="text-sm font-medium text-white">{strategy.name}</h4>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                          优先级 {strategy.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-3">{strategy.description}</p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">适用类型: {getTypeText(strategy.type)}</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-green-400">活跃</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* 设置标签页 */}
            <TabsContent value="settings" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-white">错误处理设置</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-white">自动恢复设置</h4>
                    
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">启用自动恢复</span>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Play className="w-3 h-3 mr-1" />
                          已启用
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">
                        自动尝试恢复检测到的错误
                      </p>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">最大重试次数</span>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          5 次
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        每个错误的最大自动重试次数
                      </p>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">重试间隔</span>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          指数退避
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        使用指数退避算法控制重试间隔
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-white">通知设置</h4>
                    
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">严重错误通知</span>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Play className="w-3 h-3 mr-1" />
                          已启用
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">
                        严重错误发生时立即通知
                      </p>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">恢复成功通知</span>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Play className="w-3 h-3 mr-1" />
                          已启用
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">
                        错误成功恢复时发送通知
                      </p>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">日志保留时间</span>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          7 天
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        错误日志的保留时间
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Settings className="w-4 h-4 mr-2" />
                      保存设置
                    </Button>
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white">
                      重置默认
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 错误详情弹窗 */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">错误详情</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedError(null)}
                  className="bg-white/10 border-white/20 text-white"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getSeverityColor(selectedError.severity)}`}>
                    {getErrorIcon(selectedError.type)}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{selectedError.message}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getSeverityColor(selectedError.severity)}>
                        {getSeverityText(selectedError.severity)}
                      </Badge>
                      <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                        {getTypeText(selectedError.type)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                  <h5 className="text-sm font-medium text-white mb-2">错误详情</h5>
                  <p className="text-sm text-gray-300">{selectedError.details}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1">发生时间</div>
                    <div className="text-sm text-white">{selectedError.timestamp.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1">重试次数</div>
                    <div className="text-sm text-white">{selectedError.retryCount}/{selectedError.maxRetries}</div>
                  </div>
                </div>
                
                <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                  <h5 className="text-sm font-medium text-white mb-2">上下文信息</h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400">操作: </span>
                      <span className="text-white">{selectedError.context.operation}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">设备ID: </span>
                      <span className="text-white">{selectedError.context.deviceId}</span>
                    </div>
                    {selectedError.context.dataType && (
                      <div>
                        <span className="text-gray-400">数据类型: </span>
                        <span className="text-white">{selectedError.context.dataType}</span>
                      </div>
                    )}
                    {selectedError.context.recordId && (
                      <div>
                        <span className="text-gray-400">记录ID: </span>
                        <span className="text-white">{selectedError.context.recordId}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">网络状态: </span>
                      <span className={selectedError.context.networkStatus ? 'text-green-400' : 'text-red-400'}>
                        {selectedError.context.networkStatus ? '在线' : '离线'}
                      </span>
                    </div>
                    {selectedError.context.memoryUsage && (
                      <div>
                        <span className="text-gray-400">内存使用: </span>
                        <span className="text-white">{(selectedError.context.memoryUsage / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedError.context.stackTrace && (
                  <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                    <h5 className="text-sm font-medium text-white mb-2">堆栈跟踪</h5>
                    <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                      {selectedError.context.stackTrace}
                    </pre>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 pt-4 border-t border-white/10">
                  <Button
                    onClick={() => handleRecoveryAttempt(selectedError.id)}
                    disabled={isRecovering.has(selectedError.id) || selectedError.retryCount >= selectedError.maxRetries}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isRecovering.has(selectedError.id) ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        恢复中...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        尝试恢复
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleManualResolve(selectedError.id)}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    标记已解决
                  </Button>
                  
                  <Button
                    onClick={() => setSelectedError(null)}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white"
                  >
                    关闭
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
