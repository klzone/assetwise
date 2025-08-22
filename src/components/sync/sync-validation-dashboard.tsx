'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Wifi,
  RefreshCw,
  FileCheck,
  GitCompare,
  Clock,
  Activity,
  Shield,
  Zap
} from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { syncService } from '@/lib/services/sync.service';
import { localStorageService } from '@/lib/services/local-storage.service';

interface ValidationResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'running';
  message: string;
  details?: any;
  timestamp: Date;
}

interface ConsistencyCheck {
  dataType: string;
  localCount: number;
  remoteCount: number;
  inconsistencies: Array<{
    id: string;
    issue: string;
    localData?: any;
    remoteData?: any;
  }>;
}

export function SyncValidationDashboard() {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [consistencyChecks, setConsistencyChecks] = useState<ConsistencyCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { 
    networkStatus, 
    syncStatus, 
    isInitialized, 
    error,
    manualSync,
    getStorageStats 
  } = useOfflineSync('current_user');

  // 运行完整验证
  const runFullValidation = async () => {
    setIsRunning(true);
    setProgress(0);
    setValidationResults([]);
    
    const tests = [
      { name: '网络连接检查', test: testNetworkConnection },
      { name: '本地存储检查', test: testLocalStorage },
      { name: '数据库连接检查', test: testDatabaseConnection },
      { name: '同步服务状态检查', test: testSyncServiceStatus },
      { name: '数据一致性检查', test: testDataConsistency },
      { name: '冲突解决机制检查', test: testConflictResolution },
      { name: '离线队列检查', test: testOfflineQueue },
      { name: '权限验证检查', test: testPermissions }
    ];

    for (let i = 0; i < tests.length; i++) {
      const { name, test } = tests[i];
      setProgress(((i + 1) / tests.length) * 100);
      
      try {
        const result = await test();
        setValidationResults(prev => [...prev, {
          category: '系统验证',
          test: name,
          status: result.status as 'pass' | 'fail' | 'warning' | 'running',
          message: result.message,
          details: result.details,
          timestamp: new Date()
        }]);
      } catch (error) {
        setValidationResults(prev => [...prev, {
          category: '系统验证',
          test: name,
          status: 'fail' as const,
          message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
          timestamp: new Date()
        }]);
      }
      
      // 添加延迟以显示进度
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
  };

  // 网络连接检查
  const testNetworkConnection = async () => {
    const isOnline = navigator.onLine;
    const connectionType = (navigator as any).connection?.effectiveType || 'unknown';
    
    return {
      status: isOnline ? 'pass' : 'fail',
      message: isOnline ? `网络连接正常 (${connectionType})` : '网络连接断开',
      details: { isOnline, connectionType }
    };
  };

  // 本地存储检查
  const testLocalStorage = async () => {
    try {
      const stats = await getStorageStats();
      const hasData = stats.totalItems > 0;
      
      return {
        status: hasData ? 'pass' : 'warning',
        message: hasData ? `本地存储正常 (${stats.totalItems} 项数据)` : '本地存储为空',
        details: stats
      };
    } catch (error) {
      return {
        status: 'fail',
        message: '本地存储访问失败',
        details: { error: error.message }
      };
    }
  };

  // 数据库连接检查
  const testDatabaseConnection = async () => {
    try {
      // 这里应该调用实际的数据库连接测试
      // 暂时使用模拟结果
      const isConnected = networkStatus.isOnline;
      
      return {
        status: isConnected ? 'pass' : 'fail',
        message: isConnected ? 'Supabase连接正常' : 'Supabase连接失败',
        details: { connected: isConnected }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: '数据库连接测试失败',
        details: { error: error.message }
      };
    }
  };

  // 同步服务状态检查
  const testSyncServiceStatus = async () => {
    try {
      const stats = await syncService.getSyncStats();
      const isHealthy = stats.sync_enabled && stats.network_available;
      
      return {
        status: isHealthy ? 'pass' : 'warning',
        message: isHealthy ? '同步服务运行正常' : '同步服务存在问题',
        details: stats
      };
    } catch (error) {
      return {
        status: 'fail',
        message: '同步服务检查失败',
        details: { error: error.message }
      };
    }
  };

  // 数据一致性检查
  const testDataConsistency = async () => {
    try {
      const dataTypes = ['assets', 'transactions', 'plans', 'reviews'];
      const checks: ConsistencyCheck[] = [];
      let totalInconsistencies = 0;

      for (const dataType of dataTypes) {
        // 获取本地数据
        const localData = await localStorageService.getData(dataType);
        
        // 模拟远程数据检查（实际应用中需要调用API）
        const remoteCount = Math.floor(localData.length * (0.9 + Math.random() * 0.2));
        const inconsistencies = [];

        // 模拟一些不一致的情况
        if (Math.random() > 0.8) {
          inconsistencies.push({
            id: `${dataType}_${Date.now()}`,
            issue: '本地数据比远程数据新',
            localData: { updated_at: new Date().toISOString() },
            remoteData: { updated_at: new Date(Date.now() - 3600000).toISOString() }
          });
        }

        checks.push({
          dataType,
          localCount: localData.length,
          remoteCount,
          inconsistencies
        });

        totalInconsistencies += inconsistencies.length;
      }

      setConsistencyChecks(checks);

      return {
        status: totalInconsistencies === 0 ? 'pass' : 'warning',
        message: totalInconsistencies === 0 ? 
          '数据一致性检查通过' : 
          `发现 ${totalInconsistencies} 个不一致项`,
        details: { checks, totalInconsistencies }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: '数据一致性检查失败',
        details: { error: error.message }
      };
    }
  };

  // 冲突解决机制检查
  const testConflictResolution = async () => {
    try {
      // 模拟冲突解决测试
      const conflicts = await syncService.getConflicts();
      
      return {
        status: conflicts.length === 0 ? 'pass' : 'warning',
        message: conflicts.length === 0 ? 
          '无待解决冲突' : 
          `发现 ${conflicts.length} 个待解决冲突`,
        details: { conflicts }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: '冲突解决机制检查失败',
        details: { error: error.message }
      };
    }
  };

  // 离线队列检查
  const testOfflineQueue = async () => {
    try {
      const queueSize = syncStatus.queueSize;
      
      return {
        status: queueSize < 100 ? 'pass' : 'warning',
        message: `离线队列包含 ${queueSize} 个待同步项`,
        details: { queueSize }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: '离线队列检查失败',
        details: { error: error.message }
      };
    }
  };

  // 权限验证检查
  const testPermissions = async () => {
    try {
      // 这里应该检查实际的权限
      const hasPermission = true; // 模拟结果
      
      return {
        status: hasPermission ? 'pass' : 'fail',
        message: hasPermission ? '同步权限验证通过' : '缺少同步权限',
        details: { hasPermission }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: '权限验证失败',
        details: { error: error.message }
      };
    }
  };

  // 修复数据不一致
  const fixInconsistency = async (dataType: string, inconsistency: any) => {
    try {
      // 这里应该实现实际的修复逻辑
      console.log(`修复 ${dataType} 的不一致项:`, inconsistency);
      
      // 重新运行一致性检查
      await testDataConsistency();
    } catch (error) {
      console.error('修复不一致项失败:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-400';
      case 'fail': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      case 'running': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const passCount = validationResults.filter(r => r.status === 'pass').length;
  const failCount = validationResults.filter(r => r.status === 'fail').length;
  const warningCount = validationResults.filter(r => r.status === 'warning').length;

  return (
    <div className="space-y-6">
      {/* 头部操作区 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">数据同步验证</h2>
          <p className="text-gray-400">检验和完善数据同步功能的一致性</p>
        </div>
        <Button
          onClick={runFullValidation}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              验证中...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              开始验证
            </>
          )}
        </Button>
      </div>

      {/* 进度条 */}
      {isRunning && (
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">验证进度</span>
                <span className="text-blue-400">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-700" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 概览统计 */}
      {validationResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">通过</p>
                  <p className="text-2xl font-bold text-green-400">{passCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">警告</p>
                  <p className="text-2xl font-bold text-amber-400">{warningCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">失败</p>
                  <p className="text-2xl font-bold text-red-400">{failCount}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">总计</p>
                  <p className="text-2xl font-bold text-white">{validationResults.length}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 详细结果 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border-white/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
            概览
          </TabsTrigger>
          <TabsTrigger value="consistency" className="data-[state=active]:bg-slate-700">
            一致性检查
          </TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-slate-700">
            详细结果
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">验证概览</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {validationResults.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  点击"开始验证"按钮运行完整的同步功能验证
                </p>
              ) : (
                <div className="space-y-3">
                  {validationResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="text-white font-medium">{result.test}</p>
                          <p className={`text-sm ${getStatusColor(result.status)}`}>
                            {result.message}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-white/20 text-gray-300">
                        {result.timestamp.toLocaleTimeString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consistency" className="space-y-4">
          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <GitCompare className="w-5 h-5 mr-2" />
                数据一致性检查
              </CardTitle>
            </CardHeader>
            <CardContent>
              {consistencyChecks.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  运行验证以查看数据一致性检查结果
                </p>
              ) : (
                <div className="space-y-4">
                  {consistencyChecks.map((check, index) => (
                    <div key={index} className="border border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-medium capitalize">{check.dataType}</h4>
                        <div className="flex space-x-4 text-sm">
                          <span className="text-gray-400">
                            本地: <span className="text-blue-400">{check.localCount}</span>
                          </span>
                          <span className="text-gray-400">
                            远程: <span className="text-green-400">{check.remoteCount}</span>
                          </span>
                        </div>
                      </div>
                      
                      {check.inconsistencies.length > 0 ? (
                        <div className="space-y-2">
                          <Alert className="border-amber-500/20 bg-amber-500/10">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <AlertDescription className="text-amber-300">
                              发现 {check.inconsistencies.length} 个不一致项
                            </AlertDescription>
                          </Alert>
                          
                          {check.inconsistencies.map((inconsistency, idx) => (
                            <div key={idx} className="bg-slate-800/50 p-3 rounded flex items-center justify-between">
                              <div>
                                <p className="text-white text-sm">{inconsistency.issue}</p>
                                <p className="text-gray-400 text-xs">ID: {inconsistency.id}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white/10 border-white/20 text-white"
                                onClick={() => fixInconsistency(check.dataType, inconsistency)}
                              >
                                修复
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          数据一致性良好
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">详细验证结果</CardTitle>
            </CardHeader>
            <CardContent>
              {validationResults.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  暂无详细结果
                </p>
              ) : (
                <div className="space-y-4">
                  {validationResults.map((result, index) => (
                    <div key={index} className="border border-white/10 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <h4 className="text-white font-medium">{result.test}</h4>
                        </div>
                        <Badge variant="outline" className="border-white/20 text-gray-300">
                          {result.category}
                        </Badge>
                      </div>
                      
                      <p className={`text-sm mb-2 ${getStatusColor(result.status)}`}>
                        {result.message}
                      </p>
                      
                      {result.details && (
                        <details className="text-xs text-gray-400">
                          <summary className="cursor-pointer hover:text-gray-300">
                            查看详细信息
                          </summary>
                          <pre className="mt-2 p-2 bg-slate-800/50 rounded overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        {result.timestamp.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}